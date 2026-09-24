/* Lanternbound — tiny WebAudio chiptune engine. No audio files: every sound
   is synthesised on the fly. */
(function () {
  const LB = (window.LB = window.LB || {});
  let ctx = null, master = null, musicGain = null, sfxGain = null, noiseBuf = null;
  const settings = { music: true, sfx: true };
  try {
    Object.assign(settings, JSON.parse(localStorage.getItem('lanternbound.sound') || '{}'));
  } catch (e) { /* storage unavailable */ }

  function init() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = settings.music ? 0.32 : 0;
    musicGain.connect(master);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = settings.sfx ? 0.5 : 0;
    sfxGain.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (pendingTrack) playTrack(pendingTrack);
  }

  function tone(freq, dur, opts = {}) {
    if (!ctx) return;
    const t = ctx.currentTime + (opts.delay || 0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = opts.type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), t + dur);
    const v = opts.vol === undefined ? 0.3 : opts.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(opts.bus || sfxGain);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  function noise(dur, opts = {}) {
    if (!ctx) return;
    const t = ctx.currentTime + (opts.delay || 0);
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = opts.filter || 'lowpass';
    f.frequency.value = opts.freq || 1800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(opts.vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(opts.bus || sfxGain);
    s.start(t);
    s.stop(t + dur + 0.05);
  }

  const SFX = {
    click: () => tone(660, 0.05, { vol: 0.12 }),
    select: () => { tone(520, 0.06, { vol: 0.15 }); tone(780, 0.08, { vol: 0.15, delay: 0.05 }); },
    blip: () => tone(900 + Math.random() * 200, 0.025, { vol: 0.05, type: 'triangle' }),
    hit: () => { noise(0.12, { freq: 1400, vol: 0.4 }); tone(180, 0.1, { slide: 60, vol: 0.25 }); },
    crit: () => { noise(0.2, { freq: 3000, vol: 0.5 }); tone(400, 0.2, { slide: 80, vol: 0.3 }); tone(900, 0.08, { vol: 0.2, delay: 0.02 }); },
    hurt: () => { tone(220, 0.18, { slide: 90, type: 'sawtooth', vol: 0.25 }); noise(0.1, { freq: 800, vol: 0.3 }); },
    miss: () => tone(500, 0.15, { slide: 1200, type: 'triangle', vol: 0.15 }),
    magic: () => { for (let i = 0; i < 5; i++) tone(600 + i * 180, 0.08, { type: 'triangle', vol: 0.18, delay: i * 0.04 }); },
    fire: () => { noise(0.35, { freq: 900, vol: 0.35 }); tone(300, 0.3, { slide: 900, type: 'sawtooth', vol: 0.12 }); },
    heal: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, { type: 'triangle', vol: 0.2, delay: i * 0.06 })); },
    coin: () => { tone(988, 0.06, { vol: 0.15 }); tone(1319, 0.14, { vol: 0.15, delay: 0.06 }); },
    chest: () => { tone(392, 0.08, { vol: 0.18 }); tone(523, 0.08, { vol: 0.18, delay: 0.08 }); tone(784, 0.2, { vol: 0.18, delay: 0.16 }); },
    step: () => noise(0.06, { freq: 500, vol: 0.18 }),
    guard: () => { tone(300, 0.1, { vol: 0.2 }); tone(300, 0.15, { vol: 0.15, delay: 0.1, type: 'triangle' }); },
    levelup: () => { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.14, { vol: 0.2, delay: i * 0.08 })); },
    victory: () => { [392, 392, 392, 523, 0, 466, 523].forEach((f, i) => f && tone(f, i === 6 ? 0.5 : 0.12, { vol: 0.2, delay: i * 0.1 })); },
    death: () => { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, { vol: 0.2, type: 'triangle', delay: i * 0.22 })); },
    flee: () => { for (let i = 0; i < 4; i++) noise(0.05, { freq: 600, vol: 0.15, delay: i * 0.07 }); },
    toad: () => { tone(200, 0.1, { slide: 120, vol: 0.3 }); tone(160, 0.15, { slide: 90, vol: 0.3, delay: 0.14 }); },
    boom: () => { noise(0.5, { freq: 400, vol: 0.6 }); tone(120, 0.4, { slide: 40, vol: 0.35 }); },
    snuff: () => noise(0.4, { freq: 3000, filter: 'highpass', vol: 0.2 }),
    drink: () => { for (let i = 0; i < 3; i++) tone(300 + i * 60, 0.06, { type: 'triangle', vol: 0.18, delay: i * 0.08 }); },
    buy: () => { tone(1319, 0.05, { vol: 0.15 }); tone(1568, 0.1, { vol: 0.15, delay: 0.05 }); },
    stairs: () => { [523, 440, 349, 262].forEach((f, i) => tone(f, 0.1, { type: 'triangle', vol: 0.2, delay: i * 0.08 })); },
    rumble: () => { noise(1.2, { freq: 200, vol: 0.5 }); tone(55, 1.2, { vol: 0.3, type: 'sawtooth' }); },
  };

  /* --------------------------------------------------------------- music */
  const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  function freq(n) {
    const m = /^([A-G][#b]?)(\d)$/.exec(n);
    if (!m) return 0;
    const semis = NOTE[m[1]] + (parseInt(m[2], 10) + 1) * 12 - 69;
    return 440 * Math.pow(2, semis / 12);
  }
  const s = (str) => str.trim().split(/\s+/);
  const TRACKS = {
    title: {
      bpm: 84,
      lead: s('E5 - D5 - C5 - G4 - A4 - B4 - C5 - - - E5 - D5 - C5 - G4 - E4 - F4 - G4 - - -'),
      bass: s('C3 - - - A2 - - - F2 - - - G2 - - - C3 - - - A2 - - - F2 - - - G2 - - -'),
      leadType: 'triangle',
    },
    town: {
      bpm: 104,
      lead: s('E4 G4 C5 G4 A4 G4 E4 D4 C4 E4 G4 E4 D4 - - - F4 A4 C5 A4 G4 E4 C4 E4 D4 F4 E4 D4 C4 - - -'),
      bass: s('C3 - G2 - A2 - E2 - F2 - C3 - G2 - G2 - F2 - C3 - E2 - A2 - D2 - G2 - C3 - - -'),
      leadType: 'triangle',
    },
    dungeon: {
      bpm: 78,
      lead: s('A4 - - C5 - B4 - - E4 - - - G4 - F4 E4 A4 - - C5 - D5 - - E5 - D5 - C5 - B4 -'),
      bass: s('A2 - - - F2 - - - C3 - - - E2 - - - A2 - - - F2 - - - G2 - - - E2 - - -'),
      leadType: 'triangle',
    },
    battle: {
      bpm: 150,
      lead: s('D5 A4 D5 F5 E5 C5 A4 C5 D5 A4 F4 A4 G4 E4 C4 E4 D5 A4 D5 F5 G5 F5 E5 C5 D5 - A4 - D5 - - -'),
      bass: s('D3 D3 - D3 A2 A2 - A2 Bb2 Bb2 - Bb2 C3 C3 - C3 D3 D3 - D3 A2 A2 - A2 Bb2 Bb2 C3 C3 D3 - D3 -'),
      leadType: 'square',
    },
    boss: {
      bpm: 164,
      lead: s('E5 - D#5 E5 B4 - G4 - A4 - G4 A4 F#4 - D#4 - E5 - D#5 E5 B4 - C5 - D5 - C5 B4 A4 - B4 -'),
      bass: s('E2 E2 E3 E2 E2 E2 E3 E2 C2 C2 C3 C2 B1 B1 B2 B1 E2 E2 E3 E2 E2 E2 E3 E2 A1 A1 A2 A1 B1 B1 B2 B1'),
      leadType: 'square',
    },
    victory: {
      bpm: 110,
      lead: s('C5 E5 G5 C6 - G5 E5 G5 F5 A5 C6 F5 - E5 D5 - C5 E5 G5 C6 - B5 A5 B5 C6 - G5 - C6 - - -'),
      bass: s('C3 - C3 - A2 - A2 - F2 - F2 - G2 - G2 - C3 - C3 - E3 - E3 - F3 - G3 - C3 - - -'),
      leadType: 'triangle',
    },
  };

  let current = null, pendingTrack = null, step = 0, nextTime = 0, timer = null;
  function playTrack(name) {
    pendingTrack = name;
    if (!ctx) return;
    if (current === name) return;
    current = name;
    step = 0;
    nextTime = ctx.currentTime + 0.1;
    if (timer) clearInterval(timer);
    timer = setInterval(schedule, 50);
  }
  function schedule() {
    const tr = TRACKS[current];
    if (!tr || !ctx) return;
    const stepDur = 60 / tr.bpm / 2; // eighth notes
    while (nextTime < ctx.currentTime + 0.2) {
      const i = step % tr.lead.length;
      const ln = tr.lead[i];
      const bn = tr.bass[i % tr.bass.length];
      const offset = nextTime - ctx.currentTime;
      if (ln !== '-') {
        // hold a note through following rests
        let hold = 1;
        while (tr.lead[(i + hold) % tr.lead.length] === '-' && hold < 4) hold++;
        tone(freq(ln), stepDur * hold * 0.95, { type: tr.leadType, vol: 0.09, delay: offset, bus: musicGain });
      }
      if (bn !== '-') tone(freq(bn), stepDur * 0.9, { type: 'triangle', vol: 0.16, delay: offset, bus: musicGain });
      if (current === 'battle' || current === 'boss') {
        if (step % 4 === 0) noise(0.05, { freq: 300, vol: 0.12, delay: offset, bus: musicGain });
        if (step % 4 === 2) noise(0.03, { freq: 6000, filter: 'highpass', vol: 0.05, delay: offset, bus: musicGain });
      }
      nextTime += stepDur;
      step++;
    }
  }

  function saveSettings() {
    try { localStorage.setItem('lanternbound.sound', JSON.stringify(settings)); } catch (e) { /* ignore */ }
  }

  LB.audio = {
    init,
    sfx(name) {
      if (!ctx || !settings.sfx) return;
      try { SFX[name] && SFX[name](); } catch (e) { /* audio is decoration */ }
    },
    music(name) { playTrack(name); },
    settings,
    /* Cycles: everything on -> sfx only -> muted. */
    cycle() {
      if (settings.music && settings.sfx) settings.music = false;
      else if (settings.sfx) settings.sfx = false;
      else { settings.music = true; settings.sfx = true; }
      if (musicGain) musicGain.gain.value = settings.music ? 0.32 : 0;
      if (sfxGain) sfxGain.gain.value = settings.sfx ? 0.5 : 0;
      saveSettings();
      return this.label();
    },
    label() {
      return settings.music && settings.sfx ? 'Sound: On' : settings.sfx ? 'Sound: SFX' : 'Sound: Off';
    },
  };
})();
