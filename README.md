# PF2e Autoloot

A lightweight Foundry VTT module for **Pathfinder 2e** that automatically populates loot containers as you open or reroll them. It uses smart budgets based on party level, rarity-weighted selection, and configurable rules per container type. (Heavely based on BG3 loot system).

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
   Based on BG3 loot rolls
2. Apply chance of being empty (config).
3. Calculate average party level and gp budget = TotalValue(level) * budgetFraction.
   Based on the [PF2e Loot table](https://2e.aonprd.com/Rules.aspx?ID=2656&Redirected=1)
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
