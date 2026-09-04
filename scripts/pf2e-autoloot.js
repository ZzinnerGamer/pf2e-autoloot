import { AutolootConfigApp } from "./option-menu.js";

const MODULE = "pf2e-autoloot";

let IS_SF2E = false;
let IS_PF2E = false;


const DEFAULTS = {
  packs: {
    equipment: "pf2e.equipment-srd",
    kctg: "kctg-2e.kctg-2e"
  },
  names: {
    barrel: "(?:Barrel|Barril)",
    crate: "(?:Crate|Caja)",
    chest: "(?:Chest|Cofre)",
    pouch: "(?:Pouch|Bolsa)",
    stash: "(?:Stash|Alijo)"
  },
  emptyChance: {
    barrel: 75,
    crate: 50,
    chest: 25,
    pouch: 10,
    stash: 1
  },
  counts: {
    barrel: [1, 10],
    crate: [1, 15],
    chest: [2, 20],
    pouch: [1, 3]
  },
  minimumChestLevelOffset: 4,
  maximumChestLevelOffset: 2,
  crateLevelOffset: 4,
  stashLevelOffset: 0,
  rarityWeights: { common: 10, uncommon: 3, rare: 1, unique: 0.2 },
  maxStack: 10,
  budgetFraction: 0.01,
  preloadOnReady: true
};

const COIN_VALUE_GP = { pp: 10, gp: 1, sp: 0.1, cp: 0.01 };

const PF2E_TREASURE_BY_LEVEL = {
  1: 175, 2: 300, 3: 500, 4: 850, 5: 1350,
  6: 2000, 7: 2900, 8: 4000, 9: 5700, 10: 8000,
  11: 11500, 12: 16500, 13: 25000, 14: 36500, 15: 54500,
  16: 82500, 17: 128000, 18: 208000, 19: 355000, 20: 490000
};

const KCTG_FOLDER_FALLBACK = {
  "JozhTcLtWhQSoixO": "Coinage & Currency",
  "IZq1WnGQJLoIvXx8": "Jewelry",
  "qaBYj6FjgwDkfFpB": "Vessels & Tableware",
  "5odEKgzVaSQWECGi": "Ceremonial & Sacred",
  "hsoTwRresy4mnjp7": "Funerary & Memorial",
  "oXzcvIj45F4QHj75": "Animals & Livestock",
  "CxeM1yrMXkrNcYtZ": "Documents & Scrolls",
  "LcEbVaN90oHiv1Ya": "Fish & Game",
  "mExUSCpoqePj3OdE": "Food & Produce",
  "8lz2VxOmkdxoG8jI": "Potions & Tinctures",
  "xNkX3Iw0Flrj0FRY": "Tavern & Prepared",
  "RdzZ5C0EGK9UDTNv": "Bone & Hides",
  "WYL6bFNvkQAqc7vh": "Fibres & Textiles",
  "Rd2Ktl0K6V7JRLq7": "Gemstones",
  "tW7OiZPldGc5FGzO": "Ore & Metals",
  "7Fyf3kHvuwlcHXOm": "Stone & Masonry",
  "4txKsKHAPGf9wAy5": "Timber & Lumber",
  "ye3r3Ta3YG2Dbjt1": "Red Harvest",
  "tgBukDzvYtH27xc6": "Carpentry",
  "MTu86T3XOtrod5sb": "General Tools",
  "1LGVb6QYZgelF64z": "Tools & Craft",
  "Fnhotid9YhDXFevx": "Herbalist Supplies",
  "4KCNdQYPwrafjCWn": "Instruments",
  "7ib9lhOv3o7tL5Q5": "Raw Materials",
  "np1lrgDmvT5Zcx0c": "Provisions",
  "DNNb5KsoQ5uyIkz4": "Adornments & Luxury",
  "BRJol1dheZH5MuAT": "General Trade",
  "CkbhqUXNtPTwfDnl": "Seasonal & Themed",
  "ZhvgovzjOp3DAVvp": "Antiquities & Relics"
};

const Cache = {
  equipIndex: [],
  kctgIndex: [],
  kctgFolders: {},
  equipPack: null,
  kctgPack: null,
  docCache: new Map(),
  ready: false
};

const InFlight = new WeakSet();
const ManualRoll = new WeakSet();

const CURRENCY_KEYS = ["pp", "gp", "sp", "cp", "credits", "upb"];

/**
 * Value shares per denomination for each coin preference.
 * Each preset spends the SAME total value, only spread differently:
 *   - value:    concentrates in platinum/gold and vetoes copper
 *   - balanced: gold-led, with a visible tail of silver and copper
 *   - quantity: pushes the bulk down into silver/copper, so you get many coins
 * Shares are fractions of the coin budget and add up to 1.
 */
const COIN_VALUE_SHARES = {
  value: { pp: 0.72, gp: 0.26, sp: 0.02, cp: 0.00 },
  balanced: { pp: 0.10, gp: 0.66, sp: 0.10, cp: 0.14 },
  quantity: { pp: 0.00, gp: 0.26, sp: 0.33, cp: 0.41 }
};

/**
 * The container does not always hold its full coin budget.
 * Rolls the amount actually present: at least half the budget up to level 10,
 * at least three quarters from level 11 on, never more than the budget.
 * Works at copper precision so small budgets still vary.
 */
function rollCoinAmount(budgetGP, partyLevel) {
  const budgetCp = Math.max(0, Math.floor((Number(budgetGP) || 0) * 100 + 1e-6));
  if (budgetCp <= 0) return 0;

  const lvl = Math.max(1, Math.min(20, Number(partyLevel) || 1));
  const minFrac = lvl <= 10 ? 0.50 : 0.75;
  const minCp = Math.max(1, Math.floor(budgetCp * minFrac));
  if (minCp >= budgetCp) return budgetCp / 100;

  return randInt(minCp, budgetCp) / 100;
}

/**
 * Splits an exact gp amount into coins according to the coin preference.
 * The full amount is always preserved; only its distribution changes.
 *
 * Allocation uses probabilistic rounding: a denomination whose share works out
 * to 0.66 coins has a 66% chance of yielding one. Plain truncation would drop
 * that value down to the smaller denominations every single time, which made
 * small budgets produce the same handful of copper on every roll.
 */
function pf2eCurrencyFromGP(gpAmount, opts = {}) {
  const denoms = [
    { k: "pp", v: 1000 },
    { k: "gp", v: 100 },
    { k: "sp", v: 10 },
    { k: "cp", v: 1 }
  ];

  const out = { pp: 0, gp: 0, sp: 0, cp: 0 };
  let remaining = Math.max(0, Math.floor((Number(gpAmount) || 0) * 100 + 1e-6));
  if (!remaining) return out;

  const pref = opts.coinPreference || game.settings.get(MODULE, "coinPreference") || "balanced";
  const shares = COIN_VALUE_SHARES[pref] || COIN_VALUE_SHARES.balanced;

  // Jitter each share so two rolls of the same budget do not look identical.
  const weighted = {};
  let weightSum = 0;
  for (const d of denoms) {
    const base = Number(shares[d.k]) || 0;
    const w = base > 0 ? base * (0.80 + Math.random() * 0.40) : 0;
    weighted[d.k] = w;
    weightSum += w;
  }
  if (weightSum <= 0) {
    out.cp = remaining;
    return out;
  }

  // Main pass: each denomination takes its share of the total value,
  // rounding up or down at random in proportion to the leftover fraction.
  const total = remaining;
  for (const d of denoms) {
    if (remaining <= 0) break;
    const share = weighted[d.k] / weightSum;
    if (share <= 0) continue;

    const targetCp = Math.min(total * share, remaining);
    const exact = targetCp / d.v;
    let qty = Math.floor(exact);
    if (Math.random() < (exact - qty)) qty += 1;

    qty = Math.min(qty, Math.floor(remaining / d.v));
    if (qty > 0) {
      out[d.k] += qty;
      remaining -= qty * d.v;
    }
  }

  // Cascade whatever is left, largest first. Vetoed denominations (share 0)
  // stay out of this pass; copper is the unavoidable last resort.
  for (const d of denoms) {
    if (remaining <= 0) break;
    if (!weighted[d.k] && d.k !== "cp") continue;
    const qty = Math.floor(remaining / d.v);
    if (qty > 0) {
      out[d.k] += qty;
      remaining -= qty * d.v;
    }
  }
  if (remaining > 0) out.cp += remaining;

  return out;
}

function randInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randNearMax(min, max) {
  const u = Math.random();
  const v = Math.random();
  const t = Math.max(u, v); // sesga hacia el tope
  return Math.floor(min + (max - min) * t);
}

function sf2eCurrencyFromGP(gpAmount, _opts = {}) {
  // SF2e uses a single merged currency, so there is nothing to distribute:
  // the amount has already been rolled by rollCoinAmount and scaled to
  // credits by getContainerBudget.
  const credits = Math.floor(Math.max(0, Number(gpAmount) || 0));
  if (!credits) return {};
  return { credits };
}

function currencyFromBudgetGP(gpAmount, opts = {}) {
  return IS_SF2E ? sf2eCurrencyFromGP(gpAmount, opts) : pf2eCurrencyFromGP(gpAmount, opts);
}

function readCurrencyNumber(v) {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") return Number(v) || 0;
  if (typeof v === "object" && v && "value" in v) return Number(v.value) || 0;
  return Number(v) || 0;
}

function writeCurrencyLike(existingValue, n) {
  if (existingValue && typeof existingValue === "object" && "value" in existingValue) {
    return { ...existingValue, value: n };
  }
  return n;
}

function mergeCurrency(a, b) {
  const base = a && typeof a === "object" ? a : {};
  const src = b && typeof b === "object" ? b : {};
  const out = { ...base };

  for (const k of CURRENCY_KEYS) {
    if (!(k in src) && !(k in base)) continue;
    const next = readCurrencyNumber(base[k]) + readCurrencyNumber(src[k]);
    out[k] = writeCurrencyLike(base[k], next);
  }
  return out;
}

function hasAnyCurrencyObj(obj) {
  if (!obj || typeof obj !== "object") return false;
  return CURRENCY_KEYS.some(k => readCurrencyNumber(obj[k]) > 0);
}

function actorHasAnyCurrency(actor) {
  const c = actor?.inventory?.coins;
  if (!c) return false;

  // PF2E (copperValue) + SF2E (credits/upb)
  const copperValue = Number(c.copperValue) || 0;
  if (copperValue > 0) return true;

  return CURRENCY_KEYS.some(k => (Number(c[k]) || 0) > 0);
}

async function addCurrencyToActor(actor, currencyObj) {
  currencyObj = currencyObj || {};
  if (!hasAnyCurrencyObj(currencyObj)) return false;

  const inv = actor?.inventory;
  try {
    // Prefer Coins.fromObject when available (PF2E/SF2E)
    const CoinsCls =
      (inv?.coins?.constructor && typeof inv.coins.constructor.fromObject === "function" ? inv.coins.constructor : null) ||
      (game?.pf2e?.Coins && typeof game.pf2e.Coins.fromObject === "function" ? game.pf2e.Coins : null) ||
      (game?.sf2e?.Coins && typeof game.sf2e.Coins.fromObject === "function" ? game.sf2e.Coins : null);

    const coinsToAdd = CoinsCls ? CoinsCls.fromObject(currencyObj) : currencyObj;

    // PF2e (reciente) expone addCurrency en inventario de personaje.
    if (inv?.addCurrency) {
      await inv.addCurrency(coinsToAdd);
      return true;
    }

    // Algunos tipos / versiones exponen addCoins.
    if (inv?.addCoins) {
      await inv.addCoins(coinsToAdd);
      return true;
    }

    // Fallback: update directo.
    const path =
      actor?.system?.currency ? "system.currency" :
        actor?.system?.coins ? "system.coins" :
          actor?.system?.resources?.currency ? "system.resources.currency" :
            "system.currency";

    const existing = foundry.utils.getProperty(actor, path) || {};
    const merged = mergeCurrency(existing, currencyObj);

    // Actualiza por claves para evitar choques con DataModel (algunas versiones usan {pp:{value}}).
    const update = {};
    for (const k of CURRENCY_KEYS) {
      if (!(k in merged)) continue;
      const n = readCurrencyNumber(merged[k]);
      const ex = existing?.[k];
      if (ex && typeof ex === "object" && "value" in ex) {
        update[`${path}.${k}.value`] = n;
      } else {
        update[`${path}.${k}`] = n;
      }
    }
    if (Object.keys(update).length) await actor.update(update);
    return true;
  } catch (e) {
    console.warn(`${MODULE}: addCurrencyToActor failed`, e);
    return false;
  }
}

