const MODULE = "pf2e-autoloot";

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
    pouch: [1,3]
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

const COIN_VALUE_GP = { pp:10, gp:1, sp:0.1, cp:0.01 };

const PF2E_TREASURE_BY_LEVEL = {
  1:   175,    2:   300,   3:   500,  4:   850,  5:  1350,
  6:  2000,    7:  2900,   8:  4000,  9:  5700, 10:  8000,
  11: 11500,  12: 16500,  13: 25000, 14: 36500, 15: 54500,
  16: 82500,  17: 128000, 18:208000, 19:355000, 20:490000
};

const KCTG_FOLDER_FALLBACK = {
  "0Tm0asm3LUrxa5kC": "Coinage",
  "6hYZ9Hc8fRvK9JiV": "Letters, Books & Scrolls",
  "IVpANVWTiiCiNg4A": "Fish",
  "hwl8Wuch8vDxz6RO": "Food",
  "ida5RTswFJc0uMjq": "Jewelry",
  "rVALCRpo8OgzsUUL": "Potions",
  "zVVu6z0PBTfQ1TEU": "Tavern Foods",
  "ZRyw39SLwJLK4M8t": "Carpentry",
  "4U8XLwprIq4Tmz5G": "Tools",
  "9UICyFG0eQpZhDIQ": "Mixed Materials",
  "BwqWamNoXDFiaSVe": "Weaving Tools",
  "D5mNXc2nKfCqVF02": "Instruments",
  "Kc0vPzHPlrswlYLN": "Logs & Lumber",
  "RvJuKQkD9WaUoShf": "Bones",
  "VZtRJkvlNtreHR7c": "Gemstones",
  "YwOccB4gZhArWDvC": "Ore & Metal",
  "hPTbArn4mQJ02Tcz": "Herbalist Tools",
  "olTjz37Q2DwRxkfb": "Critters & Livestock",
  "qH1EPlyqqYQaqNTO": "Theme - Red Harvest"
};

const Cache = {
  equipIndex: [],
  kctgIndex: [],
  kctgFolders: {},
  equipPack: null,
  kctgPack: null,
  equipDocs: new Map(),
  kctgDocs: new Map(),
  ready: false
};

const InFlight = new WeakSet();
const ManualRoll = new WeakSet(); 

const COIN_NAMES = {
  pp: "Platinum Pieces",
  gp: "Gold Pieces",
  sp: "Silver Pieces",
  cp: "Copper Pieces"
};

const PF2E_CURRENCY_PER_ADDITIONAL_PC = {
  1: 10,   2: 18,   3: 30,   4: 50,   5: 80,
  6: 125,  7: 180,  8: 250,  9: 350,  10: 500,
  11: 700, 12: 1000,13: 1500,14: 2250,15: 3250,
  16: 5000,17: 7500,18: 12000,19: 20000,20: 35000
};

const STASH_SPECS = {
  1:  { perms: {2:2,1:2},       cons: {2:2,1:3},       currency: 40  },
  2:  { perms: {3:2,2:2},       cons: {3:2,2:2,1:2},   currency: 70  },
  3:  { perms: {4:2,3:2},       cons: {4:2,3:2,2:2},   currency: 120 },
  4:  { perms: {5:2,4:2},       cons: {5:2,4:2,3:2},   currency: 200 },
  5:  { perms: {6:2,5:2},       cons: {6:2,5:2,4:2},   currency: 320 },
  6:  { perms: {7:2,6:2},       cons: {7:2,6:2,5:2},   currency: 500 },
  7:  { perms: {8:2,7:2},       cons: {8:2,7:2,6:2},   currency: 720 },
  8:  { perms: {9:2,8:2},       cons: {9:2,8:2,7:2},   currency: 1000},
  9:  { perms: {10:2,9:2},      cons: {10:2,9:2,8:2},  currency: 1400},
  10: { perms: {11:2,10:2},     cons: {11:2,10:2,9:2}, currency: 2000},
  11: { perms: {12:2,11:2},     cons: {12:2,11:2,10:2},currency: 2800},
  12: { perms: {13:2,12:2},     cons: {13:2,12:2,11:2},currency: 4000},
  13: { perms: {14:2,13:2},     cons: {14:2,13:2,12:2},currency: 6000},
  14: { perms: {15:2,14:2},     cons: {15:2,14:2,13:2},currency: 9000},
  15: { perms: {16:2,15:2},     cons: {16:2,15:2,14:2},currency: 13000},
  16: { perms: {17:2,16:2},     cons: {17:2,16:2,15:2},currency: 20000},
  17: { perms: {18:2,17:2},     cons: {18:2,17:2,16:2},currency: 30000},
  18: { perms: {19:2,18:2},     cons: {19:2,18:2,17:2},currency: 48000},
  19: { perms: {20:2,19:2},     cons: {20:2,19:2,18:2},currency: 80000},
  20: { perms: {20:4},          cons: {20:4,19:2},     currency: 140000}
};


