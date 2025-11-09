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

https://github.com/user-attachments/assets/baa277b0-2d4d-459a-91ae-8f3799421556

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
