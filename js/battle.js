/* Lanternbound — turn-based battles, skills, items and levelling. */
(function () {
  const LB = window.LB;
  const { U, ui } = LB;
  const { el, esc, sleep, chance, ri, rand, pick, clamp } = U;

  let B = null; // current battle
  LB.inBattle = () => !!B;

  /* ------------------------------------------------------------ enemies */
  function makeEnemy(id, floor, eliteId) {
    const E = LB.ENEMIES[id];
    const f = Math.max(0, floor - 1);
    const e = {
      id, name: E.name, sprite: E.sprite, boss: !!E.boss, proper: !!E.proper,
      maxHp: Math.round(E.hp * (1 + 0.36 * f)),
      atk: E.atk * (1 + 0.27 * f),
      def: E.def * (1 + 0.2 * f),
      agi: E.agi + f * 0.6,
      exp: Math.round(E.exp * (1 + 0.4 * f)),
      gold: ri(E.gold[0], E.gold[1]) * (1 + 0.25 * f) * 0.7,
      loot: 0,
      status: { stun: 0, toad: 0, burn: 0, burnDmg: 0, atkUp: 0, weak: 0, charged: null },
      elite: null,
    };
    if (E.boss) {
      e.maxHp = E.hp; e.atk = E.atk; e.def = E.def; e.agi = E.agi; e.exp = E.exp; e.gold = E.gold[0];
    }
    if (eliteId) {
      const M = LB.ELITES[eliteId];
      e.elite = eliteId;
      e.name = `${M.name} ${e.name}`;
      e.maxHp = Math.round(e.maxHp * M.hp);
      e.atk *= M.atk;
      e.def *= M.def;
      e.exp = Math.round(e.exp * M.exp);
      e.gold *= M.gold;
      e.loot += M.loot;
    }
    const light = LB.lightLevel();
    if (light === 'dim') { e.atk *= 1.15; e.loot += 0.1; }
    if (light === 'dark') { e.atk *= 1.3; e.loot += 0.22; e.exp = Math.round(e.exp * 1.2); }
    e.gold = Math.round(e.gold);
    e.hp = e.maxHp;
    return e;
  }

  /* Names for log lines: "The Sulkcap", but "The Wickless King" and "Professor Spore". */
  function The(e) {
    return e.proper || /^The /.test(e.name) ? esc(e.name) : 'The ' + esc(e.name);
  }
  function the(e) {
    if (e.proper) return esc(e.name);
    return /^The /.test(e.name) ? 'the ' + esc(e.name.slice(4)) : 'the ' + esc(e.name);
  }

  /* ------------------------------------------------------------ rendering */
  function heroNode() { return U.$('#actor-hero'); }
  function enemyNode() { return U.$('#actor-enemy'); }

  function renderBattleScene() {
    LB.renderStage('battle');
    const actors = U.$('#actors');
    const scale = LB.pxScale();
    const hero = el('div', { class: 'actor hero-actor', id: 'actor-hero' });
    hero.append(LB.spriteImg(LB.CLASSES[LB.S.hero.cls].sprite, scale));
    hero.append(el('div', { class: 'shadow' }));
    hero.append(el('div', { class: 'status-row', id: 'hero-status' }));
    const e = B.enemy;
    const enemy = el('div', { class: 'actor enemy-actor enter ' + (e.boss ? 'boss ' : '') + (e.elite ? LB.ELITES[e.elite].cls : ''), id: 'actor-enemy' });
    const plate = el('div', { class: 'plate' },
      el('div', { class: 'plate-name', html: esc(e.name) }),
      el('div', { class: 'bar hp enemy-hp' }, el('div', { class: 'bar-fill' }), el('div', { class: 'bar-ghost' }), el('span', { class: 'bar-text' })),
      el('div', { class: 'intent', id: 'enemy-intent' }),
      el('div', { class: 'status-row', id: 'enemy-status' }));
    enemy.append(plate);
    const img = LB.spriteImg(e.sprite, e.boss ? scale + 1 : scale, { flip: true });
    img.id = 'enemy-img';
    enemy.append(img);
    enemy.append(el('div', { class: 'shadow' }));
    actors.append(hero, enemy);
    updateBattleUI();
  }

  function updateBattleUI() {
    if (!B) return;
    const e = B.enemy;
    const pct = clamp((e.hp / e.maxHp) * 100, 0, 100);
    const bar = U.$('#actor-enemy .enemy-hp');
    if (bar) {
      bar.querySelector('.bar-fill').style.width = pct + '%';
      bar.querySelector('.bar-ghost').style.width = pct + '%';
      bar.querySelector('.bar-text').textContent = `${Math.max(0, e.hp)}/${e.maxHp}`;
    }
    const intent = U.$('#enemy-intent');
    if (intent) {
      const it = B.intent ? intentInfo(B.intent) : null;
      intent.className = 'intent' + (it ? ' ' + it.cls : '');
      intent.innerHTML = it ? it.text : '';
      intent.title = it ? it.tip : '';
    }
    const es = [];
    if (e.status.stun) es.push(['stun', 'Stunned']);
    if (e.status.toad) es.push(['toad', 'Toad']);
    if (e.status.burn) es.push(['burn', 'Burning']);
    if (e.status.atkUp) es.push(['up', 'ATK↑'.repeat(1) + (e.status.atkUp > 1 ? '×' + e.status.atkUp : '')]);
    if (e.status.weak) es.push(['weak', 'Weakened']);
    const esEl = U.$('#enemy-status');
    if (esEl) esEl.innerHTML = es.map(([c, t]) => `<span class="chip chip-${c}">${t}</span>`).join('');
    const h = B.hero;
    const hs = [];
    if (h.guard) hs.push(['guard', 'Guarding']);
    if (h.bulwark) hs.push(['guard', `Bulwark ${h.bulwark}`]);
    if (h.poison) hs.push(['poison', `Poison ${h.poison}`]);
    if (h.weak) hs.push(['weak', `Weak ${h.weak}`]);
    if (h.overclock) hs.push(['up', `Overclock ${h.overclock}`]);
    const hsEl = U.$('#hero-status');
    if (hsEl) hsEl.innerHTML = hs.map(([c, t]) => `<span class="chip chip-${c}">${t}</span>`).join('');
    ui.hud();
  }

  const INTENTS = {
    attack: { text: '⚔ Attack', cls: '', tip: 'A normal attack.' },
    snuff: { text: '~ Snuff', cls: 'warn', tip: 'Will steal some of your lantern oil.' },
    sulk: { text: '… Sulking', cls: 'charge', tip: 'Winding up a big attack. Defend next turn!' },
    tantrum: { text: '‼ TANTRUM', cls: 'danger', tip: 'A huge attack. Defend to halve it!' },
    steal: { text: '$ Steal', cls: 'warn', tip: 'Will try to steal gold.' },
    escape: { text: '» Escaping', cls: 'warn', tip: 'About to fly off with your gold! Kill it first.' },
    poison: { text: '☠ Fever', cls: 'warn', tip: 'Attack that poisons.' },
    audit: { text: '$ Audit', cls: 'warn', tip: 'Takes gold, or hits hard if you are broke.' },
    hymn: { text: '♪ Hymn', cls: 'warn', tip: 'Buffs its own attack.' },
    highnote: { text: '♫ High Note', cls: 'warn', tip: 'A piercing attack that mostly ignores DEF.' },
    drown: { text: '≈ Drown', cls: 'warn', tip: 'Soaks you: you deal less damage for 2 turns.' },
    pray: { text: '+ Pray', cls: 'warn', tip: 'Will heal itself.' },
    chomp: { text: '⚔⚔ Chomp', cls: 'warn', tip: 'A strong bite.' },
    lecture: { text: '✎ Lecture', cls: 'warn', tip: 'Weakens you with facts about fungus.' },
    ribbit: { text: '♥ Ribbit', cls: '', tip: "It's a toad. It will do a toad thing." },
    stunned: { text: '✶ Stunned', cls: '', tip: 'Skips its next turn.' },
    sweep: { text: '⚔ Ash Sweep', cls: '', tip: 'A sweeping attack.' },
    smoke: { text: '~ Crown of Smoke', cls: 'warn', tip: 'Drains lantern oil.' },
    inhale: { text: '… Inhaling Shadows', cls: 'charge', tip: 'Charging SNUFF OUT. DEFEND next turn!' },
    snuffout: { text: '‼ SNUFF OUT', cls: 'danger', tip: 'An enormous attack. Defend!' },
    decree: { text: '! Royal Decree', cls: 'warn', tip: 'Declares you Weak.' },
  };
  function intentInfo(id) { return INTENTS[id] || INTENTS.attack; }

  /* --------------------------------------------------------- damage math */
  const mitigate = (raw, def) => raw * (30 / (30 + Math.max(0, def)));

  function heroStrike(mult, opts = {}) {
    const st = LB.stats();
    const e = B.enemy;
    const acc = clamp(92 + (st.agi - e.agi), 72, 99) / 100;
    if (!opts.sure && !chance(acc)) return { miss: true };
    const power = opts.magic ? st.wit : st.str;
    let raw = power * mult * rand(0.9, 1.1);
    if (B.hero.weak) raw *= 0.7;
    let dmg = mitigate(raw, e.def * (opts.pierce ?? 1));
    let crit = false;
    const critChance = 0.05 + st.luck * 0.012 + (LB.S.hero.cls === 'tinker' ? 0.05 : 0);
    if (!opts.noCrit && (B.hero.overclock > 0 || chance(critChance))) {
      crit = true;
      dmg *= 1.8;
      if (B.hero.overclock > 0) B.hero.overclock--;
    }
    if (e.status.toad) dmg *= 1.5;
    return { dmg: Math.max(1, Math.round(dmg)), crit };
  }

  async function damageEnemy(amount, opts = {}) {
    const e = B.enemy;
    e.hp = Math.max(0, e.hp - amount);
    const node = enemyNode();
    ui.floater(node, (opts.crit ? amount + '!' : String(amount)), opts.color || (opts.crit ? '#ffd35c' : '#ffffff'), opts.crit);
    if (opts.crit) { ui.shake(true); LB.audio.sfx('crit'); LB.S.stats.crits++; }
    else LB.audio.sfx(opts.sfx || 'hit');
    ui.anim(node, 'hurt', 380);
    updateBattleUI();
    await sleep(opts.crit ? 420 : 300);
  }

  async function damageHero(amount, opts = {}) {
    const h = LB.S.hero;
    let dmg = amount;
    if (!opts.raw) {
      if (B.hero.guard) dmg *= opts.charged ? 0.35 : 0.5;
      if (B.hero.bulwark) dmg *= 0.5;
    }
    dmg = Math.max(1, Math.round(dmg));
    h.hp = Math.max(0, h.hp - dmg);
    const node = heroNode();
    ui.floater(node, String(dmg), '#ff6a6a', dmg >= LB.stats().hp * 0.25);
    LB.audio.sfx('hurt');
    ui.anim(node, 'hurt', 380);
    if (dmg >= LB.stats().hp * 0.25) { ui.shake(true); ui.flash('rgba(255,40,40,.35)'); } else ui.shake(false);
    updateBattleUI();
    await sleep(320);
    if (B.hero.bulwark && !opts.raw && !opts.noReflect && B.enemy.hp > 0) {
      const back = Math.max(1, Math.round(dmg * 0.5));
      ui.log(`Your Bulwark reflects <b>${back}</b> damage!`, 'good');
      await damageEnemy(back, { color: '#8fd8ff' });
    }
    return dmg;
  }

  function enemyHitRaw(mult) {
    const e = B.enemy;
    let atk = e.atk * (1 + 0.25 * e.status.atkUp);
    if (e.status.weak) atk *= 0.7;
    if (B.phase2) atk *= 1.25;
    return atk * mult * rand(0.9, 1.1);
  }
  /* Enemy attack with dodge roll. Returns damage dealt, or -1 for a dodge. */
  async function enemyAttack(mult, opts = {}) {
    const st = LB.stats();
    const e = B.enemy;
    const node = enemyNode();
    ui.anim(node, 'lunge-left', 300);
    await sleep(160);
    const dodge = clamp(4 + (st.agi - e.agi) * 1.5, 2, 30) / 100;
    if (!opts.sure && chance(dodge)) {
      ui.floater(heroNode(), 'MISS', '#c8c8f0');
      LB.audio.sfx('miss');
      ui.anim(heroNode(), 'dodge', 350);
      ui.log(pick(['You sidestep neatly.', 'You dodge! Nobody saw, but it was cool.', 'It misses. You pretend that was skill.']), 'dim');
      await sleep(320);
      return -1;
    }
    const raw = enemyHitRaw(mult);
    const def = st.def * (opts.pierce ?? 1);
    return damageHero(mitigate(raw, def), opts);
  }

  /* ----------------------------------------------------------- the flow */
  LB.battle = function (enemyId, opts = {}) {
    return new Promise((resolve) => {
      const S = LB.S;
      const floor = opts.floor || S.floor;
      B = {
        enemy: makeEnemy(enemyId, floor, opts.elite),
        hero: { guard: false, bulwark: 0, poison: 0, poisonDmg: 0, weak: 0, overclock: 0 },
        floor, resolve, turn: 0, stolen: 0, pickpocketed: 0, itemStolen: false, over: false, phase2: false,
        noFlee: !!opts.noFlee || LB.ENEMIES[enemyId].boss,
      };
      S.scene = 'battle';
      LB.audio.music(B.enemy.boss ? 'boss' : 'battle');
      (async () => {
        renderBattleScene();
        ui.actions([]);
        const E = LB.ENEMIES[enemyId];
        ui.log(`<b class="enemy-name">${esc(B.enemy.name)}</b> — ${esc(opts.introText || pick(E.intro))}`, 'battle-start');
        if (B.enemy.elite) ui.log(eliteText(B.enemy.elite), 'warn');
        const light = LB.lightLevel();
        if (light === 'dim') ui.log('Your lantern is dim. The enemy feels braver. (ATK up, loot up)', 'warn');
        if (light === 'dark') ui.log('It is DARK. The enemy is emboldened! (ATK way up, loot way up)', 'bad');
        if (!LB.S.flags.battleTip) {
          LB.S.flags.battleTip = true;
          ui.log('Tip: the bubble over an enemy shows its <b>next move</b>. If it is winding up, <b>Defend</b>!', 'tip');
        }
        await sleep(450);
        if (opts.ambush && !B.enemy.boss) {
          ui.log('Ambush! It strikes before you can react!', 'bad');
          await enemyAttack(0.8);
          if (await checkEnd()) return;
        }
        chooseIntent();
        release();
      })();
    });
  };

  function eliteText(id) {
    return {
      shiny: 'It sparkles. Shiny enemies carry lots of gold.',
      enraged: 'It is ENRAGED. It hits much harder, but gives more EXP.',
      ancient: 'It is ANCIENT: tougher, older, and carrying better loot.',
    }[id];
  }

  function release() {
    if (!B) return;
    LB.busy = false;
    ui.lockActions(false);
    updateBattleUI();
    renderMainActions();
  }

  function act(fn) {
    if (LB.busy || !B || B.over) return;
    LB.busy = true;
    ui.lockActions(true);
    (async () => {
      try {
        B.hero.guard = false;
        const used = await fn();
        if (used === false) return release();
        if (await checkEnd()) return;
        await enemyTurn();
        if (await checkEnd()) return;
        await endOfRound();
        if (await checkEnd()) return;
        B.turn++;
        chooseIntent();
        release();
      } catch (err) {
        console.error(err);
        ui.log('The battle hiccups: ' + esc(err.message), 'bad');
        release();
      }
    })();
  }

  function renderMainActions() {
    const S = LB.S;
    const known = LB.knownSkills();
    const items = battleItems();
    ui.actions([
      { label: 'Attack', sub: 'Hit it', icon: 'i_sword', onClick: () => act(doAttack) },
      { label: 'Skills', sub: `${known.length} known`, icon: 'i_flame', onClick: renderSkillMenu },
      { label: 'Items', sub: items.length ? `${items.reduce((a, [, n]) => a + n, 0)} usable` : 'Empty', icon: 'i_potion', onClick: renderItemMenu, disabled: !items.length },
      { label: 'Defend', sub: 'Halve damage, +MP', icon: 'i_armor', onClick: () => act(doDefend) },
      { label: 'Flee', sub: B.noFlee ? 'Not an option' : `${Math.round(fleeChance() * 100)}%`, icon: 'i_door', onClick: () => act(doFlee), disabled: B.noFlee },
    ], `Turn ${B.turn + 1} — what will ${esc(S.hero.name)} do?`);
  }

  function renderSkillMenu() {
    const S = LB.S;
    const list = LB.knownSkills().map((id) => {
      const sk = LB.SKILLS[id];
      return {
        label: sk.name, sub: `${sk.mp} MP`, title: sk.desc, icon: 'i_flame',
        disabled: S.hero.mp < sk.mp,
        onClick: () => act(() => useSkill(id)),
      };
    });
    list.push({ label: 'Back', sub: '', icon: 'i_door', cls: 'back', onClick: renderMainActions });
    ui.actions(list, 'Skills — hover or long-press for details');
  }

  function battleItems() {
    const bag = LB.S.bag.items;
    return Object.entries(bag).filter(([id, n]) => n > 0 && !LB.CONSUMABLES[id].passive && !(id === 'smoke' && B && B.noFlee));
  }
  function renderItemMenu() {
    const list = battleItems().map(([id, n]) => {
      const C = LB.CONSUMABLES[id];
      return { label: C.name, sub: `×${n}`, title: C.desc, icon: C.icon, onClick: () => act(() => useBattleItem(id)) };
    });
    list.push({ label: 'Back', sub: '', icon: 'i_door', cls: 'back', onClick: renderMainActions });
    ui.actions(list, 'Items');
  }

  /* ------------------------------------------------------ player actions */
  async function lunge() {
    ui.anim(heroNode(), 'lunge-right', 300);
    await sleep(150);
  }

  async function doAttack() {
    await lunge();
    const r = heroStrike(1);
    if (r.miss) return missed();
    ui.log(r.crit ? `<b>Critical hit!</b> ${r.dmg} damage!` : `You hit ${the(B.enemy)} for <b>${r.dmg}</b>.`, r.crit ? 'crit' : '');
    await damageEnemy(r.dmg, { crit: r.crit });
  }
  async function missed() {
    ui.floater(enemyNode(), 'MISS', '#c8c8f0');
    LB.audio.sfx('miss');
    ui.anim(enemyNode(), 'dodge', 350);
    ui.log(pick(['You miss. The air is very hurt.', 'Whiff! Clean miss.', 'You swing at where it was a moment ago.']), 'dim');
    await sleep(300);
  }

  async function doDefend() {
    B.hero.guard = true;
    const mp = LB.restoreMp(Math.max(2, Math.round(LB.stats().mp * 0.1)));
    LB.audio.sfx('guard');
    ui.floater(heroNode(), 'GUARD', '#8fd8ff');
    ui.log(`You brace yourself behind your lantern.${mp ? ` (+${mp} MP)` : ''}`, 'good');
    updateBattleUI();
    await sleep(300);
  }

  function fleeChance() {
    if (!B) return 0;
    return clamp(0.5 + (LB.stats().agi - B.enemy.agi) * 0.03, 0.2, 0.92);
  }
  async function doFlee() {
    if (chance(fleeChance())) {
      LB.audio.sfx('flee');
      ui.anim(heroNode(), 'flee', 500);
      ui.log(pick(['You run away! Bravely!', 'You flee with great dignity. Mostly.', 'Tactical retreat successful.']), 'dim');
      await sleep(500);
      B.fled = true;
      return;
    }
    ui.log(pick(["You try to run but trip over your own dignity.", 'The exit is blocked by the enemy. And your cowardice.', "You can't get away!"]), 'bad');
    await sleep(250);
  }

  async function useSkill(id) {
    const S = LB.S, h = S.hero, st = LB.stats();
    const sk = LB.SKILLS[id];
    if (h.mp < sk.mp) return false;
    h.mp -= sk.mp;
    ui.hud();
    const e = B.enemy;
    switch (id) {
      case 'bash': {
        await lunge();
        const r = heroStrike(1.3);
        if (r.miss) return missed();
        ui.log(`<b>Shield Bash!</b> ${r.dmg} damage.`, r.crit ? 'crit' : '');
        await damageEnemy(r.dmg, { crit: r.crit });
        if (e.hp > 0 && !e.boss && chance(0.4)) { e.status.stun = 1; ui.log(`${The(e)} sees stars. <b>Stunned!</b>`, 'good'); }
        else if (e.boss) ui.log('The King does not get stunned. He is far too dramatic for that.', 'dim');
        break;
      }
      case 'breakfast': {
        LB.audio.sfx('heal');
        const n = LB.heal(st.hp * 0.4);
        B.hero.poison = 0;
        ui.floater(heroNode(), '+' + n, '#7dff9a');
        ui.burst(heroNode(), '#ffd35c');
        ui.log(pick([`You pause for Second Breakfast. <b>+${n} HP</b>. The enemy waits politely.`, `A quick sandwich. <b>+${n} HP</b>. Crusts removed, obviously.`]), 'good');
        break;
      }
      case 'bulwark':
        B.hero.bulwark = 3;
        LB.audio.sfx('guard');
        ui.burst(heroNode(), '#8fd8ff', 18);
        ui.log('<b>Bulwark!</b> You become an extremely stubborn wall for 3 turns.', 'good');
        break;
      case 'slam': {
        await lunge();
        const r = heroStrike(2.6);
        if (r.miss) return missed();
        ui.flash('rgba(255,211,92,.4)');
        ui.log(`<b>LANTERN SLAM!</b> ${r.dmg} damage! The lantern is fine. Probably.`, 'crit');
        await damageEnemy(r.dmg, { crit: r.crit, sfx: 'boom' });
        break;
      }
      case 'sparkbomb': {
        await ui.projectile(heroNode(), enemyNode(), '#ffd35c');
        const dmg = Math.round((8 + h.level * 3.5 + st.wit) * rand(0.9, 1.15) * (e.status.toad ? 1.5 : 1));
        ui.burst(enemyNode(), '#ffb03b', 20);
        ui.log(`<b>Spark Bomb!</b> KA-BLAM. ${dmg} damage, armour ignored.`, 'good');
        await damageEnemy(dmg, { sfx: 'boom', color: '#ffb03b' });
        break;
      }
      case 'sticky': {
        await lunge();
        const r = heroStrike(1);
        if (r.miss) return missed();
        ui.log(`You jab for <b>${r.dmg}</b> and rummage in its pockets…`);
        await damageEnemy(r.dmg, { crit: r.crit });
        if (B.pickpocketed < 2) {
          B.pickpocketed++;
          const g = LB.addGold(ri(3, 8) + B.floor * 2);
          LB.audio.sfx('coin');
          ui.floater(heroNode(), '+' + g + 'G', '#ffd35c');
          ui.log(`Swiped <b>${g} gold</b>!`, 'gold');
          if (!B.itemStolen && chance(0.25)) {
            B.itemStolen = true;
            const loot = LB.rollLoot(B.floor, { consumableChance: 1 });
            ui.log(`…and a ${LB.giveLoot(loot)}!`, 'gold');
          }
        } else ui.log('Its pockets are empty. It looks embarrassed for you.', 'dim');
        break;
      }
      case 'contraption':
        await contraption();
        break;
      case 'overclock':
        B.hero.overclock = 3;
        LB.audio.sfx('magic');
        ui.burst(heroNode(), '#8fe3ff', 20);
        ui.log('<b>Overclock!</b> Your goggles fog up with pure confidence. Next 3 attacks will crit.', 'good');
        break;
      case 'bolt': {
        LB.audio.sfx('fire');
        await ui.projectile(heroNode(), enemyNode(), '#ff9d3b');
        const r = heroStrike(1.45, { magic: true, pierce: 0.5, sure: true });
        ui.burst(enemyNode(), '#ff9d3b');
        ui.log(`<b>Ember Bolt!</b> ${r.dmg} fire damage.`, r.crit ? 'crit' : '');
        await damageEnemy(r.dmg, { crit: r.crit, color: '#ffb03b' });
        break;
      }
      case 'mend': {
        LB.audio.sfx('heal');
        const n = LB.heal(st.wit * 2.6 + 12);
        B.hero.poison = 0;
        ui.floater(heroNode(), '+' + n, '#7dff9a');
        ui.burst(heroNode(), '#9fffb0');
        ui.log(`You mutter a mending charm. <b>+${n} HP</b>.`, 'good');
        break;
      }
      case 'toadify':
        LB.audio.sfx('magic');
        await ui.projectile(heroNode(), enemyNode(), '#7dff9a');
        if (e.boss) {
          ui.log('The Wickless King is too regal to become a toad. He looks a little flattered, though.', 'dim');
        } else if (chance(0.85)) {
          e.status.toad = 3;
          e.status.charged = null;
          S.stats.toads++;
          LB.audio.sfx('toad');
          const img = U.$('#enemy-img');
          img.src = LB.spriteURL('barnaby', true);
          ui.burst(enemyNode(), '#7dff9a', 20);
          ui.log(`<b>Ribbit.</b> ${The(e)} is now a toad. It seems upset, but in a toad way.`, 'good');
        } else ui.log('The spell fizzles. The enemy is briefly slightly damp.', 'dim');
        break;
      case 'wildfire': {
        LB.audio.sfx('fire');
        await ui.projectile(heroNode(), enemyNode(), '#ff5a3a');
        const r = heroStrike(2.1, { magic: true, pierce: 0.5, sure: true });
        ui.flash('rgba(255,120,40,.35)');
        ui.burst(enemyNode(), '#ff5a3a', 24);
        e.status.burn = 3;
        e.status.burnDmg = Math.max(3, Math.round(st.wit * 0.3));
        ui.log(`<b>WILDFIRE!</b> ${r.dmg} damage, and it's on fire now.`, 'crit');
        await damageEnemy(r.dmg, { crit: r.crit, color: '#ff8a5a', sfx: 'boom' });
        break;
      }
    }
    updateBattleUI();
  }

  async function contraption() {
    const S = LB.S, st = LB.stats(), e = B.enemy;
    ui.log('You pull the lever on The Contraption. It whirrs. It clanks. It…', 'dim');
    LB.audio.sfx('magic');
    await sleep(500);
    const roll = U.weighted({ zap: 35, heal: 20, stun: e.boss ? 0 : 15, confetti: 15, oops: 10, toad: e.boss ? 0 : 5 });
    if (roll === 'zap') {
      await ui.projectile(heroNode(), enemyNode(), '#8fe3ff');
      const dmg = Math.round((12 + S.hero.level * 5 + st.wit * 1.2) * rand(0.9, 1.2));
      ui.flash('rgba(143,227,255,.4)');
      ui.log(`…<b>MEGA ZAP!</b> ${dmg} damage!`, 'crit');
      await damageEnemy(dmg, { sfx: 'boom', color: '#8fe3ff', crit: false });
    } else if (roll === 'heal') {
      const n = LB.heal(st.hp * 0.35);
      LB.audio.sfx('heal');
      ui.floater(heroNode(), '+' + n, '#7dff9a');
      ui.log(`…dispenses a warm towel and a biscuit. <b>+${n} HP</b>.`, 'good');
    } else if (roll === 'stun') {
      e.status.stun = 2;
      ui.log(`…fires a boxing glove on a spring. ${The(e)} is <b>stunned for 2 turns</b>.`, 'good');
      ui.anim(enemyNode(), 'hurt', 380);
    } else if (roll === 'confetti') {
      e.status.weak = 3;
      ui.burst(enemyNode(), '#ff8bd8', 24);
      ui.log(`…explodes into confetti. ${The(e)} is too distracted to hit hard. <b>Weakened!</b>`, 'good');
    } else if (roll === 'oops') {
      const dmg = Math.max(1, Math.round(st.hp * 0.08));
      S.hero.hp = Math.max(1, S.hero.hp - dmg);
      const mp = LB.restoreMp(st.mp);
      ui.floater(heroNode(), String(dmg), '#ff6a6a');
      ui.log(`…explodes. In your face. (-${dmg} HP) But the smoke is oddly invigorating. (+${mp} MP)`, 'warn');
    } else {
      e.status.toad = 3;
      S.stats.toads++;
      LB.audio.sfx('toad');
      U.$('#enemy-img').src = LB.spriteURL('barnaby', true);
      ui.log('…turns the enemy into a toad?! You did not know it could do that.', 'good');
    }
  }

  LB.useConsumable = async function (id, inBattle) {
    const S = LB.S, st = LB.stats();
    const C = LB.CONSUMABLES[id];
    if (!S.bag.items[id]) return false;
    S.bag.items[id]--;
    if (!S.bag.items[id]) delete S.bag.items[id];
    const node = inBattle ? heroNode() : U.$('#actor-hero');
    const say = (t, c = 'good') => ui.log(t, c);
    switch (id) {
      case 'tonic': case 'bigtonic': {
        const n = LB.heal(id === 'tonic' ? st.hp * 0.45 : st.hp);
        LB.audio.sfx('drink');
        node && ui.floater(node, '+' + n, '#7dff9a');
        say(`You drink the ${C.name}. <b>+${n} HP</b>.`);
        break;
      }
      case 'ether': {
        const n = LB.restoreMp(st.mp * 0.6);
        LB.audio.sfx('drink');
        node && ui.floater(node, '+' + n, '#6ab8ff');
        say(`You sip the Ember Draught. It tastes like a campfire. <b>+${n} MP</b>.`);
        break;
      }
      case 'oil': {
        const n = LB.addOil(40);
        LB.audio.sfx('drink');
        say(`You refill your lantern. <b>+${n} oil</b>. The shadows back off a bit.`);
        LB.updateDarkness && LB.updateDarkness();
        break;
      }
      case 'smoke':
        LB.audio.sfx('flee');
        say('You throw a Smoke Pellet and vanish in a puff of cowardice!', 'dim');
        B.fled = true;
        break;
      case 'firecracker': {
        const dmg = Math.round((18 + 9 * B.floor) * rand(0.9, 1.1));
        await ui.projectile(heroNode(), enemyNode(), '#ffb03b');
        ui.burst(enemyNode(), '#ffb03b', 22);
        say(`You light a Firecracker and throw it. BANG! <b>${dmg}</b> damage.`);
        await damageEnemy(dmg, { sfx: 'boom', color: '#ffb03b' });
        break;
      }
      case 'soup':
        await soup(node);
        break;
    }
    ui.hud();
    return true;
  };

  async function soup(node) {
    const S = LB.S, st = LB.stats();
    LB.audio.sfx('drink');
    const r = U.weighted({ heal: 30, mp: 20, regret: 15, coin: 15, oil: 15, perm: 5 });
    if (r === 'heal') { const n = LB.heal(st.hp * 0.5); ui.log(`The soup is... delicious? <b>+${n} HP</b>.`, 'good'); node && ui.floater(node, '+' + n, '#7dff9a'); }
    else if (r === 'mp') { const n = LB.restoreMp(st.mp); ui.log(`The soup fizzes. Your fingertips spark. <b>+${n} MP</b>.`, 'good'); }
    else if (r === 'regret') { const d = Math.max(1, Math.round(st.hp * 0.05)); S.hero.hp = Math.max(1, S.hero.hp - d); ui.log(`It tastes like regret. And slightly of feet. <b>-${d} HP</b>.`, 'bad'); }
    else if (r === 'coin') { const g = LB.addGold(15, true); ui.log(`There was a coin in it! <b>+${g} gold</b>. Also a bit of a button.`, 'gold'); }
    else if (r === 'oil') { const n = LB.addOil(30); ui.log(`It was lamp oil. Your lantern appreciates it (<b>+${n} oil</b>). Your stomach does not.`, 'warn'); }
    else {
      const k = pick(['str', 'def', 'wit', 'agi', 'luck']);
      S.hero.bonus[k] += 1;
      ui.log(`You feel... permanently different. <b>+1 ${LB.STAT_SHORT[k]}</b>, forever.`, 'good');
    }
  }

  async function useBattleItem(id) {
    await LB.useConsumable(id, true);
  }

  /* ---------------------------------------------------------- enemy turn */
  function chooseIntent() {
    const e = B.enemy;
    const E = LB.ENEMIES[e.id];
    if (e.status.stun) return (B.intent = 'stunned');
    if (e.status.toad) return (B.intent = 'ribbit');
    if (e.status.charged) return (B.intent = e.status.charged);
    if (e.boss) return (B.intent = bossIntent());
    if (e.id === 'moth' && B.stolen > 0 && chance(0.5)) return (B.intent = 'escape');
    if (e.id === 'deacon' && e.hp < e.maxHp * 0.5 && !B.prayed) return (B.intent = 'pray');
    let move = U.weighted(E.moves);
    if (move === 'pray') move = 'attack';
    if (move === 'hymn' && e.status.atkUp >= 3) move = 'highnote';
    if (move === 'sulk' && B.turn === 0 && chance(0.5)) move = 'attack';
    B.intent = move;
  }

  function bossIntent() {
    const e = B.enemy;
    B.bossCycle = (B.bossCycle || 0) + 1;
    const c = B.bossCycle;
    if (c % 4 === 0) return 'inhale';
    if (B.phase2 && c % 4 === 2 && chance(0.6)) return 'decree';
    return chance(0.35) ? 'smoke' : 'sweep';
  }

  async function enemyTurn() {
    const e = B.enemy, S = LB.S;
    if (B.fled || e.hp <= 0) return;
    const move = B.intent;
    if (move === 'stunned') {
      e.status.stun = Math.max(0, e.status.stun - 1);
      ui.log(`${The(e)} is stunned and wobbles in place.`, 'dim');
      await sleep(350);
      return;
    }
    switch (move) {
      case 'ribbit': {
        e.status.toad--;
        if (chance(0.5)) {
          ui.anim(enemyNode(), 'lunge-left', 300);
          await sleep(160);
          await damageHero(1, { raw: true, noReflect: true });
          ui.log('The toad headbutts your shin. 1 damage. Emotionally, more.', 'dim');
        } else ui.log(pick(['The toad says "ribbit". It sounds furious.', 'The toad catches a fly. Priorities.', 'The toad stares at you with ancient toad hatred.']), 'dim');
        if (!e.status.toad) {
          U.$('#enemy-img').src = LB.spriteURL(e.sprite, true);
          ui.log(`With a pop, ${the(e)} is no longer a toad. It is VERY annoyed.`, 'warn');
        }
        await sleep(300);
        return;
      }
      case 'attack': case 'sweep': {
        const d = await enemyAttack(1);
        if (d >= 0) ui.log(move === 'sweep' ? `The King sweeps a wave of ash at you. <b>${d}</b> damage.` : `${The(e)} hits you for <b>${d}</b>.`, 'hurt');
        return;
      }
      case 'chomp': {
        const d = await enemyAttack(1.5);
        if (d >= 0) ui.log(`${The(e)} CHOMPS you. <b>${d}</b> damage. Wax teeth are still teeth.`, 'hurt');
        return;
      }
      case 'snuff': {
        const d = await enemyAttack(0.6);
        const lost = -LB.addOil(-8);
        LB.audio.sfx('snuff');
        ui.log(`${The(e)} inhales your lantern light! ${d >= 0 ? `<b>${d}</b> damage and ` : ''}<b>-${lost} oil</b>.`, 'warn');
        LB.updateDarkness();
        return;
      }
      case 'sulk':
        e.status.charged = 'tantrum';
        ui.anim(enemyNode(), 'charge', 600);
        ui.log(`${The(e)} is sulking. Ominously. <b>Something big is coming — Defend!</b>`, 'warn');
        await sleep(400);
        return;
      case 'tantrum': {
        e.status.charged = null;
        ui.log(`${The(e)} throws a TANTRUM!`, 'bad');
        const d = await enemyAttack(2.2, { charged: true, sure: true });
        ui.log(`<b>${d}</b> damage.${B.hero.guard ? ' Your guard absorbs most of it!' : ''}`, 'hurt');
        return;
      }
      case 'steal': {
        ui.anim(enemyNode(), 'lunge-left', 300);
        await sleep(200);
        const amt = Math.min(S.hero.gold, ri(5, 10) + B.floor * 3);
        if (amt > 0 && !chance(clamp(LB.stats().agi * 0.02, 0, 0.35))) {
          S.hero.gold -= amt;
          B.stolen += amt;
          LB.audio.sfx('coin');
          ui.floater(heroNode(), '-' + amt + 'G', '#ffd35c');
          ui.log(`${The(e)} steals <b>${amt} gold</b>! Get it back before it flies off!`, 'bad');
        } else if (amt > 0) ui.log(`${The(e)} reaches for your purse. You slap its tiny hand away.`, 'good');
        else ui.log(`${The(e)} checks your purse, finds nothing, and looks at you with pity.`, 'dim');
        await sleep(300);
        return;
      }
      case 'escape':
        ui.anim(enemyNode(), 'flee-right', 600);
        ui.log(`${The(e)} flutters away with your ${B.stolen} gold! Rude.`, 'bad');
        await sleep(600);
        B.enemyFled = true;
        return;
      case 'poison': {
        const d = await enemyAttack(0.6);
        if (d >= 0) {
          B.hero.poison = 3;
          B.hero.poisonDmg = Math.max(2, Math.round(e.atk * 0.35));
          ui.log(`${The(e)} breathes Marsh Fever on you. <b>${d}</b> damage and <b>poisoned</b>!`, 'bad');
        }
        return;
      }
      case 'audit': {
        ui.anim(enemyNode(), 'lunge-left', 300);
        await sleep(200);
        if (S.hero.gold >= 20) {
          const amt = Math.min(Math.round(S.hero.gold * 0.1), 15 + B.floor * 5);
          S.hero.gold -= amt;
          B.stolen += amt;
          LB.audio.sfx('coin');
          ui.floater(heroNode(), '-' + amt + 'G', '#ffd35c');
          ui.log(`${The(e)} audits you and collects <b>${amt} gold</b> in "Lantern Tax". Defeat it to get a refund.`, 'bad');
        } else {
          const d = await enemyAttack(1.3, { sure: true });
          ui.log(`"No money? We accept payment in bruises." <b>${d}</b> damage.`, 'hurt');
        }
        return;
      }
      case 'hymn':
        e.status.atkUp++;
        LB.audio.sfx('magic');
        ui.burst(enemyNode(), '#ffd35c', 10);
        ui.log(`${The(e)} sings a rousing hymn. It believes in itself now. <b>ATK up!</b>`, 'warn');
        await sleep(350);
        return;
      case 'highnote': {
        const d = await enemyAttack(0.95, { pierce: 0.3 });
        if (d >= 0) ui.log(`${The(e)} hits a HIGH NOTE. Your armour rattles. <b>${d}</b> damage.`, 'hurt');
        return;
      }
      case 'drown': {
        const d = await enemyAttack(0.8);
        if (d >= 0) {
          B.hero.weak = 2;
          ui.log(`${The(e)} drenches you. <b>${d}</b> damage, and soggy heroes hit softer. <b>Weak!</b>`, 'bad');
        }
        return;
      }
      case 'pray': {
        B.prayed = true;
        const n = Math.round(e.maxHp * 0.25);
        e.hp = Math.min(e.maxHp, e.hp + n);
        LB.audio.sfx('heal');
        ui.floater(enemyNode(), '+' + n, '#7dff9a');
        ui.log(`${The(e)} prays to something damp. It recovers <b>${n} HP</b>.`, 'warn');
        updateBattleUI();
        await sleep(350);
        return;
      }
      case 'lecture': {
        const d = await enemyAttack(0.5, { sure: true });
        B.hero.weak = 2;
        ui.log(`Professor Spore lectures you on mycology. You lose the will to fight a little. <b>${d}</b> damage and <b>Weak</b>.`, 'bad');
        return;
      }
      case 'smoke': {
        const d = await enemyAttack(0.75);
        const lost = -LB.addOil(-12);
        LB.audio.sfx('snuff');
        ui.log(`The King's crown billows smoke. ${d >= 0 ? `<b>${d}</b> damage, ` : ''}<b>-${lost} oil</b>.`, 'warn');
        LB.updateDarkness();
        return;
      }
      case 'inhale':
        e.status.charged = 'snuffout';
        ui.anim(enemyNode(), 'charge', 700);
        LB.audio.sfx('rumble');
        ui.log('The Wickless King inhales every shadow in the room. <b>DEFEND NEXT TURN!</b>', 'bad');
        await sleep(500);
        return;
      case 'snuffout': {
        e.status.charged = null;
        ui.flash('rgba(0,0,0,.8)');
        ui.log('<b>"SNUFF OUT!"</b>', 'bad');
        const d = await enemyAttack(2.6, { charged: true, sure: true });
        ui.log(`<b>${d}</b> damage.${B.hero.guard ? ' Your guard holds!' : ' That really hurt.'}`, 'hurt');
        return;
      }
      case 'decree':
        B.hero.weak = 2;
        LB.audio.sfx('snuff');
        ui.log('"By royal decree, you are WEAK." The King unrolls a scroll. You feel legally obliged to be weaker.', 'bad');
        await sleep(400);
        return;
    }
  }

  async function endOfRound() {
    const h = B.hero, e = B.enemy;
    if (B.fled || B.enemyFled) return;
    if (h.poison > 0 && LB.S.hero.hp > 0) {
      h.poison--;
      const d = Math.min(LB.S.hero.hp - 1, h.poisonDmg);
      if (d > 0) {
        LB.S.hero.hp -= d;
        ui.floater(heroNode(), String(d), '#a8ff5a');
        ui.log(`Marsh Fever: <b>-${d} HP</b>. (Poison can't finish you off, but it tries.)`, 'bad');
        await sleep(250);
      }
    }
    if (e.status.burn > 0 && e.hp > 0) {
      e.status.burn--;
      ui.log(`${The(e)} burns for <b>${e.status.burnDmg}</b>.`, 'good');
      await damageEnemy(e.status.burnDmg, { color: '#ff8a5a', sfx: 'fire' });
    }
    if (h.weak > 0) h.weak--;
    if (h.bulwark > 0) h.bulwark--;
    if (e.status.weak > 0) e.status.weak--;
    // Boss phase change
    if (e.boss && !B.phase2 && e.hp > 0 && e.hp <= e.maxHp / 2) {
      B.phase2 = true;
      LB.audio.sfx('rumble');
      ui.shake(true);
      ui.flash('rgba(120,0,0,.5)');
      U.$('#stage').classList.add('boss-phase2');
      await ui.say('king', 'ENOUGH! You want to see the dark? LET IT DEEPEN!');
      ui.endDialogue();
      ui.log('The Wickless King is enraged! His attacks grow stronger.', 'bad');
    }
    updateBattleUI();
  }

  /* ------------------------------------------------------ end conditions */
  async function checkEnd() {
    const S = LB.S, e = B.enemy;
    if (e.hp <= 0) { await victory(); return true; }
    if (S.hero.hp <= 0) {
      if (S.bag.items.feather) {
        S.bag.items.feather--;
        if (!S.bag.items.feather) delete S.bag.items.feather;
        S.hero.hp = Math.round(LB.stats().hp * 0.4);
        LB.audio.sfx('heal');
        ui.flash('rgba(255,160,80,.5)');
        ui.burst(heroNode(), '#ffb03b', 26);
        ui.log('Your <b>Second-Wind Feather</b> bursts into flame! You rise again at 40% HP!', 'good');
        updateBattleUI();
        await sleep(600);
        return false;
      }
      await defeat();
      return true;
    }
    if (B.fled) { finish('flee'); return true; }
    if (B.enemyFled) { finish('enemyfled'); return true; }
    return false;
  }

  function finish(result) {
    const done = B;
    B.over = true;
    B = null;
    LB.S.scene = LB.S.mode;
    U.$('#stage').classList.remove('boss-phase2');
    done.resolve(result);
  }

  async function victory() {
    const S = LB.S, e = B.enemy;
    B.intent = null;
    const node = enemyNode();
    node.classList.add('die');
    LB.audio.sfx('victory');
    ui.burst(node, '#ffd35c', 20);
    await sleep(700);
    S.stats.battles++;
    let gold = LB.addGold(e.gold);
    if (B.stolen) { S.hero.gold += B.stolen; ui.log(`You recover your stolen <b>${B.stolen} gold</b>!`, 'gold'); }
    ui.log(`<b>Victory!</b> ${The(e)} is defeated. <b>+${e.exp} EXP</b>, <b>+${gold} gold</b>.`, 'victory');
    ui.floater(heroNode(), '+' + e.exp + ' EXP', '#bfa8ff');
    // loot
    const light = LB.lightLevel();
    const ilvl = B.floor + (light === 'dark' ? 1 : 0);
    const dropChance = e.boss ? 0 : 0.3 + LB.stats().luck * 0.004 + e.loot;
    if (e.id === 'mimic' || e.id === 'spore') {
      ui.log(`It drops ${LB.giveLoot(LB.rollLoot(ilvl, { gearOnly: true, minRarity: 'fine', rarityBonus: 0.15 }))}!`, 'loot');
    } else if (chance(dropChance)) {
      ui.log(`It drops ${LB.giveLoot(LB.rollLoot(ilvl, { rarityBonus: e.loot * 0.5 }))}!`, 'loot');
    }
    B.hero = { guard: false, bulwark: 0, poison: 0, weak: 0, overclock: 0 };
    ui.hud();
    await sleep(300);
    await LB.gainExp(e.exp);
    finish('win');
  }

  async function defeat() {
    const node = heroNode();
    node.classList.add('die');
    LB.audio.sfx('death');
    ui.log('You collapse. Your lantern rolls away, flickering…', 'bad');
    await sleep(1200);
    finish('lose');
  }

  /* ------------------------------------------------------------ level up */
  LB.gainExp = async function (n) {
    const S = LB.S, h = S.hero;
    h.exp += n;
    while (h.exp >= LB.expToNext(h.level)) {
      h.exp -= LB.expToNext(h.level);
      const before = LB.stats();
      h.level++;
      const g = LB.CLASSES[h.cls].growth;
      for (const k of Object.keys(g)) h.base[k] += g[k];
      const after = LB.stats();
      h.hp = after.hp;
      h.mp = after.mp;
      LB.audio.sfx('levelup');
      ui.flash('rgba(255,211,92,.35)');
      const heroEl = U.$('#actor-hero');
      if (heroEl) ui.burst(heroEl, '#ffd35c', 24);
      ui.log(`<b>LEVEL UP!</b> ${esc(h.name)} is now level ${h.level}. HP and MP fully restored.`, 'levelup');
      ui.hud();
      await levelUpModal(before, after);
    }
  };

  function levelUpModal(before, after) {
    return new Promise((resolve) => {
      const S = LB.S, h = S.hero;
      const body = el('div', { class: 'levelup' });
      body.append(LB.pixelText(`LEVEL ${h.level}!`, { color: '#ffd35c', scale: 5, cls: 'levelup-title' }));
      const grid = el('div', { class: 'lu-stats' });
      for (const k of ['hp', 'mp', 'str', 'def', 'wit', 'agi', 'luck']) {
        const d = after[k] - before[k];
        grid.append(el('div', { class: 'lu-stat' + (d > 0 ? ' up' : '') }, el('span', { text: LB.STAT_SHORT[k] }), el('b', { text: String(after[k]) }), el('em', { text: d > 0 ? `+${d}` : '' })));
      }
      body.append(grid);
      const idx = LB.CLASSES[h.cls].skills.findIndex((_, i) => LB.SKILL_LEVELS[i] === h.level);
      if (idx >= 0) {
        const sk = LB.SKILLS[LB.CLASSES[h.cls].skills[idx]];
        body.append(el('div', { class: 'lu-skill', html: `<b>New skill: ${sk.name}</b> (${sk.mp} MP)<br><span>${sk.desc}</span>` }));
      }
      body.append(el('p', { class: 'lu-pick', text: 'Choose a boon:' }));
      const pool = LB.BOONS.slice().sort(() => Math.random() - 0.5).slice(0, 3);
      const row = el('div', { class: 'boon-row' });
      let m;
      pool.forEach((b) => {
        const btn = el('button', { class: 'btn boon', type: 'button' }, el('b', { text: b.label }), el('span', { text: b.desc }));
        btn.addEventListener('click', () => {
          LB.audio.sfx('select');
          b.apply(h.bonus, h);
          const st = LB.stats();
          h.hp = st.hp;
          h.mp = st.mp;
          ui.log(`Boon chosen: <b>${b.label}</b>.`, 'good');
          ui.hud();
          m.close();
          resolve();
        });
        row.append(btn);
      });
      body.append(row);
      m = ui.modal({ title: '', body, cls: 'modal-levelup', closable: false });
    });
  };

  LB._battleDebug = () => B;
})();