async function clearAllCurrency(actor) {
  // Try PF2e/SF2e inventory coin API first (PF2e 7+)
  try {
    const inv = actor?.inventory;
    const coins = inv?.coins;
    if (inv?.removeCoins && coins) {
      const ctor = coins?.constructor;
      const zeroLike = ctor?.fromObject
        ? ctor.fromObject({ pp: 0, gp: 0, sp: 0, cp: 0, credits: 0, upb: 0 })
        : { pp: 0, gp: 0, sp: 0, cp: 0, credits: 0, upb: 0 };
      await inv.removeCoins(zeroLike, { removeByValue: true });
      return true;
    }
  } catch (e) {
    /* fall through */
  }

  // Fallback: update common system paths
  const candidates = [
    "system.currency",
    "system.coins",
    "system.attributes.currency",
    "system.attributes.coins"
  ];

  for (const path of candidates) {
    const cur = foundry.utils.getProperty(actor, path);
    if (cur && typeof cur === "object") {
      const patch = {};
      // Preserve keys if present, otherwise write the common ones
      const keys = Object.keys(cur);
      const writeKeys = keys.length ? keys : ["pp", "gp", "sp", "cp", "credits", "upb"];
      for (const k of writeKeys) patch[`${path}.${k}`] = 0;
      try {
        await actor.update(patch);
        return true;
      } catch (e) {
        // keep trying other paths
      }
    }
  }

  dbg("could not clear currency (no compatible API)", { actor, snapshot: actor?.system?.currency ?? actor?.system?.coins ?? actor?.system });
  return false;
}



const PF2E_CURRENCY_PER_ADDITIONAL_PC = {
  1: 10, 2: 18, 3: 30, 4: 50, 5: 80,
  6: 125, 7: 180, 8: 250, 9: 350, 10: 500,
  11: 700, 12: 1000, 13: 1500, 14: 2250, 15: 3250,
  16: 5000, 17: 7500, 18: 12000, 19: 20000, 20: 35000
};

const STASH_SPECS = {
  1: { perms: { 2: 2, 1: 2 }, cons: { 2: 2, 1: 3 }, currency: 40 },
  2: { perms: { 3: 2, 2: 2 }, cons: { 3: 2, 2: 2, 1: 2 }, currency: 70 },
  3: { perms: { 4: 2, 3: 2 }, cons: { 4: 2, 3: 2, 2: 2 }, currency: 120 },
  4: { perms: { 5: 2, 4: 2 }, cons: { 5: 2, 4: 2, 3: 2 }, currency: 200 },
  5: { perms: { 6: 2, 5: 2 }, cons: { 6: 2, 5: 2, 4: 2 }, currency: 320 },
  6: { perms: { 7: 2, 6: 2 }, cons: { 7: 2, 6: 2, 5: 2 }, currency: 500 },
  7: { perms: { 8: 2, 7: 2 }, cons: { 8: 2, 7: 2, 6: 2 }, currency: 720 },
  8: { perms: { 9: 2, 8: 2 }, cons: { 9: 2, 8: 2, 7: 2 }, currency: 1000 },
  9: { perms: { 10: 2, 9: 2 }, cons: { 10: 2, 9: 2, 8: 2 }, currency: 1400 },
  10: { perms: { 11: 2, 10: 2 }, cons: { 11: 2, 10: 2, 9: 2 }, currency: 2000 },
  11: { perms: { 12: 2, 11: 2 }, cons: { 12: 2, 11: 2, 10: 2 }, currency: 2800 },
  12: { perms: { 13: 2, 12: 2 }, cons: { 13: 2, 12: 2, 11: 2 }, currency: 4000 },
  13: { perms: { 14: 2, 13: 2 }, cons: { 14: 2, 13: 2, 12: 2 }, currency: 6000 },
  14: { perms: { 15: 2, 14: 2 }, cons: { 15: 2, 14: 2, 13: 2 }, currency: 9000 },
  15: { perms: { 16: 2, 15: 2 }, cons: { 16: 2, 15: 2, 14: 2 }, currency: 13000 },
  16: { perms: { 17: 2, 16: 2 }, cons: { 17: 2, 16: 2, 15: 2 }, currency: 20000 },
  17: { perms: { 18: 2, 17: 2 }, cons: { 18: 2, 17: 2, 16: 2 }, currency: 30000 },
  18: { perms: { 19: 2, 18: 2 }, cons: { 19: 2, 18: 2, 17: 2 }, currency: 48000 },
  19: { perms: { 20: 2, 19: 2 }, cons: { 20: 2, 19: 2, 18: 2 }, currency: 80000 },
  20: { perms: { 20: 4 }, cons: { 20: 4, 19: 2 }, currency: 140000 }
};

/* ---------------- Settings ---------------- */
Hooks.once("init", () => {

  IS_SF2E = game.system.id === "sf2e";
  IS_PF2E = game.system.id === "pf2e";

  const L = (k) => game.i18n.localize(k);


  game.settings.registerMenu(MODULE, "autolootSettingsMenu", {
    name: game.i18n.localize("pf2e-autoloot.settings.menu.name"),
    label: game.i18n.localize("pf2e-autoloot.settings.menu.name"),
    icon: "fas fa-box-open",
    type: AutolootConfigApp,
    restricted: true
  });

  game.settings.register(MODULE, "pack-equipment", {
    name: L("pf2e-autoloot.settings.pack-equipment.name"),
    hint: L("pf2e-autoloot.settings.pack-equipment.hint"),
    scope: "world",
    config: false,
    type: String,
    default: DEFAULTS.packs.equipment,
    requiresReload: true
  });

  game.settings.register(MODULE, "pack-kctg", {
    name: "Compendio de Kris",
    scope: "world", config: false, default: DEFAULTS.packs.kctg, type: String
  });

  game.settings.register(MODULE, "autoloot", {
    name: L("pf2e-autoloot.settings.autoloot.name"),
    hint: L("pf2e-autoloot.settings.autoloot.hint"),
    scope: "world", config: false, default: false, type: Boolean
  });

  game.settings.register(MODULE, "previewBeforeApply", {
    name: L("pf2e-autoloot.settings.previewBeforeApply.name"),
    hint: L("pf2e-autoloot.settings.previewBeforeApply.hint"),
    scope: "world", config: false, default: false, type: Boolean
  });

  game.settings.register(MODULE, "coinPreference", {
    name: L("pf2e-autoloot.settings.coinPreference.name"),
    hint: L("pf2e-autoloot.settings.coinPreference.hint"),
    scope: "world", config: false, type: String, default: "balanced",
    choices: {
      quantity: L("pf2e-autoloot.settings.coinPreference.quantity"),
      balanced: L("pf2e-autoloot.settings.coinPreference.balanced"),
      value: L("pf2e-autoloot.settings.coinPreference.value")
    }
  });

  game.settings.register(MODULE, "avoidNamesRegex", {
    name: L("pf2e-autoloot.settings.avoidNamesRegex.name"),
    hint: L("pf2e-autoloot.settings.avoidNamesRegex.hint"),
    scope: "world", config: false, type: String, default: ""
  });

  game.settings.register(MODULE, `name-barrel`, {
    name: L("pf2e-autoloot.settings.name-key.barrel.name"),
    hint: L("pf2e-autoloot.settings.name-key.hint"),
    scope: "world", config: false, default: DEFAULTS.names.barrel, type: String
  });

  game.settings.register(MODULE, `empty-barrel`, {
    name: L("pf2e-autoloot.settings.empty-key.barrel.name"),
    hint: L("pf2e-autoloot.settings.empty-key.hint"),
    scope: "world", config: false, default: DEFAULTS.emptyChance.barrel, type: Number,
    range: { min: 0, max: 100, step: 1 }
  });

  game.settings.register(MODULE, `count-barrel`, {
    name: L("pf2e-autoloot.settings.count-key.barrel.name"),
    hint: L("pf2e-autoloot.settings.count-key.hint"),
    scope: "world", config: false, default: DEFAULTS.counts.barrel.join(","), type: String
  });

  game.settings.register(MODULE, `name-crate`, {
    name: L("pf2e-autoloot.settings.name-key.crate.name"),
    hint: L("pf2e-autoloot.settings.name-key.hint"),
    scope: "world", config: false, default: DEFAULTS.names.crate, type: String
  });

  game.settings.register(MODULE, `empty-crate`, {
    name: L("pf2e-autoloot.settings.empty-key.crate.name"),
    hint: L("pf2e-autoloot.settings.empty-key.hint"),
    scope: "world", config: false, default: DEFAULTS.emptyChance.crate, type: Number,
    range: { min: 0, max: 100, step: 1 }
  });

  game.settings.register(MODULE, `count-crate`, {
    name: L("pf2e-autoloot.settings.count-key.crate.name"),
    hint: L("pf2e-autoloot.settings.count-key.hint"),
    scope: "world", config: false, default: DEFAULTS.counts.crate.join(","), type: String
  });

  game.settings.register(MODULE, "crateLevelOffset", {
    name: L("pf2e-autoloot.settings.crateLevelOffset.name"),
    hint: L("pf2e-autoloot.settings.crateLevelOffset.hint"),
    scope: "world", config: false, default: DEFAULTS.crateLevelOffset, type: Number, range: { min: -10, max: 10, step: 1 }
  });

  game.settings.register(MODULE, `name-chest`, {
    name: L("pf2e-autoloot.settings.name-key.chest.name"),
    hint: L("pf2e-autoloot.settings.name-key.hint"),
    scope: "world", config: false, default: DEFAULTS.names.chest, type: String
  });

  game.settings.register(MODULE, `empty-chest`, {
    name: L("pf2e-autoloot.settings.empty-key.chest.name"),
    hint: L("pf2e-autoloot.settings.empty-key.hint"),
    scope: "world", config: false, default: DEFAULTS.emptyChance.chest, type: Number,
    range: { min: 0, max: 100, step: 1 }
  });

  game.settings.register(MODULE, `count-chest`, {
    name: L("pf2e-autoloot.settings.count-key.chest.name"),
    hint: L("pf2e-autoloot.settings.count-key.hint"),
    scope: "world", config: false, default: DEFAULTS.counts.chest.join(","), type: String
  });

  game.settings.register(MODULE, `minimumChestLevelOffset`, {
    name: L("pf2e-autoloot.settings.minimumChestLevelOffset.name"),
    hint: L("pf2e-autoloot.settings.minimumChestLevelOffset.hint"),
    scope: "world", config: false, default: DEFAULTS.minimumChestLevelOffset, type: Number, range: { min: 0, max: 10, step: 1 }
  });

  game.settings.register(MODULE, `maximumChestLevelOffset`, {
    name: L("pf2e-autoloot.settings.maximumChestLevelOffset.name"),
    hint: L("pf2e-autoloot.settings.maximumChestLevelOffset.hint"),
    scope: "world", config: false, default: DEFAULTS.maximumChestLevelOffset, type: Number, range: { min: 0, max: 10, step: 1 }
  });

  game.settings.register(MODULE, `name-pouch`, {
    name: L("pf2e-autoloot.settings.name-key.pouch.name"),
    hint: L("pf2e-autoloot.settings.name-key.hint"),
    scope: "world", config: false, default: DEFAULTS.names.pouch, type: String
  });

  game.settings.register(MODULE, `empty-pouch`, {
    name: L("pf2e-autoloot.settings.empty-key.pouch.name"),
    hint: L("pf2e-autoloot.settings.empty-key.hint"),
    scope: "world", config: false, default: DEFAULTS.emptyChance.pouch, type: Number,
    range: { min: 0, max: 100, step: 1 }
  });

  game.settings.register(MODULE, `count-pouch`, {
    name: L("pf2e-autoloot.settings.count-key.pouch.name"),
    hint: L("pf2e-autoloot.settings.count-key.hint"),
    scope: "world", config: false, default: DEFAULTS.counts.pouch.join(","), type: String
  });

  game.settings.register(MODULE, `name-stash`, {
    name: L("pf2e-autoloot.settings.name-key.stash.name"),
    hint: L("pf2e-autoloot.settings.name-key.hint"),
    scope: "world", config: false, default: DEFAULTS.names.stash, type: String
  });

  game.settings.register(MODULE, `empty-stash`, {
    name: L("pf2e-autoloot.settings.empty-key.stash.name"),
    hint: L("pf2e-autoloot.settings.empty-key.hint"),
    scope: "world", config: false, default: DEFAULTS.emptyChance.stash, type: Number,
    range: { min: 0, max: 100, step: 1 }
  });

  game.settings.register(MODULE, "stashLevelOffset", {
    name: L("pf2e-autoloot.settings.stashLevelOffset.name"),
    hint: L("pf2e-autoloot.settings.stashLevelOffset.hint"),
    scope: "world", config: false, default: DEFAULTS.stashLevelOffset, type: Number, range: { min: -10, max: 10, step: 1 }
  });

  game.settings.register(MODULE, "rarityWeightsJson", {
    name: L("pf2e-autoloot.settings.rarityWeightsJson.name"),
    hint: L("pf2e-autoloot.settings.rarityWeightsJson.hint"),
    scope: "world", config: false, type: String,
    default: JSON.stringify(DEFAULTS.rarityWeights)
  });

  game.settings.register(MODULE, "maxStack", {
    name: L("pf2e-autoloot.settings.maxStack.name"),
    scope: "world", config: false, type: Number, default: DEFAULTS.maxStack, range: { min: 1, max: 50, step: 1 }
  });

  game.settings.register(MODULE, "budgetFraction", {
    name: L("pf2e-autoloot.settings.budgetFraction.name"),
    hint: L("pf2e-autoloot.settings.budgetFraction.hint"),
    scope: "world", config: false, type: Number, default: DEFAULTS.budgetFraction, range: { min: 0.01, max: 1, step: 0.01 }
  });

  game.settings.register(MODULE, "preloadOnReady", {
    name: game.i18n.localize("pf2e-autoloot.settings.preloadOnReady.name"),
    hint: game.i18n.localize("pf2e-autoloot.settings.preloadOnReady.hint"),
    scope: "world",
    config: false,
    type: Boolean,
    default: DEFAULTS.preloadOnReady
  });

  game.settings.register(MODULE, "uniqueRegistryJson", {
    name: L("pf2e-autoloot.settings.uniqueRegistryJson.name"),
    scope: "world", config: false, type: String, default: "{}"
  });

  game.settings.register(MODULE, "customContainersJson", {
    name: L("pf2e-autoloot.settings.custom.title"),
    scope: "world",
    config: false,
    type: String,
    default: "[]"
  });

  game.settings.register(MODULE, "debug", {
    name: "Debug",
    scope: "world", config: false, default: false, type: Boolean
  });

  game.settings.register(MODULE, "customContainersJsonBackup", {
    name: "Custom Containers Backup",
    scope: "world",
    config: false,
    type: String,
    default: ""
  });
});

