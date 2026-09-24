/* Lanternbound — the world: town, the Hollow, NPCs, menus and screens. */
(function () {
  const LB = window.LB;
  const { U, ui } = LB;
  const { el, esc, sleep, chance, ri, pick, clamp } = U;

  /* ================================================================ stage */
  let bgKey = null;
  LB.pxScale = function () {
    const w = U.$('#stage').clientWidth || 800;
    return clamp(Math.floor(w / 150), 3, 6);
  };

  LB.renderStage = function (kind) {
    const S = LB.S;
    const stage = U.$('#stage');
    const area = S.mode === 'town' ? 'town' : LB.areaFor(S.floor);
    const seed = S.mode === 'town' ? 4242 : S.seed + S.floor * 131 + (S.progress || 0) * 7;
    const key = `${area}|${seed}|${S.flags.bossDefeated}`;
    if (key !== bgKey) {
      LB.drawBackground(U.$('#bg'), area, seed, { lit: S.flags.bossDefeated });
      bgKey = key;
    }
    stage.dataset.area = area;
    stage.dataset.kind = kind;
    U.$('#actors').innerHTML = '';
    U.$('#fx').innerHTML = '';
    const banner = U.$('#banner');
    if (S.mode === 'town') banner.innerHTML = `<b>Emberwick</b><span>${S.flags.bossDefeated ? 'The Great Lantern burns bright' : 'The Great Lantern is dark'}</span>`;
    else {
      const need = LB.stepsForFloor(S.floor);
      const pips = S.floor >= LB.MAX_FLOOR ? '' : Array.from({ length: need }, (_, i) => `<i class="${i < S.progress ? 'on' : ''}"></i>`).join('');
      banner.innerHTML = `<b>Floor ${S.floor}</b><span>${LB.AREA_NAMES[area]}</span>${pips ? `<div class="pips" title="Exploration progress on this floor">${pips}</div>` : ''}`;
    }
    LB.particles.setArea(area);
    LB.updateDarkness();
  };

  LB.updateDarkness = function () {
    const S = LB.S;
    const d = U.$('#darkness');
    if (!S || S.mode === 'town') { d.style.opacity = 0; U.$('#stage').dataset.light = 'bright'; return; }
    const oil = S.hero.oil / S.hero.maxOil;
    const light = LB.lightLevel();
    const r = light === 'dark' ? 16 : light === 'dim' ? 26 : 30 + oil * 30;
    d.style.setProperty('--r', r + '%');
    d.style.opacity = 1;
    U.$('#stage').dataset.light = light;
  };

  function actor(sprite, opts = {}) {
    const a = el('div', { class: 'actor ' + (opts.cls || ''), id: opts.id || '' });
    if (opts.label) a.append(el('div', { class: 'actor-label', html: opts.label }));
    a.append(LB.spriteImg(sprite, opts.scale || LB.pxScale(), { flip: opts.flip }));
    a.append(el('div', { class: 'shadow' }));
    if (opts.style) a.style.cssText += opts.style;
    if (opts.onClick) {
      a.classList.add('clickable');
      a.tabIndex = 0;
      a.addEventListener('click', () => { if (!LB.busy) { LB.audio.sfx('click'); opts.onClick(); } });
      a.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !LB.busy) opts.onClick(); });
    }
    U.$('#actors').append(a);
    return a;
  }
  LB.heroActor = () => actor(LB.CLASSES[LB.S.hero.cls].sprite, { id: 'actor-hero', cls: 'hero-actor' });

  LB.refresh = function () {
    const S = LB.S;
    if (!S || LB.inBattle()) return;
    if (S.mode === 'town') renderTown();
    else renderDungeon();
    ui.hud();
  };

  /* ================================================================ town */
  function renderTown() {
    const S = LB.S;
    S.scene = 'town';
    LB.audio.music(S.flags.bossDefeated ? 'victory' : 'town');
    LB.renderStage('town');
    const sc = Math.max(3, LB.pxScale() - 1);
    actor('marrow', { label: 'Inn', style: 'left:9%', scale: sc, onClick: () => LB.run(visitInn) });
    actor('barnaby', { label: 'Shop', style: 'left:27%', scale: sc, onClick: () => LB.run(visitShop) });
    actor('elder', { label: 'Elder', style: 'left:45%', scale: sc, onClick: () => LB.run(talkElder) });
    actor('pim', { label: 'Pim', style: 'left:62%', scale: sc, cls: 'pim', onClick: () => LB.run(petPim) });
    const hero = LB.heroActor();
    hero.style.left = '80%';
    ui.actions([
      { label: 'Enter the Hollow', sub: S.flags.bossDefeated ? 'Keep exploring' : `Deepest: floor ${S.deepest}`, icon: 'i_flame', cls: 'primary', onClick: () => LB.run(enterHollow) },
      { label: 'Rest at the Inn', sub: restCost() ? `${restCost()} gold` : 'Free', icon: 'i_heart', onClick: () => LB.run(visitInn) },
      { label: 'Croak & Sons', sub: 'Buy & sell', icon: 'i_coin', onClick: () => LB.run(visitShop) },
      { label: 'Elder Wickett', sub: 'Advice', icon: 'i_scroll', onClick: () => LB.run(talkElder) },
      { label: 'Pet Pim', sub: 'Mandatory', icon: 'i_heart', onClick: () => LB.run(petPim) },
    ], 'Emberwick — the last lit village above the Hollow');
  }

  function restCost() {
    const S = LB.S;
    return S.flags.restedOnce ? 5 + S.hero.level * 3 : 0;
  }

  async function visitInn() {
    const S = LB.S;
    const cost = restCost();
    const st = LB.stats();
    const full = S.hero.hp >= st.hp && S.hero.mp >= st.mp;
    const choice = await ui.say('marrow', pick([
      'Welcome to the Snoring Candle. Beds are soft, soup is hot, questions are extra.',
      "Back again, dear? You look like something the Hollow chewed and didn't like.",
      'Rooms are upstairs. Mind the third step, it bites. Emotionally.',
    ]), [cost ? `Rest and recover (${cost} gold)` : 'Rest and recover (first night free)', 'Any gossip?', 'Leave']);
    if (choice === 0) {
      if (full) {
        await ui.say('marrow', "You're already fresh as a daisy. I won't take your money. …Today.");
      } else if (S.hero.gold < cost) {
        await ui.say('marrow', "You're short, dear. I'd let it slide, but I have a reputation. For being mean.");
      } else {
        S.hero.gold -= cost;
        S.flags.restedOnce = true;
        ui.endDialogue();
        await ui.fade(async () => {
          S.hero.hp = st.hp;
          S.hero.mp = st.mp;
        });
        LB.audio.sfx('heal');
        ui.log(`You sleep like a log. A log that snores. <b>HP and MP fully restored.</b>`, 'good');
        await ui.say('marrow', pick(['Morning! You snored the whole night. The cat left.', 'Rise and shine. Breakfast is porridge. It has always been porridge.', 'Slept well? Good. Now go be brave somewhere else, I need to change the sheets.']));
        LB.save('auto');
      }
    } else if (choice === 1) {
      await ui.say('marrow', pick(gossip()));
    }
    ui.endDialogue();
  }

  function gossip() {
    const S = LB.S;
    const g = [
      'Barnaby charged me for looking at his hat once. Just looking.',
      'Pim brings me dead moths. At least, I hope they were dead.',
      "If you meet a mushroom that talks philosophy, don't argue. You'll lose, and then it'll be smug about it.",
      "When you fall down there — and you will, dear — I'll come and fetch you. I charge half your purse. Plus tip.",
      'The Elder says the King lives on the tenth floor. Villains love a round number.',
      'Bring oil. When your lantern goes dim, the Hollow gets bolder. So does its loot, mind.',
    ];
    if (S.flags.reginald === 0) g.push("Sir Reginald went down the Hollow six weeks ago. Said he'd be back by lunch. Didn't say which lunch.");
    if (S.flags.reginald >= 2) g.push("Reginald's alive? And living on a rock called Chair? …That tracks.");
    if (S.stats.deaths >= 3) g.push(`That's ${S.stats.deaths} times I've dragged you home, dear. I'm naming my back after you.`);
    if (S.flags.bossDefeated) g.push("Everyone's sleeping properly again. Except me. Somebody has to hear the snoring.");
    return g;
  }

  async function talkElder() {
    const S = LB.S;
    let line;
    if (S.flags.bossDefeated) line = "The Lantern burns again. You did that. I'd hug you, but my beard is extremely flammable.";
    else if (S.deepest >= 10) line = "He's right there. The tenth floor. I can feel the cold from here. Rest first. Heroes who skip naps become cautionary tales.";
    else if (S.deepest >= 7) line = "The Drowned Chapel. Someone built a church down there, and then the water came to worship. Don't join the choir.";
    else if (S.deepest >= 4) line = 'The Sulking Grotto! Every mushroom there has feelings, and every feeling is resentment.';
    else line = "The Mosslight Tunnels are the Hollow's front porch. Wipe your feet. Stab politely.";
    const c = await ui.say('elder', line, ['Any advice?', 'Tell me about the Wickless King.', 'Goodbye.']);
    if (c === 0) await ui.say('elder', pick([
      'When an enemy winds up (sulking, inhaling, glaring meaningfully), Defend. Your guard shrugs off most of the blow.',
      'A dim lantern makes the Hollow braver, and its treasure shinier. Greed is a lantern setting, child.',
      'Waystones on floors 4, 7 and 10 let you skip ahead from the village. Touch them. Respectfully.',
      "Barnaby restocks his gear every time you come back. He calls it 'fresh'. It is not fresh.",
      'Shiny monsters carry gold. Ancient ones carry better loot. Enraged ones carry grudges.',
      'Defending also steadies your breath. You recover a little MP. Old trick. Older than me, even.',
      'Save your game at the inn. Or anywhere, really. The universe keeps notes if you ask it nicely.',
    ]));
    else if (c === 1) {
      if (S.flags.bossDefeated) await ui.say('elder', 'Turns out he just wanted things quiet and dim. Like a nice restaurant. We may open one for him.');
      else await ui.talk('elder', [
        'Once he was a candle-maker. The best. Then he decided light was rude: it shows the dust, the flaws, the dishes nobody did.',
        'So he took ours. Every flame in the Hollow bows to him now. Except yours, I hope.',
      ]);
    }
    ui.endDialogue();
  }

  async function petPim() {
    const S = LB.S;
    LB.audio.sfx('select');
    const pim = U.$('.actor.pim');
    if (pim) ui.burst(pim, '#f28bb0', 8);
    if (!S.flags.pimGift && chance(0.45)) {
      S.flags.pimGift = true;
      const id = pick(['tonic', 'oil', 'soup', 'ether']);
      S.bag.items[id] = (S.bag.items[id] || 0) + 1;
      await ui.say('pim', `Pim pushes a ${LB.CONSUMABLES[id].name} off a barrel. It rolls to your feet. Pim stares at you until you take it.`);
      ui.log(`Pim gave you a <b>${LB.CONSUMABLES[id].name}</b>. Good cat.`, 'good');
    } else {
      await ui.say('pim', pick([
        'Pim allows it. You feel blessed.',
        'Pim stares into your soul and finds it adequate.',
        "Pim purrs like a tiny engine. You're fairly sure the purr means 'Defend when they wind up'.",
        'Pim headbutts your lantern. It flickers happily.',
        'Pim rolls over. It is a trap. You know it is a trap. You pet the belly anyway. Ow.',
        'Pim meows at the inn. Pim thinks you should rest. Pim is usually right.',
        'Pim is asleep. You pet very quietly. Pim twitches one ear in approval.',
      ]));
    }
    ui.endDialogue();
  }

  /* ---------------------------------------------------------------- shop */
  function restockShop() {
    const S = LB.S;
    const ilvl = Math.max(1, S.deepest);
    S.shop = { gear: [0, 1, 2].map((i) => LB.makeGear(Math.max(1, ilvl - (i === 0 ? 1 : 0)), i === 2 ? 'rare' : 'fine', ['weapon', 'armor', 'trinket'][i])) };
  }
  const buyPrice = (item) => Math.round(item.value * 2.5);

  async function visitShop() {
    await ui.say('barnaby', pick([
      "Ribbit. That's frog for 'everything is fairly priced'.",
      'Welcome to Croak & Sons. There are no sons. It is a branding thing.',
      "No refunds. No returns. No, you can't pet the hat.",
      "Ah, my favourite customer! (I say that to everyone. It's never true.)",
    ]));
    ui.endDialogue();
    await LB.openShop({ title: 'Croak & Sons', keeper: 'barnaby', markup: 1 });
  }

  LB.openShop = function ({ title, markup = 1, stock, keeper }) {
    return new Promise((resolve) => {
      const S = LB.S;
      if (!stock && !S.shop) restockShop();
      let tab = 'buy';
      const body = el('div', { class: 'shop' });
      const m = ui.modal({ title, body, cls: 'modal-wide', onClose: () => { ui.hud(); resolve(); } });
      function render() {
        body.innerHTML = '';
        const tabs = el('div', { class: 'tabs' });
        for (const t of ['buy', 'sell']) tabs.append(el('button', { class: 'btn tab' + (tab === t ? ' on' : ''), type: 'button', text: t === 'buy' ? 'Buy' : 'Sell', onclick: () => { tab = t; render(); } }));
        tabs.append(el('div', { class: 'shop-gold', html: `<span class="ico ico-coin"></span> ${S.hero.gold} gold` }));
        body.append(tabs);
        const list = el('div', { class: 'item-list' });
        if (tab === 'buy') {
          const consumables = stock ? stock.items : Object.keys(LB.CONSUMABLES).filter((id) => !LB.CONSUMABLES[id].minDepth || S.deepest >= LB.CONSUMABLES[id].minDepth);
          for (const id of consumables) {
            const C = LB.CONSUMABLES[id];
            const price = Math.round(C.price * markup);
            list.append(itemRow({ icon: C.icon, name: esc(C.name), desc: C.desc, extra: `Owned: ${S.bag.items[id] || 0}`, btn: `Buy ${price}g`, disabled: S.hero.gold < price, onClick: () => {
              S.hero.gold -= price;
              S.bag.items[id] = (S.bag.items[id] || 0) + 1;
              LB.audio.sfx('buy');
              ui.toast(`Bought ${esc(C.name)}`);
              render();
            } }));
          }
          const gear = stock ? stock.gear : S.shop.gear;
          gear.forEach((item, i) => {
            const price = Math.round(buyPrice(item) * markup);
            list.append(gearRow(item, { btn: `Buy ${price}g`, disabled: S.hero.gold < price, onClick: () => {
              S.hero.gold -= price;
              S.bag.gear.push(item);
              gear.splice(i, 1);
              LB.audio.sfx('buy');
              ui.toast(`Bought ${LB.gearLabel(item)}`);
              render();
            } }));
          });
          if (!gear.length) list.append(el('p', { class: 'muted', text: 'Gear sold out. More arrives whenever you come back from the Hollow.' }));
        } else {
          const junk = S.bag.gear.filter((g) => g.rarity === 'common');
          if (junk.length) {
            const total = junk.reduce((a, g) => a + g.value, 0);
            list.append(el('button', { class: 'btn sell-junk', type: 'button', text: `Sell all Common gear (${junk.length}) for ${total}g`, onclick: () => {
              S.bag.gear = S.bag.gear.filter((g) => g.rarity !== 'common');
              S.hero.gold += total;
              LB.audio.sfx('coin');
              render();
            } }));
          }
          S.bag.gear.forEach((item) => list.append(gearRow(item, { btn: `Sell ${item.value}g`, onClick: () => {
            S.bag.gear = S.bag.gear.filter((g) => g !== item);
            S.hero.gold += item.value;
            LB.audio.sfx('coin');
            ui.toast(pick(["I'll take it. Out of pity. And profit.", 'Ribbit. Sold.', 'A fine piece of junk!']));
            render();
          } })));
          for (const [id, n] of Object.entries(S.bag.items)) {
            const C = LB.CONSUMABLES[id];
            const price = Math.max(1, Math.floor(C.price / 2));
            list.append(itemRow({ icon: C.icon, name: `${esc(C.name)} ×${n}`, desc: C.desc, btn: `Sell ${price}g`, onClick: () => {
              S.bag.items[id]--;
              if (!S.bag.items[id]) delete S.bag.items[id];
              S.hero.gold += price;
              LB.audio.sfx('coin');
              render();
            } }));
          }
          if (!S.bag.gear.length && !Object.keys(S.bag.items).length) list.append(el('p', { class: 'muted', text: 'Your bag is empty. Barnaby looks disappointed in a very froggy way.' }));
        }
        body.append(list);
        ui.hud();
      }
      render();
      void keeper;
      void m;
    });
  };

  function itemRow({ icon, name, desc, extra, btn, onClick, disabled, cls = '' }) {
    const row = el('div', { class: 'item-row ' + cls });
    row.append(el('div', { class: 'item-icon' }, LB.spriteImg(icon, 3)));
    row.append(el('div', { class: 'item-info' }, el('div', { class: 'item-title', html: name }), el('div', { class: 'item-desc', html: desc || '' }), extra ? el('div', { class: 'item-extra', html: extra }) : null));
    if (btn) {
      const b = el('button', { class: 'btn small', type: 'button', html: btn });
      if (disabled) b.disabled = true;
      b.addEventListener('click', () => { if (!b.disabled) onClick(); });
      row.append(b);
    }
    return row;
  }
  function diffLine(item) {
    const S = LB.S;
    const cur = S.equip[item.slot];
    const keys = new Set([...Object.keys(item.stats), ...Object.keys(cur ? cur.stats : {})]);
    const parts = [];
    for (const k of keys) {
      const d = (item.stats[k] || 0) - ((cur && cur.stats[k]) || 0);
      if (d) parts.push(`<span class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'}${Math.abs(d)} ${LB.STAT_SHORT[k]}</span>`);
    }
    if (!parts.length) return '<span class="muted">Same as equipped</span>';
    return 'vs equipped: ' + parts.join(' ');
  }
  function gearRow(item, opts = {}) {
    const slotName = { weapon: 'Weapon', armor: 'Armour', trinket: 'Trinket' }[item.slot];
    const row = itemRow({
      icon: item.icon,
      name: LB.gearLabel(item),
      desc: `<span class="slot-tag">${slotName} · ${LB.RARITY[item.rarity].name}</span> ${LB.statLine(item.stats)}${item.lore ? `<br><i class="lore">${esc(item.lore)}</i>` : ''}`,
      extra: opts.noDiff ? '' : diffLine(item),
      btn: opts.btn, onClick: opts.onClick, disabled: opts.disabled,
      cls: 'rarity-' + item.rarity,
    });
    if (opts.btn2) {
      const b2 = el('button', { class: 'btn small ghost', type: 'button', html: opts.btn2 });
      b2.addEventListener('click', opts.onClick2);
      row.append(b2);
    }
    return row;
  }

  /* ----------------------------------------------------------- inventory */
  LB.openBag = function () {
    if (LB.busy || LB.inBattle() || ui.anyModal() || ui.dialogueOpen()) return;
    const S = LB.S;
    const body = el('div', { class: 'bag' });
    ui.modal({ title: 'Bag & Equipment', body, cls: 'modal-wide', onClose: () => LB.refresh() });
    function render() {
      body.innerHTML = '';
      const eq = el('div', { class: 'equip-grid' });
      for (const slot of ['weapon', 'armor', 'trinket']) {
        const item = S.equip[slot];
        const card = el('div', { class: 'equip-slot' + (item ? ' rarity-' + item.rarity : ' empty') });
        card.append(el('div', { class: 'slot-name', text: { weapon: 'Weapon', armor: 'Armour', trinket: 'Trinket' }[slot] }));
        if (item) {
          card.append(el('div', { class: 'slot-item' }, LB.spriteImg(item.icon, 3), el('div', { html: `${LB.gearLabel(item)}<div class="item-desc">${LB.statLine(item.stats)}</div>` })));
          card.append(el('button', { class: 'btn small ghost', type: 'button', text: 'Unequip', onclick: () => { S.bag.gear.push(item); S.equip[slot] = null; LB.clampVitals(); LB.audio.sfx('click'); render(); } }));
        } else card.append(el('div', { class: 'muted', text: 'Nothing equipped' }));
        eq.append(card);
      }
      body.append(eq);
      const st = LB.stats();
      body.append(el('div', { class: 'stat-strip', html: ['hp', 'mp', 'str', 'def', 'wit', 'agi', 'luck', 'gold'].map((k) => `<span><b>${LB.STAT_SHORT[k]}</b> ${st[k]}${k === 'gold' ? '%' : ''}</span>`).join('') }));

      body.append(el('h3', { text: 'Consumables' }));
      const cl = el('div', { class: 'item-list' });
      const entries = Object.entries(S.bag.items);
      for (const [id, n] of entries) {
        const C = LB.CONSUMABLES[id];
        const usable = !C.battleOnly && !C.passive;
        cl.append(itemRow({ icon: C.icon, name: `${esc(C.name)} ×${n}`, desc: C.desc, btn: usable ? 'Use' : C.passive ? 'Passive' : 'Battle only', disabled: !usable, onClick: async () => {
          await LB.useConsumable(id, false);
          ui.hud();
          render();
        } }));
      }
      if (!entries.length) cl.append(el('p', { class: 'muted', text: 'No consumables. Barnaby would love to fix that.' }));
      body.append(cl);

      body.append(el('h3', { text: `Gear (${S.bag.gear.length})` }));
      const gl = el('div', { class: 'item-list' });
      const order = { legendary: 0, radiant: 1, rare: 2, fine: 3, common: 4 };
      S.bag.gear.slice().sort((a, b) => order[a.rarity] - order[b.rarity] || a.slot.localeCompare(b.slot)).forEach((item) => {
        gl.append(gearRow(item, {
          btn: 'Equip',
          onClick: () => {
            const old = S.equip[item.slot];
            S.equip[item.slot] = item;
            S.bag.gear = S.bag.gear.filter((g) => g !== item);
            if (old) S.bag.gear.push(old);
            LB.clampVitals();
            LB.audio.sfx('select');
            ui.toast(`Equipped ${LB.gearLabel(item)}`);
            ui.hud();
            render();
          },
          btn2: 'Drop',
          onClick2: () => { S.bag.gear = S.bag.gear.filter((g) => g !== item); LB.audio.sfx('click'); render(); },
        }));
      });
      if (!S.bag.gear.length) gl.append(el('p', { class: 'muted', text: 'No spare gear. Go take some from monsters. They do not need it.' }));
      body.append(gl);
    }
    render();
  };

  /* ---------------------------------------------------------- hero sheet */
  LB.openHero = function () {
    if (LB.busy || ui.anyModal() || ui.dialogueOpen()) return;
    const S = LB.S, h = S.hero, C = LB.CLASSES[h.cls], st = LB.stats();
    const body = el('div', { class: 'hero-sheet' });
    const top = el('div', { class: 'sheet-top' });
    top.append(el('div', { class: 'sheet-portrait' }, LB.spriteImg(C.sprite, 6)));
    top.append(el('div', {}, el('h3', { text: h.name }), el('p', { html: `Level ${h.level} ${C.name} — <i>${esc(C.tagline)}</i>` }),
      el('p', { class: 'muted', html: `Keepsake: <b>${LB.KEEPSAKES[h.keepsake].name}</b> — ${LB.KEEPSAKES[h.keepsake].desc}` }),
      S.blessing ? el('p', { class: 'good', html: `Blessing: <b>${esc(S.blessing.name)}</b> (+${S.blessing.amount} ${LB.STAT_SHORT[S.blessing.stat]} until you return to town)` }) : null));
    body.append(top);
    const stats = el('div', { class: 'sheet-stats' });
    for (const k of ['hp', 'mp', 'str', 'def', 'wit', 'agi', 'luck', 'gold']) {
      stats.append(el('div', { class: 'sheet-stat' }, el('b', { text: LB.STAT_NAMES[k] }), el('span', { text: k === 'hp' ? `${h.hp}/${st.hp}` : k === 'mp' ? `${h.mp}/${st.mp}` : k === 'gold' ? `+${st.gold}%` : String(st[k]) }), el('em', { text: LB.STAT_HELP[k] || '' })));
    }
    body.append(stats);
    body.append(el('h3', { text: 'Skills' }));
    const sk = el('div', { class: 'skill-list' });
    C.skills.forEach((id, i) => {
      const s = LB.SKILLS[id];
      const known = h.level >= LB.SKILL_LEVELS[i];
      sk.append(el('div', { class: 'skill' + (known ? '' : ' locked'), html: `<b>${s.name}</b> <span class="mp">${s.mp} MP</span>${known ? '' : ` <span class="muted">(unlocks at Lv ${LB.SKILL_LEVELS[i]})</span>`}<br><span class="item-desc">${s.desc}</span>` }));
    });
    body.append(sk);
    const t = S.stats;
    const mins = Math.round((t.playMs || 0) / 60000);
    body.append(el('h3', { text: 'Adventure log' }));
    body.append(el('div', { class: 'run-stats', html: [
      ['Battles won', t.battles], ['Steps taken', t.steps], ['Deepest floor', S.deepest], ['Chests opened', t.chests],
      ['Critical hits', t.crits], ['Enemies toadified', t.toads], ['Gold earned', t.goldEarned], ['Times Marrow dragged you home', t.deaths], ['Play time', `${mins} min`],
    ].map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('') }));
    ui.modal({ title: 'Hero', body, cls: 'modal-wide' });
  };

  /* ---------------------------------------------------------- save / load */
  function saveSummary(d) {
    if (!d) return '<span class="muted">Empty</span>';
    const C = LB.CLASSES[d.hero.cls];
    const when = new Date(d.savedAt || 0).toLocaleString();
    const where = d.mode === 'town' ? 'Emberwick' : `Floor ${d.floor}`;
    return `<b>${esc(d.hero.name)}</b> — Lv ${d.hero.level} ${C ? C.name : ''}<br><span class="muted">${where} · deepest ${d.deepest}${d.flags && d.flags.bossDefeated ? ' · ★ King defeated' : ''} · ${when}</span>`;
  }
  LB.openSaves = function (fromTitle) {
    if (!fromTitle && (LB.busy || LB.inBattle() || ui.anyModal() || ui.dialogueOpen())) return;
    const body = el('div', { class: 'saves' });
    const m = ui.modal({ title: fromTitle ? 'Load Game' : 'Save / Load', body });
    function render() {
      body.innerHTML = '';
      if (!fromTitle) body.append(el('p', { class: 'muted', text: 'The game also autosaves as you play. Saves live in this browser.' }));
      for (const slot of LB.SLOTS) {
        const d = LB.readSave(slot);
        const row = el('div', { class: 'save-row' });
        row.append(el('div', { class: 'save-slot', text: slot === 'auto' ? 'Auto' : 'Slot ' + slot }));
        row.append(el('div', { class: 'save-info', html: saveSummary(d) }));
        const btns = el('div', { class: 'save-btns' });
        if (!fromTitle && slot !== 'auto') btns.append(el('button', { class: 'btn small', type: 'button', text: 'Save', onclick: () => {
          if (LB.save(slot)) { LB.audio.sfx('select'); ui.toast(`Saved to slot ${slot}`); } else ui.toast('Could not save. Is storage blocked?', 'bad');
          render();
        } }));
        if (d) btns.append(el('button', { class: 'btn small', type: 'button', text: 'Load', onclick: () => { m.close(); LB.loadGame(slot); } }));
        if (d) btns.append(el('button', { class: 'btn small ghost', type: 'button', text: 'Delete', onclick: () => {
          if (row.dataset.confirm) { LB.deleteSave(slot); render(); } else { row.dataset.confirm = 1; ui.toast('Click Delete again to confirm'); }
        } }));
        row.append(btns);
        body.append(row);
      }
    }
    render();
  };

  LB.loadGame = function (slot) {
    const d = LB.readSave(slot);
    if (!d) return ui.toast('That save is empty or damaged.', 'bad');
    LB.S = LB.migrate(d);
    ui.closeTopModal();
    ui.endDialogue();
    LB.showScreen('game');
    ui.clearLog();
    ui.log(`Welcome back, <b>${esc(LB.S.hero.name)}</b>.`, 'good');
    bgKey = null;
    LB.refresh();
  };

  /* ============================================================ the Hollow */
  async function enterHollow() {
    const S = LB.S;
    let floor = 1;
    const stones = S.waystones.filter((f) => f <= LB.MAX_FLOOR).sort((a, b) => a - b);
    if (stones.length > 1) {
      floor = await ui.pickModal('Descend', 'Waystones hum under the village. Where do you want to start?', [
        ...stones.map((f) => ({ label: `Floor ${f}`, desc: LB.AREA_NAMES[LB.areaFor(f)] + (f === 10 ? (S.flags.bossDefeated ? ' — the empty throne' : ' — the King awaits') : ''), value: f, icon: 'i_flame' })),
        { label: 'Not yet', value: null, icon: 'i_door' },
      ]);
      if (!floor) return;
    }
    if (S.hero.oil < S.hero.maxOil) S.hero.oil = S.hero.maxOil;
    await ui.fade(async () => {
      S.mode = 'dungeon';
      S.floor = floor;
      S.progress = 0;
      bgKey = null;
      renderDungeon();
    });
    LB.audio.sfx('stairs');
    ui.log(`You descend into <b>${LB.AREA_NAMES[LB.areaFor(floor)]}</b>, floor ${floor}. Your lantern hums.`, 'area');
    LB.save('auto');
  }

  function renderDungeon() {
    const S = LB.S;
    S.scene = 'dungeon';
    LB.audio.music('dungeon');
    LB.renderStage('dungeon');
    const hero = LB.heroActor();
    hero.style.left = '26%';
    const need = LB.stepsForFloor(S.floor);
    const stairs = S.floor < LB.MAX_FLOOR && S.progress >= need;
    const throne = S.floor >= LB.MAX_FLOOR && !S.flags.bossDefeated;
    if (stairs) actor('i_door', { style: 'left:74%', cls: 'prop', label: 'Stairs', onClick: () => LB.run(descend) });
    if (throne) actor('king', { style: 'left:74%', cls: 'prop throne-silhouette', label: 'The Throne', flip: true, onClick: () => LB.run(approachThrone) });
    const drain = LB.oilDrain();
    const list = [];
    if (throne) list.push({ label: 'Approach the Throne', sub: 'Final battle', icon: 'i_flame', cls: 'danger', onClick: () => LB.run(approachThrone) });
    list.push({ label: 'Explore', sub: S.hero.oil > 0 ? `-${drain} oil` : 'In the dark…', icon: 'i_flame', cls: throne ? '' : 'primary', onClick: () => LB.run(explore) });
    if (stairs) list.push({ label: `Descend to Floor ${S.floor + 1}`, sub: 'Stairs found!', icon: 'i_door', cls: 'primary', onClick: () => LB.run(descend) });
    list.push({ label: 'Bag', sub: 'Items & gear', icon: 'i_bag', onClick: LB.openBag });
    list.push({ label: 'Return to Emberwick', sub: 'Refill oil, rest', icon: 'i_heart', onClick: () => LB.run(returnToTown) });
    const light = LB.lightLevel();
    ui.actions(list, `Floor ${S.floor} — ${light === 'dark' ? '<span class="bad">your lantern is OUT</span>' : light === 'dim' ? '<span class="warn">your lantern is dim</span>' : 'your lantern burns steady'}`);
  }

  async function returnToTown(silent) {
    const S = LB.S;
    await ui.fade(async () => {
      S.mode = 'town';
      S.hero.oil = S.hero.maxOil;
      S.blessing = null;
      S.flags.pimGift = false;
      LB.clampVitals();
      restockShop();
      bgKey = null;
      renderTown();
    });
    if (!silent) ui.log('You climb back to Emberwick. The lamplighter refills your lantern. Barnaby has new stock.', 'area');
    LB.save('auto');
  }

  async function descend() {
    const S = LB.S;
    LB.audio.sfx('stairs');
    await ui.fade(async () => {
      S.floor++;
      S.progress = 0;
      S.deepest = Math.max(S.deepest, S.floor);
      renderDungeon();
    });
    const area = LB.areaFor(S.floor);
    if (LB.areaFor(S.floor - 1) !== area) ui.log(`You enter <b>${LB.AREA_NAMES[area]}</b>.`, 'area');
    ui.log(`Floor ${S.floor}.`, 'area');
    if (LB.WAYSTONES.includes(S.floor) && !S.waystones.includes(S.floor)) {
      S.waystones.push(S.floor);
      LB.audio.sfx('magic');
      ui.log(`You touch a humming <b>Waystone</b>. You can now start from floor ${S.floor} when leaving Emberwick.`, 'good');
      ui.toast(`Waystone unlocked: Floor ${S.floor}`);
    }
    if (S.floor === LB.MAX_FLOOR && !S.flags.bossDefeated) {
      ui.log('The air turns cold as old wax. Ahead, on a throne of drips and shadows, something waits.', 'bad');
    }
    LB.save('auto');
  }

  function enemyPool(floor) {
    const pool = {};
    for (const [id, E] of Object.entries(LB.ENEMIES)) {
      if (floor >= LB.MAX_FLOOR) { if (E.floors[0] < 99 && E.floors[0] >= 4) pool[id] = 1; }
      else if (floor >= E.floors[0] && floor <= E.floors[1]) pool[id] = 1 + (floor - E.floors[0] < 2 ? 0.5 : 0);
    }
    return pool;
  }

  async function randomBattle() {
    const S = LB.S;
    const id = U.weighted(enemyPool(S.floor));
    const light = LB.lightLevel();
    const eliteChance = 0.08 + (light === 'dim' ? 0.05 : light === 'dark' ? 0.12 : 0) + (S.floor >= 3 ? 0.03 : 0);
    const elite = chance(eliteChance) ? pick(Object.keys(LB.ELITES)) : null;
    const ambush = chance(clamp(0.1 - LB.stats().luck * 0.004, 0.02, 0.1));
    const result = await LB.battle(id, { elite, ambush });
    return handleBattleResult(result);
  }
  async function handleBattleResult(result) {
    if (result === 'lose') { await LB.onDeath(); return false; }
    return true;
  }

  async function explore() {
    const S = LB.S;
    const need = LB.stepsForFloor(S.floor);
    S.stats.steps++;
    const hadOil = S.hero.oil > 0;
    LB.addOil(-LB.oilDrain());
    if (hadOil && S.hero.oil === 0) ui.log('Your lantern sputters out. <b>Darkness.</b> Enemies grow bolder… and so does their loot.', 'bad');
    else if (S.hero.oil > 0 && S.hero.oil <= 30 && S.hero.oil + LB.oilDrain() > 30) ui.log('Your lantern dims. The shadows lean closer.', 'warn');
    const wasBelow = S.progress < need;
    if (wasBelow) S.progress++;
    LB.audio.sfx('step');
    const hero = U.$('#actor-hero');
    if (hero) ui.anim(hero, 'walk', 500);
    U.$('#stage').classList.add('walking');
    await sleep(420);
    U.$('#stage').classList.remove('walking');
    renderDungeon();

    if (S.hero.oil <= 0 && chance(0.3)) {
      const d = Math.max(1, Math.round(LB.stats().hp * 0.06));
      S.hero.hp = Math.max(1, S.hero.hp - d);
      ui.shake(false);
      LB.audio.sfx('hurt');
      ui.log(`Something in the dark nips you. <b>-${d} HP</b>. You did not see what. You would prefer not to.`, 'bad');
    }

    const roll = U.weighted({ battle: 50, chest: 12, special: 14, find: 10, flavor: 14 });
    if (roll === 'battle') { if (!(await randomBattle())) return; }
    else if (roll === 'chest') { if (!(await chestEvent())) return; }
    else if (roll === 'special') { if (!(await specialEvent())) return; }
    else if (roll === 'find') findEvent();
    else ui.log(pick(LB.FLAVOR[LB.areaFor(S.floor)]), 'flavor');

    if (S.mode === 'dungeon' && S.floor < LB.MAX_FLOOR && wasBelow && S.progress >= need) ui.log('You spot <b>stairs leading down</b>!', 'good');
    LB.save('auto');
  }

  function findEvent() {
    const S = LB.S;
    if (chance(0.55)) {
      const g = LB.addGold(ri(3, 8) + S.floor * 2);
      LB.audio.sfx('coin');
      ui.log(pick([`You find a loose pouch with <b>${g} gold</b> in it.`, `Something glints in a puddle: <b>${g} gold</b>!`, `A skeleton offers you <b>${g} gold</b>. It doesn't need it anymore.`]), 'gold');
    } else {
      const loot = LB.rollLoot(S.floor, { consumableChance: 0.85 });
      LB.audio.sfx('chest');
      ui.log(`You find ${LB.giveLoot(loot)} wedged between two rocks.`, 'loot');
    }
  }

  async function chestEvent() {
    const S = LB.S;
    const chest = actor('chest', { style: 'left:70%', cls: 'prop pop' });
    const c = await ui.pickModal('A treasure chest!', 'A chest sits alone in the dark. Chests in the Hollow are <i>usually</i> just chests.', [
      { label: 'Open it', value: 'open', icon: 'i_coin' },
      { label: 'Leave it', desc: 'It looked at you funny.', value: 'leave', icon: 'i_door' },
    ]);
    if (c !== 'open') { ui.log('You leave the chest alone. It seems relieved. Or disappointed.', 'dim'); return true; }
    if (S.floor >= 2 && chance(0.13)) {
      chest.remove();
      LB.audio.sfx('hurt');
      ui.shake(true);
      const r = await LB.battle('mimic', {});
      if (r === 'win') S.stats.chests++;
      return handleBattleResult(r);
    }
    S.stats.chests++;
    LB.audio.sfx('chest');
    ui.burst(chest, '#ffd35c', 18);
    const light = LB.lightLevel();
    const bonus = light === 'dark' ? 0.2 : light === 'dim' ? 0.1 : 0;
    const g = LB.addGold(ri(6, 12) + S.floor * 3);
    let msg = `The chest creaks open: <b>${g} gold</b>`;
    if (chance(0.7)) msg += ` and ${LB.giveLoot(LB.rollLoot(S.floor + (light === 'dark' ? 1 : 0), { consumableChance: 0.35, rarityBonus: bonus + 0.05 }))}`;
    ui.log(msg + '!', 'loot');
    await sleep(500);
    return true;
  }

  /* ------------------------------------------------------ special events */
  const RIDDLES = [
    { q: "I'm tall when I'm young and short when I'm old. What am I?", a: ['A candle', 'A tree', 'Your patience'], correct: 0 },
    { q: 'The more you take, the more you leave behind. What am I?', a: ['Gold', 'Footsteps', 'Regrets'], correct: 1 },
    { q: 'What has keys but opens no locks?', a: ["Barnaby's shop", 'A jailer', 'A piano'], correct: 2 },
    { q: 'What can fill a room but takes up no space?', a: ['Light', 'Soup', 'Ghosts'], correct: 0 },
    { q: 'What gets wetter the more it dries?', a: ['A towel', 'The Drowned Deacon', 'A fish'], correct: 0 },
  ];
  const SPORE_Q = [
    {
      q: 'Ah, a walking meat-tube. Tell me: if a lantern burns in the Hollow and no one sees it, does it cast a shadow?',
      a: ['Yes.', 'No.', "I'm going to eat you."],
      r: [['Correct, but for entirely the wrong reasons. Take this, and think harder.', 'wit'], ['Wrong. But confidently wrong. I respect that. Here.', 'str'], null],
    },
    {
      q: 'Question for you, surface-dweller: which came first, the mushroom or the spore?',
      a: ['The mushroom.', 'The spore.', 'Lunch.'],
      r: [['Wrong! But you have given me much to ruminate upon. Take this.', 'def'], ['A classic answer. Boring, but classic. Here.', 'luck'], ['…You are hungry. That is valid. Have some soup.', 'soup']],
    },
    {
      q: 'Be honest with me. Do you think I am a… fun guy?',
      a: ['Yes!', 'No.', "I'm going to eat you."],
      r: [["Everyone says that. I have heard it four hundred times. Take your prize and go.", 'agi'], ['Finally. Someone honest. Take this gold, you refreshing person.', 'gold'], null],
    },
  ];

  async function specialEvent() {
    const S = LB.S;
    const f = S.floor;
    const reg = S.flags.reginald;
    const regReady = (reg === 0 && f >= 2) || (reg === 1 && f >= 4) || (reg === 2 && f >= 6) || (reg === 3 && f >= 8) || (reg === 4 && S.flags.bossDefeated);
    const opts = {
      reginald: regReady ? 4 : 0,
      spore: f >= 3 && S.flags.spore.length < SPORE_Q.length ? 2 : 0,
      ghost: f >= 2 && S.flags.riddles.length < RIDDLES.length ? 2 : 0,
      sal: f >= 3 ? 1.5 : 0,
      shrine: 2, well: 1.5, trap: 2, nook: 1.5, moths: 1.5,
    };
    const ev = U.weighted(opts);
    const r = await EVENTS[ev]();
    ui.endDialogue();
    return r !== false;
  }

  const EVENTS = {
    async reginald() {
      const S = LB.S;
      actor('reginald', { style: 'left:70%', cls: 'npc pop', flip: true });
      const stage = S.flags.reginald;
      if (stage === 0) {
        await ui.say('reginald', 'Hark! A fellow adventurer! Could you point me toward the surface? I have been walking upward for three days.');
        await ui.say('hero', "…That's down.");
        await ui.say('reginald', 'Ah. That does explain the heat. Here: for your trouble, a Honey Tonic. I have eleven. I keep finding them.');
        S.bag.items.tonic = (S.bag.items.tonic || 0) + 1;
        ui.log('Sir Reginald gave you a <b>Honey Tonic</b>.', 'good');
      } else if (stage === 1) {
        await ui.say('reginald', 'You again! Wonderful news: I have befriended a Sulkcap. His name is Gerald. He hates me. We are very close.');
        const c = await ui.say('reginald', 'Gerald, say hello.', ['Tell Gerald hi.', 'Is Gerald okay?']);
        await ui.say('reginald', c === 0 ? 'Gerald says nothing, but he sulks in a friendly direction. He wants you to have this. He stole it from me.' : "Gerald is never okay. That's his charm. Here, he wants you to have this. He stole it from me.");
        const g = LB.addGold(30 + S.floor * 4, true);
        ui.log(`Gerald (indirectly) gave you <b>${g} gold</b>.`, 'gold');
      } else if (stage === 2) {
        await ui.say('reginald', 'I have decided to live here now. I have a chair. It is a rock. I have named it Chair.');
        const c = await ui.say('reginald', 'Would you like to sit on Chair? Chair is very comfortable.', ['Sit on Chair.', 'I respect Chair from a distance.']);
        if (c === 0) {
          const st = LB.stats();
          S.hero.hp = st.hp;
          S.hero.mp = st.mp;
          LB.audio.sfx('heal');
          await ui.say('reginald', 'See? Chair provides. (HP and MP fully restored.)');
        } else await ui.say('reginald', 'Chair understands. Chair is very patient.');
      } else if (stage === 3) {
        await ui.say('reginald', "I hear you intend to face the King. Madness! Glorious madness! Take this. It's my sword.");
        await ui.say('reginald', 'It is slightly bent, which I maintain makes it better at going around shields.');
        const item = LB.makeLegendary('bentsword', S.floor);
        S.bag.gear.push(item);
        LB.audio.sfx('chest');
        ui.log(`Sir Reginald gave you ${LB.gearLabel(item)}!`, 'loot');
      } else {
        await ui.say('reginald', 'Is it over? Is the light back? Splendid! Could you… point me toward the surface?');
        await ui.say('hero', "It's up.");
        await ui.say('reginald', 'UP! Of course! Why did nobody say! Here, take my savings, I shan\'t need them. I have Chair.');
        const g = LB.addGold(150, true);
        ui.log(`Sir Reginald gave you <b>${g} gold</b>. He waves goodbye and walks confidently sideways.`, 'gold');
      }
      S.flags.reginald++;
      return true;
    },

    async spore() {
      const S = LB.S;
      actor('spore', { style: 'left:70%', cls: 'npc pop', flip: true });
      const idx = [0, 1, 2].find((i) => !S.flags.spore.includes(i));
      S.flags.spore.push(idx);
      const Q = SPORE_Q[idx];
      if (idx === 0) await ui.say('spore', "Halt! I am Professor Spore, chair of Philosophy at the University of Damp. I shall ask you a question.");
      const c = await ui.say('spore', Q.q, Q.a);
      const res = Q.r[c];
      if (!res) {
        await ui.say('spore', '…Rude. Accurate, perhaps, but RUDE. Very well. Class is in session.');
        ui.endDialogue();
        const r = await LB.battle('spore', {});
        if (r === 'win') ui.log('Professor Spore retreats into the wall, muttering about tenure.', 'dim');
        return handleBattleResult(r);
      }
      await ui.say('spore', res[0]);
      if (res[1] === 'soup') { S.bag.items.soup = (S.bag.items.soup || 0) + 2; ui.log('Received <b>Mystery Soup ×2</b>.', 'good'); }
      else if (res[1] === 'gold') { const g = LB.addGold(40 + S.floor * 5, true); ui.log(`Received <b>${g} gold</b>.`, 'gold'); }
      else { S.hero.bonus[res[1]] += 1; LB.audio.sfx('levelup'); ui.log(`Enlightenment! <b>+1 ${LB.STAT_SHORT[res[1]]}</b> permanently.`, 'good'); }
      return true;
    },

    async ghost() {
      const S = LB.S;
      actor('ghost', { style: 'left:70%', cls: 'npc pop float' });
      const idx = RIDDLES.findIndex((_, i) => !S.flags.riddles.includes(i));
      const R = RIDDLES[idx];
      await ui.say('ghost', pick(['Boo. Sorry. Reflex.', 'Oh! A visitor! Nobody visits. Being dead is very quiet.', "Wooo. That's ghost for 'hello'."]));
      const c = await ui.say('ghost', `Answer my riddle and I'll give you something I've been haunting. ${R.q}`, R.a);
      S.flags.riddles.push(idx);
      if (c === R.correct) {
        LB.audio.sfx('chest');
        await ui.say('ghost', 'Correct! Oh, that was fun. Nobody plays with me. Take this, I was haunting it but you can have it.');
        const loot = LB.rollLoot(S.floor, { gearOnly: true, minRarity: 'fine', rarityBonus: 0.15 });
        ui.log(`Wendel gave you ${LB.giveLoot(loot)}!`, 'loot');
      } else {
        const lost = -LB.addOil(-10);
        await ui.say('ghost', 'Wrong! Oh well.');
        ui.log(`Wendel sighs a sigh that is mostly draught. Your lantern gutters. <b>-${lost} oil</b>.`, 'warn');
        LB.updateDarkness();
      }
      return true;
    },

    async sal() {
      const S = LB.S;
      actor('sal', { style: 'left:70%', cls: 'npc pop' });
      await ui.say('sal', pick(["Psst. Hey. Want some gear? Don't ask where it came from. It came from a dead guy.", "Shady Sal's Discount Emporium. The discount is for me. Everything's marked up.", 'Buyin\'? Sellin\'? Starin\'? Starin\' costs extra.']));
      ui.endDialogue();
      const stock = {
        items: ['tonic', 'oil', U.pick(['bigtonic', 'feather', 'ether', 'firecracker'])],
        gear: [LB.makeGear(S.floor + 1, chance(0.25) ? 'radiant' : 'rare')],
      };
      await LB.openShop({ title: "Shady Sal's", markup: 1.4, stock, keeper: 'sal' });
      ui.log('Shady Sal melts back into the dark. Your wallet feels watched.', 'dim');
      return true;
    },

    async shrine() {
      const S = LB.S;
      actor('i_flame', { style: 'left:70%', cls: 'prop pop', label: 'Shrine' });
      const cost = 10 + S.floor * 5;
      const c = await ui.say(null, 'A tiny shrine with a single candle. It has been waiting a long time for someone.', ['Pray.', `Offer ${cost} gold for a blessing.`, 'Blow out the candle.', 'Leave it be.']);
      if (c === 0) {
        const st = LB.stats();
        const hp = LB.heal(st.hp * 0.3), mp = LB.restoreMp(st.mp * 0.3);
        LB.audio.sfx('heal');
        ui.log(`The candle brightens. You feel better. <b>+${hp} HP, +${mp} MP</b>.`, 'good');
      } else if (c === 1) {
        if (S.hero.gold < cost) {
          ui.log('You pat your pockets. The shrine can tell. The shrine is not impressed.', 'dim');
        } else {
          S.hero.gold -= cost;
          const [stat, name] = pick([['str', 'Blessing of the Ox'], ['def', 'Blessing of the Wall'], ['wit', 'Blessing of the Owl'], ['agi', 'Blessing of the Moth'], ['luck', 'Blessing of the Coin']]);
          S.blessing = { stat, amount: 3 + Math.floor(S.floor / 2), name };
          LB.clampVitals();
          LB.audio.sfx('levelup');
          ui.log(`<b>${name}!</b> +${S.blessing.amount} ${LB.STAT_SHORT[stat]} until you return to Emberwick.`, 'good');
        }
      } else if (c === 2) {
        await ui.say(null, 'Why would you— The shrine is very disappointed in you.');
        if (chance(0.5)) {
          ui.endDialogue();
          ui.log('A Soot Sprite crawls out of the smoke, furious on the shrine\'s behalf!', 'bad');
          return handleBattleResult(await LB.battle('soot', { floor: S.floor, elite: 'enraged' }));
        }
        LB.addGold(1, true);
        ui.log('The shrine spits out a single gold coin. It is petty, but fair.', 'gold');
      } else ui.log('You leave the little candle to its vigil.', 'dim');
      return true;
    },

    async well() {
      const S = LB.S;
      const c = await ui.say(null, 'An old well. Something at the bottom glints.', ['Toss a coin (5 gold).', 'Shout into it.', 'Walk away.']);
      if (c === 0) {
        if (S.hero.gold < 5) { ui.log('You have no coins to toss. The well judges you silently.', 'dim'); return true; }
        S.hero.gold -= 5;
        LB.audio.sfx('coin');
        const r = U.weighted({ nothing: 40, heal: 30, gold: 20, item: 10 });
        if (r === 'nothing') ui.log('Plip. Nothing happens. That was the most expensive plip of your life.', 'dim');
        else if (r === 'heal') { const n = LB.heal(LB.stats().hp * 0.5); ui.log(`A warm mist rises. <b>+${n} HP</b>.`, 'good'); }
        else if (r === 'gold') { const g = LB.addGold(30 + S.floor * 4, true); ui.log(`The well coughs up <b>${g} gold</b>. It had a cold.`, 'gold'); }
        else ui.log(`Something floats up: ${LB.giveLoot(LB.rollLoot(S.floor, { gearOnly: true, minRarity: 'rare' }))}!`, 'loot');
      } else if (c === 1) {
        await ui.say(null, '"HELLO?" … "HELLO?" … "HELLO?" … "WHAT."');
        if (chance(0.5)) {
          ui.endDialogue();
          ui.log('Something climbs out of the well. It is not happy about the shouting.', 'bad');
          const id = S.floor >= 4 ? 'wisp' : 'soot';
          return handleBattleResult(await LB.battle(id, {}));
        }
        ui.log('The well does not appreciate being yelled at. Nothing else happens.', 'dim');
      }
      return true;
    },

    async trap() {
      const S = LB.S;
      const st = LB.stats();
      LB.audio.sfx('click');
      if (chance(clamp(0.35 + st.agi * 0.015, 0.35, 0.8))) {
        ui.log(pick(['<b>Click.</b> A pressure plate! You leap aside like you practised this. You did not.', '<b>Click.</b> Darts whistle past your nose. Your nose is fine. Your nose is shaken.']), 'good');
      } else {
        const d = Math.max(1, Math.round(st.hp * 0.12));
        S.hero.hp = Math.max(1, S.hero.hp - d);
        ui.shake(false);
        LB.audio.sfx('hurt');
        ui.log(pick([`<b>Click.</b> A pie fires out of the wall. It is a rock pie. <b>-${d} HP</b>.`, `<b>Click.</b> A bucket of cold cave water. And the bucket. <b>-${d} HP</b>.`]), 'bad');
      }
      return true;
    },

    async nook() {
      const n = LB.heal(LB.stats().hp * 0.2);
      LB.audio.sfx('heal');
      ui.log(`You find a dry nook with suspiciously comfy moss and take a short breather. <b>+${n} HP</b>.`, 'good');
      return true;
    },

    async moths() {
      actor('lanternmoth', { style: 'left:66%', cls: 'npc pop float' });
      LB.audio.sfx('magic');
      const n = LB.addOil(25);
      await ui.say('moth', 'A cloud of lantern moths swirls around your light and… refuels it? Nature is weird.');
      ui.log(`The lantern moths leave you <b>+${n} oil</b>.`, 'good');
      LB.updateDarkness();
      return true;
    },
  };

  /* ------------------------------------------------------------- the boss */
  async function approachThrone() {
    const S = LB.S;
    LB.audio.music('boss');
    await ui.say(null, 'The throne room is silent except for the slow drip of cold wax. On the throne, a figure in a crown of unlit candles lifts its head.');
    await ui.say('king', 'Ah. A lamp-bearer. How… bright of you.');
    await ui.say('king', 'Do you know what light does? It SHOWS things. Dust. Flaws. The dishes nobody did. I have done the world a favour.');
    const c = await ui.say('king', 'So. Why are you here, little flame?', ['Give back the flame.', 'Your crown is made of candles.', "I'm here to fight."]);
    if (c === 0) await ui.say('king', 'No. It is mine now. I keep it in a jar. I look at it when I am sad. …I MEAN I LOATHE IT. Prepare yourself!');
    else if (c === 1) await ui.say('king', '…They are DECORATIVE. You will pay for noticing!');
    else await ui.say('king', 'Straightforward. I hate that. Very well!');
    ui.endDialogue();
    const r = await LB.battle('king', { floor: 10, noFlee: true, introText: 'The Wickless King rises from his throne of cold wax!' });
    if (r !== 'win') return handleBattleResult(r);
    await victoryEnding();
    return true;
  }

  async function victoryEnding() {
    const S = LB.S;
    S.flags.bossDefeated = true;
    const crown = LB.makeLegendary('crown', 10);
    S.bag.gear.push(crown);
    ui.log(`The King drops ${LB.gearLabel(crown)} and a small jar containing… a flame.`, 'loot');
    await ui.say('king', 'No… I just wanted… it to be quiet… and dim… like a nice restaurant…');
    await ui.say(null, 'The King collapses into a puddle of cold wax, leaving behind a small glass jar. Inside, the Great Flame of Emberwick flickers, looking a bit embarrassed about the whole thing.');
    ui.endDialogue();
    LB.audio.sfx('levelup');
    await ui.fade(async () => {
      S.mode = 'town';
      S.hero.oil = S.hero.maxOil;
      S.blessing = null;
      const st = LB.stats();
      S.hero.hp = st.hp;
      S.hero.mp = st.mp;
      restockShop();
      bgKey = null;
      renderTown();
    });
    LB.audio.music('victory');
    fireworks();
    await ui.say('elder', 'You… you did it! Look! The Great Lantern!');
    await ui.say('marrow', "Well I'll be. Somebody wake the town. Actually, don't. Let them sleep in the light for once.");
    await ui.say('barnaby', 'Ribbit! A hero! Heroes get… a 5% discount. Do not tell anyone. Especially the other heroes.');
    await ui.say('pim', 'Pim sits in the warm glow of the Great Lantern, purring so loudly the windows rattle.');
    await ui.say('elder', `Emberwick owes you everything, ${S.hero.name}. The Hollow is still down there, of course. Things are still lurking. You're welcome to keep poking them.`);
    ui.endDialogue();
    LB.save('auto');
    showEndScreen();
  }

  function fireworks() {
    const stage = U.$('#stage');
    let n = 0;
    const t = setInterval(() => {
      const fake = el('div', { style: `position:absolute;left:${ri(15, 85)}%;top:${ri(8, 45)}%;width:2px;height:2px` });
      U.$('#fx').append(fake);
      ui.burst(fake, pick(['#ffd35c', '#ff8bd8', '#8fe3ff', '#9fffb0', '#ff9d3b']), 22);
      LB.audio.sfx('coin');
      setTimeout(() => fake.remove(), 800);
      if (++n > 14) clearInterval(t);
    }, 380);
    void stage;
  }

  function showEndScreen() {
    const S = LB.S, t = S.stats;
    const body = el('div', { class: 'ending' });
    body.append(LB.pixelText('THE LIGHT RETURNS', { color: '#ffd35c', scale: 4 }));
    body.append(el('p', { html: `<b>${esc(S.hero.name)}</b> the ${LB.CLASSES[S.hero.cls].name} relit the Great Lantern of Emberwick at level ${S.hero.level}.` }));
    body.append(el('div', { class: 'run-stats', html: [
      ['Battles won', t.battles], ['Steps taken', t.steps], ['Chests opened', t.chests], ['Critical hits', t.crits],
      ['Enemies toadified', t.toads], ['Gold earned', t.goldEarned], ['Times Marrow dragged you home', t.deaths], ['Play time', Math.round((t.playMs || 0) / 60000) + ' min'],
    ].map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('') }));
    body.append(el('p', { class: 'muted', text: 'Thanks for playing Lanternbound. The Hollow is still open: keep exploring, hunt legendaries, and see how many things you can turn into toads.' }));
    ui.modal({ title: '★ Victory ★', body, cls: 'modal-ending' });
  }

  /* --------------------------------------------------------------- death */
  LB.onDeath = async function () {
    const S = LB.S;
    S.stats.deaths++;
    const lost = Math.floor(S.hero.gold / 2);
    S.hero.gold -= lost;
    const deepFloor = S.floor;
    await ui.fade(async () => {
      S.mode = 'town';
      const st = LB.stats();
      S.hero.hp = st.hp;
      S.hero.mp = st.mp;
      S.hero.oil = S.hero.maxOil;
      S.blessing = null;
      S.flags.pimGift = false;
      restockShop();
      bgKey = null;
      renderTown();
    });
    await ui.say('marrow', pick([
      `Found you face-down on floor ${deepFloor}, snoring. I took my fee from your purse. Half. Plus tip.`,
      `Floor ${deepFloor}, was it? You were very heavy. I've taken ${lost} gold for my back.`,
      "Up you get. Dying's allowed in Emberwick, but only briefly. That'll be half your gold, dear.",
    ]));
    ui.endDialogue();
    ui.log(`You wake up at the Snoring Candle. Marrow charged <b>${lost} gold</b> for the rescue.`, 'bad');
    LB.save('auto');
  };

  /* ================================================================ screens */
  LB.showScreen = function (name) {
    U.$$('.screen').forEach((s) => (s.hidden = s.id !== 'screen-' + name));
    document.body.dataset.screen = name;
  };

  function renderTitle() {
    LB.showScreen('title');
    const logo = U.$('#title-logo');
    logo.innerHTML = '';
    logo.append(LB.pixelText('LANTERNBOUND', { color: '#ffd35c', scale: 7, cls: 'logo-text' }));
    const c = U.$('#title-bg');
    LB.drawBackground(c, 'town', 99, { lit: false });
    const flame = U.$('#title-flame');
    flame.innerHTML = '';
    flame.append(LB.spriteImg('i_flame', 8));
    const latest = LB.latestSave();
    const btns = U.$('#title-buttons');
    btns.innerHTML = '';
    const mk = (label, fn, cls = '') => {
      const b = el('button', { class: 'btn big ' + cls, type: 'button', text: label });
      b.addEventListener('click', () => { LB.audio.init(); LB.audio.sfx('select'); fn(); });
      btns.append(b);
      return b;
    };
    if (latest) mk(`Continue — ${latest.data.hero.name}, Lv ${latest.data.hero.level}`, () => LB.loadGame(latest.slot), 'primary');
    mk('New Game', renderCreate, latest ? '' : 'primary');
    if (latest) mk('Load Game', () => LB.openSaves(true));
    const snd = mk(LB.audio.label(), () => { snd.textContent = LB.audio.cycle(); }, 'ghost');
  }

  function renderCreate() {
    LB.showScreen('create');
    LB.audio.music('title');
    const S0 = { name: pick(LB.HERO_NAMES), cls: 'warden', keepsake: 'cookies' };
    const nameInput = U.$('#create-name');
    nameInput.value = S0.name;
    U.$('#create-dice').onclick = () => { LB.audio.sfx('click'); nameInput.value = pick(LB.HERO_NAMES.filter((n) => n !== nameInput.value)); };
    const classes = U.$('#create-classes');
    const keeps = U.$('#create-keepsakes');
    function draw() {
      classes.innerHTML = '';
      for (const [id, C] of Object.entries(LB.CLASSES)) {
        const card = el('button', { class: 'card class-card' + (S0.cls === id ? ' on' : ''), type: 'button' });
        card.append(el('div', { class: 'card-sprite' }, LB.spriteImg(C.sprite, 5)));
        card.append(el('div', { class: 'card-title', text: C.name }));
        card.append(el('div', { class: 'card-tag', text: C.tagline }));
        card.append(el('div', { class: 'card-desc', text: C.desc }));
        const bars = el('div', { class: 'mini-stats' });
        for (const k of ['hp', 'mp', 'str', 'def', 'wit', 'agi', 'luck']) {
          const max = { hp: 65, mp: 24, str: 10, def: 8, wit: 12, agi: 10, luck: 9 }[k];
          bars.append(el('div', { class: 'mini-stat' }, el('span', { text: LB.STAT_SHORT[k] }), el('i', { style: `--w:${Math.round((C.base[k] / max) * 100)}%` }), el('b', { text: String(C.base[k]) })));
        }
        card.append(bars);
        card.addEventListener('click', () => { S0.cls = id; LB.audio.sfx('select'); draw(); });
        classes.append(card);
      }
      keeps.innerHTML = '';
      for (const [id, K] of Object.entries(LB.KEEPSAKES)) {
        const card = el('button', { class: 'card keep-card' + (S0.keepsake === id ? ' on' : ''), type: 'button' });
        card.append(LB.spriteImg(K.icon, 3), el('div', {}, el('div', { class: 'card-title', text: K.name }), el('div', { class: 'card-desc', text: K.desc })));
        card.addEventListener('click', () => { S0.keepsake = id; LB.audio.sfx('select'); draw(); });
        keeps.append(card);
      }
    }
    draw();
    U.$('#create-back').onclick = () => { LB.audio.sfx('click'); renderTitle(); };
    U.$('#create-start').onclick = () => {
      const name = nameInput.value.trim().slice(0, 16) || pick(LB.HERO_NAMES);
      LB.audio.sfx('levelup');
      startNewGame(name, S0.cls, S0.keepsake);
    };
  }

  async function startNewGame(name, cls, keepsake) {
    LB.newState(name, cls, keepsake);
    restockShop();
    LB.showScreen('game');
    ui.clearLog();
    bgKey = null;
    LB.refresh();
    await LB.run(async () => {
      await ui.say(null, 'Emberwick. A sleepy village perched over a very deep hole. For three nights now, it has been much too dark.');
      await ui.say('elder', `Ah. You're awake, ${name}. Good. Everyone else is asleep, which is rather the problem.`);
      await ui.say('elder', 'Three nights ago, the Great Lantern went out. Not flickered. Not sputtered. OUT. As if someone… took the flame.');
      await ui.say('elder', "The Wickless King. Lives at the bottom of the Hollow. Hates light, loves drama. He'll be on the tenth floor. Villains love a round number.");
      const c = await ui.say('elder', "Take this lantern. It's not much, but then neither are you. No offence.", ["I'll bring the flame back.", 'Is there a reward?', 'Why me?']);
      if (c === 0) await ui.say('elder', "That's the spirit! Misplaced, possibly, but spirited.");
      else if (c === 1) await ui.say('elder', "There's a reward. It's called 'continuing to exist'. Also Barnaby might give you a discount. He won't. But he might.");
      else await ui.say('elder', 'You were the only one who answered the door. Also, you have the tallest lantern-holding arm in town. We measured while you slept.');
      await ui.say('elder', "Mind your oil. When your lantern dims, the Hollow gets bolder, and so does its loot. Come back up to refill. Now go on. Marrow's inn, Barnaby's shop, and the Hollow's mouth is to the east.");
      ui.endDialogue();
      LB.S.flags.introSeen = true;
      ui.log(`<b>${esc(name)}</b> the ${LB.CLASSES[cls].name} sets out to relight the Great Lantern.`, 'area');
      ui.log('Tip: click townsfolk or use the buttons below. Number keys 1–9 work too.', 'tip');
      LB.save('auto');
    });
    LB.refresh();
  }

  /* ============================================================= particles */
  LB.particles = (function () {
    let canvas, g, parts = [], color = '#ffb03b', mode = 'town', running = false;
    const COLORS = { town: '#ffcf6b', moss: '#9fffb0', grotto: '#ffa8ff', chapel: '#c8f0ff', throne: '#ff8a5a' };
    function init() {
      canvas = U.$('#particles');
      g = canvas.getContext('2d');
      resize();
      window.addEventListener('resize', resize);
      if (!running) { running = true; requestAnimationFrame(tick); }
    }
    function resize() {
      if (!canvas) return;
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }
    function tick() {
      requestAnimationFrame(tick);
      if (!g || document.hidden || U.$('#screen-game').hidden) return;
      const W = canvas.width, H = canvas.height;
      if (W !== canvas.clientWidth) resize();
      g.clearRect(0, 0, W, H);
      if (parts.length < 28 && Math.random() < 0.25) parts.push({ x: Math.random() * W, y: H + 5, vx: (Math.random() - 0.5) * 0.3, vy: -0.25 - Math.random() * 0.5, life: 0, max: 200 + Math.random() * 300, s: Math.random() < 0.3 ? 3 : 2 });
      g.fillStyle = color;
      for (const p of parts) {
        p.x += p.vx + Math.sin((p.life + p.x) / 40) * 0.2;
        p.y += p.vy;
        p.life++;
        g.globalAlpha = Math.max(0, Math.min(1, p.life / 40, (p.max - p.life) / 60)) * 0.8;
        g.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
      }
      g.globalAlpha = 1;
      parts = parts.filter((p) => p.life < p.max && p.y > -10);
    }
    return { init, setArea(a) { if (a !== mode) { mode = a; color = COLORS[a] || color; } } };
  })();

  /* ============================================================= boot */
  function onKey(e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key === 'Escape') { if (ui.closeTopModal()) e.preventDefault(); return; }
    if (ui.dialogueOpen()) {
      const opts = U.$$('#dlg-options button');
      if (opts.length && /^[1-9]$/.test(e.key)) { const b = opts[+e.key - 1]; if (b) { b.click(); e.preventDefault(); } return; }
      if (e.key === ' ' || e.key === 'Enter') { ui.advanceDialogue(); e.preventDefault(); }
      return;
    }
    if (ui.anyModal()) return;
    if (document.body.dataset.screen !== 'game') return;
    if (/^[1-9]$/.test(e.key)) {
      const b = U.$(`#actions button[data-key="${e.key}"]`);
      if (b && !b.disabled) { b.click(); e.preventDefault(); }
    } else if (e.key === 'i' || e.key === 'b') LB.openBag();
    else if (e.key === 'c' || e.key === 'h') LB.openHero();
  }

  function boot() {
    const icons = document.createElement('style');
    icons.textContent = `.ico-coin{background-image:url(${LB.spriteURL('i_coin')})}.ico-flame{background-image:url(${LB.spriteURL('i_flame')})}`;
    document.head.append(icons);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', () => LB.audio.init(), { once: false, passive: true });
    U.$('#btn-bag').addEventListener('click', () => { LB.audio.sfx('click'); LB.openBag(); });
    U.$('#btn-hero').addEventListener('click', () => { LB.audio.sfx('click'); LB.openHero(); });
    U.$('#btn-save').addEventListener('click', () => { LB.audio.sfx('click'); LB.openSaves(false); });
    const snd = U.$('#btn-sound');
    snd.textContent = LB.audio.label();
    snd.addEventListener('click', () => { snd.textContent = LB.audio.cycle(); });
    U.$('#btn-title').addEventListener('click', () => {
      if (LB.busy || LB.inBattle()) return;
      LB.save('auto');
      LB.audio.sfx('click');
      renderTitle();
      LB.audio.music('title');
    });
    // Rebuild sprites at the right scale when the window size class changes.
    let lastScale = null;
    window.addEventListener('resize', () => {
      if (!LB.S || document.body.dataset.screen !== 'game') return;
      const s = LB.pxScale();
      if (s !== lastScale && !LB.busy && !LB.inBattle()) { lastScale = s; LB.refresh(); }
    });
    setInterval(() => {
      if (LB.S && document.body.dataset.screen === 'game' && !document.hidden) LB.S.stats.playMs = (LB.S.stats.playMs || 0) + 5000;
    }, 5000);
    window.addEventListener('beforeunload', () => { if (LB.S && !LB.inBattle() && document.body.dataset.screen === 'game') LB.save('auto'); });
    LB.particles.init();
    renderTitle();
    LB.audio.music('title');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
