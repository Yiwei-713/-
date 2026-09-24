/* Lanternbound — core: state, stats, loot, saving and UI primitives. */
(function () {
  const LB = (window.LB = window.LB || {});

  /* ------------------------------------------------------------- utilities */
  const U = (LB.U = {
    $: (s, r = document) => r.querySelector(s),
    $$: (s, r = document) => Array.from(r.querySelectorAll(s)),
    rand: (a, b) => a + Math.random() * (b - a),
    ri: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    chance: (p) => Math.random() < p,
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    sleep: (ms) => new Promise((r) => setTimeout(r, LB.fast ? Math.min(ms, 5) : ms)),
    weighted(obj) {
      const entries = Object.entries(obj).filter(([, w]) => w > 0);
      let t = entries.reduce((a, [, w]) => a + w, 0) * Math.random();
      for (const [k, w] of entries) if ((t -= w) < 0) return k;
      return entries[entries.length - 1][0];
    },
    esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    el(tag, props = {}, ...kids) {
      const e = document.createElement(tag);
      for (const [k, v] of Object.entries(props)) {
        if (k === 'class') e.className = v;
        else if (k === 'html') e.innerHTML = v;
        else if (k === 'text') e.textContent = v;
        else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
        else if (k === 'style') e.style.cssText = v;
        else e.setAttribute(k, v);
      }
      for (const kid of kids.flat()) if (kid != null && kid !== false) e.append(kid instanceof Node ? kid : document.createTextNode(kid));
      return e;
    },
  });
  const { el, esc } = U;

  /* ----------------------------------------------------------------- state */
  LB.S = null;
  const STAT_KEYS = ['hp', 'mp', 'str', 'def', 'wit', 'agi', 'luck', 'gold'];
  LB.STAT_KEYS = STAT_KEYS;

  LB.newState = function (name, cls, keepsake) {
    const C = LB.CLASSES[cls];
    const hero = {
      name, cls, keepsake, level: 1, exp: 0, gold: 30,
      base: Object.assign({ gold: 0 }, C.base),
      bonus: { hp: 0, mp: 0, str: 0, def: 0, wit: 0, agi: 0, luck: 0, gold: 0 },
      oil: 100, maxOil: 100, hp: 1, mp: 1,
    };
    const S = {
      version: 1,
      hero,
      equip: { weapon: null, armor: null, trinket: null },
      bag: { items: { tonic: 2, oil: 1 }, gear: [] },
      mode: 'town',
      floor: 1, progress: 0, deepest: 1, waystones: [1],
      blessing: null,
      shop: null,
      flags: { reginald: 0, spore: [], riddles: [], pimGift: false, bossDefeated: false, introSeen: false, restedOnce: false },
      stats: { battles: 0, steps: 0, deaths: 0, goldEarned: 0, chests: 0, toads: 0, crits: 0, started: Date.now(), playMs: 0 },
      seed: Math.floor(Math.random() * 1e9),
      uid: 1,
    };
    if (keepsake === 'cookies') { hero.bonus.hp += 12; S.bag.items.tonic += 3; }
    if (keepsake === 'button') hero.bonus.luck += 3;
    if (keepsake === 'coin') { hero.gold += 60; hero.bonus.gold += 15; }
    S.equip.weapon = LB.makeGear(1, 'common', 'weapon', cls === 'witch' ? 'Walking Stick' : cls === 'tinker' ? 'Butter Knife' : 'Rusty Sword', S);
    S.equip.armor = LB.makeGear(1, 'common', 'armor', 'Wool Sweater', S);
    LB.S = S;
    const st = LB.stats();
    hero.hp = st.hp;
    hero.mp = st.mp;
    return S;
  };

  /* Derived stats: base + bonuses + gear + blessing. */
  LB.stats = function (S = LB.S, equipOverride) {
    const h = S.hero;
    const out = {};
    const equip = equipOverride || S.equip;
    for (const k of STAT_KEYS) {
      let v = (h.base[k] || 0) + (h.bonus[k] || 0);
      for (const slot of ['weapon', 'armor', 'trinket']) if (equip[slot]) v += equip[slot].stats[k] || 0;
      if (S.blessing && S.blessing.stat === k) v += S.blessing.amount;
      out[k] = Math.floor(v);
    }
    return out;
  };
  LB.oilDrain = () => (LB.S.hero.keepsake === 'oilcan' ? 3 : 5);
  LB.lightLevel = function () {
    const h = LB.S.hero;
    if (h.oil <= 0) return 'dark';
    if (h.oil <= 30) return 'dim';
    return 'bright';
  };
  LB.expToNext = (lvl) => Math.round(12 * Math.pow(lvl, 1.5) + 8);
  LB.knownSkills = function () {
    const h = LB.S.hero;
    return LB.CLASSES[h.cls].skills.filter((_, i) => h.level >= LB.SKILL_LEVELS[i]);
  };

  LB.heal = function (amount) {
    const h = LB.S.hero, max = LB.stats().hp;
    const before = h.hp;
    h.hp = Math.min(max, h.hp + Math.max(0, Math.round(amount)));
    return h.hp - before;
  };
  LB.restoreMp = function (amount) {
    const h = LB.S.hero, max = LB.stats().mp;
    const before = h.mp;
    h.mp = Math.min(max, h.mp + Math.max(0, Math.round(amount)));
    return h.mp - before;
  };
  LB.addOil = function (amount) {
    const h = LB.S.hero;
    const before = h.oil;
    h.oil = U.clamp(h.oil + amount, 0, h.maxOil);
    return h.oil - before;
  };
  LB.addGold = function (amount, raw) {
    const S = LB.S;
    let g = Math.round(amount);
    if (!raw && g > 0) g = Math.round(g * (1 + LB.stats().gold / 100));
    S.hero.gold = Math.max(0, S.hero.gold + g);
    if (g > 0) S.stats.goldEarned += g;
    return g;
  };
  /* Keeps current HP/MP within a (possibly changed) maximum. */
  LB.clampVitals = function () {
    const st = LB.stats(), h = LB.S.hero;
    h.hp = Math.min(h.hp, st.hp);
    h.mp = Math.min(h.mp, st.mp);
  };

  /* ------------------------------------------------------------------ loot */
  LB.rollRarity = function (ilvl, bonus = 0) {
    const luck = LB.S ? LB.stats().luck : 0;
    const shift = ilvl * 1.2 + luck * 0.6 + bonus * 100;
    return U.weighted({
      common: Math.max(8, 62 - shift),
      fine: 28 + shift * 0.3,
      rare: 8 + shift * 0.45,
      radiant: 1.2 + shift * 0.12,
    });
  };

  LB.makeGear = function (ilvl, rarity, slot, baseName, S = LB.S) {
    ilvl = Math.max(1, ilvl);
    let pool = LB.GEAR_BASES.filter((b) => b.tier <= ilvl && (!slot || b.slot === slot));
    if (baseName) pool = LB.GEAR_BASES.filter((b) => b.name === baseName);
    const weights = {};
    pool.forEach((b, i) => (weights[i] = b.tier >= ilvl - 2 ? 3 : 1));
    const base = pool[+U.weighted(weights)];
    const R = LB.RARITY[rarity];
    const scale = 1 + 0.2 * (ilvl - 1);
    const stats = {};
    for (const [k, v] of Object.entries(base.stats)) stats[k] = Math.max(1, Math.round(v * R.mult * scale));
    const affixKeys = [];
    const candidates = Object.keys(LB.AFFIX_BASE);
    while (affixKeys.length < R.affixes) {
      const k = U.pick(candidates);
      if (!affixKeys.includes(k)) affixKeys.push(k);
    }
    for (const k of affixKeys) {
      const v = Math.max(1, Math.round(LB.AFFIX_BASE[k] * (1 + 0.22 * (ilvl - 1)) * U.rand(0.8, 1.25)));
      stats[k] = (stats[k] || 0) + v;
    }
    let name = base.name;
    if (affixKeys.length === 1) name = U.chance(0.5) ? `${U.pick(LB.PREFIX[affixKeys[0]])} ${name}` : `${name} ${U.pick(LB.SUFFIX[affixKeys[0]])}`;
    else if (affixKeys.length >= 2) name = `${U.pick(LB.PREFIX[affixKeys[0]])} ${name} ${U.pick(LB.SUFFIX[affixKeys[1]])}`;
    const item = { uid: S ? S.uid++ : Date.now(), slot: base.slot, icon: base.icon, name, rarity, ilvl, stats };
    item.value = gearValue(item);
    return item;
  };
  LB.makeLegendary = function (id, ilvl) {
    const L = LB.LEGENDARIES[id];
    const scale = 1 + 0.12 * Math.max(0, ilvl - 5);
    const stats = {};
    for (const [k, v] of Object.entries(L.stats)) stats[k] = Math.round(v * scale);
    const item = { uid: LB.S.uid++, slot: L.slot, icon: L.icon, name: L.name, rarity: 'legendary', ilvl, stats, lore: L.lore, legendary: id };
    item.value = gearValue(item);
    return item;
  };
  function gearValue(item) {
    let pts = 0;
    for (const [k, v] of Object.entries(item.stats)) pts += k === 'hp' ? v / 5 : k === 'mp' ? v / 3 : k === 'gold' ? v / 6 : v;
    return Math.max(2, Math.round(pts * 3 * LB.RARITY[item.rarity].value));
  }

  /* Random drop: gear or a consumable. */
  LB.rollLoot = function (ilvl, opts = {}) {
    const S = LB.S;
    if (!opts.gearOnly && U.chance(opts.consumableChance ?? 0.45)) {
      const id = U.weighted({ tonic: 5, ether: 3, oil: 3, soup: 2, smoke: 1.5, firecracker: 2, bigtonic: ilvl >= 4 ? 1.5 : 0, feather: ilvl >= 5 ? 0.4 : 0 });
      return { type: 'item', id, qty: 1 };
    }
    const owned = new Set([...S.bag.gear, ...Object.values(S.equip)].filter(Boolean).map((g) => g.legendary).filter(Boolean));
    const legendPool = ['umbrella', 'candle', 'fly', 'sweater'].filter((id) => !owned.has(id));
    const lchance = ilvl >= 4 ? 0.012 + (opts.rarityBonus || 0) * 0.05 : 0;
    if (legendPool.length && U.chance(lchance)) return { type: 'gear', item: LB.makeLegendary(U.pick(legendPool), ilvl) };
    let rarity = LB.rollRarity(ilvl, opts.rarityBonus || 0);
    if (opts.minRarity) {
      const order = ['common', 'fine', 'rare', 'radiant'];
      if (order.indexOf(rarity) < order.indexOf(opts.minRarity)) rarity = opts.minRarity;
    }
    return { type: 'gear', item: LB.makeGear(ilvl, rarity) };
  };
  LB.giveLoot = function (loot) {
    const S = LB.S;
    if (loot.type === 'item') {
      S.bag.items[loot.id] = (S.bag.items[loot.id] || 0) + (loot.qty || 1);
      const C = LB.CONSUMABLES[loot.id];
      return `<span class="item-name">${esc(C.name)}${loot.qty > 1 ? ' ×' + loot.qty : ''}</span>`;
    }
    S.bag.gear.push(loot.item);
    return LB.gearLabel(loot.item);
  };
  LB.gearLabel = (item) => `<span class="item-name r-${item.rarity}">${item.rarity === 'radiant' ? '✦ ' : item.rarity === 'legendary' ? '★ ' : ''}${esc(item.name)}</span>`;
  LB.statLine = function (stats) {
    return Object.entries(stats)
      .map(([k, v]) => `${v > 0 ? '+' : ''}${v}${k === 'gold' ? '%' : ''} ${LB.STAT_SHORT[k]}`)
      .join(', ');
  };

  /* ---------------------------------------------------------------- saving */
  const SAVE_PREFIX = 'lanternbound.save.';
  LB.SLOTS = ['auto', '1', '2', '3'];
  LB.save = function (slot = 'auto') {
    const S = LB.S;
    if (!S) return false;
    try {
      S.savedAt = Date.now();
      localStorage.setItem(SAVE_PREFIX + slot, JSON.stringify(S));
      return true;
    } catch (e) {
      console.warn('Save failed', e);
      return false;
    }
  };
  LB.readSave = function (slot) {
    try {
      const raw = localStorage.getItem(SAVE_PREFIX + slot);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !data.hero || !data.version) return null;
      return data;
    } catch (e) {
      return null;
    }
  };
  LB.deleteSave = function (slot) {
    try { localStorage.removeItem(SAVE_PREFIX + slot); } catch (e) { /* ignore */ }
  };
  LB.latestSave = function () {
    let best = null;
    for (const slot of LB.SLOTS) {
      const d = LB.readSave(slot);
      if (d && (!best || d.savedAt > best.data.savedAt)) best = { slot, data: d };
    }
    return best;
  };
  /* Fills in fields a save from an older build might lack. */
  LB.migrate = function (data) {
    const fresh = { flags: { reginald: 0, spore: [], riddles: [], pimGift: false, bossDefeated: false, introSeen: true, restedOnce: true }, stats: { battles: 0, steps: 0, deaths: 0, goldEarned: 0, chests: 0, toads: 0, crits: 0, playMs: 0 } };
    data.flags = Object.assign({}, fresh.flags, data.flags);
    data.stats = Object.assign({}, fresh.stats, data.stats);
    data.bag = data.bag || { items: {}, gear: [] };
    data.waystones = data.waystones || [1];
    if (data.mode !== 'dungeon') data.mode = 'town';
    return data;
  };

  /* ================================================================== UI */
  const ui = (LB.ui = {});

  ui.log = function (html, cls = '') {
    const box = U.$('#log');
    if (!box) return;
    const line = el('div', { class: 'log-line ' + cls, html });
    box.append(line);
    while (box.children.length > 80) box.firstChild.remove();
    box.scrollTop = box.scrollHeight;
  };
  ui.clearLog = () => { const b = U.$('#log'); if (b) b.innerHTML = ''; };

  ui.toast = function (html, cls = '') {
    const root = U.$('#toasts');
    const t = el('div', { class: 'toast ' + cls, html });
    root.append(t);
    setTimeout(() => t.classList.add('out'), 2200);
    setTimeout(() => t.remove(), 2700);
  };

  function bar(cls, value, max, label) {
    const pct = max > 0 ? U.clamp((value / max) * 100, 0, 100) : 0;
    return `<div class="bar ${cls}" title="${label}"><div class="bar-fill" style="width:${pct}%"></div><div class="bar-ghost" style="width:${pct}%"></div><span class="bar-text">${label}</span></div>`;
  }

  ui.hud = function () {
    const S = LB.S;
    if (!S) return;
    const h = S.hero, st = LB.stats(), C = LB.CLASSES[h.cls];
    const need = LB.expToNext(h.level);
    const light = LB.lightLevel();
    const hud = U.$('#hud-stats');
    hud.innerHTML = `
      <div class="hud-id">
        <div class="hud-portrait"></div>
        <div>
          <div class="hud-name">${esc(h.name)}</div>
          <div class="hud-sub">Lv ${h.level} ${C.name}</div>
        </div>
      </div>
      <div class="hud-bars">
        ${bar('hp', h.hp, st.hp, `HP ${h.hp}/${st.hp}`)}
        ${bar('mp', h.mp, st.mp, `MP ${h.mp}/${st.mp}`)}
        ${bar('xp', h.exp, need, `EXP ${h.exp}/${need}`)}
      </div>
      <div class="hud-res">
        <div class="hud-gold" title="Gold"><span class="ico ico-coin"></span><b>${h.gold}</b></div>
        <div class="hud-oil light-${light}" title="Lantern oil: ${light}. Dim/dark lanterns make enemies stronger but loot better.">
          <span class="ico ico-flame"></span>${bar('oil', h.oil, h.maxOil, `Oil ${h.oil}`)}
        </div>
      </div>`;
    const portrait = hud.querySelector('.hud-portrait');
    portrait.append(LB.spriteImg(C.sprite, 3));
    // Low HP warning pulse.
    document.body.classList.toggle('low-hp', h.hp > 0 && h.hp / st.hp <= 0.25);
  };

  /* Action buttons. items: [{label, sub, onClick, disabled, cls, icon}] */
  ui.actions = function (items, title) {
    const box = U.$('#actions');
    box.innerHTML = '';
    if (title) box.append(el('div', { class: 'actions-title', html: title }));
    const grid = el('div', { class: 'actions-grid' });
    items.forEach((it, i) => {
      const b = el('button', {
        class: 'btn action ' + (it.cls || ''),
        type: 'button',
        'data-key': i + 1,
        title: it.title || '',
      });
      if (it.icon) b.append(LB.spriteImg(it.icon, 2, { cls: 'btn-icon' }));
      b.append(el('span', { class: 'btn-label', html: it.label }));
      if (it.sub) b.append(el('span', { class: 'btn-sub', html: it.sub }));
      b.append(el('span', { class: 'key', text: i < 9 ? String(i + 1) : '' }));
      if (it.disabled) b.disabled = true;
      b.addEventListener('click', () => {
        if (LB.busy || b.disabled) return;
        LB.audio.sfx('click');
        it.onClick();
      });
      grid.append(b);
    });
    box.append(grid);
  };
  ui.lockActions = function (locked) {
    U.$$('#actions button, #menu button').forEach((b) => (b.dataset.locked = locked ? '1' : ''));
    document.body.classList.toggle('busy', !!locked);
  };

  /* Runs an async game step with the controls locked. */
  LB.run = async function (fn) {
    if (LB.busy) return;
    LB.busy = true;
    ui.lockActions(true);
    try {
      await fn();
    } catch (e) {
      console.error(e);
      ui.log('Something went wrong in the dark: ' + esc(e.message), 'bad');
    } finally {
      LB.busy = false;
      ui.lockActions(false);
      if (LB.refresh && LB.S && !LB.inBattle()) LB.refresh();
      else ui.hud();
    }
  };

  /* --------------------------------------------------------------- modals */
  ui.modal = function ({ title, body, cls = '', closable = true, onClose }) {
    const root = U.$('#modals');
    const wrap = el('div', { class: 'modal-wrap' });
    const box = el('div', { class: 'modal panel ' + cls, role: 'dialog', 'aria-modal': 'true' });
    const head = el('div', { class: 'modal-head' });
    if (title) head.append(typeof title === 'string' ? el('h2', { html: title }) : title);
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      wrap.classList.add('out');
      setTimeout(() => wrap.remove(), 180);
      onClose && onClose();
    };
    if (closable) {
      head.append(el('button', { class: 'btn btn-x', type: 'button', 'aria-label': 'Close', text: '×', onclick: () => { LB.audio.sfx('click'); close(); } }));
      wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
    }
    box.append(head);
    const content = el('div', { class: 'modal-body' });
    if (body) content.append(body);
    box.append(content);
    wrap.append(box);
    wrap._close = closable ? close : null;
    root.append(wrap);
    return { close, el: box, body: content };
  };
  ui.closeTopModal = function () {
    const wraps = U.$$('#modals .modal-wrap:not(.out)');
    const top = wraps[wraps.length - 1];
    if (top && top._close) { top._close(); return true; }
    return false;
  };
  ui.anyModal = () => U.$$('#modals .modal-wrap:not(.out)').length > 0;

  /* A simple choice modal that resolves with the chosen value. */
  ui.pickModal = function (title, text, options) {
    return new Promise((resolve) => {
      const body = el('div', {});
      if (text) body.append(el('p', { class: 'modal-text', html: text }));
      const list = el('div', { class: 'pick-list' });
      let m;
      options.forEach((o) => {
        const b = el('button', { class: 'btn pick ' + (o.cls || ''), type: 'button' });
        if (o.icon) b.append(LB.spriteImg(o.icon, 2, { cls: 'btn-icon' }));
        b.append(el('span', { class: 'pick-label', html: o.label }));
        if (o.desc) b.append(el('span', { class: 'pick-desc', html: o.desc }));
        if (o.disabled) b.disabled = true;
        b.addEventListener('click', () => { LB.audio.sfx('select'); resolve(o.value); m.close(); });
        list.append(b);
      });
      body.append(list);
      m = ui.modal({ title, body, closable: options.some((o) => o.value === null), onClose: () => resolve(null) });
    });
  };

  /* ------------------------------------------------------------- dialogue */
  LB.SPEAKERS = {
    elder: { name: 'Elder Wickett', sprite: 'elder' },
    marrow: { name: 'Old Marrow', sprite: 'marrow' },
    barnaby: { name: 'Barnaby Croak', sprite: 'barnaby' },
    pim: { name: 'Pim', sprite: 'pim' },
    reginald: { name: 'Sir Reginald Fumblesworth', sprite: 'reginald' },
    spore: { name: 'Professor Spore', sprite: 'spore' },
    ghost: { name: 'Wendel the Ghost', sprite: 'ghost' },
    sal: { name: 'Shady Sal', sprite: 'sal' },
    king: { name: 'The Wickless King', sprite: 'king' },
    moth: { name: 'Lantern Moths', sprite: 'lanternmoth' },
  };
  function speakerInfo(id) {
    if (id === 'hero') return { name: LB.S.hero.name, sprite: LB.CLASSES[LB.S.hero.cls].sprite };
    return LB.SPEAKERS[id] || { name: '', sprite: null };
  }

  let dialogueAdvance = null;
  ui.dialogueOpen = () => !U.$('#dialogue').hidden;
  ui.advanceDialogue = () => dialogueAdvance && dialogueAdvance();

  /* Shows a line of dialogue. With options, resolves to the chosen index. */
  ui.say = function (speaker, text, options) {
    return new Promise((resolve) => {
      const box = U.$('#dialogue');
      const who = speakerInfo(speaker);
      box.hidden = false;
      box.classList.toggle('narrator', !who.sprite);
      const portrait = U.$('#dlg-portrait');
      portrait.innerHTML = '';
      if (who.sprite) portrait.append(LB.spriteImg(who.sprite, who.sprite === 'king' ? 3 : 4));
      U.$('#dlg-name').textContent = who.name;
      const txt = U.$('#dlg-text');
      const opts = U.$('#dlg-options');
      const hint = U.$('#dlg-hint');
      opts.innerHTML = '';
      hint.hidden = true;
      txt.textContent = '';
      const full = text.replace('{name}', LB.S ? LB.S.hero.name : 'you');
      let i = 0, done = false, timer = null;

      const finish = () => {
        if (timer) clearInterval(timer);
        txt.textContent = full;
        done = true;
        if (options && options.length) {
          dialogueAdvance = null;
          options.forEach((o, idx) => {
            const b = el('button', { class: 'btn dlg-opt', type: 'button', html: `<span class="key">${idx + 1}</span>${o}` });
            b.addEventListener('click', (e) => {
              e.stopPropagation();
              LB.audio.sfx('select');
              cleanup();
              resolve(idx);
            });
            opts.append(b);
          });
        } else {
          hint.hidden = false;
          dialogueAdvance = () => { cleanup(); resolve(0); };
        }
      };
      const cleanup = () => {
        dialogueAdvance = null;
        box.onclick = null;
      };
      dialogueAdvance = finish;
      box.onclick = () => { if (dialogueAdvance) dialogueAdvance(); };
      if (LB.fast) return finish();
      timer = setInterval(() => {
        i += 2;
        txt.textContent = full.slice(0, i);
        if (i % 6 === 0) LB.audio.sfx('blip');
        if (i >= full.length) finish();
      }, 18);
    });
  };
  ui.endDialogue = function () {
    U.$('#dialogue').hidden = true;
    dialogueAdvance = null;
  };
  /* Convenience: a sequence of lines from one speaker. */
  ui.talk = async function (speaker, lines) {
    for (const l of lines) await ui.say(speaker, l);
  };

  /* ------------------------------------------------------------- effects */
  ui.floater = function (target, text, color = '#fff', big = false) {
    const fx = U.$('#fx');
    if (!fx || !target) return;
    const sr = U.$('#stage').getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    const f = el('div', { class: 'floater' + (big ? ' big' : '') });
    f.append(LB.pixelText(text, { color, scale: big ? 4 : 3 }));
    f.style.left = tr.left - sr.left + tr.width / 2 + U.ri(-12, 12) + 'px';
    f.style.top = tr.top - sr.top + tr.height * 0.25 + 'px';
    fx.append(f);
    setTimeout(() => f.remove(), 1200);
  };
  ui.burst = function (target, color = '#ffd35c', n = 14) {
    const fx = U.$('#fx');
    if (!fx || !target) return;
    const sr = U.$('#stage').getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    const cx = tr.left - sr.left + tr.width / 2, cy = tr.top - sr.top + tr.height / 2;
    for (let i = 0; i < n; i++) {
      const p = el('div', { class: 'spark' });
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const d = 30 + Math.random() * 50;
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.background = color;
      p.style.setProperty('--dx', Math.cos(a) * d + 'px');
      p.style.setProperty('--dy', Math.sin(a) * d + 'px');
      fx.append(p);
      setTimeout(() => p.remove(), 700);
    }
  };
  ui.projectile = async function (from, to, color = '#ff9d3b') {
    const fx = U.$('#fx');
    if (!fx || !from || !to) return;
    const sr = U.$('#stage').getBoundingClientRect();
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    const p = el('div', { class: 'projectile' });
    p.style.background = color;
    p.style.boxShadow = `0 0 12px 4px ${color}`;
    p.style.left = a.left - sr.left + a.width * 0.7 + 'px';
    p.style.top = a.top - sr.top + a.height * 0.4 + 'px';
    fx.append(p);
    await U.sleep(20);
    p.style.left = b.left - sr.left + b.width / 2 + 'px';
    p.style.top = b.top - sr.top + b.height / 2 + 'px';
    await U.sleep(320);
    p.remove();
  };
  ui.shake = function (strong) {
    const st = U.$('#stage');
    st.classList.remove('shake', 'shake-big');
    void st.offsetWidth;
    st.classList.add(strong ? 'shake-big' : 'shake');
  };
  ui.flash = function (color = '#fff') {
    const f = U.$('#flash');
    f.style.background = color;
    f.classList.remove('go');
    void f.offsetWidth;
    f.classList.add('go');
  };
  ui.anim = async function (node, cls, ms) {
    if (!node) return;
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
    await U.sleep(ms);
    node.classList.remove(cls);
  };
  ui.fade = async function (fn) {
    const f = U.$('#fade');
    f.classList.add('on');
    await U.sleep(350);
    await fn();
    f.classList.remove('on');
    await U.sleep(200);
  };
})();