/* ---------------- Settings ---------------- */
Hooks.once("init", () => {
  const L  = (k) => game.i18n.localize(k);

  game.settings.register(MODULE, "pack-equipment", {
    name: L("pf2e-autoloot.settings.pack-equipment.name"),
    hint: L("pf2e-autoloot.settings.pack-equipment.hint"),
    scope: "world",
    config: true,
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
    scope: "world", config: true, default: false, type: Boolean
  });

    game.settings.register(MODULE, "avoidNamesRegex", {
    name: L("pf2e-autoloot.settings.avoidNamesRegex.name"),
    hint: L("pf2e-autoloot.settings.avoidNamesRegex.hint"),
    scope: "world", config: true, type: String, default: ""
  });

  game.settings.register(MODULE, `name-barrel`, {
    name: L("pf2e-autoloot.settings.name-key.barrel.name"),
    hint: L("pf2e-autoloot.settings.name-key.hint"),
    scope: "world", config: true, default: DEFAULTS.names.barrel, type: String
  });

  game.settings.register(MODULE, `empty-barrel`, {
    name: L("pf2e-autoloot.settings.empty-key.barrel.name"),
    hint: L("pf2e-autoloot.settings.empty-key.hint"),
    scope: "world", config: true, default: DEFAULTS.emptyChance.barrel, type: Number,
    range: { min: 0, max: 100, step: 1 }
  });

  game.settings.register(MODULE, `count-barrel`, {
    name: L("pf2e-autoloot.settings.count-key.barrel.name"),
    hint: L("pf2e-autoloot.settings.count-key.hint"),
    scope: "world", config: true, default: DEFAULTS.counts.barrel.join(","), type: String
  });

  game.settings.register(MODULE, `name-crate`, {
    name: L("pf2e-autoloot.settings.name-key.crate.name"),
    hint: L("pf2e-autoloot.settings.name-key.hint"),
    scope: "world", config: true, default: DEFAULTS.names.crate, type: String
  });

  game.settings.register(MODULE, `empty-crate`, {
    name: L("pf2e-autoloot.settings.empty-key.crate.name"),
    hint: L("pf2e-autoloot.settings.empty-key.hint"),
    scope: "world", config: true, default: DEFAULTS.emptyChance.crate, type: Number,
    range: { min: 0, max: 100, step: 1 }
  });

  game.settings.register(MODULE, `count-crate`, {
    name: L("pf2e-autoloot.settings.count-key.crate.name"),
    hint: L("pf2e-autoloot.settings.count-key.hint"),
    scope: "world", config: true, default: DEFAULTS.counts.crate.join(","), type: String
  });

  game.settings.register(MODULE, "crateLevelOffset", {
    name: L("pf2e-autoloot.settings.crateLevelOffset.name"),
    hint: L("pf2e-autoloot.settings.crateLevelOffset.hint"),
    scope: "world", config: true, default: DEFAULTS.crateLevelOffset, type: Number, range:{min:-10,max:10,step:1}
  });

  game.settings.register(MODULE, `name-chest`, {
    name: L("pf2e-autoloot.settings.name-key.chest.name"),
    hint: L("pf2e-autoloot.settings.name-key.hint"),
    scope: "world", config: true, default: DEFAULTS.names.chest, type: String
  });

  game.settings.register(MODULE, `empty-chest`, {
    name: L("pf2e-autoloot.settings.empty-key.chest.name"),
    hint: L("pf2e-autoloot.settings.empty-key.hint"),
    scope: "world", config: true, default: DEFAULTS.emptyChance.chest, type: Number,
    range: { min: 0, max: 100, step: 1 }
  });

  game.settings.register(MODULE, `count-chest`, {
    name: L("pf2e-autoloot.settings.count-key.chest.name"),
    hint: L("pf2e-autoloot.settings.count-key.hint"),
    scope: "world", config: true, default: DEFAULTS.counts.chest.join(","), type: String
  });

  game.settings.register(MODULE, `minimumChestLevelOffset`, {
    name: L("pf2e-autoloot.settings.minimumChestLevelOffset.name"),
    hint: L("pf2e-autoloot.settings.minimumChestLevelOffset.hint"),
    scope: "world", config: true, default: DEFAULTS.minimumChestLevelOffset, type: Number, range:{min:0,max:10,step:1}
  });
  
  game.settings.register(MODULE, `maximumChestLevelOffset`, {
    name: L("pf2e-autoloot.settings.maximumChestLevelOffset.name"),
    hint: L("pf2e-autoloot.settings.maximumChestLevelOffset.hint"),
    scope: "world", config: true, default: DEFAULTS.maximumChestLevelOffset, type: Number, range:{min:0,max:10,step:1}
  });

  game.settings.register(MODULE, `name-pouch`, {
    name: L("pf2e-autoloot.settings.name-key.pouch.name"),
    hint: L("pf2e-autoloot.settings.name-key.hint"),
    scope: "world", config: true, default: DEFAULTS.names.pouch, type: String
  });

  game.settings.register(MODULE, `empty-pouch`, {
    name: L("pf2e-autoloot.settings.empty-key.pouch.name"),
    hint: L("pf2e-autoloot.settings.empty-key.hint"),
    scope: "world", config: true, default: DEFAULTS.emptyChance.pouch, type: Number,
    range: { min: 0, max: 100, step: 1 }
  });

  game.settings.register(MODULE, `count-pouch`, {
    name: L("pf2e-autoloot.settings.count-key.pouch.name"),
    hint: L("pf2e-autoloot.settings.count-key.hint"),
    scope: "world", config: true, default: DEFAULTS.counts.pouch.join(","), type: String
  });

  game.settings.register(MODULE, `name-stash`, {
    name: L("pf2e-autoloot.settings.name-key.stash.name"),
    hint: L("pf2e-autoloot.settings.name-key.hint"),
    scope: "world", config: true, default: DEFAULTS.names.stash, type: String
  });

  game.settings.register(MODULE, `empty-stash`, {
    name: L("pf2e-autoloot.settings.empty-key.stash.name"),
    hint: L("pf2e-autoloot.settings.empty-key.hint"),
    scope: "world", config: true, default: DEFAULTS.emptyChance.stash, type: Number,
    range: { min: 0, max: 100, step: 1 }
  });

  game.settings.register(MODULE, "stashLevelOffset", {
    name: L("pf2e-autoloot.settings.stashLevelOffset.name"),
    hint: L("pf2e-autoloot.settings.stashLevelOffset.hint"),
    scope: "world", config: true, default: DEFAULTS.stashLevelOffset, type: Number, range:{min:-10,max:10,step:1}
  });

  game.settings.register(MODULE, "rarityWeightsJson", {
    name: L("pf2e-autoloot.settings.rarityWeightsJson.name"),
    hint: L("pf2e-autoloot.settings.rarityWeightsJson.hint"),
    scope: "world", config: true, type: String,
    default: JSON.stringify(DEFAULTS.rarityWeights)
  });

  game.settings.register(MODULE, "maxStack", {
    name: L("pf2e-autoloot.settings.maxStack.name"),
    scope: "world", config: true, type: Number, default: DEFAULTS.maxStack, range:{min:1,max:50,step:1}
  });

  game.settings.register(MODULE, "favorQuantity", {
    name: L("pf2e-autoloot.settings.favorQuantity.name"),
    scope: "world", config: true, type: Boolean, default: true
  });

  game.settings.register(MODULE, "budgetFraction", {
    name: L("pf2e-autoloot.settings.budgetFraction.name"),
    hint: L("pf2e-autoloot.settings.budgetFraction.hint"),
    scope: "world", config: true, type: Number, default: DEFAULTS.budgetFraction, range:{min:0.01,max:1,step:0.01}
  });

  game.settings.register(MODULE, "preloadOnReady", {
    name: game.i18n.localize("pf2e-autoloot.settings.preloadOnReady.name") || "Preload indexes on world ready",
    hint: game.i18n.localize("pf2e-autoloot.settings.preloadOnReady.hint") || "",
    scope: "world",
    config: false,
    type: Boolean,
    default: DEFAULTS.preloadOnReady
  });


  game.settings.register(MODULE, "uniqueRegistryJson", {
    name: L("pf2e-autoloot.settings.uniqueRegistryJson.name"),
    scope: "world", config: false, type: String, default: "{}"
  });

  game.settings.register(MODULE, "debug", {
    name: "Debug",
    scope: "world", config: true, default: false, type: Boolean
  });
});

