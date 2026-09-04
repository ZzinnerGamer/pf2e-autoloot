# PF2e Autoloot [2.5.0]

## New: preview your loot before it lands

Turn on **Preview loot before applying** and a window now appears whenever you roll a container by hand. It shows everything that was generated and gives you three choices: apply it, roll again, or cancel. Nothing is written to the container until you say yes, so cancelling leaves it exactly as it was.

The preview shows:

- A small table at the top with the budget: the most the container could hold at   this level, what it actually got, what was spent on items, and what the coins   are worth.
- Every item with its picture and quantity. Click a name to open its full sheet.
- The coins, using the currency icons from the game system.

This does not appear when fully automatic looting is switched on, since there is nobody watching to approve it. The setting is greyed out in the options window while automatic mode is active.

### New: padlocks

Every item in the preview has a small padlock, and the coins have one of their own. Lock what you like, press reroll, and those things stay exactly as they are while everything else is rolled again. What you keep is paid for out of the next roll's budget, so the container never ends up richer than it should be.

If anything is locked, the chance of the container coming out empty is skipped entirely — you asked to keep something, so you keep it.

### Fixed: containers gave out too much

Anything costing less than a gold piece was treated as free. A chest with a one gold budget could quietly end up holding two or three gold worth of arrows, tools and trinkets. Cheap goods now cost what they cost, and containers stay inside their budget.

Small amounts of money were also being rounded away in several other places. Everything now counts down to the copper piece.

## Fixed: coins were far too predictable

A level one pouch produced exactly 100 copper pieces every single time. Larger purses were nearly as repetitive — the same handful of results over and over.

Coins now work the way you would expect. First there is a hidden roll for how much money is actually in there: at least half the budget up to level 10, at least three quarters above that, never more than the full amount. Then that money is split into denominations according to your preference.

## Fixed: rerolling threw away the coins

Rolling a container again by hand generated its money and then immediately deleted it. Items survived, coins did not.

## Fixed: large parties got too much

The extra treasure for parties of more than four was being handed out at full value no matter how low you had set the budget percentage. A party of six could receive hundreds of gold more than intended.

## Changed: each container has its own treasure table

Containers used to share one budget with a multiplier bolted on top. Each type
now reads its own column of the Party Treasure by Level table:

| Container       | Draws from                 |
| --------------- | -------------------------- |
| Pouch           | Currency per Additional PC |
| Crate, barrel   | Currency per Additional PC |
| Chest           | Party Currency             |
| Stash           | Total Value                |

<img width="1100" height="639" alt="image" src="https://github.com/user-attachments/assets/2c508cf3-a1f4-418e-aad3-54e41a734f34" />

Pouches/Crates/Barrels - Cyan
Chests - Lime
Stashes - Red

Crates and barrels are meant to be scenery, so they sit on the smallest column.
Stashes are the real prize and are deliberately left alone by the budget percentage — a stash is worth what the table says, whatever your settings.

## Also in this release

- Generated items now remember which compendium they came from, which fixes a quiet problem where unique items were never released back into circulation after a reroll and could stop appearing altogether.

# PF2e Autoloot [2.4.1]

* update French translation by @rectulo in https://github.com/ZzinnerGamer/pf2e-autoloot/pull/17
* Update Polish translate by @Lioheart in https://github.com/ZzinnerGamer/pf2e-autoloot/pull/18

# PF2e Autoloot [2.4.0]

- New general setting: Coin denomination preference

Controls which coin denominations are generated more often. Chests and Custom Containers are affected by this setting.
* `Favor High Value` will generate more likely PP and GP coins (Example 36 PP, 121 GP. 50 SP 400 CP)
* Balanced will generate the same-ish amount of coin value (Example 34 PP, 119 GP. 198 SP 1180 CP)
* `Favor Low Value` will generate more likely SP and CP coins (Example 0 PP, 8 GP. 275 SP 45450 CP)

# PF2e Autoloot [2.3.0]

- Fix budget exceding the party value if more than 4 player character were in the active party.
- Fix starfinder budget value
- Increase minimum compatibility with PF2e 8.2.0 and SF2e 1.2.0
- Increase minimum compatibility from Foundry v13 to Foundry v14

# PF2e Autoloot [2.2.1]

- Fix import menu width and dialog title

# PF2e Autoloot [2.2.0]

- Fixed automatic loot generation on sheet opening
- Added Import/Export custom containers
   - Import has 2 modes, Replace and Merge.
- Added reordering containers via drag&drop
- New custom containers will always appear at the top of the dialog

# PF2e Autoloot [2.1.0]

- Added Starfinder Second Edition Compatibility
- Separated pools of custom containers by system availability (no firearms on sf2e system or no cryo weapons on pf2e system)
- Added missing tags for custom containers
- Added SF2e Anachronism Compatibility, that means firearms on sf2e system (and prepared cryo weapons for the future PF2e Anachronism too 😉)
- Coins now are generated again (i hate you 7.9.0 this cost me like 7 hours)