/* -------------- Helpers -------------- */
function dbg(...args) { if (game.settings.get(MODULE, "debug")) console.debug(MODULE, ...args); }

function weightedSample(list, count, weightFn) {
  if (!list.length || count <= 0) return [];
  const out = [];
  const pool = list.slice();
  while (pool.length && out.length < count) {
    const weights = pool.map(weightFn);
    const total = weights.reduce((a, b) => a + b, 0) || 1;
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < pool.length; idx++) {
      r -= weights[idx];
      if (r <= 0) break;
    }
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}

async function generateStash(actor, partyLevel, opts = {}) {
  const spec = STASH_SPECS[Math.max(1, Math.min(20, partyLevel))];
  if (!spec) return;

  if (!Cache.ready) await preloadCache();
  if (!Cache.ready) return;

  const reg = uniqueRegistry();

  const levelOf = (e) => Number(e.system?.level?.value ?? 0);

  const isPermanent = (e) => {
    const t = e.type;
    return t === "equipment" || t === "weapon" || t === "armor" || t === "shield";
  };

  const isConsumable = (e) => e.type === "consumable";

  const byLevelPermanent = new Map();
  const byLevelConsumable = new Map();

  for (const e of Cache.equipIndex) {
    if (isUnique(e) && reg[uniqueKey(e)]) continue;
    const lvl = levelOf(e);
    if (!lvl) continue;

    if (isPermanent(e)) {
      if (!byLevelPermanent.has(lvl)) byLevelPermanent.set(lvl, []);
      byLevelPermanent.get(lvl).push(e);
    } else if (isConsumable(e)) {
      if (!byLevelConsumable.has(lvl)) byLevelConsumable.set(lvl, []);
      byLevelConsumable.get(lvl).push(e);
    }
  }

  // Padlocked items from a previous preview keep their place.
  const lockedItems = Array.isArray(opts.lockedItems) ? opts.lockedItems : [];
  const lockedKeys = new Set(lockedItems.map(r => r?.flags?.[MODULE]?.source?.id).filter(Boolean));
  const toCreate = lockedItems.map(r => foundry.utils.deepClone(r));

  const weights = rarityWeightFromSetting();
  const itemWeight = (e) => {
    const r = getRarity(e);
    const w = Number(weights[r]) || 1;
    return Math.max(0.0001, w) * (0.9 + Math.random() * 0.2);
  };

  // Permanentes
  for (const [lvlStr, cnt] of Object.entries(spec.perms)) {
    const lvl = Number(lvlStr);
    const pool = (byLevelPermanent.get(lvl) || []).filter((e) => (!isUnique(e) || !reg[uniqueKey(e)]) && !lockedKeys.has(e._id));
    const picked = weightedSample(pool, cnt, itemWeight);
    for (const entry of picked) {
      const doc = await getDocFrom(entry);
      if (!doc) continue;
      const raw = doc.toObject();
      delete raw._id;
      raw.system = raw.system || {};
      raw.system.quantity = 1;
      stampSource(raw, entry);
      toCreate.push(raw);
    }
  }

  // Consumibles
  for (const [lvlStr, cnt] of Object.entries(spec.cons)) {
    const lvl = Number(lvlStr);
    const pool = (byLevelConsumable.get(lvl) || []).filter((e) => (!isUnique(e) || !reg[uniqueKey(e)]) && !lockedKeys.has(e._id));
    const picked = weightedSample(pool, cnt, itemWeight);
    for (const entry of picked) {
      const doc = await getDocFrom(entry);
      if (!doc) continue;
      const raw = doc.toObject();
      delete raw._id;
      raw.system = raw.system || {};
      raw.system.quantity = 1;
      stampSource(raw, entry);
      toCreate.push(raw);
    }
  }

  // Monedas (nuevo sistema PF2E/SF2E: currency en el actor, no ítems de "treasure")
  let currencyAdded = false;

  // Total Value covers the whole haul, items included, so the coins are only
  // what is left after the fixed item selection has been paid for.
  const stashAllowance = getContainerBudget("stash", partyLevel) + additionalPCBudget(partyLevel, false);
  const stashItemsValue = itemsValueGP(toCreate);
  const stashCoinBudget = Math.max(0, round2(stashAllowance - stashItemsValue));
  const specCurrency = rollCoinAmount(stashCoinBudget, partyLevel);

  const stashCurrency = (opts.lockedCurrency && hasAnyCurrencyObj(opts.lockedCurrency))
    ? foundry.utils.deepClone(opts.lockedCurrency)
    : (specCurrency > 0 ? currencyFromBudgetGP(specCurrency) : {});

  if (shouldPreview(opts)) {
    const lockedValue = itemsValueGP(opts.lockedItems || [])
      + ((opts.lockedCurrency && hasAnyCurrencyObj(opts.lockedCurrency)) ? currencyValueGP(opts.lockedCurrency) : 0);

    const res = await showLootPreview(actor, "stash", toCreate, stashCurrency, {
      items: opts.lockedItems || [],
      currency: opts.lockedCurrency || null
    }, {
      maxBudget: getContainerBudgetMax("stash", partyLevel),
      budget: stashAllowance,
      lockedValue,
      itemsValue: stashItemsValue,
      currencyValue: currencyValueGP(stashCurrency)
    });
    if (res.action === "cancel") return { cancelled: true };
    if (res.action === "reroll") {
      return { reroll: true, lockedItems: res.lockedItems, lockedCurrency: res.lockedCurrency };
    }
    if (typeof opts.onBeforeApply === "function") await opts.onBeforeApply();
  }

  if (hasAnyCurrencyObj(stashCurrency)) {
    currencyAdded = await addCurrencyToActor(actor, stashCurrency);
  }

  let created = [];
  if (toCreate.length) {
    created = await actor.createEmbeddedDocuments("Item", toCreate);
  }

  if (created.length || currencyAdded) {
    ui.notifications?.info(game.i18n.localize("pf2e-autoloot.msg.lootGenerated") || "Loot has been generated.");
  } else {
    ui.notifications?.warn(game.i18n.localize("pf2e-autoloot.msg.lootEmpty") || "This loot is empty.");
  }
}


function rarityWeightFromSetting() {
  let weights = { ...DEFAULTS.rarityWeights };
  try {
    const raw = game.settings.get(MODULE, "rarityWeightsJson");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") weights = Object.assign(weights, parsed);
  } catch (e) { console.warn(MODULE, "rarityWeightsJson parse error", e); }
  return weights;
}

function getRarity(entry) {
  return entry?.system?.traits?.rarity ?? entry?.system?.rarity?.value ?? entry?.system?.traits?.rarity?.value ?? "common";
}

function isUnique(entry) { return getRarity(entry) === "unique"; }

function priceToGP(item) {
  const sys = item?.system || {};
  const p = sys.price || {};
  let gp = 0;

  if (typeof p.value === "number") {
    gp = p.value;
  } else if (p.value && typeof p.value === "object") {
    const v = p.value;
    gp =
      (Number(v.gp || 0)) +
      (Number(v.pp || 0) * 10) +
      (Number(v.sp || 0) / 10) +
      (Number(v.cp || 0) / 100);
  } else if (typeof p.gp !== "undefined") {
    gp = Number(p.gp) || 0;
  }

  if (!Number.isFinite(gp) || gp <= 0) return 0;

  if (typeof p.per === "number" && p.per > 1) {
    gp = gp / p.per;
  }
  return gp;
}

function priceFromIndex(entry) {
  const p = entry?.system?.price;
  if (!p) return 0;
  let gp = 0;

  if (typeof p.value === "number") {
    gp = p.value;
  } else if (p.value && typeof p.value === "object") {
    const v = p.value;
    gp =
      (Number(v.gp || 0)) +
      (Number(v.pp || 0) * 10) +
      (Number(v.sp || 0) / 10) +
      (Number(v.cp || 0) / 100);
  }

  if (!Number.isFinite(gp) || gp <= 0) return 0;

  if (typeof p.per === "number" && p.per > 1) {
    gp = gp / p.per;
  }
  return gp;
}