/* -------------- Helpers -------------- */
function dbg(...args) { if (game.settings.get(MODULE,"debug")) console.debug(MODULE, ...args); }
function rng(n) { return Math.floor(Math.random()*n); }
function pickRand(arr) { return arr[rng(arr.length)]; }

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function classify(raw) {
  const t = raw.type;
  const traits = new Set(raw.system?.traits?.value ?? []);
  if (t === "ammo") return "ammo";
  if (t === "consumable") {
    if (traits.has("ammunition") || traits.has("ammunition-arcane") || traits.has("ammo")) {
      return "consumable-ammo";
    }
    return "consumable";
  }
  if (t === "weapon") return "weapon";
  if (t === "armor") return "armor";
  if (t === "shield") return "shield";
  if (t === "treasure") return "treasure";
  return "equipment";
}

function makeBands(cheapPairs, budget) {
  if (!cheapPairs.length) return [];
  const prices = cheapPairs.map(x => x.p).sort((a,b)=>a-b);
  const lo = prices[Math.floor(prices.length * 0.33)];
  const hi = prices[Math.floor(prices.length * 0.66)];
  const b1 = cheapPairs.filter(x => x.p <= lo);
  const b2 = cheapPairs.filter(x => x.p > lo && x.p <= hi);
  const b3 = cheapPairs.filter(x => x.p > hi && x.p <= budget);
  return [shuffleInPlace(b1), shuffleInPlace(b2), shuffleInPlace(b3)];
}

