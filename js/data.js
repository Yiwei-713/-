/* Lanternbound — game data: classes, skills, enemies, items and loot tables. */
(function () {
  const LB = (window.LB = window.LB || {});

  LB.STAT_NAMES = { hp: 'Max HP', mp: 'Max MP', str: 'STR', def: 'DEF', wit: 'WIT', agi: 'AGI', luck: 'LUCK', gold: 'Gold Find' };
  LB.STAT_SHORT = { hp: 'HP', mp: 'MP', str: 'STR', def: 'DEF', wit: 'WIT', agi: 'AGI', luck: 'LCK', gold: 'GOLD%' };
  LB.STAT_HELP = {
    str: 'Physical damage.',
    def: 'Reduces damage taken.',
    wit: 'Spell power and healing.',
    agi: 'Dodge, accuracy and escaping.',
    luck: 'Critical hits and better loot.',
    gold: 'Extra gold from every source.',
  };

  /* ---------------------------------------------------------------- classes */
  LB.CLASSES = {
    warden: {
      name: 'Warden',
      sprite: 'warden',
      tagline: 'Guard the light. Hit things with the shield.',
      desc: 'Sturdy and stubborn. Lots of HP, lots of DEF, and a shield that doubles as an argument.',
      base: { hp: 62, mp: 12, str: 8, def: 6, wit: 3, agi: 4, luck: 3 },
      growth: { hp: 10, mp: 2, str: 2, def: 1.8, wit: 0.5, agi: 0.8, luck: 0.5 },
      skills: ['bash', 'breakfast', 'bulwark', 'slam'],
    },
    tinker: {
      name: 'Tinker',
      sprite: 'tinker',
      tagline: "If it isn't broken, you haven't tried.",
      desc: 'Quick hands, quicker exits. High AGI and LUCK, crits often, and has gadgets of questionable legality.',
      base: { hp: 48, mp: 14, str: 7, def: 4, wit: 5, agi: 8, luck: 7 },
      growth: { hp: 7.5, mp: 3, str: 1.7, def: 1.1, wit: 1, agi: 1.6, luck: 1.4 },
      skills: ['sparkbomb', 'sticky', 'contraption', 'overclock'],
    },
    witch: {
      name: 'Hedge-Witch',
      sprite: 'witch',
      tagline: 'Tea, toads, and terrible power.',
      desc: 'Fragile, clever, and dangerous. Burns enemies with WIT and occasionally turns them into toads.',
      base: { hp: 42, mp: 22, str: 4, def: 3, wit: 10, agi: 5, luck: 5 },
      growth: { hp: 6.5, mp: 3.5, str: 0.5, def: 1, wit: 2.1, agi: 1, luck: 1 },
      skills: ['bolt', 'mend', 'toadify', 'wildfire'],
    },
  };

  /* Skills unlock at these levels (index matches class skill list). */
  LB.SKILL_LEVELS = [1, 3, 6, 9];
  LB.SKILLS = {
    bash: { name: 'Shield Bash', mp: 4, desc: '1.3× damage with a 40% chance to stun.' },
    breakfast: { name: 'Second Breakfast', mp: 6, desc: 'Heal 40% HP and cure poison. You packed a lunch. And a second lunch.' },
    bulwark: { name: 'Bulwark', mp: 8, desc: 'For 3 turns, take half damage and reflect 50% of it back.' },
    slam: { name: 'Lantern Slam', mp: 14, desc: '2.6× damage. The lantern is fine. Probably.' },
    sparkbomb: { name: 'Spark Bomb', mp: 5, desc: 'Explosive damage that ignores DEF. Scales with level and WIT.' },
    sticky: { name: 'Sticky Fingers', mp: 3, desc: 'Attack and pickpocket some gold. Sometimes an item, too.' },
    contraption: { name: 'The Contraption', mp: 8, desc: 'Pull the lever. Something happens. Usually good.' },
    overclock: { name: 'Overclock', mp: 12, desc: 'Your next 3 attacks are guaranteed critical hits.' },
    bolt: { name: 'Ember Bolt', mp: 4, desc: 'Fire magic: 1.45× WIT damage that mostly ignores DEF.' },
    mend: { name: 'Mend', mp: 6, desc: 'Heal 2.6× WIT + 12 HP and cure poison.' },
    toadify: { name: 'Toadify', mp: 9, desc: 'Turn the enemy into a toad for 3 turns. Toads are weak and take +50% damage.' },
    wildfire: { name: 'Wildfire', mp: 16, desc: '2.1× WIT fire damage and sets the enemy ablaze.' },
  };

  /* --------------------------------------------------------------- keepsakes */
  LB.KEEPSAKES = {
    cookies: { name: "Grandma's Cookies", icon: 'i_soup', desc: '+12 Max HP and 3 Honey Tonics. Grandma believes in you, nutritionally.' },
    button: { name: 'Lucky Button', icon: 'i_coin', desc: '+3 LUCK. It fell off something important.' },
    oilcan: { name: 'Brass Oil Can', icon: 'i_oil', desc: 'Your lantern burns 40% less oil. Explore deeper, for longer.' },
    coin: { name: 'Suspicious Coin', icon: 'i_coin', desc: '+60 starting gold and +15% Gold Find. Both sides are heads.' },
  };

  /* ---------------------------------------------------------- level-up boons */
  LB.BOONS = [
    { id: 'hp', label: '+10 Max HP', desc: 'Sturdier bones.', apply: (b) => (b.hp += 10) },
    { id: 'mp', label: '+6 Max MP', desc: 'A deeper well of spark.', apply: (b) => (b.mp += 6) },
    { id: 'str', label: '+2 STR', desc: 'Hit harder.', apply: (b) => (b.str += 2) },
    { id: 'def', label: '+2 DEF', desc: 'Get hit softer.', apply: (b) => (b.def += 2) },
    { id: 'wit', label: '+2 WIT', desc: 'Bigger spells, better heals.', apply: (b) => (b.wit += 2) },
    { id: 'agi', label: '+2 AGI', desc: 'Dodge more, flee better.', apply: (b) => (b.agi += 2) },
    { id: 'luck', label: '+2 LUCK', desc: 'More crits, shinier loot.', apply: (b) => (b.luck += 2) },
    { id: 'gold', label: '+10% Gold Find', desc: 'Money finds you attractive.', apply: (b) => (b.gold += 10) },
    { id: 'oil', label: '+15 Max Oil', desc: 'A bigger lantern reservoir.', apply: (b, h) => { h.maxOil += 15; h.oil += 15; } },
  ];

  /* ------------------------------------------------------------ consumables */
  LB.CONSUMABLES = {
    tonic: { name: 'Honey Tonic', icon: 'i_potion', price: 12, desc: 'Restores 45% HP. Sticky.' },
    bigtonic: { name: 'Royal Jelly', icon: 'i_bigpotion', price: 34, desc: 'Restores all HP. The bees are furious about this.', minDepth: 4 },
    ether: { name: 'Ember Draught', icon: 'i_ether', price: 18, desc: 'Restores 60% MP. Tastes like a campfire.' },
    oil: { name: 'Oil Flask', icon: 'i_oil', price: 10, desc: 'Refuels your lantern by 40.' },
    smoke: { name: 'Smoke Pellet', icon: 'i_smoke', price: 15, desc: 'Guaranteed escape from any normal battle.', battleOnly: true },
    firecracker: { name: 'Firecracker', icon: 'i_bomb', price: 20, desc: 'Deals 18 + 9 × floor damage, ignoring DEF.', battleOnly: true },
    soup: { name: 'Mystery Soup', icon: 'i_soup', price: 8, desc: "Something happens. Marrow won't say what's in it." },
    feather: { name: 'Second-Wind Feather', icon: 'i_feather', price: 90, desc: 'If you fall in battle, revive at 40% HP. Used automatically.', passive: true, minDepth: 3 },
  };

  /* ---------------------------------------------------------------- gear */
  LB.RARITY = {
    common: { name: 'Common', mult: 1, affixes: 0, value: 1 },
    fine: { name: 'Fine', mult: 1.1, affixes: 1, value: 1.6 },
    rare: { name: 'Rare', mult: 1.25, affixes: 2, value: 2.6 },
    radiant: { name: 'Radiant', mult: 1.5, affixes: 3, value: 4 },
    legendary: { name: 'Legendary', mult: 1, affixes: 0, value: 6 },
  };

  LB.GEAR_BASES = [
    // weapons
    { name: 'Butter Knife', slot: 'weapon', icon: 'i_sword', tier: 1, stats: { str: 2 } },
    { name: 'Walking Stick', slot: 'weapon', icon: 'i_staff', tier: 1, stats: { str: 1, wit: 2 } },
    { name: 'Rusty Sword', slot: 'weapon', icon: 'i_sword', tier: 1, stats: { str: 3 } },
    { name: 'Gardening Fork', slot: 'weapon', icon: 'i_sword', tier: 2, stats: { str: 3, luck: 1 } },
    { name: 'Crooked Wand', slot: 'weapon', icon: 'i_staff', tier: 2, stats: { wit: 4 } },
    { name: 'Lantern Pole', slot: 'weapon', icon: 'i_staff', tier: 3, stats: { str: 4, def: 1 } },
    { name: 'Fishing Harpoon', slot: 'weapon', icon: 'i_sword', tier: 4, stats: { str: 5, agi: 1 } },
    { name: 'Mushroom Staff', slot: 'weapon', icon: 'i_staff', tier: 4, stats: { wit: 5, mp: 5 } },
    { name: 'Chapel Candlestick', slot: 'weapon', icon: 'i_staff', tier: 7, stats: { str: 5, wit: 4 } },
    { name: "Knight's Longsword", slot: 'weapon', icon: 'i_sword', tier: 7, stats: { str: 7 } },
    { name: 'Choir Baton', slot: 'weapon', icon: 'i_staff', tier: 7, stats: { wit: 7, mp: 4 } },
    // armour
    { name: 'Wool Sweater', slot: 'armor', icon: 'i_armor', tier: 1, stats: { def: 2, hp: 5 } },
    { name: 'Saucepan Helmet', slot: 'armor', icon: 'i_armor', tier: 1, stats: { def: 3 } },
    { name: 'Leather Jerkin', slot: 'armor', icon: 'i_armor', tier: 2, stats: { def: 3, agi: 1 } },
    { name: 'Moth-Silk Robe', slot: 'armor', icon: 'i_armor', tier: 3, stats: { def: 2, wit: 2, mp: 4 } },
    { name: 'Chainmail', slot: 'armor', icon: 'i_armor', tier: 4, stats: { def: 5 } },
    { name: 'Mushroom-Cap Armor', slot: 'armor', icon: 'i_armor', tier: 4, stats: { def: 4, hp: 12 } },
    { name: 'Chapel Plate', slot: 'armor', icon: 'i_armor', tier: 7, stats: { def: 7, hp: 8 } },
    { name: "Deacon's Vestments", slot: 'armor', icon: 'i_armor', tier: 7, stats: { def: 5, wit: 3, mp: 8 } },
    // trinkets
    { name: 'Lucky Button', slot: 'trinket', icon: 'i_trinket', tier: 1, stats: { luck: 3 } },
    { name: 'Cracked Monocle', slot: 'trinket', icon: 'i_trinket', tier: 1, stats: { wit: 2, luck: 1 } },
    { name: "Rabbit's Other Foot", slot: 'trinket', icon: 'i_trinket', tier: 2, stats: { agi: 2, luck: 2 } },
    { name: 'Ember Ring', slot: 'trinket', icon: 'i_trinket', tier: 2, stats: { mp: 8 } },
    { name: "Grandma's Locket", slot: 'trinket', icon: 'i_trinket', tier: 3, stats: { hp: 14 } },
    { name: 'Pocket Sundial', slot: 'trinket', icon: 'i_trinket', tier: 4, stats: { agi: 3, str: 1 } },
    { name: 'Choir Bell', slot: 'trinket', icon: 'i_trinket', tier: 7, stats: { wit: 3, mp: 8 } },
    { name: 'Drowned Pearl', slot: 'trinket', icon: 'i_trinket', tier: 7, stats: { luck: 4, hp: 10 } },
  ];

  LB.AFFIX_BASE = { hp: 6, mp: 4, str: 1.4, def: 1.4, wit: 1.4, agi: 1.4, luck: 1.5, gold: 7 };
  LB.PREFIX = {
    str: ['Sharp', 'Angry', 'Pointy'],
    def: ['Sturdy', 'Stubborn', 'Padded'],
    wit: ['Clever', 'Whispering', 'Bookish'],
    agi: ['Nimble', 'Twitchy', 'Greased'],
    luck: ['Lucky', 'Suspicious', 'Shiny'],
    hp: ['Hearty', 'Soggy', 'Well-Fed'],
    mp: ['Glowing', 'Humming', 'Fizzy'],
    gold: ['Gilded', 'Greedy'],
  };
  LB.SUFFIX = {
    str: ['of Unearned Confidence', 'of Stabbing', 'of the Ox'],
    def: ['of Mild Concern', 'of the Turtle', 'of Not Today'],
    wit: ['of the Owl', 'of Overthinking', 'of Big Words'],
    agi: ['of the Moth', 'of Hasty Exits', 'of Zoomies'],
    luck: ['of Coin Flips', 'of the Four-Leaf', "of Beginner's Luck"],
    hp: ['of Snacking', 'of Second Helpings', 'of the Bear'],
    mp: ['of Embers', 'of Tea Time', 'of Sparks'],
    gold: ['of Tax Evasion', "of the Dragon's Accountant"],
  };

  LB.LEGENDARIES = {
    umbrella: { name: "Grandpa's Umbrella", slot: 'weapon', icon: 'i_staff', stats: { str: 8, def: 4, luck: 3 }, lore: "It's seen things. Mostly rain." },
    candle: { name: 'The Last Candle', slot: 'trinket', icon: 'i_trinket', stats: { wit: 8, mp: 15 }, lore: 'Still warm. Still stubborn.' },
    fly: { name: "Barnaby's Lucky Fly", slot: 'trinket', icon: 'i_trinket', stats: { luck: 8, gold: 25 }, lore: 'Barnaby will want this back. Barnaby will not get it back.' },
    sweater: { name: 'Sweater of Absolute Coziness', slot: 'armor', icon: 'i_armor', stats: { def: 7, hp: 40 }, lore: 'Knitted with love and three layers of spite.' },
    bentsword: { name: "Reginald's Slightly Bent Sword", slot: 'weapon', icon: 'i_sword', stats: { str: 9, luck: 4, agi: 2 }, lore: 'Better at going around shields. Allegedly.' },
    crown: { name: 'Crown of the Wickless King', slot: 'trinket', icon: 'i_trinket', stats: { str: 4, def: 4, wit: 4, agi: 4, luck: 4, hp: 20 }, lore: "The candles are decorative. He was very clear about that." },
  };

  /* --------------------------------------------------------------- enemies */
  LB.ENEMIES = {
    soot: {
      name: 'Soot Sprite', sprite: 'soot', hp: 16, atk: 6, def: 1, agi: 7, exp: 6, gold: [3, 7], floors: [1, 3],
      intro: ['A Soot Sprite puffs out of a crack, sneezing.', 'A Soot Sprite sizes up your lantern. Hungrily.'],
      moves: { attack: 3, snuff: 1 },
    },
    sulkcap: {
      name: 'Sulkcap', sprite: 'sulkcap', hp: 24, atk: 7, def: 3, agi: 2, exp: 8, gold: [4, 9], floors: [1, 5],
      intro: ['A Sulkcap waddles out, already offended.', 'A Sulkcap glares at you. You have done nothing. It knows what you did.'],
      moves: { attack: 3, sulk: 2 },
    },
    moth: {
      name: 'Pickpocket Moth', sprite: 'moth', hp: 18, atk: 5, def: 1, agi: 10, exp: 9, gold: [10, 20], floors: [2, 6],
      intro: ['A Pickpocket Moth flutters by, eyeing your purse.', 'A moth in a tiny bandit mask. Adorable. Criminal.'],
      moves: { attack: 2, steal: 2 },
    },
    wisp: {
      name: 'Bog Wisp', sprite: 'wisp', hp: 26, atk: 8, def: 2, agi: 8, exp: 11, gold: [6, 12], floors: [4, 7],
      intro: ['A Bog Wisp giggles wetly in the dark.', 'A green flame with a smile. Never trust a smiling flame.'],
      moves: { attack: 2, poison: 2 },
    },
    goblin: {
      name: 'Goblin Auditor', sprite: 'goblin', hp: 32, atk: 8, def: 4, agi: 5, exp: 13, gold: [12, 22], floors: [4, 8],
      intro: ['A Goblin Auditor adjusts its spectacles. "Your paperwork is NOT in order."', 'A Goblin Auditor opens its ledger. Your name is already in it.'],
      moves: { attack: 3, audit: 2 },
    },
    chorister: {
      name: 'Bone Chorister', sprite: 'chorister', hp: 34, atk: 9, def: 4, agi: 6, exp: 15, gold: [10, 20], floors: [7, 10],
      intro: ['A Bone Chorister clears its throat. It has no throat.', 'A skeleton in choir robes. It is warming up. Oh no.'],
      moves: { attack: 2, hymn: 1, highnote: 2 },
    },
    deacon: {
      name: 'Drowned Deacon', sprite: 'deacon', hp: 46, atk: 9, def: 6, agi: 3, exp: 18, gold: [14, 26], floors: [7, 10],
      intro: ['A Drowned Deacon rises from the water, dripping solemnly.', 'The Drowned Deacon begins a very long, very wet sermon.'],
      moves: { attack: 3, drown: 2, pray: 1 },
    },
    mimic: {
      name: 'Candle Mimic', sprite: 'mimic', hp: 38, atk: 10, def: 4, agi: 4, exp: 24, gold: [25, 45], floors: [99, 99],
      intro: ['The chest has TEETH. And a candle. Why does it have a candle?!'],
      moves: { attack: 2, chomp: 1 },
    },
    spore: {
      name: 'Professor Spore', sprite: 'spore', proper: true, hp: 40, atk: 9, def: 5, agi: 3, exp: 30, gold: [30, 50], floors: [99, 99],
      intro: ['Professor Spore rolls up his sleeves. He has no arms. It is a metaphor.'],
      moves: { attack: 2, sulk: 1, lecture: 1 },
    },
    king: {
      name: 'The Wickless King', sprite: 'king', boss: true, hp: 820, atk: 31, def: 15, agi: 8, exp: 400, gold: [300, 300], floors: [99, 99],
      intro: ['The Wickless King rises from his throne of cold wax.'],
      moves: {},
    },
  };

  LB.ELITES = {
    shiny: { name: 'Shiny', hp: 1.1, atk: 1, def: 1, exp: 1.3, gold: 3, loot: 0.5, cls: 'elite-shiny' },
    enraged: { name: 'Enraged', hp: 1.0, atk: 1.35, def: 1, exp: 1.5, gold: 1.3, loot: 0.25, cls: 'elite-enraged' },
    ancient: { name: 'Ancient', hp: 1.6, atk: 1.1, def: 1.3, exp: 1.7, gold: 1.5, loot: 0.45, cls: 'elite-ancient' },
  };

  /* ------------------------------------------------------------ the Hollow */
  LB.MAX_FLOOR = 10;
  LB.WAYSTONES = [1, 4, 7, 10];
  LB.areaFor = (floor) => (floor >= 10 ? 'throne' : floor >= 7 ? 'chapel' : floor >= 4 ? 'grotto' : 'moss');
  LB.AREA_NAMES = { moss: 'Mosslight Tunnels', grotto: 'The Sulking Grotto', chapel: 'The Drowned Chapel', throne: 'The Wickless Throne' };
  LB.stepsForFloor = (floor) => 4 + Math.floor(floor / 3);

  LB.FLAVOR = {
    moss: [
      'Moss glows softly underfoot. It squishes in a way that feels judgmental.',
      'You pass a carved sign: "TURN BACK". Someone has added: "or don\'t, I\'m a sign, not a cop."',
      'Water drips somewhere. Plink. Plink. Plink. You begin to hate it.',
      'A worm pokes out of the wall, sees your lantern, and retreats in disgust.',
      'You find old boot prints heading down. They look confident. They do not come back up.',
    ],
    grotto: [
      'Every mushroom here turns slightly away from you as you pass.',
      'Spores drift through your lantern light like tiny, sulky snow.',
      'A mushroom mutters "typical" as you walk by. You did nothing.',
      'You step on a puffball. It sighs dramatically.',
      'Someone has written "WE WERE HERE FIRST" in glowing slime.',
    ],
    chapel: [
      'Water laps at sunken pews. A hymn book floats by, open to page 404.',
      'Distant bells toll underwater. It sounds like a very sad whale.',
      'A stained-glass window depicts a fish giving a sermon to other fish.',
      'The candles here burn blue and cold. Your lantern flickers, nervous.',
      'You find a collection plate. It contains one button and a note: "sorry".',
    ],
    throne: [
      'The air tastes of smoke and bad decisions.',
      'Chains sway from the ceiling. None of them are attached to anything. Very dramatic.',
      'Cold wax pools on the floor, shaped like tiny crowns.',
    ],
  };

  LB.HERO_NAMES = ['Pip', 'Bramble', 'Wick', 'Tansy', 'Moss', 'Juniper', 'Fennick', 'Ottoline', 'Crumb', 'Barley', 'Lumen', 'Nettle', 'Sprocket', 'Hob', 'Quill', 'Marigold', 'Tuck', 'Rowan', 'Dumpling', 'Sorrel'];
})();