function getAveragePartyLevel() {
  const partyActor = game.actors?.party;
  let actors = [];

  if (partyActor?.members?.length) {
    actors = partyActor.members
      .map(m => m?.actor || m)
      .filter(a => a && a.type === "character");
  }
  if (!actors.length && canvas.ready) {
    actors = canvas.tokens.placeables
      .map(t => t.actor)
      .filter(a => a?.type === "character" && a.hasPlayerOwner);
  }
  if (!actors.length) {
    actors = game.actors.filter(a => a.type === "character" && a.hasPlayerOwner);
  }

  const levels = actors
    .map(a => Number(a.system?.details?.level?.value ?? 1))
    .filter(n => Number.isFinite(n) && n > 0);

  const avg = levels.length ? Math.round(levels.reduce((s, n) => s + n, 0) / levels.length) : 1;
  const clamped = Math.max(1, Math.min(20, avg));
  dbg("avgPartyLevel", { levels, avg, clamped, count: levels.length });
  return clamped;
}

function getPartySize() {
  let actors = [];
  const partyActor = game.actors?.party;
  if (partyActor?.members?.length) {
    actors = partyActor.members
      .map(m => m?.actor || m)
      .filter(a => a && a.type === "character");
  }
  if (!actors.length && canvas.ready) {
    actors = canvas.tokens.placeables
      .map(t => t.actor)
      .filter(a => a?.type === "character" && a.hasPlayerOwner);
  }
  if (!actors.length) {
    actors = game.actors.filter(a => a.type === "character" && a.hasPlayerOwner);
  }
  return actors.length || 0;
}


async function mintCreditsFromBudget(budget, toCreate) {
  if (budget.gp <= 0) return;

  const credstickEntry = Cache.equipIndex.find(e =>
    e.type === "treasure" &&
    e.name.toLowerCase().includes("credstick")
  );

  if (!credstickEntry) return;

  const doc = await getDocFrom(credstickEntry);
  const raw = doc.toObject();
  delete raw._id;

  raw.system.quantity = Math.floor(budget.gp * 10);
  budget.gp = 0;

  toCreate.push(raw);
}


async function getAllEquipmentPacks() {
  const packIds = game.settings.get(MODULE, "pack-equipment")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const packs = await Promise.all(
    packIds.map(async id => {
      const pack = game.packs.get(id);
      if (!pack) console.warn(`${MODULE}: Missing compendium ${id}`);
      return pack;
    })
  );
  return packs.filter(Boolean);
}

function nameMatches(actorName, key) {
  const regex = new RegExp(game.settings.get(MODULE, `name-${key}`), "i");
  return regex.test(actorName ?? "");
}

async function buildKCTGFolderMap(pack) {
  const map = {};
  try {
    if (pack?.folders && pack.folders.size) {
      for (const f of pack.folders) {
        const folder = Array.isArray(f) ? f[1] : f;
        if (folder?.id) map[folder.id] = folder.name;
      }
    }
  } catch (e) { /* ignore */ }
  if (!Object.keys(map).length) Object.assign(map, KCTG_FOLDER_FALLBACK);
  return map;
}

function filterKCTGByFolders(index, folderMap, includeNames = null, excludeNames = null) {
  const inc = includeNames ? new Set(includeNames) : null;
  const exc = excludeNames ? new Set(excludeNames) : null;
  return index.filter(e => {
    const fname = folderMap[e.folder] || "";
    if (inc && !inc.has(fname)) return false;
    if (exc && exc.has(fname)) return false;
    return true;
  });
}

function uniqueRegistry() {
  try {
    return JSON.parse(game.settings.get(MODULE, "uniqueRegistryJson") || "{}") || {};
  } catch { return {}; }
}

async function uniqueRegistrySet(obj) {
  await game.settings.set(MODULE, "uniqueRegistryJson", JSON.stringify(obj));
}

function uniqueKey(entry) {
  return `${entry.__pack || "unknown"}:${entry._id}`;
}

function uniqueRegistryDelete(key) {
  const reg = uniqueRegistry();
  if (reg[key]) {
    delete reg[key];
    game.settings.set(MODULE, "uniqueRegistryJson", JSON.stringify(reg));
  }
}

/**
 * Stamps the compendium origin on a generated item.
 * Lets the preview open the real item sheet and keeps the unique registry
 * able to release entries when loot is rerolled.
 */
function stampSource(raw, entry) {
  if (!raw || !entry) return raw;
  raw.flags = raw.flags || {};
  raw.flags[MODULE] = raw.flags[MODULE] || {};
  raw.flags[MODULE].source = {
    pack: entry.__pack || null,
    id: entry._id || null,
    unique: !!isUnique(entry)
  };
  return raw;
}

function sourceUuid(raw) {
  const src = raw?.flags?.[MODULE]?.source;
  if (!src?.pack || !src?.id) return null;
  return `Compendium.${src.pack}.Item.${src.id}`;
}

/** Total gp value of a currency object (credits for SF2e). */
function currencyValueGP(cur) {
  if (!cur) return 0;
  if (IS_SF2E) return (Number(cur.credits) || 0) / 10;
  return (Number(cur.pp) || 0) * 10
    + (Number(cur.gp) || 0)
    + (Number(cur.sp) || 0) / 10
    + (Number(cur.cp) || 0) / 100;
}

/** Total gp value of a list of raw item data. */
function itemsValueGP(list) {
  let total = 0;
  for (const raw of (list || [])) {
    const q = Math.max(1, Number(raw?.system?.quantity) || 1);
    total += (Number(priceToGP(raw)) || 0) * q;
  }
  return total;
}

function uniqueKeyFromItem(item) {
  const src = item?.flags?.[MODULE]?.source;
  if (!src?.pack || !src?.id) return null;
  return `${src.pack}:${src.id}`;
}


// ------------------ CUSTOM CONTAINERS ------------------

const SETTING_KEY = "customContainersJson";

function CC() {
  return globalThis?.pf2eAutolootCustom || null;
}

function isCustomType(typeStr) {
  return /^custom:/.test(String(typeStr || ""));
}