function weightedSample(list, count, weightFn) {
  if (!list.length || count <= 0) return [];
  const out = [];
  const pool = list.slice();
  while (pool.length && out.length < count) {
    const weights = pool.map(weightFn);
    const total = weights.reduce((a,b)=>a+b,0) || 1;
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < pool.length; idx++) {
      r -= weights[idx];
      if (r <= 0) break;
    }
    out.push(pool[idx]);
    pool.splice(idx,1);
  }
  return out;
}

async function generateStash(actor, partyLevel) {
  const spec = STASH_SPECS[Math.max(1, Math.min(20, partyLevel))];
  if (!spec) return;

  if (!Cache.ready) await preloadCache();
  if (!Cache.ready) return;

  const reg = uniqueRegistry();
  const weights = rarityWeightFromSetting();

  const levelOf = e => Number(e.system?.level?.value ?? 0);

  const isPermanent = e => {
    const t = e.type;
    return t === "equipment" || t === "weapon" || t === "armor" || t === "shield";
  };

  const isConsumable = e => e.type === "consumable";

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

  const toCreate = [];

  const itemWeight = (e) => {
    const r = getRarity(e);
    const w = Number(weights[r]) || 1;
    return Math.max(0.0001, w) * (0.9 + Math.random()*0.2);
  };

  for (const [lvlStr, cnt] of Object.entries(spec.perms)) {
    const lvl = Number(lvlStr);
    const pool = (byLevelPermanent.get(lvl) || []).filter(e => !isUnique(e) || !reg[uniqueKey(e)]);
    const picked = weightedSample(pool, cnt, itemWeight);
    for (const entry of picked) {
      const doc = await getDocFrom(entry);
      if (!doc) continue;
      const raw = doc.toObject(); delete raw._id;
      raw.system = raw.system || {};
      raw.system.quantity = 1;
      toCreate.push(raw);
    }
  }

  for (const [lvlStr, cnt] of Object.entries(spec.cons)) {
    const lvl = Number(lvlStr);
    const pool = (byLevelConsumable.get(lvl) || []).filter(e => !isUnique(e) || !reg[uniqueKey(e)]);
    const picked = weightedSample(pool, cnt, itemWeight);
    for (const entry of picked) {
      const doc = await getDocFrom(entry);
      if (!doc) continue;
      const raw = doc.toObject(); delete raw._id;
      raw.system = raw.system || {};
      raw.system.quantity = 1;
      toCreate.push(raw);
    }
  }

  const coinBudget = { gp: spec.currency };
  const coins = Cache.equipIndex.filter(e => e.type === "treasure" && Object.values(COIN_NAMES).includes(e.name));
  const byName = Object.fromEntries(coins.map(e => [e.name, e]));
  const pending = { pp: 0, gp: 0, sp: 0, cp: 0 };

  while (coinBudget.gp > 0) {
    const viable = Object.entries(COIN_VALUE_GP).filter(([_, unit]) => unit <= coinBudget.gp);
    if (!viable.length) break;
    const [denom, unit] = viable[Math.floor(Math.random()*viable.length)];
    const name = COIN_NAMES[denom];
    const entry = byName[name];
    if (!entry) break;
    const maxByBudget = Math.floor(coinBudget.gp / unit);
    const qty = Math.max(1, Math.floor(Math.random() * Math.max(1, maxByBudget)));
    pending[denom] += qty;
    coinBudget.gp -= Math.floor(unit * qty);
  }
  for (const denom of ["pp","gp","sp","cp"]) {
    const qty = pending[denom];
    if (!qty) continue;
    const name = COIN_NAMES[denom];
    const entry = byName[name];
    if (!entry) continue;
    const doc = await getDocFrom(entry);
    if (!doc) continue;
    const raw = doc.toObject(); delete raw._id;
    raw.system = raw.system || {};
    raw.system.quantity = qty;
    toCreate.push(raw);
  }

  if (toCreate.length) await actor.createEmbeddedDocuments("Item", toCreate);
}


