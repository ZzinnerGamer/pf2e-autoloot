# Curated, party-aware PF2e autoloot overlay

This overlay adds a curated loot generator on top of the existing module instead of replacing the original `generateStash` path immediately. The old Roll Loot behavior remains available while the new buttons and API can be tested independently in Foundry.

## Goals implemented

- Use the module/PF2e party workflow first: PF2e party actor, then active scene player-owned tokens, then player-owned character actors.
- Use the `Party` Actor folder only as a fallback if the normal party paths do not resolve a party.
- Exclude familiars, animal companions, companion-style actors, master-linked actors, and classless creature-style character actors from party size, level averaging, and relevance scoring.
- Keep the PF2e treasure-by-level shape: permanent items, consumables, and currency.
- Replace most mundane/junk loot with currency or better useful items.
- Bias permanent items and consumables toward the current roster’s classes, traditions, and roles.
- Use hybrid item selection: 70% general useful items, 20% party-weighted items, and 10% spotlight items for one random PC/class.
- Count duplicate classes/roles. A party with three martial PCs now weights martial loot more heavily than a party with one martial PC.
- Add a session-cadence roll that gives roughly one useful permanent item, a few useful consumables, and fractional currency.
- Add a full-level curated roll that follows the official table more closely.

## Install into the fork

1. Copy `scripts/pf2e-curated-loot.js` into the repository’s `scripts/` folder.
2. Edit `module.json` and add the script after the existing main script:

```json
"scripts/pf2e-autoloot.js",
"scripts/pf2e-curated-loot.js"
```

If the manifest uses a single-line `esmodules` array, insert `"scripts/pf2e-curated-loot.js"` immediately after `"scripts/pf2e-autoloot.js"`.

3. Reload Foundry and enable the module.
4. Make sure the PF2e Party sheet has the current session’s PCs. The fallback folder setting can stay at `Party`.
5. Open a loot actor and use one of the new buttons:
   - `Session Treasure`: one relevant permanent, 2–3 relevant consumables, and fractional currency.
   - `Curated Full Level`: full treasure-by-level package for the party’s current average level.
   - `One Relevant Permanent`: one useful permanent item only; this mode intentionally spotlights one random PC/class.

## Macro/API examples

```js
const loot = game.actors.getName("Session Loot");
await game.pf2eCuratedAutoloot.rollSessionTreasure(loot);
```

```js
const loot = canvas.tokens.controlled[0]?.actor;
await game.pf2eCuratedAutoloot.rollOnePermanent(loot);
```

```js
console.log(game.pf2eCuratedAutoloot.resolveSessionParty());
console.log(game.pf2eCuratedAutoloot.getPartyContext());
```

## Settings added

- `Enable curated loot generator`: toggles the overlay.
- `Fallback session party actor folder`: default `Party`; used only after the normal PF2e party, scene-token, and player-owned-character lookups fail.
- `Session treasure fraction`: default `0.25`; this is the currency fraction for session-sized rewards.
- `Party relevance weight`: default `3`; higher values make the party-weighted and spotlight lanes more class-specific.
- `Junk loot name regex`: editable regex for names that should be converted away from item picks.

## Hybrid selection model

Each generated item slot chooses a lane:

- **70% general useful**: ignores class scoring and selects from broadly useful permanent/consumable items. This keeps loot from becoming too narrow or predictable.
- **20% party weighted**: uses the whole current party profile. Duplicate roles count, capped to prevent runaway scoring. For example, three martial PCs apply more pressure toward runes, weapons, armor, shields, oils, and talismans than one martial PC.
- **10% spotlight**: chooses one random PC profile and heavily weights that PC’s class, tradition, and keywords. This creates occasional “that is clearly for Remy / the rogue / the fighter” rewards without making every drop hyper-tailored.

`One Relevant Permanent` always uses the spotlight lane if a valid PC profile exists.

## Curated filtering model

The generator considers permanent items useful when they are magical, invested, rune-related, tradition-related, or match common useful item names like staves, wands, spellhearts, rings, boots, gloves, cloaks, wayfinders, and skill boosters. Plain mundane weapons/armor/shields are rejected unless they have magic/rune/useful traits.

Consumables are kept when they are likely to be used: potions, elixirs, scrolls, oils, talismans, fulus, mutagens, bombs, antidotes, antiplagues, catalysts, and similar items. Poisons are down-filtered unless the party includes a rogue, alchemist, or similar profile.

Junk/trade-good names such as coffee, beans, coal, flour, grain, soap, chalk, rope, lumber, ore, hides, livestock, barrels, crates, buckets, and tools are rejected by default and represented as currency instead.

## Party-aware scoring

The scoring pass extracts class, role, keyword, and spell tradition hints from the resolved party actors. It stores those hints as counters instead of Sets, so duplicate roles matter.

Examples:

- A psychic increases the score for occult, mental, illusion, dream, wand, scroll, and staff items.
- Two fighters increase martial/rune/weapon/armor/shield pressure more than one fighter.
- A sword-and-board champion increases armor, shield, reinforcing, resilient, divine, healing, and rune scores.
- A rogue increases thievery, stealth, deception, finesse-ish weapon, cloak, boots, and tool scores.
- Alchemists make bombs, elixirs, mutagens, and alchemical tools much more likely, and keep poison from being filtered as vendor clutter.

The generated GM chat card now shows the party source, class profile counts, ignored non-PC actors, and the lane used by each item pick.

## Known limitations

- This is an additive overlay. It does not yet replace the original container auto-roll path.
- It is syntax-checked with Node, but it still needs Foundry runtime testing in your world.
- The class profiles are heuristic and should be tuned from real session results.
- Container type is intentionally ignored for now; chest, corpse, stash, and reward pile all use the same curated logic.
- Foundry/PF2e data paths can shift between system versions; the code uses defensive fallbacks, but runtime testing is still required.

## Recommended next phase

After you test the overlay, the clean architectural next step is to fold the curated filter/scorer into the existing `generateStash` and normal Roll Loot workflow. That should add a setting like `Loot mode: Original / Curated / Hybrid`, so barrels and crates can stay low-value while stashes and session reward chests use the new curated logic.
