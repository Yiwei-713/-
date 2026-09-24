# 🏮 Lanternbound

*A tiny RPG about a very small light in a very big dark.*

Three nights ago the Great Lantern of Emberwick went out. The Wickless King, a
dramatic ex-candle-maker who thinks light is rude, stole the flame and carried
it to the bottom of the Hollow. You are the only person who answered the door.

Lanternbound is a complete little browser RPG. It's pure HTML, CSS and
JavaScript: no frameworks, no libraries, no image or sound files. All the pixel
art is drawn from text grids and every sound is synthesised live.

## How to play

**Play it locally:** download or clone this repository and double-click
`index.html`. It runs from a local file, so you don't need a server.

**Play it online (optional):** in this repository on GitHub, open
**Settings → Pages**, set *Source* to **Deploy from a branch**, pick your main
branch and the `/ (root)` folder, then click **Save**. After a minute the game
will be live at `https://<your-username>.github.io/<repo-name>/`.

### Controls

- Click the buttons (or the townsfolk!), or press **1–9** to pick an action
- **Space / Enter** advances dialogue, and **1–3** picks a dialogue choice
- **I** opens the bag, **C** opens the hero sheet, **Esc** closes windows

## What's inside

| | |
|---|---|
| **Character creation** | Pick a name and one of three classes: the tanky **Warden**, the crit-happy **Tinker**, or the **Hedge-Witch** (fire magic and toads). Then pick a keepsake that bends the run: extra HP, luck, oil efficiency or gold. |
| **Stats & growth** | HP, MP, EXP, level, gold, plus STR / DEF / WIT / AGI / LUCK and Gold Find. Each level-up raises your stats, fully heals you, and offers a choice of **3 random boons**. Each class learns 4 skills (at levels 1, 3, 6 and 9). |
| **The lantern** | Every step in the Hollow burns oil. A **dim** or **dark** lantern makes monsters hit harder but drop better loot. The screen literally closes in around you. It's a push-your-luck risk meter. |
| **Battles** | Turn-based, with telegraphed **enemy intents**: when a Sulkcap starts sulking, *defend*. Attack, skills, items, defend (halves damage and restores MP) or flee. Crits, dodges, poison, stuns, burns, weakness, and turning enemies into toads. |
| **Enemies** | Soot Sprites, Sulkcaps, Pickpocket Moths (they steal your gold, so kill them before they fly off), Bog Wisps, Goblin Auditors (who levy "Lantern Tax"), Bone Choristers, Drowned Deacons, Candle Mimics, and a philosophising mushroom. Random **Shiny / Enraged / Ancient** elite variants. |
| **The boss** | The Wickless King on floor 10: a two-phase fight with a charged **SNUFF OUT** attack, oil-draining smoke and royal decrees. |
| **Loot** | Randomly generated gear in 5 rarities (Common → Fine → Rare → ✦ Radiant → ★ Legendary) with names like *Soggy Knight's Longsword of Unearned Confidence*. Three equipment slots, with stat comparisons shown against what you're wearing. |
| **NPCs** | Elder Wickett, Old Marrow the innkeeper, Barnaby Croak (a frog shopkeeper), Pim the cat, plus wandering folk in the Hollow: lost Sir Reginald Fumblesworth (who has a whole story arc), Professor Spore, Wendel the riddling ghost and Shady Sal. |
| **Events** | Treasure chests (usually just chests), shrines, wishing wells, traps, lantern moths and cosy nooks. |
| **Saving** | Autosaves as you play, plus 3 manual save slots, all stored in your browser's `localStorage`. |
| **Presentation** | Hand-made pixel sprites, a pixel font, procedurally generated backdrops for four areas, particles, screen shake, floating damage numbers, a typewriter dialogue box, and an original chiptune soundtrack with sound effects. Works on phones too. |

## Project layout

```
index.html        page shell
css/style.css     all styling and animations
js/sprites.js     pixel art, pixel font, background painter
js/audio.js       synthesised sound effects and music
js/data.js        classes, skills, enemies, items, loot tables
js/core.js        game state, stats, loot generation, saving, UI helpers
js/battle.js      the battle system and levelling
js/world.js       town, the Hollow, NPCs, events, menus, screens
```

Tips for new heroes: rest at the inn, pet the cat, and when something starts
inhaling every shadow in the room, **defend**.