function rarityWeightFromSetting() {
  let weights = {...DEFAULTS.rarityWeights};
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


function parseCount(key) {
  const raw = game.settings.get(MODULE, `count-${key}`);
  const m = String(raw).split(",").map(n => Number(n.trim())).filter(n=>Number.isFinite(n));
  if (m.length === 2) return [Math.min(m[0], m[1]), Math.max(m[0], m[1])];
  return DEFAULTS.counts[key];
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

  const avg = levels.length ? Math.round(levels.reduce((s,n)=>s+n,0) / levels.length) : 1;
  const clamped = Math.max(1, Math.min(20, avg));
  dbg("avgPartyLevel", { levels, avg, clamped, count: levels.length });
  return clamped;
}

function getPartySize() {
  // PCs con propietario (como ya haces en getAveragePartyLevel)
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

async function mintCoinsFromBudget(gpAmount, toCreate) {
  gpAmount = Math.floor(Math.max(0, Number(gpAmount) || 0));
  if (!gpAmount) return;

  const coins = Cache.equipIndex.filter(e => e.type === "treasure" && Object.values(COIN_NAMES).includes(e.name));
  const byName = Object.fromEntries(coins.map(e => [e.name, e]));

  const pending = { pp: 0, gp: 0, sp: 0, cp: 0 };
  while (gpAmount > 0) {
    const viable = Object.entries(COIN_VALUE_GP).filter(([_, unit]) => unit <= gpAmount);
    if (!viable.length) break;

    const [denom, unit] = viable[Math.floor(Math.random()*viable.length)];
    const maxByBudget = Math.floor(gpAmount / unit);
    const qty = Math.max(1, Math.floor(Math.random() * Math.max(1, maxByBudget)));
    pending[denom] += qty;
    gpAmount -= Math.floor(unit * qty);
  }

  for (const denom of ["pp","gp","sp","cp"]) {
    const qty = pending[denom];
    if (!qty) continue;
    const name = COIN_NAMES[denom];
    const entry = byName[name];
    if (!entry) continue;
    const doc = await getDocFrom(entry);
    if (!doc) continue;
    const raw = doc.toObject(); delete raw._id;
    raw.system = raw.system || {};
    raw.system.quantity = qty;
    toCreate.push(raw);
  }
}


async function getPack(id) {
  const pack = game.packs.get(id);
  return pack || null;
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

async function getIndexWith(pack, fields) {
  await pack.getIndex({fields});
  return pack.index;
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
    return JSON.parse(game.settings.get(MODULE,"uniqueRegistryJson")||"{}") || {};
  } catch { return {}; }
}
async function uniqueRegistrySet(obj) {
  await game.settings.set(MODULE, "uniqueRegistryJson", JSON.stringify(obj));
}
function uniqueKey(entry) {
  return `${entry.__pack||"unknown"}:${entry._id}`;
}

function uniqueRegistryDelete(key) {
  const reg = uniqueRegistry();
  if (reg[key]) {
    delete reg[key];
    game.settings.set(MODULE, "uniqueRegistryJson", JSON.stringify(reg));
  }
}

function uniqueKeyFromItem(item) {
  const src = item?.flags?.[MODULE]?.source;
  if (!src?.pack || !src?.id) return null;
  return `${src.pack}:${src.id}`;
}


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
    "system.quantity"
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
  const isCrate  = nameMatches(name, "crate");
  const isChest  = nameMatches(name, "chest");
  const isPouch  = nameMatches(name, "pouch");
  const isStash  = nameMatches(name, "stash");
  return isBarrel ? "barrel" : isCrate ? "crate" : isChest ? "chest" : isPouch ? "pouch" : isStash ? "stash" : null;
}

function filterPools(containerType, partyLevel) {
  const cratesOffset = Number(game.settings.get(MODULE, "crateLevelOffset") ?? DEFAULTS.crateLevelOffset);
  let equip = [], kctg = [];

  if (containerType === "barrel") {
    if (Cache.kctgIndex.length) {
      const include = new Set(["Food","Tavern Foods","Fish"]);
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
      const exclude = new Set(["Food","Tavern Foods","Fish","Ore & Metal","Mixed Materials","Logs & Lumber","Gemstones","Critters & Livestock"]);
      kctg = filterKCTGByFolders(Cache.kctgIndex, Cache.kctgFolders, null, exclude);
    }

  } else if (containerType === "chest") {
    const minChestOffset = Number(game.settings.get(MODULE, "minimumChestLevelOffset") ?? DEFAULTS.minimumChestLevelOffset);
    const maxChestOffset = Number(game.settings.get(MODULE, "maximumChestLevelOffset") ?? DEFAULTS.maximumChestLevelOffset);
    const minL = Math.max(0, partyLevel - minChestOffset), maxL = partyLevel + maxChestOffset;
    const allowed = new Set(["equipment","weapon","armor","shield","consumable","treasure","ammo","container"]);
    equip = Cache.equipIndex.filter(e =>
      allowed.has(e.type) && Number(e.system?.level?.value ?? 0) >= minL && Number(e.system?.level?.value ?? 0) <= maxL
    );
    if (Cache.kctgIndex.length) {
      const exclude = new Set(["Food","Tavern Foods","Fish","Bones","Instruments","Critters & Livestock"]);
      kctg = filterKCTGByFolders(Cache.kctgIndex, Cache.kctgFolders, null, exclude);
    }

  } else if (containerType === "pouch") {
    const coinNames = new Set(Object.values(COIN_NAMES));
    equip = Cache.equipIndex.filter(e => e.type === "treasure" && coinNames.has(e.name));
    kctg = [];
  }

  const reg = uniqueRegistry();
  equip = equip.filter(e => !isUnique(e) || !reg[uniqueKey(e)]);
  kctg = kctg.filter(e => !isUnique(e) || !reg[uniqueKey(e)]);
  return { equip, kctg };
}



async function getDocFrom(entry) {
  const id = entry._id;
  const fromEquip = entry.__pack === (Cache.equipPack?.collection || "x");
  const map = fromEquip ? Cache.equipDocs : Cache.kctgDocs;
  if (map.has(id)) return map.get(id);
  const pack = fromEquip ? Cache.equipPack : Cache.kctgPack;
  if (!pack) return null;
  const doc = await pack.getDocument(id);
  if (doc) map.set(id, doc);
  return doc;
}

function getBudgetFor(partyLevel) {
  const base = PF2E_TREASURE_BY_LEVEL[partyLevel] ?? PF2E_TREASURE_BY_LEVEL[1];
  let frac = game.settings.get(MODULE, "budgetFraction");

  if (typeof frac === "string") {
    frac = frac.trim().replace(",", ".").replace("%", "");
  }
  frac = Number(frac);
  if (!Number.isFinite(frac) || frac <= 0) frac = DEFAULTS.budgetFraction;

  if (frac > 1) {
    frac = frac > 100 ? 1 : frac / 100;
  }

  const gp = Math.max(0, Math.floor(base * frac));
  dbg("budgetFor", { txt: game.i18n.localize("pf2e-autoloot.dbg.budgetFor"), partyLevel, base, frac, gp });
  return gp;
}

function getContainerBudget(containerType, partyLevel) {
  const base = getBudgetFor(partyLevel);
  if (containerType === "pouch") {
    return Math.max(1, Math.ceil(base * 0.10));
  }
  return base;
}


function getCountRange(containerType) {
  const raw = game.settings.get(MODULE, `count-${containerType}`);
  const parts = String(raw).split(",").map(n=>Number(n.trim())).filter(Number.isFinite);
  let [mn,mx] = parts.length===2 ? [Math.min(parts[0],parts[1]), Math.max(parts[0],parts[1])] : DEFAULTS.counts[containerType];
  return [mn,mx];
}

function getQuotas(containerType, typeCount) {
  switch (containerType) {
    case "barrel":
      return { treasure: typeCount, equipment: typeCount };
    case "crate":
      return {};
    case "chest":
      return { ammo: 2, "consumable-ammo": 2, consumable: 6, weapon: 4, armor: 4, shield: 2, treasure: 8, equipment: 8 };
    case "pouch":
      return {};
    case "stash":
      return {};
    default:
      return {};
  }
}



/* -------------- Core generation -------------- */
async function generateFor(actor, containerType, opts = {}) {
  if (InFlight.has(actor)) { dbg("skip generate: in-flight"); return; }
  InFlight.add(actor);
  try {
    const already = actor.getFlag(MODULE, "rolled");
    if (already && !opts.ignoreRolled) return;
    if (actor.items?.size) { await actor.setFlag(MODULE, "rolled", true); return; }

    const emptyProb = Number(game.settings.get(MODULE, `empty-${containerType}`)) || 0;
    const rollEmpty = Math.random() *100;
    if (!opts.ignoreEmpty && rollEmpty < emptyProb) {
      await actor.setFlag(MODULE, "rolled", true);
      await actor.setFlag(MODULE, "empty", true);
      return;
    }

    if (!Cache.ready) await preloadCache();
    if (!Cache.ready) return;

    const partyLevel = getAveragePartyLevel();
    const budget = { gp: getContainerBudget(containerType, partyLevel) };


    if (containerType === "stash") {
      const stashOffset = Number(game.settings.get(MODULE, "stashLevelOffset") ?? DEFAULTS.stashLevelOffset);
      const partyLevel = getAveragePartyLevel();
      const stashMaxLevel = Math.max(0, partyLevel + stashOffset); 
      await generateStash(actor, stashMaxLevel);
      await actor.setFlag(MODULE, "rolled", true);
      await actor.setFlag(MODULE, "containerType", containerType);
      await actor.setFlag(MODULE, "rollTime", Date.now());
      return;
    }


    const {equip, kctg} = filterPools(containerType, partyLevel);
    let candidates = [...equip, ...kctg];

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
      return;
    }

    dbg("candidates", {
      total: candidates.length,
      leqBudget: candidates.filter(e => priceFromIndex(e) > 0 && priceFromIndex(e) <= budget.gp).length
    });


    const [minTypes, maxTypes] = getCountRange(containerType);
    const typeCount = Math.max(minTypes, Math.min(maxTypes, minTypes + Math.floor(Math.random()*(maxTypes-minTypes+1))));

    const weights = rarityWeightFromSetting();
    const weightedIds = [];
    for (const e of candidates) {
      const r = getRarity(e);
      const w = Number(weights[r]) || 1;
      for (let i=0;i<Math.max(1,Math.round(w));i++) weightedIds.push(e._id);
    }

    const toCreate = [];
    let registry = uniqueRegistry();

    if (containerType === "pouch") {
    const coinEntries = Cache.equipIndex.filter(e => e.type === "treasure" && Object.values(COIN_NAMES).includes(e.name));
    const byName = Object.fromEntries(coinEntries.map(e => [e.name, e]));

    const pending = { pp: 0, gp: 0, sp: 0, cp: 0 };

    while (budget.gp > 0) {
      const viable = Object.entries(COIN_VALUE_GP)
        .filter(([denom, unit]) => unit <= budget.gp)
        .map(([denom]) => denom);
      if (!viable.length) break;

      const denom = viable[Math.floor(Math.random() * viable.length)];
      const unit = COIN_VALUE_GP[denom];
      const name = COIN_NAMES[denom];
      const entry = byName[name];
      if (!entry) {
        continue;
      }

      const maxByBudget = Math.floor(budget.gp / unit);
      if (maxByBudget <= 0) break;
      const qty = 1 + Math.floor(Math.random() * maxByBudget);

      pending[denom] += qty;
      budget.gp -= Math.floor(unit * qty);
    }

    for (const denom of ["pp","gp","sp","cp"]) {
      const qty = pending[denom];
      if (!qty) continue;
      const name = COIN_NAMES[denom];
      const entry = byName[name];
      const doc = await getDocFrom(entry);
      if (!doc) continue;

      const raw = doc.toObject(); delete raw._id;
      raw.system = raw.system || {};
      raw.system.quantity = qty;
      toCreate.push(raw);
    }
  } else {
    const favorQty = !!game.settings.get(MODULE, "favorQuantity");

    let pairs = candidates
      .map(e => ({ e, p: priceFromIndex(e) }))
      .filter(x => x.p >= 0.01);

    const EPS = 0.03;
    pairs = pairs.map(x => ({ ...x, p: x.p * (1 + (Math.random()*2 - 1) * EPS) }));

    const maxPerItem = Math.max(1, Number(game.settings.get(MODULE, "maxStack") ?? DEFAULTS.maxStack));
    const banned = new Set();
    let remainingSlots = Math.min(typeCount, candidates.length);
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

      let perSlotCap = Math.max(1, Math.floor(budget.gp / remainingSlots));
      let cap = Math.min(Math.floor(budget.gp * 0.60), perSlotCap);

      let pool = affordable.filter(x => x.p <= cap);
      let relaxSteps = 0;
      while (!pool.length && relaxSteps < 5) {
        cap = relaxSteps < 3 ? Math.min(budget.gp, Math.floor(cap * (relaxSteps === 0 ? 1.5 : relaxSteps === 1 ? 2 : 3)))
                            : (relaxSteps === 3 ? Math.floor(budget.gp * 0.60) : budget.gp);
        pool = affordable.filter(x => x.p <= cap);
        relaxSteps += 1;
      }
      if (!pool.length) break;

      const pick = weightedPick(pool, budget.gp, cap);
      const entry = pick.e;

      const doc = await getDocFrom(entry);
      if (!doc) { banned.add(entry._id); continue; }
      const raw = doc.toObject(); delete raw._id;

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

      budget.gp -= Math.floor(unit * qty);
      toCreate.push(raw);

      used[kind] += 1;
      banned.add(entry._id);
      remainingSlots -= 1;
    }
  }

  if (containerType === "chest") {
    const perAddPC = PF2E_CURRENCY_PER_ADDITIONAL_PC[Math.max(1, Math.min(20, partyLevel))] || 0;
    const extraPCs = Math.max(0, getPartySize() - 4); // PCs adicionales sobre 4
    const seedCoins = perAddPC * extraPCs;

    const leftover = Math.floor(Math.max(0, budget.gp || 0));

    await mintCoinsFromBudget(seedCoins + leftover, toCreate);

    budget.gp = 0;
  }

    const startBudget = budget.gp;

    dbg("loot summary", {
      containerType,
      spent: startBudget - budget.gp,
      leftover: budget.gp,
      items: toCreate.map(i => ({ name: i.name, qty: i.system?.quantity }))
    });

    if (toCreate.length) await actor.createEmbeddedDocuments("Item", toCreate);
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
  return new Promise((resolve) => {
    new Dialog({
      title: L("pf2e-autoloot.dialog.containerType.title"),
      content: `<div class="form-group">
        <select id="ptype" style="width:100%">
          <option value="barrel">${L("pf2e-autoloot.container.barrel")}</option>
          <option value="crate">${L("pf2e-autoloot.container.crate")}</option>
          <option value="chest">${L("pf2e-autoloot.container.chest")}</option>
          <option value="pouch">${L("pf2e-autoloot.container.pouch")}</option>
          <option value="stash">${L("pf2e-autoloot.container.stash")}</option>
        </select>
      </div>`,
      buttons: {
        ok: {
          label: "Ok",
          icon: '<i class="fas fa-dice"></i>',
          callback: html => resolve(html.find("#ptype").val())
        },
        cancel: { label: "Cancelar", callback: () => resolve(null) }
      },
      default: "ok"
    }).render(true);
  });
}