function readList() {
  try {
    const raw = game.settings.get(MODULE, SETTING_KEY) || "[]";
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
async function writeList(list) {
  await game.settings.set(MODULE, SETTING_KEY, JSON.stringify(list ?? []));
}

function buildRegexFromPatterns(patterns) {
  const parts = String(patterns || "")
    .split(",").map(s => s.trim()).filter(Boolean)
    .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return parts.length ? `(?:${parts.join("|")})` : "";
}

function nextDefaultName(base, existing) {
  const taken = new Set(existing.map(c => c.name));
  let n = 1;
  while (taken.has(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}

function categoriesToString(cats) {
  const arr = Array.isArray(cats) ? cats : String(cats || "").split(",").map(s => s.trim());
  const uniq = [...new Set(arr.filter(Boolean))];
  return uniq.join(", ");
}

function stringToCategories(s) {
  return String(s || "")
    .split(",").map(x => x.trim().toLowerCase())
    .filter(Boolean);
}

function parseCountRange(s, fallback = [1, 5]) {
  const parts = String(s || "").split(",").map(n => Number(n.trim())).filter(Number.isFinite);
  if (parts.length === 2) return [Math.min(parts[0], parts[1]), Math.max(parts[0], parts[1])];
  return fallback;
}

const API = {
  list() { return readList(); },
  async set(list) { await writeList(list); },

  async add() {
    const base = game.i18n.localize("pf2e-autoloot.custom.containerNoun") || "Contenedor";
    const list = readList();
    const name = nextDefaultName(base, list);
    const id = `c-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
    const entry = {
      id,
      name,
      patterns: name,
      regex: buildRegexFromPatterns(name),
      categories: "equipment, armor, weapon, consumable, treasure, coins, container",
      emptyChance: 25,
      countRange: "1, 5"
    };
    list.push(entry);
    await writeList(list);
    return entry;
  },

  async remove(id) {
    const list = readList().filter(c => c.id !== id);
    await writeList(list);
  },

  async update(id, patch = {}) {
    const list = readList();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return;
    const cur = { ...list[idx], ...patch };

    if (typeof patch.patterns !== "undefined") {
      cur.regex = buildRegexFromPatterns(cur.patterns);
    }

    if (typeof patch.categories !== "undefined") {
      cur.categories = categoriesToString(patch.categories);
    }

    if (typeof patch.countRange !== "undefined") {
      const [mn, mx] = parseCountRange(patch.countRange);
      cur.countRange = `${mn}, ${mx}`;
    }
    list[idx] = cur;
    await writeList(list);
  },

  matchByName(actorName) {
    const list = readList();
    for (const c of list) {
      const rx = c.regex ? new RegExp(c.regex, "i") : null;
      if (rx && rx.test(actorName ?? "")) return c;
    }
    return null;
  },

  getById(id) { return readList().find(c => c.id === id) || null; },

  typeStringFor(id) { return `custom:${id}`; },
  parseType(typeStr) {
    if (!typeStr || typeof typeStr !== "string") return null;
    const m = typeStr.match(/^custom:(.+)$/);
    return m ? (this.getById(m[1]) || null) : null;
  },

  getCountRangeFor(typeStr) {
    const def = this.parseType(typeStr);
    if (!def) return null;
    return parseCountRange(def.countRange, [1, 5]);
  },

  getAllowedCategoriesFor(typeStr) {
    const def = this.parseType(typeStr);
    if (!def) return [];
    return stringToCategories(def.categories);
  },

  getEmptyChanceFor(typeStr) {
    const def = this.parseType(typeStr);
    if (!def) return null;
    const n = Number(def.emptyChance);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 25;
  },

  allAsPromptOptions() {
    return readList().map(c => ({ value: this.typeStringFor(c.id), label: c.name }));
  }
};

if (!window.pf2eAutolootCustom) window.pf2eAutolootCustom = API;

/* ---------------- Preload Cache ---------------- */
async function preloadCache() {
  const packEquipList = await getAllEquipmentPacks();
  const packKctgId = game.settings.get(MODULE, "pack-kctg") || DEFAULTS.packs.kctg;
  const packKctg = game.packs.get(packKctgId);

  if (!packEquipList.length) {
    ui.notifications.error(`${MODULE}: No valid equipment compendiums found`);
    return;
  }

  const fields = [
    "name", "type", "img", "folder",
    "system.level.value",
    "system.traits.rarity", "system.rarity.value",
    "system.price.value", "system.price.per",
    "system.quantity",

    "system.traits.value",
    "system.traits.otherTags",

    "system.group",
    "system.category",
    "system.baseItem",

    "system.usage.type",
    "system.usage.value"
  ];

  const equipIndex = [];
  for (const pack of packEquipList) {
    const index = await pack.getIndex({ fields });
    equipIndex.push(...index.map(e => ({ ...e, __pack: pack.collection })));
  }

  Cache.equipIndex = equipIndex;
  Cache.equipPack = packEquipList[0];
  if (packKctg) {
    const kctgIndex = await packKctg.getIndex({ fields });
    Cache.kctgIndex = kctgIndex.map(e => ({ ...e, __pack: packKctg.collection }));
    Cache.kctgPack = packKctg;
    Cache.kctgFolders = await buildKCTGFolderMap(packKctg);
  } else {
    Cache.kctgIndex = [];
    Cache.kctgPack = null;
    Cache.kctgFolders = {};
  }

  Cache.ready = true;

  console.log(`${MODULE} | Preload done`, {
    equipIndex: Cache.equipIndex.length,
    kctgIndex: Cache.kctgIndex.length
  });
}

Hooks.once("ready", async () => {
  try {
    const key = `${MODULE}.preloadOnReady`;
    const hasSetting = game.settings?.settings?.has?.(key);
    const preload = hasSetting ? game.settings.get(MODULE, "preloadOnReady") : DEFAULTS.preloadOnReady;

    if (preload) await preloadCache();

    game.modules.get(MODULE).api = { preloadCache, cache: Cache };
    console.log(`${MODULE} | Ready`);
  } catch (e) {
    console.error(`${MODULE} ready error`, e);
  }
});

/* -------------- Pooling ---------------- */
function getContainerTypeByName(name) {
  const isBarrel = nameMatches(name, "barrel");
  const isCrate = nameMatches(name, "crate");
  const isChest = nameMatches(name, "chest");
  const isPouch = nameMatches(name, "pouch");
  const isStash = nameMatches(name, "stash");
  if (isBarrel) return "barrel";
  if (isCrate) return "crate";
  if (isChest) return "chest";
  if (isPouch) return "pouch";
  if (isStash) return "stash";

  // Intento custom por nombre
  const def = CC()?.matchByName?.(name);
  if (def?.id) return CC().typeStringFor(def.id);

  return null;
}

function isCustomContainerType(t) {
  return typeof t === "string" && t.startsWith("custom:");
}

// === Helpers de tokens ===
function getTraitSet(entry) {
  const arr =
    entry?.system?.traits?.value ??
    entry?.["system.traits.value"] ??
    [];
  return new Set(arr.map(s => String(s).toLowerCase()));
}

function alchBucketFor(entry) {
  const sys = entry.system ?? {};
  const name = String(entry.name || "");
  const traits = new Set(
    (Array.isArray(sys.traits?.value) ? sys.traits.value : [])
      .map(s => String(s).toLowerCase())
  );

  const rawOther = sys.traits?.otherTags;
  const otherTags = new Set(
    Array.isArray(rawOther)
      ? rawOther.map(s => String(s).toLowerCase())
      : (typeof rawOther === "string"
        ? rawOther.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
        : [])
  );

  const cat = (sys.category ?? entry["system.category"] ?? "").toLowerCase();
  const type = entry.type;
  const tok = (id) => `equipment:${id}`;
  const isAlchemical = traits.has("alchemical") || otherTags.has("alchemical");

  if (otherTags.has("alchemical-food")) return tok("alchemical-food");
  if (otherTags.has("herbal")) return tok("alchemical-plants");
  if (otherTags.has("alchemical-tool")) return tok("alchemical-tools");
  if (otherTags.has("bottled-monstrosities")) return tok("bottled-monstrosities");
  if (otherTags.has("drugs")) return tok("drugs");

  if (cat === "poison" || traits.has("poison")) return tok("alchemical-poisons");
  if (cat === "drug") return tok("drugs");
  if (cat === "ammunition" || type === "ammo") return tok("alchemical-ammunition");
  if (cat === "bomb" || traits.has("bomb")) return tok("alchemical-bombs");
  if (cat === "elixir" || /(^|\W)elixir(\W|$)/i.test(name)) return tok("alchemical-elixirs");

  if (isAlchemical) return tok("alchemical-other");
  return null;
}

function getConsumableCategory(e) {
  const c = e?.system?.category ?? e?.["system.category"];
  return c ? String(c).toLowerCase() : null;
}

function buildTokenSet(e) {
  const tok = new Set();
  const sys = e.system ?? {};
  const type = e.type;

  if (type) {
    tok.add(`type:${type}`);
    const big =
      type === "backpack" ? "container" : type;
    tok.add(`group:${big}`);
  }

  if (sys.group) tok.add(`item.system.group:${sys.group}`);
  if (sys.baseItem) tok.add(`item.system.baseItem:${sys.baseItem}`);
  if (sys.category) tok.add(`item.system.category:${sys.category}`);

  if (type === "armor") {
    const cat = sys.category ?? sys.armor?.category;
    if (cat) tok.add(`armor:${cat}`);
  }

  if (type === "consumable") {
    tok.add("group:consumable");
  }

  const ab = alchBucketFor(e);
  if (ab) {
    tok.add(ab);
    tok.add("equipment:alchemical-items");
  }

  const usageRaw =
    sys?.usage?.type ??
    e?.["system.usage.type"] ??
    sys?.usage?.value ??
    e?.["system.usage.value"] ??
    "";
  const usage = String(usageRaw).toLowerCase();
  if (usage === "worn") tok.add("equipment:worn-items");

  if (type === "equipment") {
    const traits = getTraitSet(e);
    const forbidden = new Set([
      "arcane", "occult", "divine", "primal",
      "magical", "invested", "alchemical", "precious"
    ]);
    let isAdv = true;
    for (const f of forbidden) if (traits.has(f)) { isAdv = false; break; }
    if (isAdv) tok.add("equipment:adventuring-gear");

    if (traits.has("precious")) tok.add("equipment:materials");
    if (traits.has("snare")) tok.add("equipment:snares");
    if (traits.has("spellheart")) tok.add("equipment:spellhearts");
    if (traits.has("staff")) tok.add("equipment:staves");
    if (traits.has("tattoo")) tok.add("equipment:tattoos");
    if (traits.has("wand")) tok.add("equipment:wands");
  }

  return tok;
}

function filterPools(containerType, partyLevel) {
  const cratesOffset = Number(game.settings.get(MODULE, "crateLevelOffset") ?? DEFAULTS.crateLevelOffset);
  let equip = [], kctg = [];

  // ----- CUSTOM -----
  if (isCustomType(containerType)) {
    const allowedCats = new Set(CC()?.getAllowedCategoriesFor?.(containerType) || []);
    const filters = new Set(CC()?.getFiltersFor?.(containerType) || []);

    const allowedTypes = new Set(["equipment", "weapon", "armor", "shield", "consumable", "treasure", "ammo", "container"]);
    const baseEquip = Cache.equipIndex.filter(e => allowedTypes.has(e.type));

    equip = baseEquip.filter(e => allowedCats.size ? allowedCats.has(e.type) : true);

    if (filters.size) {
      const filtersSet = new Set([...filters].map(f => String(f).trim()));
      const requestedConsumableCats = [...filters]
        .map(f => f.match(/^item\.system\.category:(.+)$/i))
        .filter(Boolean)
        .map(m => m[1].toLowerCase());
      const wantsConsumableCats = requestedConsumableCats.length > 0;

      const alchLeaves = [...filters].filter(f => /^equipment:alchemical-(?!items$)/.test(f));
      const hasAlchLeaves = alchLeaves.length > 0;
      const onlyAlchParent = filters.size === 1 && filters.has("equipment:alchemical-items");

      const wantsOnlyMaterials = filtersSet.size === 1 && filtersSet.has("equipment:materials");
      const wantsMaterialsAmongOthers = filtersSet.has("equipment:materials");

      const wantsOnlySnares = filtersSet.size === 1 && filtersSet.has("equipment:snares");
      const wantsSnaresAmongOthers = filtersSet.has("equipment:snares");

      const wantsOnlySpellhearts = filtersSet.size === 1 && filtersSet.has("equipment:spellhearts");
      const wantsSpellheartsAmongOthers = filtersSet.has("equipment:spellhearts");

      const wantsOnlyStaves = filtersSet.size === 1 && filtersSet.has("equipment:staves");
      const wantsStavesAmongOthers = filtersSet.has("equipment:staves");

      const wantsOnlyTattoos = filtersSet.size === 1 && filtersSet.has("equipment:tattoos");
      const wantsTattoosAmongOthers = filtersSet.has("equipment:tattoos");

      const wantsOnlyWands = filtersSet.size === 1 && filtersSet.has("equipment:wands");
      const wantsWandsAmongOthers = filtersSet.has("equipment:wands");

      const wantsOnlyWorn = (filtersSet.size === 1 && filtersSet.has("equipment:worn-items"));
      const wantsWornAmongOthers = filtersSet.has("equipment:worn-items");

      equip = equip.filter(e => {

        let traitsSet = null;
        const traits = () => (traitsSet ??= getTraitSet(e));

        if (hasAlchLeaves) {
          const bucket = alchBucketFor(e);
          return !!bucket && alchLeaves.includes(bucket);
        }

        if (onlyAlchParent) {
          return !!alchBucketFor(e);
        }

        if (wantsOnlyWorn) {
          const usageRaw =
            e?.system?.usage?.type ??
            e?.["system.usage.type"] ??
            e?.system?.usage?.value ??
            e?.["system.usage.value"] ??
            "";
          return String(usageRaw).toLowerCase() === "worn";
        }

        if (wantsOnlyMaterials) {
          if (e.type !== "equipment") return false;
          return traits().has("precious");
        }

        if (wantsOnlySnares) {
          if (e.type !== "equipment") return false;
          return traits().has("snare");
        }

        if (wantsOnlySpellhearts) {
          if (e.type !== "equipment") return false;
          return traits().has("spellheart");
        }

        if (wantsOnlyStaves) {
          if (e.type !== "equipment") return false;
          return traits().has("staff");
        }

        if (wantsOnlyTattoos) {
          if (e.type !== "equipment") return false;
          return traits().has("tattoo");
        }

        if (wantsOnlyWands) {
          if (e.type !== "equipment") return false;
          return traits().has("wand");
        }

        if (wantsConsumableCats) {
          if (e.type !== "consumable") return false;
          const cat = getConsumableCategory(e);
          return !!cat && requestedConsumableCats.includes(cat);
        }

        const tokens = buildTokenSet(e);

        if (wantsMaterialsAmongOthers && tokens.has("equipment:materials")) return true;
        if (wantsSnaresAmongOthers && tokens.has("equipment:snares")) return true;
        if (wantsSpellheartsAmongOthers && tokens.has("equipment:spellhearts")) return true;
        if (wantsStavesAmongOthers && tokens.has("equipment:staves")) return true;
        if (wantsTattoosAmongOthers && tokens.has("equipment:tattoos")) return true;
        if (wantsWandsAmongOthers && tokens.has("equipment:wands")) return true;
        if (wantsWornAmongOthers && tokens.has("equipment:worn-items")) return true;

        for (const f of filtersSet) if (tokens.has(f)) return true;
        return false;
      });
    }

    kctg = [];

    const reg = uniqueRegistry();
    equip = equip.filter(e => !isUnique(e) || !reg[uniqueKey(e)]);
    return { equip, kctg };
  }

  // ----- NO CUSTOM  -----
  if (containerType === "barrel") {
    if (Cache.kctgIndex.length) {
      const include = new Set(["Food & Produce", "Tavern & Prepared", "Fish & Game", "Provisions"]);
      kctg = filterKCTGByFolders(Cache.kctgIndex, Cache.kctgFolders, include, null);
    }
    equip = Cache.equipIndex.filter(e => e.type === "treasure");

  } else if (containerType === "crate") {
    const maxLevel = Math.max(0, partyLevel + cratesOffset);
    equip = Cache.equipIndex.filter(e => {
      const lvl = Number(e.system?.level?.value ?? 0);
      if (lvl > maxLevel) return false;
      return e.type === "equipment" || e.type === "backpack";
    });
    if (Cache.kctgIndex.length) {
      const exclude = new Set(["Food & Produce", "Tavern & Prepared", "Fish & Game", "Ore & Metals", "Raw Materials", "Timber & Lumber", "Gemstones", "Animals & Livestock"]);
      kctg = filterKCTGByFolders(Cache.kctgIndex, Cache.kctgFolders, null, exclude);
    }

  } else if (containerType === "chest") {
    const minChestOffset = Number(game.settings.get(MODULE, "minimumChestLevelOffset") ?? DEFAULTS.minimumChestLevelOffset);
    const maxChestOffset = Number(game.settings.get(MODULE, "maximumChestLevelOffset") ?? DEFAULTS.maximumChestLevelOffset);
    const minL = Math.max(0, partyLevel - minChestOffset), maxL = partyLevel + maxChestOffset;
    const allowed = new Set(["equipment", "weapon", "armor", "shield", "consumable", "treasure", "ammo", "container"]);
    equip = Cache.equipIndex.filter(e =>
      allowed.has(e.type) && Number(e.system?.level?.value ?? 0) >= minL && Number(e.system?.level?.value ?? 0) <= maxL
    );
    if (Cache.kctgIndex.length) {
      const exclude = new Set(["Food & Produce", "Tavern & Prepared", "Fish & Game", "Bone & Hides", "Instruments", "Animals & Livestock"]);
      kctg = filterKCTGByFolders(Cache.kctgIndex, Cache.kctgFolders, null, exclude);
    }

  } else if (containerType === "pouch") {
    equip = [];
    kctg = [];
  }


  const reg = uniqueRegistry();
  equip = equip.filter(e => !isUnique(e) || !reg[uniqueKey(e)]);
  kctg = kctg.filter(e => !isUnique(e) || !reg[uniqueKey(e)]);
  return { equip, kctg };
}

async function getDocFrom(entry) {
  const packId = entry.__pack;
  const docId = entry._id;
  if (!packId || !docId) return null;

  const cacheKey = `${packId}:${docId}`;
  if (Cache.docCache.has(cacheKey)) return Cache.docCache.get(cacheKey);

  const pack = game.packs.get(packId);
  if (!pack) {
    console.warn(`${MODULE}: pack not found`, packId, entry?.name);
    return null;
  }

  const doc = await pack.getDocument(docId);
  if (doc) Cache.docCache.set(cacheKey, doc);
  return doc;
}

/**
 * Source column each container type draws its budget from (Table 10-9).
 *   pouch, crate, barrel -> Currency per Additional PC
 *   chest                -> Party Currency
 *   stash                -> Total Value (it also uses the permanent/consumable
 *                           item-level filters from STASH_SPECS)
 * Custom containers keep using Total Value.
 */
function containerBaseValue(containerType, partyLevel) {
  const lvl = Math.max(1, Math.min(20, Number(partyLevel) || 1));
  switch (containerType) {
    case "pouch":
    case "crate":
    case "barrel":
      return PF2E_CURRENCY_PER_ADDITIONAL_PC[lvl] ?? 0;
    case "chest":
      return STASH_SPECS[lvl]?.currency ?? 0;
    case "stash":
    default:
      return PF2E_TREASURE_BY_LEVEL[lvl] ?? PF2E_TREASURE_BY_LEVEL[1];
  }
}

/** The stash is a fixed set piece, so the budget fraction never scales it. */
function ignoresBudgetFraction(containerType) {
  return containerType === "stash";
}

/** Budget fraction setting, normalised to a 0-1 multiplier. */
function getBudgetFraction() {
  let frac = game.settings.get(MODULE, "budgetFraction");
  if (typeof frac === "string") frac = frac.trim().replace(",", ".").replace("%", "");
  frac = Number(frac);
  if (!Number.isFinite(frac) || frac <= 0) frac = DEFAULTS.budgetFraction;
  if (frac > 1) frac = frac > 100 ? 1 : frac / 100;
  return frac;
}

/** Extra coin allowance for parties larger than four. */
function additionalPCBudget(partyLevel, applyFraction = true) {
  const lvl = Math.max(1, Math.min(20, Number(partyLevel) || 1));
  const extraPCs = Math.max(0, getPartySize() - 4);
  if (!extraPCs) return 0;
  const per = PF2E_CURRENCY_PER_ADDITIONAL_PC[lvl] ?? 0;
  const frac = applyFraction ? getBudgetFraction() : 1;
  return round2(per * extraPCs * frac * (IS_SF2E ? 10 : 1));
}

/** Rounds to copper precision so budgets never drift on floating point. */
function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/**
 * Full table value for this container type at this level, before the
 * budget fraction is applied. Shown in the preview as the reference ceiling.
 */
function getContainerBudgetMax(containerType, partyLevel) {
  const base = containerBaseValue(containerType, partyLevel);
  return round2(base * (IS_SF2E ? 10 : 1));
}

/**
 * Budget this container actually gets: its table value scaled by the
 * configured budget fraction. Kept at copper precision, so a level 1 pouch
 * at the default 1% is 1.75 gp rather than a rounded 1 gp.
 */
function getContainerBudget(containerType, partyLevel) {
  const base = containerBaseValue(containerType, partyLevel);
  const frac = ignoresBudgetFraction(containerType) ? 1 : getBudgetFraction();
  return round2(base * frac * (IS_SF2E ? 10 : 1));
}

function getCountRange(containerType) {
  if (isCustomContainerType(containerType) && CC()) {
    const pair = CC().getCountRangeFor?.(containerType);
    if (Array.isArray(pair) && pair.length === 2) return pair;
    return [1, 5];
  }

  const raw = game.settings.get(MODULE, `count-${containerType}`);
  const parts = String(raw).split(",").map(n => Number(n.trim())).filter(Number.isFinite);
  if (parts.length === 2) return [Math.min(parts[0], parts[1]), Math.max(parts[0], parts[1])];
  return DEFAULTS.counts[containerType];
}

function getQuotas(containerType, typeCount) {
  const chestQuotas = { ammo: 2, "consumable-ammo": 2, consumable: 6, weapon: 4, armor: 4, shield: 2, treasure: 8, equipment: 8 };
  if (typeof containerType === "string" && containerType.startsWith("custom:")) {
    return {};
  }
  switch (containerType) {
    case "barrel": return { treasure: typeCount, equipment: typeCount };
    case "crate": return {};
    case "chest": return { ...chestQuotas };
    case "pouch": return {};
    case "stash": return {};
    default: return {};
  }
}

/* -------------- Loot preview -------------- */

function shouldPreview(opts = {}) {
  if (!opts.preview) return false;
  return !!game.settings.get(MODULE, "previewBeforeApply");
}

/** Icon shipped by the system for each currency denomination. */
function currencyIcon(key) {
  const sys = IS_SF2E ? "sf2e" : "pf2e";
  const file = {
    pp: "platinum-pieces",
    gp: "gold-pieces",
    sp: "silver-pieces",
    cp: "copper-pieces",
    upb: "upb",
    credits: "gold-pieces"
  }[key] || "gold-pieces";
  return `systems/${sys}/icons/equipment/treasure/currency/${file}.webp`;
}

function _previewCoinRows(currency) {
  const order = IS_SF2E ? ["credits", "upb"] : ["pp", "gp", "sp", "cp"];
  const rows = [];
  for (const k of order) {
    const v = Number(currency?.[k]) || 0;
    if (v > 0) rows.push({ key: k, value: v });
  }
  return rows;
}

/**
 * Shows the generated loot and lets the GM apply it, reroll it or cancel.
 * Items can be padlocked: locked entries survive a reroll untouched and their
 * value is deducted from the budget of the next roll.
 *
 * Returns { action: "accept" | "reroll" | "cancel", lockedItems, lockedCurrency }.
 * Nothing is written to the actor here.
 */
async function showLootPreview(actor, containerType, items, currency, prevLocked = {}, stats = null) {
  const L = (k, fb) => game.i18n.localize(k) || fb;
  const esc = foundry.utils.escapeHTML;
  const list = Array.isArray(items) ? items : [];

  // Items carried over from a previous roll stay locked.
  const lockedIdx = new Set();
  const prevKeys = new Set((prevLocked.items || []).map(r => sourceUuid(r) || r?.name));
  list.forEach((raw, i) => {
    const key = sourceUuid(raw) || raw?.name;
    if (key && prevKeys.has(key)) lockedIdx.add(i);
  });
  let currencyLocked = !!prevLocked.currency;

  const itemRows = list.map((raw, i) => {
    const qty = Number(raw?.system?.quantity) || 1;
    const img = raw?.img || "icons/svg/item-bag.svg";
    const uuid = sourceUuid(raw);
    const locked = lockedIdx.has(i);
    const nameCell = uuid
      ? `<a class="content-link" draggable="true" data-uuid="${esc(uuid)}">${esc(raw?.name ?? "?")}</a>`
      : `<span>${esc(raw?.name ?? "?")}</span>`;
    return `
      <li class="pf2e-autoloot-row${locked ? " is-locked" : ""}" data-idx="${i}">
        <img class="pf2e-autoloot-thumb" src="${esc(img)}" width="24" height="24" />
        <span class="pf2e-autoloot-name">${nameCell}</span>
        <span class="pf2e-autoloot-qty">&times;${qty}</span>
        <a class="pf2e-autoloot-lock" data-idx="${i}"
           data-tooltip="${esc(L("pf2e-autoloot.preview.lockTip", "Keep this item on reroll"))}">
          <i class="fas ${locked ? "fa-lock" : "fa-lock-open"}"></i>
        </a>
      </li>`;
  }).join("");

  const coinRows = _previewCoinRows(currency);
  const coinHtml = coinRows.map(r => `
      <li class="pf2e-autoloot-row">
        <img class="pf2e-autoloot-thumb" src="${esc(currencyIcon(r.key))}" width="24" height="24" />
        <span class="pf2e-autoloot-name">${esc(L(`pf2e-autoloot.currency.${r.key}`, r.key.toUpperCase()))}</span>
        <span class="pf2e-autoloot-qty">&times;${r.value}</span>
      </li>`).join("");

  const emptyMsg = (!itemRows && !coinHtml)
    ? `<p class="notes">${esc(L("pf2e-autoloot.preview.empty", "This loot came out empty."))}</p>`
    : "";

  const unit = IS_SF2E ? L("pf2e-autoloot.currency.credits", "Credits") : "gp";
  const num = (n) => {
    const v = Number(n) || 0;
    return (Math.round(v * 100) / 100).toLocaleString(game.i18n?.lang || "en");
  };
  const statRow = (labelKey, fallback, value) => `
        <tr>
          <th>${esc(L(labelKey, fallback))}</th>
          <td>${esc(num(value))} ${esc(unit)}</td>
        </tr>`;

  const statsHtml = stats ? `
      <table class="pf2e-autoloot-stats">
        <tbody>
          ${statRow("pf2e-autoloot.preview.statMax", "Max budget for level", stats.maxBudget)}
          ${statRow("pf2e-autoloot.preview.statBudget", "Container budget", stats.budget)}
          ${statRow("pf2e-autoloot.preview.statLocked", "Locked budget", stats.lockedValue)}
          ${statRow("pf2e-autoloot.preview.statItems", "Spent on items", stats.itemsValue)}
          ${statRow("pf2e-autoloot.preview.statCurrency", "Currency generated", stats.currencyValue)}
        </tbody>
        <tfoot>
          <tr>
            <th>${esc(L("pf2e-autoloot.preview.statTotal", "Total value"))}</th>
            <td>${esc(num((Number(stats.itemsValue) || 0) + (Number(stats.currencyValue) || 0)))} ${esc(unit)}</td>
          </tr>
        </tfoot>
      </table>` : "";

  const content = `
    <div class="pf2e-autoloot-preview">
      ${statsHtml}
      ${emptyMsg}
      ${itemRows ? `
        <h4>${esc(L("pf2e-autoloot.preview.items", "Items"))}</h4>
        <ul class="pf2e-autoloot-list" data-list="items">${itemRows}</ul>` : ""}
      ${coinHtml ? `
        <h4 class="pf2e-autoloot-coins-header">
          <span>${esc(L("pf2e-autoloot.preview.currency", "Currency"))}</span>
          <a class="pf2e-autoloot-lock" data-currency-lock
             data-tooltip="${esc(L("pf2e-autoloot.preview.lockCoinTip", "Keep this currency on reroll"))}">
            <i class="fas ${currencyLocked ? "fa-lock" : "fa-lock-open"}"></i>
          </a>
        </h4>
        <ul class="pf2e-autoloot-list${currencyLocked ? " is-locked" : ""}" data-list="coins">${coinHtml}</ul>` : ""}
    </div>`;

  const DV2 = foundry.applications.api.DialogV2;

  const action = await DV2.wait({
    window: {
      title: `${L("pf2e-autoloot.preview.title", "Loot preview")} — ${actor?.name ?? ""}`,
      icon: "fas fa-box-open"
    },
    position: { width: 480 },
    classes: ["pf2e-autoloot-preview-dialog"],
    content,
    buttons: [
      { action: "accept", icon: "fas fa-check", label: L("pf2e-autoloot.preview.accept", "Apply"), default: true, callback: () => "accept" },
      { action: "reroll", icon: "fas fa-dice", label: L("pf2e-autoloot.preview.reroll", "Reroll"), callback: () => "reroll" },
      { action: "cancel", icon: "fas fa-times", label: L("pf2e-autoloot.preview.cancel", "Cancel"), callback: () => "cancel" }
    ],
    close: () => "cancel",
    render: (_event, dialog) => {
      const root = dialog?.element;
      if (!root) return;

      // Padlocks
      root.querySelectorAll(".pf2e-autoloot-lock").forEach(btn => {
        btn.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();

          if (btn.hasAttribute("data-currency-lock")) {
            currencyLocked = !currencyLocked;
            btn.querySelector("i")?.setAttribute("class", `fas ${currencyLocked ? "fa-lock" : "fa-lock-open"}`);
            root.querySelector('[data-list="coins"]')?.classList.toggle("is-locked", currencyLocked);
            return;
          }

          const idx = Number(btn.dataset.idx);
          if (!Number.isFinite(idx)) return;
          const nowLocked = !lockedIdx.has(idx);
          if (nowLocked) lockedIdx.add(idx); else lockedIdx.delete(idx);
          btn.querySelector("i")?.setAttribute("class", `fas ${nowLocked ? "fa-lock" : "fa-lock-open"}`);
          root.querySelector(`.pf2e-autoloot-row[data-idx="${idx}"]`)?.classList.toggle("is-locked", nowLocked);
        });
      });

      // Open the real item sheet from the compendium entry
      root.querySelectorAll("a.content-link[data-uuid]").forEach(link => {
        link.addEventListener("click", async (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          try {
            const doc = await fromUuid(link.dataset.uuid);
            doc?.sheet?.render(true);
          } catch (e) {
            console.warn(`${MODULE} could not open item sheet`, e);
          }
        });
      });
    }
  });

  return {
    action: action ?? "cancel",
    lockedItems: [...lockedIdx].sort((a, b) => a - b).map(i => list[i]).filter(Boolean),
    lockedCurrency: currencyLocked ? foundry.utils.deepClone(currency || {}) : null
  };
}

/* -------------- Core generation -------------- */
async function generateFor(actor, containerType, opts = {}) {

  if (InFlight.has(actor)) { dbg("skip generate: in-flight"); return; }
  InFlight.add(actor);
  try {
    const already = actor.getFlag(MODULE, "rolled");
    if (already && !opts.ignoreRolled) return;
    if (!opts.ignoreRolled && ((actor.items?.size ?? 0) || actorHasAnyCurrency(actor))) {
      await actor.setFlag(MODULE, "rolled", true);
      return;
    }


    let emptyProb = 0;
    if (isCustomContainerType(containerType) && CC()) {
      emptyProb = Number(CC().getEmptyChanceFor?.(containerType) ?? 0);
    } else {
      emptyProb = Number(game.settings.get(MODULE, `empty-${containerType}`)) || 0;
    }

    // Anything the GM padlocked must survive, so the empty-container roll
    // is skipped entirely when a lock is in play.
    const hasLocks = !!(opts.lockedItems?.length) || !!(opts.lockedCurrency && hasAnyCurrencyObj(opts.lockedCurrency));

    const rollEmpty = Math.random() * 100;
    if (!opts.ignoreEmpty && !hasLocks && rollEmpty < emptyProb) {
      await actor.setFlag(MODULE, "rolled", true);
      await actor.setFlag(MODULE, "empty", true);
      ui.notifications?.warn(game.i18n.localize("pf2e-autoloot.msg.lootEmpty") || "This loot is empty.");
      return;
    }

    if (!Cache.ready) await preloadCache();
    if (!Cache.ready) return;

    const partyLevel = getAveragePartyLevel();
    const budget = { gp: getContainerBudget(containerType, partyLevel) };
    const initialBudgetGP = budget.gp;

    if (containerType === "stash") {
      const stashOffset = Number(game.settings.get(MODULE, "stashLevelOffset") ?? DEFAULTS.stashLevelOffset);
      const partyLevel = getAveragePartyLevel();
      const stashMaxLevel = Math.max(0, partyLevel + stashOffset);
      const stashResult = await generateStash(actor, stashMaxLevel, opts);
      if (stashResult?.cancelled) return;
      if (stashResult?.reroll) return stashResult;

      await actor.setFlag(MODULE, "rolled", true);
      await actor.setFlag(MODULE, "containerType", containerType);
      await actor.setFlag(MODULE, "rollTime", Date.now());
      return;
    }

    // ---- POUCH: coins only ----
    if (containerType === "pouch") {
      let coinsObj;
      const pouchCoinBudget = Math.max(0, Number(budget.gp) || 0);
      let pouchRolled = 0;
      if (opts.lockedCurrency && hasAnyCurrencyObj(opts.lockedCurrency)) {
        coinsObj = foundry.utils.deepClone(opts.lockedCurrency);
        pouchRolled = currencyValueGP(coinsObj);
      } else {
        pouchRolled = rollCoinAmount(pouchCoinBudget, partyLevel);
        coinsObj = currencyFromBudgetGP(pouchRolled);
      }

      if (shouldPreview(opts)) {
        const res = await showLootPreview(actor, containerType, [], coinsObj, {
          items: opts.lockedItems || [],
          currency: opts.lockedCurrency || null
        }, {
          maxBudget: getContainerBudgetMax(containerType, partyLevel),
          budget: initialBudgetGP,
          lockedValue: (opts.lockedCurrency && hasAnyCurrencyObj(opts.lockedCurrency)) ? currencyValueGP(opts.lockedCurrency) : 0,
          itemsValue: 0,
          currencyValue: currencyValueGP(coinsObj)
        });
        if (res.action === "cancel") return;
        if (res.action === "reroll") {
          return { reroll: true, lockedItems: res.lockedItems, lockedCurrency: res.lockedCurrency };
        }
        if (typeof opts.onBeforeApply === "function") await opts.onBeforeApply();
      }

      await clearAllCurrency(actor);
      const ok = await addCurrencyToActor(actor, coinsObj);

      await actor.setFlag(MODULE, "rolled", true);
      await actor.setFlag(MODULE, "containerType", containerType);
      await actor.setFlag(MODULE, "rollTime", Date.now());

      if (ok && (coinsObj.pp || coinsObj.gp || coinsObj.sp || coinsObj.cp || coinsObj.credits || coinsObj.upb)) {
        ui.notifications?.info(game.i18n.localize("pf2e-autoloot.msg.lootGenerated") || "Loot has been generated.");
      } else {
        await actor.setFlag(MODULE, "empty", true);
        ui.notifications?.warn(game.i18n.localize("pf2e-autoloot.msg.lootEmpty") || "This loot is empty.");
      }
      return;
    }

    const { equip, kctg } = filterPools(containerType, partyLevel);
    let candidates = [...equip, ...kctg];

    let rangeMin = 1, rangeMax = 5;

    if (isCustomType(containerType) && CC()) {
      emptyProb = Number(CC().getEmptyChanceFor?.(containerType) ?? 0);
      const pair = CC().getCountRangeFor?.(containerType) || [1, 5];
      rangeMin = pair[0];
      rangeMax = pair[1];
    } else {
      emptyProb = Number(game.settings.get(MODULE, `empty-${containerType}`)) || 0;
      [rangeMin, rangeMax] = getCountRange(containerType);
    }

    const avoid = (game.settings.get(MODULE, "avoidNamesRegex") || "").trim();
    if (avoid) {
      const rx = new RegExp(avoid, "i");
      candidates = candidates.filter(e => !rx.test(e.name || ""));
    }

    const reg = uniqueRegistry();

    candidates = candidates.filter(e => (!isUnique(e) || !reg[uniqueKey(e)]));
    candidates = candidates.filter(e => (priceFromIndex(e) || 0) >= 0.01);

    if (!candidates.length) {
      await actor.setFlag(MODULE, "rolled", true);
      await actor.setFlag(MODULE, "empty", true);
      ui.notifications?.warn(game.i18n.localize("pf2e-autoloot.msg.lootEmpty") || "This loot is empty.");
      return;
    }

    dbg("candidates", {
      total: candidates.length,
      leqBudget: candidates.filter(e => priceFromIndex(e) > 0 && priceFromIndex(e) <= budget.gp).length
    });

    if (isCustomContainerType(containerType)) {
      dbg("custom candidates", {
        total: candidates.length,
        sample: candidates.slice(0, 10).map(e => ({
          name: e.name, type: e.type,
          cat: e.system?.category, grp: e.system?.group, base: e.system?.baseItem
        }))
      });
    }

    const minTypes = rangeMin;
    const maxTypes = rangeMax;
    const typeCount = Math.max(minTypes, Math.min(maxTypes, minTypes + Math.floor(Math.random() * (maxTypes - minTypes + 1))));

    const weights = rarityWeightFromSetting();
    const weightedIds = [];
    for (const e of candidates) {
      const r = getRarity(e);
      const w = Number(weights[r]) || 1;
      for (let i = 0; i < Math.max(1, Math.round(w)); i++) weightedIds.push(e._id);
    }

    // Items the GM padlocked in the preview survive the reroll untouched:
    // they keep their slot and their cost comes off the budget.
    const lockedItems = Array.isArray(opts.lockedItems) ? opts.lockedItems : [];
    const toCreate = lockedItems.map(r => foundry.utils.deepClone(r));
    for (const raw of toCreate) {
      const q = Math.max(1, Number(raw?.system?.quantity) || 1);
      budget.gp = Math.max(0, budget.gp - Math.floor(priceToGP(raw) * q));
    }
    let registry = uniqueRegistry();

    if (containerType === "pouch") {
      const addedCurrency = await addCurrencyToActor(actor, currencyFromBudgetGP(budget.gp));

      await actor.setFlag(MODULE, "rolled", true);
      await actor.setFlag(MODULE, "containerType", containerType);
      await actor.setFlag(MODULE, "rollTime", Date.now());

      if (addedCurrency) {
        ui.notifications?.info(
          game.i18n.format("PF2E_AUTOLOOT.GeneratedLoot", {
            actor: actor.name,
            items: 0,
            budget: budget.gp,
          })
        );
      } else {
        ui.notifications?.warn(game.i18n.format("PF2E_AUTOLOOT.EmptyLoot", { actor: actor.name }));
      }

      return;
    }
    else {
      const coinPref = game.settings.get(MODULE, "coinPreference");
      const favorQty = coinPref === "quantity";

      let pairs = candidates
        .map(e => ({ e, p: priceFromIndex(e) }))
        .filter(x => x.p >= 0.01);

      const EPS = 0.03;
      pairs = pairs.map(x => ({ ...x, p: x.p * (1 + (Math.random() * 2 - 1) * EPS) }));

      const maxPerItem = Math.max(1, Number(game.settings.get(MODULE, "maxStack") ?? DEFAULTS.maxStack));
      const banned = new Set();
      // Locked items already occupy their slot; never roll them a second time.
      for (const raw of toCreate) {
        const id = raw?.flags?.[MODULE]?.source?.id;
        if (id) banned.add(id);
      }
      let remainingSlots = Math.max(0, Math.min(typeCount, candidates.length) - toCreate.length);
      let guard = 600;

      const quotas = getQuotas(containerType, typeCount);

      const used = Object.create(null);

      const classifyKind = (raw) => {
        const t = raw.type;
        const traits = new Set(raw.system?.traits?.value ?? []);
        if (t === "ammo") return "ammo";
        if (t === "consumable") {
          if (traits.has("ammunition") || traits.has("ammo") || traits.has("ammunition-arcane")) return "consumable-ammo";
          return "consumable";
        }
        if (t === "weapon") return "weapon";
        if (t === "armor") return "armor";
        if (t === "shield") return "shield";
        if (t === "treasure") return "treasure";
        return "equipment";
      };

      const weights = rarityWeightFromSetting();
      function score(x, budgetGP, cap) {
        const r = getRarity(x.e);
        let s = Number(weights[r]) || 1;

        if (favorQty) {
          const rel = x.p / Math.max(1, cap);
          s *= 1 / Math.max(0.2, Math.min(3, rel));
        } else {
          const rel = x.p / Math.max(1, budgetGP);
          s *= 1 / Math.sqrt(Math.max(0.5, rel));
        }

        s *= (0.9 + Math.random() * 0.2);
        return Math.max(0.0001, s);
      }

      function weightedPick(list, budgetGP, cap) {
        let total = 0;
        const acc = [];
        for (const x of list) {
          const w = score(x, budgetGP, cap);
          total += w;
          acc.push(total);
        }
        const r = Math.random() * total;
        const idx = acc.findIndex(v => v >= r);
        return list[Math.max(0, idx)];
      }

      while (remainingSlots > 0 && budget.gp > 0 && guard-- > 0) {
        const affordable = pairs.filter(x => !banned.has(x.e._id) && x.p <= budget.gp);
        if (!affordable.length) break;

        // Caps are kept at copper precision: flooring them to whole gp made
        // every cap collapse to 0 on small budgets.
        let perSlotCap = Math.max(0.01, budget.gp / remainingSlots);
        let cap = Math.min(budget.gp * 0.60, perSlotCap);

        let pool = affordable.filter(x => x.p <= cap);
        let relaxSteps = 0;
        while (!pool.length && relaxSteps < 5) {
          cap = relaxSteps < 3 ? Math.min(budget.gp, cap * (relaxSteps === 0 ? 1.5 : relaxSteps === 1 ? 2 : 3))
            : (relaxSteps === 3 ? budget.gp * 0.60 : budget.gp);
          pool = affordable.filter(x => x.p <= cap);
          relaxSteps += 1;
        }
        if (!pool.length) break;

        const pick = weightedPick(pool, budget.gp, cap);
        const entry = pick.e;

        const doc = await getDocFrom(entry);
        if (!doc) { banned.add(entry._id); continue; }
        const raw = doc.toObject(); delete raw._id;
        stampSource(raw, entry);

        const unitRaw = priceToGP(raw);
        if (unitRaw <= 0 || unitRaw > budget.gp) { banned.add(entry._id); continue; }
        const unit = Math.max(0.01, unitRaw);

        const kind = classifyKind(raw);
        used[kind] = used[kind] || 0;
        if (quotas[kind] != null && used[kind] >= quotas[kind]) { banned.add(entry._id); continue; }

        if (unit > cap && remainingSlots > 1) {
          remainingSlots = 1;
        }

        const maxByBudget = Math.max(1, Math.floor(cap / unit));
        let qty = 1;
        if (favorQty) {
          const isAmmo = raw.type === "ammo";
          const isConsumable = raw.type === "consumable";
          if (isAmmo || isConsumable) {
            const softCap = isAmmo ? 20 : 5;
            const hard = Math.min(maxPerItem, softCap, Math.floor(budget.gp / unit), maxByBudget);
            if (hard >= 2) qty = 1 + Math.floor(Math.random() * hard);
          }
        } else {
          qty = Math.max(1, Math.min(
            maxPerItem,
            Math.floor(budget.gp / unit),
            maxByBudget,
            1 + Math.floor(Math.random() * maxPerItem)
          ));
        }

        raw.system = raw.system || {};
        raw.system.quantity = qty;

        // Subtract the real cost at copper precision. Flooring to whole gp
        // made anything under 1 gp effectively free, so cheap stacks drained
        // no budget and the loop kept filling slots past the limit.
        budget.gp = Math.max(0, Math.round((budget.gp - unit * qty) * 100) / 100);
        toCreate.push(raw);

        used[kind] += 1;
        banned.add(entry._id);
        remainingSlots -= 1;
      }
    }

    // ---- Monedas extra (cofres + custom con "coins") usando el nuevo sistema de currency ----
    const isCustom = typeof containerType === "string" && containerType.startsWith("custom:");
    const allowCoins = isCustom ? !!CC()?.getAllowedCategoriesFor?.(containerType)?.includes("coins") : false;

    let pendingCurrency = {};
    let coinBudgetGP = 0;
    let coinRolledGP = 0;
    if (opts.lockedCurrency && hasAnyCurrencyObj(opts.lockedCurrency)) {
      pendingCurrency = foundry.utils.deepClone(opts.lockedCurrency);
      budget.gp = 0;
    } else if (containerType === "chest" || (isCustom && allowCoins)) {
      const seedCoins = additionalPCBudget(partyLevel);

      coinBudgetGP = seedCoins + Math.max(0, Number(budget.gp) || 0);
      coinRolledGP = rollCoinAmount(coinBudgetGP, partyLevel);
      pendingCurrency = mergeCurrency(pendingCurrency, currencyFromBudgetGP(coinRolledGP));
      budget.gp = 0;
    }

    if (shouldPreview(opts)) {
      const lockedValue = itemsValueGP(opts.lockedItems || [])
        + ((opts.lockedCurrency && hasAnyCurrencyObj(opts.lockedCurrency)) ? currencyValueGP(opts.lockedCurrency) : 0);

      const res = await showLootPreview(actor, containerType, toCreate, pendingCurrency, {
        items: opts.lockedItems || [],
        currency: opts.lockedCurrency || null
      }, {
        maxBudget: getContainerBudgetMax(containerType, partyLevel),
        budget: initialBudgetGP,
        lockedValue,
        itemsValue: itemsValueGP(toCreate),
        currencyValue: currencyValueGP(pendingCurrency)
      });
      if (res.action === "cancel") return;
      if (res.action === "reroll") {
        return { reroll: true, lockedItems: res.lockedItems, lockedCurrency: res.lockedCurrency };
      }
      if (typeof opts.onBeforeApply === "function") await opts.onBeforeApply();
    }

    let currencyAdded = false;
    if (hasAnyCurrencyObj(pendingCurrency)) {
      currencyAdded = await addCurrencyToActor(actor, pendingCurrency);
    }

    dbg("loot summary", {
      containerType,
      spent: (Number(initialBudgetGP) || 0) - (Number(budget.gp) || 0),
      leftover: budget.gp,
      items: toCreate.map(i => ({ name: i.name, qty: i.system?.quantity }))
    });

    let created = [];
    if (toCreate.length) {
      created = await actor.createEmbeddedDocuments("Item", toCreate);
    }

    if (created.length || currencyAdded) {
      ui.notifications?.info(game.i18n.localize("pf2e-autoloot.msg.lootGenerated") || "Loot has been generated.");
    } else {
      await actor.setFlag(MODULE, "empty", true);
      ui.notifications?.warn(game.i18n.localize("pf2e-autoloot.msg.lootEmpty") || "This loot is empty.");
    }

    await uniqueRegistrySet(registry);
    await actor.setFlag(MODULE, "rolled", true);
    await actor.setFlag(MODULE, "containerType", containerType);
    await actor.setFlag(MODULE, "rollTime", Date.now());

  } finally {

    InFlight.delete(actor);
  }
}

async function promptContainerType() {
  const L = (k) => game.i18n.localize(k);

  const customOpts = (CC()?.allAsPromptOptions?.() ?? [])
    .map(o => `<option value="${o.value}">${foundry.utils.escapeHTML(o.label)}</option>`)
    .join("");

  const content = `
    <div class="form-group">
      <select id="ptype" style="width:100%">
        <option value="barrel">${L("pf2e-autoloot.container.barrel")}</option>
        <option value="crate">${L("pf2e-autoloot.container.crate")}</option>
        <option value="chest">${L("pf2e-autoloot.container.chest")}</option>
        <option value="pouch">${L("pf2e-autoloot.container.pouch")}</option>
        <option value="stash">${L("pf2e-autoloot.container.stash")}</option>
        ${customOpts ? `<optgroup label="${L("Custom") || "Custom"}">${customOpts}</optgroup>` : ""}
      </select>
    </div>
  `;

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: L("pf2e-autoloot.dialog.containerType.title") },
    content,
    buttons: [
      {
        action: "ok",
        label: "Ok",
        icon: "fas fa-dice",
        default: true,
        callback: (_event, _button, dialog) => {
          return dialog.element.querySelector("#ptype")?.value ?? null;
        },
      },
      {
        action: "cancel",
        label: "Cancelar",
        callback: () => null,
      },
    ],
  });

  return result ?? null;
}


async function rerollFor(actor, forcedType = null, { promptIfUnknown = false, ignoreName = false } = {}) {
  ManualRoll.add(actor);
  try {
    let type = forcedType;
    if (!type) {
      if (!ignoreName) {
        const byName = getContainerTypeByName(actor.name ?? "");
        if (byName) type = byName;
      }
      if (!type && promptIfUnknown) type = await promptContainerType();
    }
    if (!type) return;

    // With preview enabled the old contents are only wiped once the GM accepts,
    // so cancelling never leaves the container empty.
    const usePreview = !!game.settings.get(MODULE, "previewBeforeApply");

    const wipeExisting = async () => {
      const uniquesToUnregister = actor.items.filter(i => i?.flags?.[MODULE]?.source?.unique);
      for (const it of uniquesToUnregister) {
        const key = uniqueKeyFromItem(it);
        if (key) uniqueRegistryDelete(key);
      }

      if (actor.items.size) {
        await actor.deleteEmbeddedDocuments("Item", actor.items.map(i => i.id));
      }

      if (actorHasAnyCurrency(actor)) {
        await clearAllCurrency(actor);
      }

      await actor.unsetFlag(MODULE, "rolled");
      await actor.unsetFlag(MODULE, "empty");
    };

    if (!usePreview) await wipeExisting();

    let lockedItems = [];
    let lockedCurrency = null;
    let guard = 50;

    while (guard-- > 0) {
      const result = await generateFor(actor, type, {
        ignoreEmpty: false,
        ignoreRolled: true,
        preview: true,
        lockedItems,
        lockedCurrency,
        onBeforeApply: usePreview ? wipeExisting : null
      });

      if (!result?.reroll) break;
      lockedItems = result.lockedItems || [];
      lockedCurrency = result.lockedCurrency || null;
    }
  } finally {
    ManualRoll.delete(actor);
  }
}

/* -------------- Hooks -------------- */
function tryAutolootFromSheet(app) {
  const actor = app?.actor;
  if (!actor || actor.type !== "loot") return;

  if (!game.settings.get(MODULE, "autoloot")) {
    dbg("autoloot disabled; skip");
    return;
  }

  if (ManualRoll.has(actor)) {
    dbg("skip autogen: manual roll");
    return;
  }

  const type = getContainerTypeByName(actor.name ?? "");
  if (!type) return;

  generateFor(actor, type, { ignoreEmpty: false, ignoreRolled: false }).catch(err => {
    console.error(`${MODULE} autoloot error`, err);
  });
}

Hooks.on("renderActorSheet", tryAutolootFromSheet);

Hooks.on("getActorSheetHeaderButtons", (sheet, buttons) => {
  try {
    const actor = sheet.actor;
    if (!actor || actor.type !== "loot") return;

    buttons.unshift({
      label: "Roll Loot",
      class: "roll-loot-any",
      icon: "fas fa-dice",
      onclick: () => {
        const autolootOn = !!game.settings.get(MODULE, "autoloot");
        rerollFor(actor, null, { promptIfUnknown: true, ignoreName: !autolootOn });
      }
    });
  } catch (e) {
    console.error(`${MODULE} header buttons error`, e);
  }
});