# PF2e Autoloot [2.0.3]

Updated English, Polish, French and Spanish localizations.

# PF2e Autoloot [2.0.2]

Fixed module.json

# PF2e Autoloot [2.0.1]

Deleted duplicated filters

# PF2e Autoloot [2.0.0]

[opera_sy4LtGcRhH.webm](https://github.com/user-attachments/assets/4c0ef17b-73a7-4681-8d2f-cc93b7c68dc6)

## Hightlights
* Custom Loot
Custom loot is a powerful new feature that allows you as GM to setup your dream container. A box filled with just sharp weapons? Or maybe a hidden cache full of random shiny equipment? Or uhhh a place with just light bardings?????

* New Settings Menu

## Know Issues
* There are item category like Alchemical Tools, Animals their Gear, Runes, and multiple other categories that cannot be parsed without setting them item by item.
* Assistive items are in Adventuring Gear subcategory
* Personal opinion, I dont feel like Artifacts, Contracts, Intelligent Items, Relics, needs to be looteable by normal means with this module
* Following [Archives of Nethys' equipment tab](https://2e.aonprd.com/Equipment.aspx): Alchemical Tools, Animals and Gear, Banners, Censers, Cursed Items, Customizations, Figurehead, Grafts, Grimoires, Held Items, High Tech, Other, Runes (for now), just because of issue 1, those items are only included in "Equipment" category. (Exception: Alchemical Tools are included in Alchemical Items subcategory too)

# PF2e Autoloot [1.1.4]

* Added Polish localization
* Fixed custom compendiums

# PF2e Autoloot [1.1.3]

* Fixed empty probability not working

# PF2e Autoloot [1.1.2]

* Added French Localization [🇫🇷 RadicalBlue & rectulo]

# PF2e Autoloot [1.1.1]

* Fixed Spanish localization

# PF2e Autoloot [1.1.0]

* Fixed Typo (no more Pouhes only Pouches)
* Added custom compendium entry for parsing the loot (requires reload).

# PF2e Autoloot [1.0.0]

A lightweight Foundry VTT module for **Pathfinder 2e** that automatically populates loot containers as you open or reroll them. It uses smart budgets based on party level, rarity-weighted selection, and configurable rules per container type. Great for quick prep and BG3-style exploration looting.

## Features

* Detects container type by name: **Barrel / Crate / Chest / Pouch / Stash**.
* Configurable chance to be empty per type.
* Budget scales with **average party level** and a tunable `budgetFraction`.
* Rarity-weighted selection (customizable weight map).
* Quantity-aware picking that tries to fit budget and favors stacks for consumables/ammo.
* Unique item registry to avoid duplicating the same unique across rolls.
* Optional KCTG compendium integration for flavor items.
* “Roll Loot” button on loot sheets; auto-generation on open (toggleable).

## How loot is calculated

1. Determine container type by name (Three tiers Barrel/Crate/Chest).
   -# Based on BG3 loot rolls
2. Apply chance of being empty (config).
3. Calculate average party level and gp budget = TotalValue(level) * budgetFraction.
   -# Based on the [PF2e Loot table](https://2e.aonprd.com/Rules.aspx?ID=2656&Redirected=1)
4. Filter candidates according to rules and cache (not too fast but its "nice").
5. Choose X types (according to count-*), weighted by rarity.
6. For each item chosen:

* Read price in gp (supports { gp, sp, cp, pp }).
* Choose quantity in 1..maxStack without exceeding the remaining budget.
* Create items and set flags to not roll again for the container.

## Installation

1. Install via Foundry’s **Add-on Modules** using this repo’s manifest URL.
2. Enable **PF2e Autoloot** in your world.
3. (Optional) Point the module to your preferred equipment and KCTG compendia in settings.

## Usage

https://github.com/user-attachments/assets/aab40104-b5da-47b8-937c-651779a485b1

* Create/open a **loot** actor named like a target type (e.g., “Cofre”, “Chest”, “Crate”, “Barrel”, “Bolsa/Pouch”, “Alijo/Stash”).
* Open the sheet to auto-generate loot, or click **Roll Loot** to reroll.
* Adjust budgets, rarity weights, stack caps, and empty chances in **Module Settings**.

## Notable Settings

* **Name patterns** per type (regex), e.g. `(Chest|Cofre)`.
* **Empty chance** per type.
* **Count range** per type (`count-*`).
* **Budget fraction** (portion of PF2e treasure by level).
* **Rarity weights** JSON.
* **Max stack** and **Favor quantity** toggle.
* **Level offsets** for crates/chests/stashes.

## Compatibility

* System: **Pathfinder 2e** for Foundry VTT.
* Works with PF2e equipment SRD compendium; optionally mixes in KCTG items for ambience.

## Credits

* Inspired by **BG3**-style loot pacing.
* Budgeting guided by the official **PF2e Treasure by Level** table.
* Thanks to the PF2e & Foundry communities for the amazing ecosystem.