async function rerollFor(actor, forcedType = null, { promptIfUnknown = false, ignoreName = false } = {}) {
  ManualRoll.add(actor);
  try {
    const uniquesToUnregister = actor.items.filter(i => i?.flags?.[MODULE]?.source?.unique);
    for (const it of uniquesToUnregister) {
      const key = uniqueKeyFromItem(it);
      if (key) uniqueRegistryDelete(key);
    }

    if (actor.items.size) {
      await actor.deleteEmbeddedDocuments("Item", actor.items.map(i => i.id));
    }

    await actor.unsetFlag(MODULE, "rolled");
    await actor.unsetFlag(MODULE, "empty");

    let type = forcedType;
    if (!type) {
      if (!ignoreName) {
        const byName = getContainerTypeByName(actor.name ?? "");
        if (byName) type = byName;
      }
      if (!type && promptIfUnknown) type = await promptContainerType();
    }
    if (!type) return;

    await generateFor(actor, type, { ignoreEmpty: true, ignoreRolled: true });
  } finally {
    ManualRoll.delete(actor);
  }
}


/* -------------- Hooks -------------- */
Hooks.on("renderActorSheet", async (app, html, data) => {
  try {
    const actor = app.actor;
    if (!actor || actor.type !== "loot") return;

    if (!game.settings.get(MODULE, "autoloot")) {
      dbg("autoloot disabled; skip");
      return;
    }

    if (ManualRoll.has(actor)) { dbg("skip autogen: manual roll"); return; }
    const type = getContainerTypeByName(actor.name ?? "");
    if (!type) return;
    await generateFor(actor, type, { ignoreEmpty: true, ignoreRolled: true });
  } catch (e) {
    console.error(`${MODULE} error`, e);
  }
});

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
