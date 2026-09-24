/* Lanternbound — pixel art, pixel font and procedural backgrounds.
   Every sprite is a grid of characters; each character maps to a colour in
   the sprite's palette ('.' is transparent, 'k' is the shared outline). */
(function () {
  const LB = (window.LB = window.LB || {});
  const OUTLINE = '#1b1226';
  const SPR = {};

  function def(name, pal, rows) {
    SPR[name] = { pal: Object.assign({ k: OUTLINE }, pal), rows };
  }
  function alias(name, base, palOverride) {
    SPR[name] = { pal: Object.assign({}, SPR[base].pal, palOverride), rows: SPR[base].rows };
  }

  /* ---------------------------------------------------------------- heroes */
  def('warden', { m: '#c9d1d9', M: '#7d8793', s: '#f2c29b', e: OUTLINE, r: '#e0463a', b: '#3b6fd1', B: '#284a8f', w: '#6b4428', y: '#ffd35c', Y: '#fff3b0' }, [
    '.......rrr......',
    '......rrrr......',
    '.....kkkkkk.....',
    '....kmmmmmmk....',
    '...kmmmmmmmMk...',
    '...kmkkkkkkMk...',
    '...kmksesesMk...',
    '...kMksssskMk...',
    '....kkkkkkkk....',
    '...kBbbbbbbBk.k.',
    '..kmkbbbbbbkkyk.',
    '.kmmmkbyybkkYYk.',
    '.kmmmkbbbbk.kyk.',
    '..kmkBbkbbBk.k..',
    '....kwwkkwwk....',
    '....kkk..kkk....',
  ]);
  def('tinker', { c: '#8a5a32', C: '#5e3b1f', g: '#8fe3ff', G: '#b88a3a', s: '#f2c29b', h: '#3a2a1a', n: '#3f8f5a', N: '#2a6040', m: '#c9d1d9', M: '#7d8793', w: '#6b4428', y: '#ffd35c' }, [
    '................',
    '.....kkkkkk.....',
    '....kccccccck...',
    '...kccccccccCk..',
    '...kGGGkGGGCk...',
    '...kGgGkGgGhk...',
    '...kGGGsGGGhk...',
    '...ksssssssk....',
    '....kssmmssk....',
    '...kNnnnnnnNk...',
    '..kskynnnnnkmk..',
    '..kskNnnyynkMmk.',
    '...kkNnnnnNkmk..',
    '....knnkknnk.k..',
    '....kwwk.kwwk...',
    '....kkk...kkk...',
  ]);
  def('witch', { p: '#7b4bc4', P: '#4e2d86', y: '#ffd35c', h: '#e8743b', s: '#f2c29b', e: OUTLINE, w: '#8a5a32', Y: '#9fffb0', G: '#3fdc6a' }, [
    '.......kk.......',
    '......kpPk....Y.',
    '.....kpppk...YGY',
    '.....kppPPk...Y.',
    '....kpppppPk..w.',
    '..kkyyyyyyyykkw.',
    '.kPPPPPPPPPPPkw.',
    '...khsssssshk.w.',
    '...khsesesshk.w.',
    '...khhssssshhkw.',
    '....kkPpppPkk.w.',
    '...kPppyyppPPkw.',
    '..kPpppppppppPw.',
    '..kPpppppppppPw.',
    '...kkkkkkkkkkkw.',
    '..............w.',
  ]);

  /* --------------------------------------------------------------- enemies */
  def('soot', { d: '#2a2433', D: '#4a4060', w: '#ffffff', o: '#ff9d3b', y: '#ffe08a' }, [
    '................',
    '.......k........',
    '....k..k..k.....',
    '...k.kkkkkk.k...',
    '....kdddDddk....',
    '...kdDddddddk...',
    '..kddwwddwwddk..',
    '..kddwkddwkddk..',
    '..kdddddddddDk..',
    '..kDdddkkdddDk..',
    '...kddddddddk...',
    '...kDddoyodDk...',
    '....kkdooodk....',
    '...k..kkkkk..k..',
    '................',
    '................',
  ]);
  def('sulkcap', { r: '#d8443a', R: '#9a2a24', w: '#f6efe0', c: '#f0dcc0', C: '#c9b08e' }, [
    '................',
    '.....kkkkkk.....',
    '...kkrrwwrrkk...',
    '..krrrrwwrrrrk..',
    '.krwwrrrrrrwwrk.',
    '.krwwrrrrrrwwrk.',
    '.kRrrrrwwrrrrRk.',
    '..kkkkkkkkkkkk..',
    '....kccccccCk...',
    '....kkkcckkCk...',
    '....kckccckCk...',
    '....kcckkccCk...',
    '....kccccccCk...',
    '...kcccccccCCk..',
    '...kkkkkkkkkkk..',
    '................',
  ]);
  def('moth', { t: '#c9a86a', T: '#8a7048', f: '#efe4c8', m: '#1b1226', w: '#ffffff', b: '#6b4428' }, [
    '................',
    '..kk........kk..',
    '.kttk......kttk.',
    '.kTttk.kk.kttTk.',
    '.kTtttkffkttttk.',
    '..kTttkffkttTk..',
    '..kkttmmmmttkk..',
    '.kttkmwmmwmkttk.',
    '.kTttkffffkttTk.',
    '.kTttkbbbbkttTk.',
    '..kTtkbbbbktTk..',
    '...kkkbbbbkkk...',
    '.....kbbbbk.....',
    '......kbbk......',
    '.......kk.......',
    '................',
  ]);
  def('mimic', { c: '#f4ecd0', C: '#cfc3a0', o: '#ffb03b', y: '#fff0a0', r: '#8a1f2a', w: '#ffffff', e: '#ff3b3b' }, [
    '.......yk.......',
    '......kyyk......',
    '......koyk......',
    '.....kooyk......',
    '......kook......',
    '.......kk.......',
    '....kkkkkkkk....',
    '...kcccccccCk...',
    '...kcekccekCk...',
    '...kcccccccCk...',
    '...krwrwrwrwk...',
    '...krrrrrrrrk...',
    '...kwrwrwrwrk...',
    '...kcccccccCk...',
    '..kccCkcccCCCk..',
    '..kkkkkkkkkkkk..',
  ]);
  def('wisp', { g: '#7dff9a', G: '#2fbf5a', y: '#e9ffe0' }, [
    '.......k........',
    '......kgk.......',
    '.....kgGk...k...',
    '.....kgGGk.kgk..',
    '....kgGGGGkkGk..',
    '...kgGGyGGGGGk..',
    '...kGGyyyGGGGk..',
    '..kGGyyyyyGGGGk.',
    '..kGyykyykyGGGk.',
    '..kGyykyykyyGGk.',
    '..kGyyyyyyyyGGk.',
    '..kGGyykkyyyGGk.',
    '...kGGyyyyyGGk..',
    '....kGGGGGGGk...',
    '.....kkkkkkk....',
    '................',
  ]);
  def('goblin', { g: '#7fb34a', G: '#557a2f', w: '#cfefff', b: '#4a4a6a', B: '#33334a', l: '#c9a86a', r: '#d8443a' }, [
    '................',
    '................',
    '..k..kkkkkk..k..',
    '.kgkkggggggkkgk.',
    '.kggkggggggkggk.',
    '..kkgkkkgkkkgk..',
    '...kgkwkgkwkgk..',
    '...kggkkgkkggk..',
    '....kgggGgggk...',
    '....kgkkkkgk....',
    '...kbbbrrbbbk...',
    '..kbbbbrbbkllk..',
    '..kgkbbrbbkllk..',
    '...kkbbbbbkkk...',
    '....kbbkbbk.....',
    '....kkk.kkk.....',
  ]);
  def('chorister', { w: '#e8e4d8', W: '#b8b2a0', r: '#8a1f3a', R: '#5a1026', y: '#ffd35c' }, [
    '.............y..',
    '.....kkkkk...yy.',
    '....kwwwwwk..y..',
    '...kwwwwwwwk.y..',
    '...kwkkwkkWkyy..',
    '...kwkkwkkWk....',
    '...kwwwkwwWk....',
    '....kwkkkWk.....',
    '....kWkkkWk.....',
    '...kkkwwwkkk....',
    '..kRrrrrrrrRk...',
    '..kRrrwrrrrRk...',
    '..kRrrrrrrrRk...',
    '..kRrrrrrrrRk...',
    '..kRRrrrrrRRk...',
    '..kkkkkkkkkkk...',
  ]);
  def('deacon', { b: '#2f5e7a', B: '#1c3c52', g: '#3f8f5a', d: '#0a0a14', y: '#9fe8ff' }, [
    '.......kk.......',
    '......kbbk......',
    '.....kbbbBk.....',
    '....kbbbbbBk....',
    '....kbkdddkBk...',
    '...kbkdydydkBk..',
    '...kbkddddkBBk..',
    '...kbbkkkkbBBk..',
    '..kbbgbbbbbgBBk.',
    '..kbgbbbbbbbgBk.',
    '..kbbbbgbbbbbBk.',
    '..kbgbbbbbgbbBk.',
    '.kbbbbbbbbbbbBBk',
    '.kbgbbgbbbgbbbBk',
    '.kkkkkkkkkkkkkkk',
    '................',
  ]);
  def('king', { y: '#ffd35c', Y: '#b8862a', o: '#ff9d3b', d: '#120a14', r: '#ff4a3a', w: '#e8e4d8', p: '#4a1440', P: '#260a22', a: '#8a7a8a' }, [
    '........................',
    '....o....o....o....o....',
    '....y...kyk..kyk...y....',
    '...kyk..kyk..kyk..kyk...',
    '...kYyk.kyk..kyk.kyYk...',
    '...kYyykyyykkyyykyyYk...',
    '...kYyyyyyyyyyyyyyyYk...',
    '...kYYYYYYYYYYYYYYYYk...',
    '...kkkkkkkkkkkkkkkkkk...',
    '....kddddddddddddddk....',
    '....kddrrddddddrrddk....',
    '....kdddrrddddrrdddk....',
    '....kddddddddddddddk....',
    '....kdddkkkkkkkkdddk....',
    '.....kddwkwkwkwkddk.....',
    '...kkpkddddddddddkpkk...',
    '..kpppkkkkkkkkkkkkpppk..',
    '.kpppppppppppppppppppPk.',
    '.kPpppppyppppyppppppPPk.',
    '.kPppppppppppppppppPPPk.',
    '.kPPppppppyypppppppPPPk.',
    '.kPPpppppppppppppppPPPk.',
    '..kPPppppppppppppppPPk..',
    '...kkkkkkkkkkkkkkkkkk...',
  ]);

  /* ------------------------------------------------------------------ NPCs */
  def('marrow', { h: '#d8d8e0', H: '#a8a8b8', s: '#f2c29b', c: '#f28b8b', w: '#f6efe0', r: '#b8453a' }, [
    '.......kkk......',
    '......khhhk.....',
    '....kkkhhhkkk...',
    '...khhhhhhhhhk..',
    '...khhsssssshk..',
    '...kssksssksk...',
    '...kcssssssck...',
    '....ksskkkssk...',
    '.....kkssskk....',
    '...krrkkkkkrrk..',
    '..krrrwwwwwrrrk.',
    '..ksrrwwwwwrrsk.',
    '..kkrrwwwwwrrkk.',
    '...krrwwwwwrrk..',
    '...krrrrrrrrrk..',
    '....kkkkkkkkk...',
  ]);
  def('barnaby', { g: '#5fb34a', G: '#3f7f2f', l: '#d8e89a', h: '#2a2a3a', r: '#d8443a', w: '#ffffff', v: '#b8453a' }, [
    '.....kkkkkk.....',
    '.....khhhhk.....',
    '.....khhhhk.....',
    '.....krrrrk.....',
    '...kkkkkkkkkk...',
    '..kwwkkggkkwwk..',
    '.kgwkwggggwkwgk.',
    '.kggggggggggggk.',
    '.kgGkkkkkkkkGgk.',
    '..kggggggggggk..',
    '...kkvvllvvkk...',
    '..kgkvvllvvkgk..',
    '..kgkvvllvvkgk..',
    '...kkvvvvvvkk...',
    '...kggk..kggk...',
    '...kkkk..kkkk...',
  ]);
  def('elder', { y: '#ffd35c', c: '#f4ecd0', b: '#5a4a8a', B: '#3a2e5e', s: '#f2c29b', w: '#f6f6f6', W: '#c8c8d0' }, [
    '......y.........',
    '.....kyk........',
    '.....kck........',
    '....kkcckk......',
    '...kbbbbbbk.....',
    '..kbbbbbbbbk....',
    '..kkkkkkkkkk....',
    '...ksksssksk....',
    '...kssssssssk...',
    '...kwwssswwwk...',
    '..kwwwwwwwwwwk..',
    '..kbwwwwwwwwbk..',
    '..kbbwwwwwwbbk..',
    '..kbbbwwwwbbbk..',
    '..kBbbbwwbbbBk..',
    '...kkkkkkkkkk...',
  ]);
  def('pim', { d: '#2a2433', D: '#433a52', y: '#ffd35c', p: '#f28bb0' }, [
    '................',
    '................',
    '...k......k.....',
    '..kdk....kdk....',
    '..kddkkkkddk....',
    '..kdddddddddk...',
    '..kdykdddykdk...',
    '..kdddddpdddk...',
    '...kddddddk.....',
    '...kdddddddk....',
    '..kddddddddk..k.',
    '..kdDddddDddk.kk',
    '..kdDddddDdddkdk',
    '..kddkddkddddkk.',
    '...kkkkkkkkkk...',
    '................',
  ]);
  def('ghost', { w: '#e8f0ff', W: '#a8b8d8', c: '#f2a0b8' }, [
    '................',
    '.....kkkkkk.....',
    '....kwwwwwwk....',
    '...kwwwwwwwwk...',
    '...kwwkwwkwwk...',
    '...kwwkwwkwwk...',
    '...kcwwwwwwck...',
    '...kwwwkkwwwk...',
    '...kwwwkkwwwWk..',
    '...kwwwwwwwwWk..',
    '...kwwwwwwwWWk..',
    '...kwwwwwwwWWk..',
    '...kWwwwwwWWWk..',
    '...kWWwkWwkWWk..',
    '...kkkk.kk.kkk..',
    '................',
  ]);
  alias('reginald', 'warden', { m: '#e8c35a', M: '#a8842a', r: '#3bd16f', b: '#b8453a', B: '#7a2a24' });
  alias('spore', 'sulkcap', { r: '#4a8ad8', R: '#2a5a9a', w: '#cfefff' });
  alias('sal', 'deacon', { b: '#6a4a3a', B: '#4a3226', g: '#b8862a', y: '#ffd35c' });
  alias('lanternmoth', 'moth', { t: '#ffe08a', T: '#e8a83a', f: '#fff8d8', m: '#6b4428', b: '#b8862a' });
  alias('fumbleshroom', 'sulkcap', { r: '#9a6ad8', R: '#6a3aa8' });

  /* ------------------------------------------------------------ props/icons */
  def('chest', { b: '#a8683a', B: '#6b4428', y: '#ffd35c' }, [
    '................',
    '................',
    '................',
    '................',
    '...kkkkkkkkkk...',
    '..kbbbbbbbbbbk..',
    '..kbBBBBBBBBbk..',
    '..kkkkkykkkkkk..',
    '..kbbbbyybbbbk..',
    '..kbbbbbbbbbbk..',
    '..kbBBBBBBBBbk..',
    '..kkkkkkkkkkkk..',
  ]);
  def('i_sword', { m: '#dfe6ee', y: '#ffd35c', w: '#8a5a32' }, [
    '..........kk',
    '.........kmk',
    '........kmk.',
    '.......kmk..',
    '......kmk...',
    '..k..kmk....',
    '..kkkmk.....',
    '...kyk......',
    '..kykkk.....',
    '.kwk..k.....',
    'kwk.........',
    'kk..........',
  ]);
  def('i_staff', { w: '#8a5a32', g: '#9fffb0', G: '#3fdc6a' }, [
    '.........kk.',
    '........kgGk',
    '........kGgk',
    '.......kwkk.',
    '......kwk...',
    '.....kwk....',
    '....kwk.....',
    '...kwk......',
    '..kwk.......',
    '.kwk........',
    'kwk.........',
    'kk..........',
  ]);
  def('i_armor', { b: '#7d8fb3', B: '#4a5a7a', y: '#ffd35c' }, [
    '............',
    '..kk....kk..',
    '.kbbk..kbbk.',
    '.kbbbkkbbbk.',
    '..kbbbbbbk..',
    '..kbbyybbk..',
    '..kbbbbbbk..',
    '..kbBbbBbk..',
    '..kbbbbbbk..',
    '..kkkkkkkk..',
    '............',
    '............',
  ]);
  def('i_trinket', { y: '#ffd35c', g: '#7dd8ff', G: '#3a8ad8' }, [
    '............',
    '...kkkkkk...',
    '..ky....yk..',
    '..ky....yk..',
    '...ky..yk...',
    '....kyyk....',
    '.....kk.....',
    '....kggk....',
    '...kgGGgk...',
    '...kgGGgk...',
    '....kggk....',
    '.....kk.....',
  ]);
  def('i_potion', { p: '#cfe8ff', r: '#ffb03b', R: '#d87a1a', w: '#c9a86a' }, [
    '....kkkk....',
    '....kwwk....',
    '.....kk.....',
    '....kppk....',
    '...kppppk...',
    '..kpprpppk..',
    '..kprrrrpk..',
    '..kprrrrRk..',
    '..kprrrRRk..',
    '...krRRRk...',
    '....kkkk....',
    '............',
  ]);
  alias('i_ether', 'i_potion', { r: '#6ab8ff', R: '#3a6ad8' });
  alias('i_bigpotion', 'i_potion', { r: '#ff6a5a', R: '#c83a3a' });
  alias('i_oil', 'i_potion', { r: '#6b5a2a', R: '#3a3018', p: '#e8d8a0' });
  def('i_bomb', { d: '#3a3450', D: '#22203a', w: '#8a84a8', y: '#c9a86a', o: '#ffb03b' }, [
    '.......k.o..',
    '......k.o.o.',
    '.....kk..o..',
    '....kyyk....',
    '...kkkkkk...',
    '..kdddddDk..',
    '..kdwddddk..',
    '..kddddddk..',
    '..kddddddk..',
    '..kDddddDk..',
    '...kkkkkk...',
    '............',
  ]);
  alias('i_smoke', 'i_bomb', { d: '#b8b8c8', D: '#8a8aa0', w: '#ffffff', o: '#d8d8e8' });
  def('i_soup', { w: '#d8d8e8', s: '#d8a04a', g: '#6fdc8c', b: '#b8453a', B: '#7a2a24' }, [
    '....w...w...',
    '.....w...w..',
    '....w...w...',
    '............',
    'kkkkkkkkkkkk',
    'kssgsssgsssk',
    '.kbbbbbbbbk.',
    '.kbBbbbbbBk.',
    '..kbbbbbbk..',
    '...kkkkkk...',
    '............',
    '............',
  ]);
  def('i_feather', { f: '#ffd0a0', F: '#ff8a3a' }, [
    '..........kk',
    '........kkfk',
    '.......kffk.',
    '......kffk..',
    '.....kfFfk..',
    '....kfFfk...',
    '...kfFfk....',
    '...kFfk.....',
    '..kffk......',
    '..kkk.......',
    '.kk.........',
    'k...........',
  ]);
  def('i_coin', { y: '#ffd35c', Y: '#b8862a' }, [
    '............',
    '....kkkk....',
    '...kyyyyk...',
    '..kyYyyyYk..',
    '..kyYyyyyk..',
    '..kyYyyyyk..',
    '..kyYyyyyk..',
    '..kyyyyyYk..',
    '...kyyyyk...',
    '....kkkk....',
    '............',
    '............',
  ]);
  def('i_flame', { o: '#ff9d3b', y: '#ffe08a', w: '#fff8e0' }, [
    '.....k......',
    '....kok.....',
    '....kok.k...',
    '...koyokok..',
    '..koyyooyok.',
    '..koywyyyok.',
    '.koywwwyyok.',
    '.koywwwwyok.',
    '.koyywwyyok.',
    '..kooyyyok..',
    '...kkkkkk...',
    '............',
  ]);
  def('i_heart', { r: '#ff5a6a', R: '#b82a3a', w: '#ffc8d0' }, [
    '............',
    '.kkk...kkk..',
    'krwrk.krrrk.',
    'krrrrkrrrRk.',
    'krrrrrrrrRk.',
    '.krrrrrrRk..',
    '..krrrrRk...',
    '...krrRk....',
    '....kRk.....',
    '.....k......',
    '............',
    '............',
  ]);
  def('i_bag', { b: '#a8683a', B: '#6b4428', y: '#ffd35c' }, [
    '....kkkk....',
    '...kbkkbk...',
    '....kbbk....',
    '...kkkkkk...',
    '..kbbbbbbk..',
    '.kbbbyybbbk.',
    '.kbbbyybbBk.',
    '.kbbbbbbbBk.',
    '.kbbbbbbBBk.',
    '..kBBBBBBk..',
    '...kkkkkk...',
    '............',
  ]);
  def('i_scroll', { p: '#f4ecd0', P: '#cfc3a0', r: '#b8453a' }, [
    '............',
    '.kkkkkkkkk..',
    'kpPpppppppk.',
    '.kkpppppppk.',
    '..kpkkkkpk..',
    '..kpppppPk..',
    '..kpkkkkpk..',
    '..kpppppPk..',
    '..kppprrpkk.',
    '..kpppprrPpk',
    '...kkkkkkkk.',
    '............',
  ]);
  def('i_disk', { b: '#5a7ad8', B: '#3a4a9a', w: '#e8e8f0', m: '#8a8aa0' }, [
    '............',
    '.kkkkkkkkkk.',
    '.kbbwwwwbbk.',
    '.kbbwwwmbbk.',
    '.kbbwwwmbbk.',
    '.kbbbbbbbbk.',
    '.kbbbbbbbbk.',
    '.kbBBBBBBbk.',
    '.kbBmmmmBbk.',
    '.kbBmmmmBbk.',
    '.kkkkkkkkkk.',
    '............',
  ]);
  def('i_note', { y: '#ffd35c' }, [
    '............',
    '.....kkkkk..',
    '.....kyyyyk.',
    '.....kykkyk.',
    '.....kyk.yk.',
    '.....kyk.yk.',
    '.....kyk.yk.',
    '...kkkyk.yk.',
    '..kyyyyk.yk.',
    '..kyyyk.kyk.',
    '...kkk.kyyk.',
    '........kk..',
  ]);
  def('i_door', { b: '#6b4428', B: '#4a2e1a', y: '#ffd35c', s: '#8a8aa0' }, [
    '...kkkkkk...',
    '..kbbbbbbk..',
    '.kbBbbbbBbk.',
    '.kbBbbbbBbk.',
    '.kbBbbbbBbk.',
    '.kbbbbbbbbk.',
    '.kbBbbbyyBk.',
    '.kbBbbbbBbk.',
    '.kbBbbbbBbk.',
    '.kbbbbbbbbk.',
    'kssssssssssk',
    'kkkkkkkkkkkk',
  ]);

  /* --------------------------------------------------------------- renderer */
  const canvasCache = new Map();
  const urlCache = new Map();

  function spriteCanvas(name, flip) {
    const key = name + (flip ? '|f' : '');
    if (canvasCache.has(key)) return canvasCache.get(key);
    const s = SPR[name];
    if (!s) throw new Error('Unknown sprite: ' + name);
    const h = s.rows.length;
    const w = Math.max(...s.rows.map((r) => r.length));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    s.rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const col = s.pal[row[x]];
        if (!col) continue;
        g.fillStyle = col;
        g.fillRect(flip ? w - 1 - x : x, y, 1, 1);
      }
    });
    canvasCache.set(key, c);
    return c;
  }

  LB.hasSprite = (name) => !!SPR[name];
  LB.spriteSize = (name) => {
    const s = SPR[name];
    return { w: Math.max(...s.rows.map((r) => r.length)), h: s.rows.length };
  };
  LB.spriteURL = function (name, flip) {
    const key = name + (flip ? '|f' : '');
    if (!urlCache.has(key)) urlCache.set(key, spriteCanvas(name, flip).toDataURL());
    return urlCache.get(key);
  };
  /* An <img> scaled with crisp pixels. */
  LB.spriteImg = function (name, scale = 4, opts = {}) {
    const img = new Image();
    const { w, h } = LB.spriteSize(name);
    img.src = LB.spriteURL(name, opts.flip);
    img.width = w * scale;
    img.height = h * scale;
    img.className = 'px ' + (opts.cls || '');
    img.alt = opts.alt || '';
    img.draggable = false;
    return img;
  };
  LB._sprites = SPR;

  /* ------------------------------------------------------------ pixel font */
  const G = {
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
    D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
    H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
    J: ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..'],
    K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
    L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
    N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
    R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
    W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
    X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
    Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
    0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
    1: ['.#.', '##.', '.#.', '.#.', '.#.', '.#.', '###'],
    2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
    3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
    4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
    5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
    6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
    7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
    9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
    '!': ['#', '#', '#', '#', '#', '.', '#'],
    '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
    '.': ['.', '.', '.', '.', '.', '.', '#'],
    ',': ['..', '..', '..', '..', '..', '.#', '#.'],
    "'": ['#', '#', '.', '.', '.', '.', '.'],
    '-': ['....', '....', '....', '####', '....', '....', '....'],
    '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
    ':': ['.', '#', '.', '.', '.', '#', '.'],
    '/': ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....'],
    '&': ['.##..', '#..#.', '#.#..', '.#...', '#.#.#', '#..#.', '.##.#'],
    ' ': ['...', '...', '...', '...', '...', '...', '...'],
  };
  LB.pixelText = function (text, opts = {}) {
    const color = opts.color || '#fff';
    const shadow = opts.shadow === undefined ? '#1b1226' : opts.shadow;
    const scale = opts.scale || 3;
    const chars = String(text).toUpperCase().split('').map((ch) => G[ch] || G['?']);
    const width = chars.reduce((a, g) => a + g[0].length + 1, 0) + 1;
    const height = 9;
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const g = c.getContext('2d');
    const paint = (dx, dy, col) => {
      let x = 0;
      g.fillStyle = col;
      for (const gl of chars) {
        for (let y = 0; y < 7; y++)
          for (let i = 0; i < gl[y].length; i++) if (gl[y][i] === '#') g.fillRect(x + i + dx, y + dy, 1, 1);
        x += gl[0].length + 1;
      }
    };
    if (shadow) {
      paint(1, 1, shadow);
      paint(0, 1, shadow);
      paint(1, 0, shadow);
    }
    paint(0, 0, color);
    c.style.width = width * scale + 'px';
    c.style.height = height * scale + 'px';
    c.className = 'px pixel-text ' + (opts.cls || '');
    c.setAttribute('aria-label', text);
    return c;
  };

  /* ---------------------------------------------------- procedural scenery */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const AREAS = {
    moss: { top: '#0b1512', bot: '#1d3a2c', rock: '#243f33', rock2: '#11231b', floor: '#1a2e24', floor2: '#2a4a38', glow: '#6fdc8c', particle: '#9fffb0' },
    grotto: { top: '#120a1c', bot: '#34193f', rock: '#3a2448', rock2: '#1c1026', floor: '#281834', floor2: '#44285a', glow: '#e05ae8', particle: '#ffa8ff' },
    chapel: { top: '#08101c', bot: '#1a3050', rock: '#26405e', rock2: '#101c2e', floor: '#16283e', floor2: '#2a4a6a', glow: '#8fd8ff', particle: '#c8f0ff' },
    throne: { top: '#0e0406', bot: '#3a0e14', rock: '#4a1a1e', rock2: '#1e080a', floor: '#2a0c10', floor2: '#4a181c', glow: '#ff5a3a', particle: '#ffb08a' },
  };
  LB.AREA_COLORS = AREAS;

  function glow(g, x, y, r, col, alpha) {
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, hexA(col, alpha));
    grd.addColorStop(1, hexA(col, 0));
    g.fillStyle = grd;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  /* Draws a 240x135 backdrop into the canvas. */
  LB.drawBackground = function (canvas, area, seed, opts = {}) {
    const W = 240, H = 135;
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');
    g.imageSmoothingEnabled = false;
    const r = rng(seed || 1);
    if (area === 'town') return drawTown(g, W, H, r, opts);
    const A = AREAS[area] || AREAS.moss;

    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, A.top);
    sky.addColorStop(1, A.bot);
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);

    // rock texture
    for (let i = 0; i < 260; i++) {
      g.fillStyle = r() < 0.5 ? A.rock : A.rock2;
      const w = 2 + Math.floor(r() * 7);
      g.fillRect(Math.floor(r() * W), Math.floor(r() * H * 0.8), w, 1 + Math.floor(r() * 3));
    }

    if (area === 'chapel') {
      // arched windows and pillars
      for (let x = 20; x < W; x += 60) {
        g.fillStyle = A.rock2;
        g.fillRect(x, 20, 22, 70);
        g.beginPath();
        g.arc(x + 11, 20, 11, Math.PI, 0);
        g.fill();
        g.fillStyle = hexA('#8fd8ff', 0.18);
        g.fillRect(x + 4, 22, 14, 60);
        g.beginPath();
        g.arc(x + 11, 22, 7, Math.PI, 0);
        g.fill();
        g.fillStyle = A.rock;
        g.fillRect(x + 30, 10, 8, 90);
      }
    }
    if (area === 'throne') {
      // hanging chains and a distant throne silhouette
      for (let i = 0; i < 6; i++) {
        const x = 15 + i * 42 + Math.floor(r() * 10);
        const len = 20 + Math.floor(r() * 40);
        for (let y = 0; y < len; y += 3) {
          g.fillStyle = '#2a1014';
          g.fillRect(x, y, 2, 2);
        }
      }
      g.fillStyle = '#12050a';
      g.fillRect(104, 40, 32, 55);
      g.fillRect(96, 70, 48, 25);
      for (let i = 0; i < 5; i++) g.fillRect(104 + i * 7, 32, 3, 10);
    }

    // stalactites
    for (let x = 0; x < W; x += 6 + Math.floor(r() * 10)) {
      const len = 6 + Math.floor(r() * 22);
      const w = 3 + Math.floor(r() * 5);
      g.fillStyle = A.rock2;
      for (let y = 0; y < len; y++) {
        const ww = Math.max(1, Math.round(w * (1 - y / len)));
        g.fillRect(x + Math.floor((w - ww) / 2), y, ww, 1);
      }
    }

    // floor
    const fy = Math.floor(H * 0.72);
    g.fillStyle = A.floor;
    g.fillRect(0, fy, W, H - fy);
    g.fillStyle = A.floor2;
    for (let x = 0; x < W; x += 1) if (r() < 0.5) g.fillRect(x, fy, 1, 1 + Math.floor(r() * 2));
    for (let i = 0; i < 90; i++) {
      g.fillStyle = r() < 0.5 ? A.floor2 : A.rock2;
      g.fillRect(Math.floor(r() * W), fy + 3 + Math.floor(r() * (H - fy)), 2 + Math.floor(r() * 5), 1);
    }
    if (area === 'chapel') {
      g.fillStyle = hexA('#2a6aa8', 0.45);
      g.fillRect(0, fy + 14, W, H - fy - 14);
      g.fillStyle = hexA('#bfe8ff', 0.35);
      for (let i = 0; i < 40; i++) g.fillRect(Math.floor(r() * W), fy + 15 + Math.floor(r() * 20), 3 + Math.floor(r() * 5), 1);
    }

    // decorations + glows
    for (let i = 0; i < 9; i++) {
      const x = Math.floor(r() * W);
      const y = fy - 1 + Math.floor(r() * 6);
      if (area === 'moss') {
        g.fillStyle = A.glow;
        for (let j = 0; j < 6; j++) g.fillRect(x + j - 3, y - Math.floor(r() * 4), 1, 2 + Math.floor(r() * 3));
        glow(g, x, y, 14, A.glow, 0.18);
      } else if (area === 'grotto') {
        const cap = r() < 0.5 ? '#e05ae8' : '#4ad8d1';
        g.fillStyle = '#e8d8c8';
        g.fillRect(x, y - 5, 2, 6);
        g.fillStyle = cap;
        g.fillRect(x - 2, y - 7, 6, 2);
        g.fillRect(x - 1, y - 8, 4, 1);
        glow(g, x + 1, y - 6, 16, cap, 0.25);
      } else if (area === 'chapel') {
        g.fillStyle = '#f4ecd0';
        g.fillRect(x, y - 5, 2, 5);
        g.fillStyle = '#ffd35c';
        g.fillRect(x, y - 7, 2, 2);
        glow(g, x + 1, y - 7, 14, '#ffd35c', 0.22);
      } else if (area === 'throne') {
        g.fillStyle = '#ff5a3a';
        g.fillRect(x, y, 5 + Math.floor(r() * 8), 1);
        glow(g, x + 3, y, 12, '#ff5a3a', 0.22);
      }
    }
  };

  function drawTown(g, W, H, r, opts) {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0b0a22');
    sky.addColorStop(0.6, '#2a1d4d');
    sky.addColorStop(1, '#4a2d5a');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = r() < 0.2 ? '#fff3b0' : '#c8c8f0';
      g.fillRect(Math.floor(r() * W), Math.floor(r() * 70), 1, 1);
    }
    // moon
    g.fillStyle = '#f4ecd0';
    g.beginPath();
    g.arc(204, 22, 9, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#d8ccb0';
    g.fillRect(200, 19, 3, 2);
    g.fillRect(207, 25, 2, 2);
    glow(g, 204, 22, 30, '#f4ecd0', 0.12);
    // hills
    g.fillStyle = '#1d1638';
    g.beginPath();
    g.moveTo(0, 90);
    for (let x = 0; x <= W; x += 4) g.lineTo(x, 78 + Math.sin(x / 23) * 6 + Math.sin(x / 7) * 2);
    g.lineTo(W, H);
    g.lineTo(0, H);
    g.fill();

    // Great Lantern tower
    const lit = !!opts.lit;
    g.fillStyle = '#18122a';
    g.fillRect(112, 38, 16, 62);
    g.fillRect(108, 34, 24, 6);
    g.fillRect(114, 22, 12, 12);
    g.fillRect(110, 18, 20, 4);
    g.fillRect(118, 12, 4, 6);
    g.fillStyle = lit ? '#ffe08a' : '#2a2240';
    g.fillRect(116, 24, 8, 8);
    if (lit) {
      glow(g, 120, 28, 70, '#ffd35c', 0.35);
      glow(g, 120, 28, 20, '#fff3b0', 0.6);
    }

    // houses
    const houses = [
      [8, 36, 30], [46, 28, 22], [140, 26, 24], [176, 34, 28], [214, 26, 20],
    ];
    for (const [x, w, h] of houses) {
      const base = 104;
      g.fillStyle = '#241a33';
      g.fillRect(x, base - h, w, h);
      g.beginPath();
      g.moveTo(x - 3, base - h);
      g.lineTo(x + w / 2, base - h - 14);
      g.lineTo(x + w + 3, base - h);
      g.fill();
      for (let wy = base - h + 5; wy < base - 6; wy += 9)
        for (let wx = x + 4; wx < x + w - 5; wx += 9) {
          const on = r() < 0.55;
          g.fillStyle = on ? '#ffcf6b' : '#140e20';
          g.fillRect(wx, wy, 4, 4);
          if (on) glow(g, wx + 2, wy + 2, 8, '#ffcf6b', 0.2);
        }
    }
    // ground
    g.fillStyle = '#2a2236';
    g.fillRect(0, 104, W, H - 104);
    for (let i = 0; i < 120; i++) {
      g.fillStyle = r() < 0.5 ? '#3a3048' : '#1e1828';
      g.fillRect(Math.floor(r() * W), 105 + Math.floor(r() * 30), 3 + Math.floor(r() * 3), 1);
    }
    // cave mouth to the Hollow
    g.fillStyle = '#07040c';
    g.beginPath();
    g.ellipse(232, 108, 16, 22, 0, Math.PI, 0);
    g.fill();
    g.fillStyle = '#3a3048';
    g.fillRect(214, 104, 3, 4);
    // lamp posts
    for (const x of [40, 100, 150, 200]) {
      g.fillStyle = '#18122a';
      g.fillRect(x, 88, 1, 16);
      g.fillStyle = '#ffcf6b';
      g.fillRect(x - 1, 86, 3, 2);
      glow(g, x, 87, 10, '#ffcf6b', 0.35);
    }
  }
})();
