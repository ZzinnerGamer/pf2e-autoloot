const MODULE = "pf2e-autoloot";

const FILTER_CATALOG = [
  // ==== Equipment ====
  { id: "group:equipment",                              label: "Equipment",              group: "Equipment",                    kind: "major" },
  { id: "equipment:adjustments",                        label: "Adjustments",            group: "Equipment",                    kind: "minor", parent: "group:equipment" },
  { id: "equipment:adventuring-gear",                   label: "Adventuring Gear",       group: "Equipment",                    kind: "minor", parent: "group:equipment" },
  { id: "equipment:alchemical-items",                   label: "Alchemical Items",       group: "Equipment",                    kind: "minor", parent: "group:equipment",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "equipment:alchemical-ammunition",              label: "Alchemical Ammunition",  group: "Equipment / Alchemical Items", kind: "leaf",  parent: "equipment:alchemical-items",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "equipment:alchemical-bombs",                   label: "Alchemical Bombs",       group: "Equipment / Alchemical Items", kind: "leaf",  parent: "equipment:alchemical-items",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "equipment:alchemical-elixirs",                 label: "Alchemical Elixirs",     group: "Equipment / Alchemical Items", kind: "leaf",  parent: "equipment:alchemical-items",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "equipment:alchemical-food",                    label: "Alchemical Food",        group: "Equipment / Alchemical Items", kind: "leaf",  parent: "equipment:alchemical-items",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "equipment:alchemical-plants",                  label: "Alchemical Plants",      group: "Equipment / Alchemical Items", kind: "leaf",  parent: "equipment:alchemical-items",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "equipment:alchemical-poisons",                 label: "Alchemical Poisons",     group: "Equipment / Alchemical Items", kind: "leaf",  parent: "equipment:alchemical-items",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "equipment:alchemical-tools",                   label: "Alchemical Tools",       group: "Equipment / Alchemical Items", kind: "leaf",  parent: "equipment:alchemical-items",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "equipment:bottled-monstrosities",              label: "Bottled Monstrosities",  group: "Equipment / Alchemical Items", kind: "leaf",  parent: "equipment:alchemical-items",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "equipment:materials",                          label: "Materials",              group: "Equipment",                    kind: "minor", parent: "group:equipment" },
  { id: "equipment:snares",                             label: "Snares",                 group: "Equipment",                    kind: "minor", parent: "group:equipment",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "equipment:spellhearts",                        label: "Spellhearts",            group: "Equipment",                    kind: "minor", parent: "group:equipment",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "equipment:staves",                             label: "Staves",                 group: "Equipment",                    kind: "minor", parent: "group:equipment",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "equipment:tattoos",                            label: "Tattoos",                group: "Equipment",                    kind: "minor", parent: "group:equipment",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },

  // ==== Armor ====
  { id: "group:armor",                                  label: "Armor",                  group: "Armor",                        kind: "major" },

  { id: "armor:unarmored",                              label: "Unarmored Armor",        group: "Armor",                        kind: "minor", parent: "group:armor" },
  { id: "item.system.baseItem:explorers-clothing",      label: "Explorer’s Clothing",    group: "Armor / Unarmored",            kind: "leaf",  parent: "armor:unarmored",  anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:scroll-robes",            label: "Scroll Robes",           group: "Armor / Unarmored",            kind: "leaf",  parent: "armor:unarmored",  anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:gi",                      label: "Gi",                     group: "Armor / Unarmored",            kind: "leaf",  parent: "armor:unarmored",  anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:flight-suit",             label: "Flight Suit",            group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },

  { id: "armor:light",                                  label: "Light Armor",            group: "Armor",                        kind: "minor", parent: "group:armor" },
  { id: "item.system.baseItem:armored-cloak",           label: "Armored Cloak",          group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:armored-coat",            label: "Armored Coat",           group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:buckle-armor",            label: "Buckler Armor",          group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:chain-shirt",             label: "Chain Shirt",            group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:kilted-breastplate",      label: "Kilted Breastplate",     group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:leaf-weave",              label: "Leaf Weave",             group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:leather-armor",           label: "Leather Armor",          group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:leather-lamellar",        label: "Leather Lamellar",       group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:mantis-shell",            label: "Mantis Shell",           group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:padded-armor",            label: "Padded Armor",           group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:quilted-armor",           label: "Quilted Armor",          group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:rattan-armor",            label: "Rattan Armor",           group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:sankeit",                 label: "Sankeit",                group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:studded-leather-armor",   label: "Studded Leather Armor",  group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:abadacorp-travel-suit",   label: "Armored Cloak",          group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:carbon-skin",             label: "Carbon Skin",            group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:estex-suit",              label: "Estex Suit",             group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:hardlight-series",        label: "Hardlight Series",       group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:microcord-armir",         label: "Microcord Armor",        group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:second-skin",             label: "Second Skin",            group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:tempweave",               label: "Tempweave Armor",        group: "Armor / Light",                kind: "leaf",  parent: "armor:light",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },

  { id: "armor:medium",                                 label: "Medium Armor",           group: "Armor",                        kind: "minor", parent: "group:armor" },
  { id: "item.system.baseItem:breastplate",             label: "Breastplate",            group: "Armor / Medium",               kind: "leaf",  parent: "armor:medium",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:ceramic-plate",           label: "Ceramic Plate",          group: "Armor / Medium",               kind: "leaf",  parent: "armor:medium",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:chain-mail",              label: "Chain Mail",             group: "Armor / Medium",               kind: "leaf",  parent: "armor:medium",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:coral-armor",             label: "Coral Armor",            group: "Armor / Medium",               kind: "leaf",  parent: "armor:medium",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:hellknight-breastplate",  label: "Hellknight Breastplate", group: "Armor / Medium",               kind: "leaf",  parent: "armor:medium",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:hide-armor",              label: "Hide Armor",             group: "Armor / Medium",               kind: "leaf",  parent: "armor:medium",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:lamellar-breastplate",    label: "Lamellar Breastplate",   group: "Armor / Medium",               kind: "leaf",  parent: "armor:medium",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:lattice-armor",           label: "Lattice Armor",          group: "Armor / Medium",               kind: "leaf",  parent: "armor:medium",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:niyahaat",                label: "Niyahaat",               group: "Armor / Medium",               kind: "leaf",  parent: "armor:medium",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:scale-mail",              label: "Scale Mail",             group: "Armor / Medium",               kind: "leaf",  parent: "armor:medium",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:wooden-breastplate",      label: "Wooden Breastplate",     group: "Armor / Medium",               kind: "leaf",  parent: "armor:medium",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:defrex-hide",             label: "Carbon Skin",            group: "Armor / Light",                kind: "leaf",  parent: "armor:medium",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:freebooter-armor",        label: "Estex Suit",             group: "Armor / Light",                kind: "leaf",  parent: "armor:medium",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:shotalashu-armor",        label: "Hardlight Series",       group: "Armor / Light",                kind: "leaf",  parent: "armor:medium",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:skyfire-armor",           label: "Microcord Armor",        group: "Armor / Light",                kind: "leaf",  parent: "armor:medium",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:swarmsuit",               label: "Second Skin",            group: "Armor / Light",                kind: "leaf",  parent: "armor:medium",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },

  { id: "armor:heavy",                                  label: "Heavy Armor",            group: "Armor",                        kind: "minor", parent: "group:armor",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:half-plate",              label: "Half Plate",             group: "Armor / Heavy",                kind: "leaf",  parent: "armor:heavy",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:hellknight-half-plate",   label: "Hellknight Half Plate",  group: "Armor / Heavy",                kind: "leaf",  parent: "armor:heavy",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:splint-mail",             label: "Splint Mail",            group: "Armor / Heavy",                kind: "leaf",  parent: "armor:heavy",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:bastion-plate",           label: "Bastion Plate",          group: "Armor / Heavy",                kind: "leaf",  parent: "armor:heavy",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:fortress-plate",          label: "Fortress Plate",         group: "Armor / Heavy",                kind: "leaf",  parent: "armor:heavy",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:full-plate",              label: "Full Plate",             group: "Armor / Heavy",                kind: "leaf",  parent: "armor:heavy",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:hellknight-plate",        label: "Hellknight Plate",       group: "Armor / Heavy",                kind: "leaf",  parent: "armor:heavy",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:o-yoroi",                 label: "O-Yoroi",                group: "Armor / Heavy",                kind: "leaf",  parent: "armor:heavy",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  
  { id: "item.system.baseItem:aegis-series",            label: "Carbon Skin",            group: "Armor / Light",                kind: "leaf",  parent: "armor:heavy",       anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:defiance-series",         label: "Estex Suit",             group: "Armor / Light",                kind: "leaf",  parent: "armor:heavy",       anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:hidden-soldier-armor",    label: "Hardlight Series",       group: "Armor / Light",                kind: "leaf",  parent: "armor:heavy",       anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:kyokor-plating",          label: "Microcord Armor",        group: "Armor / Light",                kind: "leaf",  parent: "armor:heavy",       anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:thinplate",               label: "Second Skin",            group: "Armor / Light",                kind: "leaf",  parent: "armor:heavy",       anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:veskarium-imperial-plate",label: "Second Skin",            group: "Armor / Light",                kind: "leaf",  parent: "armor:heavy",       anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },

  { id: "armor:light-barding",                          label: "Light Barding",          group: "Armor",                        kind: "minor", parent: "group:armor",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "armor:heavy-barding",                          label: "Heavy Barding",          group: "Armor",                        kind: "minor", parent: "group:armor",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },

  // ==== Ammunition ====
  { id: "group:ammunition",                             label: "Ammunition",             group: "Ammunition",                   kind: "major" },
  { id: "item.system.baseItem:arrows",                  label: "Arrows",                 group: "Ammunition",                                  parent: "group:ammunition", anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:blowgun-darts",           label: "Blowgun Darts",          group: "Ammunition",                                  parent: "group:ammunition", anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:bolts",                   label: "Bolts",                  group: "Ammunition",                                  parent: "group:ammunition", anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:magazine",                label: "Magazine",               group: "Ammunition",                                  parent: "group:ammunition", anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:rounds",                  label: "Rounds",                 group: "Ammunition",                                  parent: "group:ammunition", anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:sling-bullets",           label: "Sling Bullets",          group: "Ammunition",                                  parent: "group:ammunition", anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:spray-pellets",           label: "Spray Pellets",          group: "Ammunition",                                  parent: "group:ammunition", anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:wooden-taws",             label: "Wooden Taws",            group: "Ammunition",                                  parent: "group:ammunition", anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:battery",                 label: "Battery",                group: "Ammunition",                                  parent: "group:ammunition", anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:chem-tank",               label: "Chem Tank",              group: "Ammunition",                                  parent: "group:ammunition", anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:proyectile-ammo",         label: "Projectile Ammo",        group: "Ammunition",                                  parent: "group:ammunition", anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },

  // ==== Consumables ====
  { id: "group:consumable",                             label: "Consumables",            group: "Consumables",                  kind: "major" },
  { id: "item.system.category:catalyst",                label: "Catalyst",               group: "Consumables",                                 parent: "group:consumable",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.category:drug",                    label: "Drug",                   group: "Consumables",                                 parent: "group:consumable",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.category:elixir",                  label: "Elixir",                 group: "Consumables",                                 parent: "group:consumable",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.category:fulu",                    label: "Fulu",                   group: "Consumables",                                 parent: "group:consumable",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.category:gadget",                  label: "Gadget",                 group: "Consumables",                                 parent: "group:consumable",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.category:mutagen",                 label: "Mutagen",                group: "Consumables",                                 parent: "group:consumable",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.category:oil",                     label: "Oil",                    group: "Consumables",                                 parent: "group:consumable",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.category:other",                   label: "Other",                  group: "Consumables",                                 parent: "group:consumable" },
  { id: "item.system.category:poison",                  label: "Poison",                 group: "Consumables",                                 parent: "group:consumable" },
  { id: "item.system.category:potion",                  label: "Potion",                 group: "Consumables",                                 parent: "group:consumable" },
  { id: "item.system.category:scroll",                  label: "Scroll",                 group: "Consumables",                                 parent: "group:consumable",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.category:snare",                   label: "Snare",                  group: "Consumables",                                 parent: "group:consumable",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.category:spell-gem",               label: "Spell Gem",              group: "Consumables",                                 parent: "group:consumable",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.category:talisman",                label: "Talisman",               group: "Consumables",                                 parent: "group:consumable",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.category:toolkit",                 label: "Toolkit",                group: "Consumables",                                 parent: "group:consumable",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.category:wand",                    label: "Wand",                   group: "Consumables",                                 parent: "group:consumable",       anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },

  // ==== Shields ====
  { id: "group:shield",                                 label: "Shields",             group: "Shields",                         kind: "major" },
  { id: "item.system.baseItem:buckler",                 label: "Buckler",             group: "Shields",                                        parent: "group:shield",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:casters-targe",           label: "Caster's Targe",      group: "Shields",                                        parent: "group:shield",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:dart-shield",             label: "Dart Shield",         group: "Shields",                                        parent: "group:shield",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:fortress-shield",         label: "Fortress Shield",     group: "Shields",                                        parent: "group:shield",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:gauntlet-buckler",        label: "Gauntlet Buckler",    group: "Shields",                                        parent: "group:shield",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:harnessed-shield",        label: "Harnessed Shield",    group: "Shields",                                        parent: "group:shield",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:klar",                    label: "Klar",                group: "Shields",                                        parent: "group:shield",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:meteor-shield",           label: "Meteor Shield",       group: "Shields",                                        parent: "group:shield",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:razor-disc",              label: "Razor Disc",          group: "Shields",                                        parent: "group:shield",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:salvo-shield",            label: "Salvo Shield",        group: "Shields",                                        parent: "group:shield",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:steel-shield",            label: "Steel Shield",        group: "Shields",                                        parent: "group:shield",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:swordstealer-shield",     label: "Swordstealer Shield", group: "Shields",                                        parent: "group:shield",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:tower-shield",            label: "Tower Shield",        group: "Shields",                                        parent: "group:shield",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:wooden-shield",           label: "Wooden Shield",       group: "Shields",                                        parent: "group:shield",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.baseItem:carbon-shield",           label: "Carbon Shield",       group: "Shields",                                        parent: "group:shield",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:compact-shield",          label: "Compact Shield",      group: "Shields",                                        parent: "group:shield",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:deflecting-shield",       label: "Deflecting Shield",   group: "Shields",                                        parent: "group:shield",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:irising-shield",          label: "Irising Shield",      group: "Shields",                                        parent: "group:shield",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:mobile-bulkwark",         label: "Mobile Bulkwark",     group: "Shields",                                        parent: "group:shield",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:phase-shield",            label: "Phase Shield",        group: "Shields",                                        parent: "group:shield",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.baseItem:riot-shield",             label: "Riot Shield",         group: "Shields",                                        parent: "group:shield",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },

  // ==== Weapons ====
  { id: "group:weapon",                                 label: "Weapons",             group: "Weapons",                        kind: "major" },
  { id: "item.system.group:axe",                        label: "Axe",                 group: "Weapons",                                        parent: "group:weapon" },
  { id: "item.system.group:bomb",                       label: "Bomb",                group: "Weapons",                                        parent: "group:weapon",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.group:bow",                        label: "Bow",                 group: "Weapons",                                        parent: "group:weapon",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.group:brawling",                   label: "Brawling",            group: "Weapons",                                        parent: "group:weapon" },
  { id: "item.system.group:club",                       label: "Club",                group: "Weapons",                                        parent: "group:weapon" },
  { id: "item.system.group:crossbow",                   label: "Crossbow",            group: "Weapons",                                        parent: "group:weapon" },
  { id: "item.system.group:dart",                       label: "Dart",                group: "Weapons",                                        parent: "group:weapon" },
  { id: "item.system.group:firearm",                    label: "Firearm",             group: "Weapons",                                        parent: "group:weapon",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.group:flail",                      label: "Flail",               group: "Weapons",                                        parent: "group:weapon" },
  { id: "item.system.group:hammer",                     label: "Hammer",              group: "Weapons",                                        parent: "group:weapon" },
  { id: "item.system.group:knife",                      label: "Knife",               group: "Weapons",                                        parent: "group:weapon" },
  { id: "item.system.group:mental",                     label: "Mental",              group: "Weapons",                                        parent: "group:weapon",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.group:pick",                       label: "Pick",                group: "Weapons",                                        parent: "group:weapon",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.group:poison",                     label: "Poison",              group: "Weapons",                                        parent: "group:weapon",      anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.group:polearm",                    label: "Polearm",             group: "Weapons",                                        parent: "group:weapon" },
  { id: "item.system.group:sling",                      label: "Sling",               group: "Weapons",                                        parent: "group:weapon" },
  { id: "item.system.group:spear",                      label: "Spear",               group: "Weapons",                                        parent: "group:weapon" },
  { id: "item.system.group:sword",                      label: "Sword",               group: "Weapons",                                        parent: "group:weapon" },
  { id: "item.system.group:corrosive",                  label: "Corrosive",           group: "Weapons",                                        parent: "group:weapon",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.group:cryo",                       label: "Cryo",                group: "Weapons",                                        parent: "group:weapon",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.group:flame",                      label: "Flame",               group: "Weapons",                                        parent: "group:weapon",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.group:grenade",                    label: "Grenade",             group: "Weapons",                                        parent: "group:weapon",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.group:laser",                      label: "Laser",               group: "Weapons",                                        parent: "group:weapon",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.group:plasma",                     label: "Plasma",              group: "Weapons",                                        parent: "group:weapon",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.group:shock",                      label: "Shock",               group: "Weapons",                                        parent: "group:weapon",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
  { id: "item.system.group:sonic",                      label: "Sonic",               group: "Weapons",                                        parent: "group:weapon",      anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },

  // ==== Treasure ====
  { id: "group:treasure",                               label: "Treasure",            group: "Treasure",                       kind: "major" },
  { id: "item.system.category:art-object",              label: "Art Object",          group: "Treasure",                                       parent: "group:treasure" },
  { id: "item.system.category:coin",                    label: "Coin",                group: "Treasure",                                       parent: "group:treasure", anyOf: [{ systems: ["pf2e"] }, { systems: ["sf2e"], modules: ["pf2e-anachronism"] }] },
  { id: "item.system.category:gem",                     label: "Gem",                 group: "Treasure",                                       parent: "group:treasure" },
  { id: "item.system.category:material",                label: "Material",            group: "Treasure",                                       parent: "group:treasure" },
  { id: "item.system.category:credstick",               label: "Credstick",           group: "Treasure",                                       parent: "group:treasure", anyOf: [{ systems: ["sf2e"] }, { systems: ["pf2e"], modules: ["sf2e-anachronism"] }] },
];

/* ===========================
 * Storage (WORLD) + Backups/Migración
 * =========================== */
const KEY = "customContainersJson";
const KEY_BACKUP = "customContainersJsonBackup";

// Raw readers that can look into storages even if scope changed in older versions
function _storageGet(scope, settingKey) {
  try {
    const store = game.settings?.storage?.get?.(scope);
    if (!store) return null;
    // Some storages expose getItem(), others get()
    return (store.getItem?.(`${MODULE}.${settingKey}`) ?? store.get?.(`${MODULE}.${settingKey}`) ?? null);
  } catch {
    return null;
  }
}

function _tryParseList(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.containers)) return parsed.containers;
  } catch {
    // ignore
  }
  return [];
}

function _normalizeContainer(c = {}, idx = 0) {
  const out = { ...c };
  if (!out.id) out.id = `c-legacy-${idx}-${Math.random().toString(36).slice(2, 8)}`;
  out.name = String(out.name ?? out.id);
  out.patterns = String(out.patterns ?? out.name ?? "");

  // regex: keep if valid, otherwise rebuild from patterns
  const __esc = (s) => String(s).replace(/[.*+?^${}()|[\[\]\]]/g, "\$&");
  const __buildRegexFromPatterns = (patterns) => {
    const parts = String(patterns || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(__esc);
    return parts.length ? `(?:${parts.join("|")})` : "";
  };
  if (!out.regex || typeof out.regex !== "string") out.regex = __buildRegexFromPatterns(out.patterns);

  if (Array.isArray(out.categories)) out.categories = out.categories.join(", ");
  out.categories = String(out.categories ?? "equipment, armor, weapon, shield, consumable, treasure, coins, container");

  const n = Number(out.emptyChance);
  out.emptyChance = Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 25;

  if (Array.isArray(out.countRange)) out.countRange = out.countRange.join(", ");
  out.countRange = String(out.countRange ?? "1, 5");

  if (!Array.isArray(out.filters)) out.filters = [];
  return out;
}

function _normalizeList(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr.map(_normalizeContainer);
}

function readList() {
  // Primary: current registered setting
  let raw = "";
  try {
    raw = String(game.settings.get(MODULE, KEY) || "");
  } catch {
    raw = "";
  }
  let list = _tryParseList(raw);

  // Fallback: world backup (last-known-good)
  if (!list.length) {
    try {
      list = _tryParseList(String(game.settings.get(MODULE, KEY_BACKUP) || ""));
    } catch {
      /* ignore */
    }
  }

  // Fallback: client storage (if older versions used scope: "client")
  if (!list.length) {
    const clientRaw = _storageGet("client", KEY);
    list = _tryParseList(clientRaw);
  }

  return _normalizeList(list);
}

async function writeList(list) {
  const normalized = _normalizeList(list ?? []);

  // Keep a backup before overwriting
  try {
    const prevRaw = String(game.settings.get(MODULE, KEY) || "");
    if (prevRaw) await game.settings.set(MODULE, KEY_BACKUP, prevRaw);
  } catch {
    // ignore if backup setting isn't registered yet
  }

  await game.settings.set(MODULE, KEY, JSON.stringify(normalized));
}

// One-time migration helper: if world list is empty but client has data, copy it over.
Hooks.once("ready", async () => {
  try {
    const world = readList();
    if (world.length) return;

    const clientRaw = _storageGet("client", KEY);
    const client = _normalizeList(_tryParseList(clientRaw));
    if (client.length) {
      await writeList(client);
      console.info(`${MODULE} | Migrated custom containers from client storage to world setting.`);
    }
  } catch (err) {
    console.warn(`${MODULE} | Custom container migration skipped`, err);
  }
});

/* ===========================
 * Utilidades
 * =========================== */
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function buildRegexFromPatterns(patterns) {
  const parts = String(patterns || "").split(",").map(s => s.trim()).filter(Boolean).map(esc);
  return parts.length ? `(?:${parts.join("|")})` : "";
}
function parseCountRange(s, fallback=[1,5]) {
  const p = String(s||"").split(",").map(n=>Number(n.trim())).filter(Number.isFinite);
  return p.length===2 ? [Math.min(p[0],p[1]), Math.max(p[0],p[1])] : fallback;
}
function catsToArray(s) {
  return String(s||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
}
function newId() { return `c-${Math.random().toString(36).slice(2,6)}${Math.random().toString(36).slice(2,6)}`; }

function normalizeContainer(raw) {
  const c = raw && typeof raw === "object" ? { ...raw } : {};

  c.id = String(c.id || "").trim() || newId();
  c.name = String(c.name || c.id || "Container");

  // Patterns + regex
  c.patterns = String(c.patterns || c.name || "");
  if (!c.regex) c.regex = buildRegexFromPatterns(c.patterns);

  // Allowed categories string (comma-separated)
  c.categories = String(c.categories || "equipment, armor, weapon, shield, consumable, treasure, coins, container");

  // Empty chance
  const ec = Number(c.emptyChance);
  c.emptyChance = Number.isFinite(ec) ? Math.max(0, Math.min(100, ec)) : 25;

  // Count range
  c.countRange = String(c.countRange || "1, 5");

  // Filters (Tagify JSON)
  if (typeof c.filters === "string") {
    try { c.filters = JSON.parse(c.filters); } catch { c.filters = []; }
  }
  if (!Array.isArray(c.filters)) c.filters = [];

  return c;
}

function isModuleActive(id) {
  return !!game.modules?.get(id)?.active;
}

function getFilterContext() {
  const systemId = game.system?.id || "pf2e";

  const mods = {
    sf2eAnachronism: isModuleActive("sf2e-anachronism"),
    pf2eAnachronism: isModuleActive("pf2e-anachronism"),
  };

  return { systemId, mods };
}

function catalogEntryEnabled(entry, ctx) {
  const only = entry.onlySystems;
  const exc  = entry.excludeSystems;

  if (Array.isArray(only) && only.length && !only.includes(ctx.systemId)) return false;
  if (Array.isArray(exc) && exc.length && exc.includes(ctx.systemId)) return false;

  const reqMods = entry.requireModules;
  if (Array.isArray(reqMods) && reqMods.length) {
    for (const id of reqMods) if (!isModuleActive(id)) return false;
  }

  const anyOf = entry.anyOf;
  if (Array.isArray(anyOf) && anyOf.length) {
    const ok = anyOf.some(rule => {
      const sysOk = !rule.systems?.length || rule.systems.includes(ctx.systemId);
      const modOk = !rule.modules?.length || rule.modules.some(id => isModuleActive(id));
      return sysOk && modOk;
    });
    if (!ok) return false;
  }

  if (typeof entry.predicate === "function") {
    try { if (!entry.predicate(ctx)) return false; }
    catch { return false; }
  }

  return true;
}

function getFilterCatalogForSystem() {
  const ctx = getFilterContext();
  return FILTER_CATALOG.filter(e => catalogEntryEnabled(e, ctx));
}

function getSystemId() {
  return game.system?.id || "pf2e";
}


/* ===========================
 * API pública (global)
 * =========================== */
const API = {
  list() { return readList(); },

  /** Export all custom containers as JSON. */
  exportJson({ pretty = true } = {}) {
    const payload = {
      schema: 1,
      system: getSystemId(),
      containers: readList(),
    };
    return JSON.stringify(payload, null, pretty ? 2 : 0);
  },

  /**
   * Import from a parsed payload object.
   * @param {object} payload
   * @param {{mode?: 'merge'|'replace'}} opts
   */
  async importFromPayload(payload, { mode = "merge" } = {}) {
    try {
      if (!payload || typeof payload !== "object") return { ok: false, reason: "no-payload" };

      const containers = Array.isArray(payload.containers) ? payload.containers : null;
      if (!containers) return { ok: false, reason: "no-containers" };

      const normalized = containers.map(_normalizeContainer).filter(Boolean);
      if (!normalized.length) return { ok: false, reason: "empty" };

      const existing = readList().map(_normalizeContainer).filter(Boolean);
      let next = [];

      if (mode === "replace") {
        next = normalized;
      } else {
        // merge (prefer existing when ids collide)
        const byId = new Map(existing.map(c => [c.id, c]));
        for (const inc of normalized) {
          if (!byId.has(inc.id)) byId.set(inc.id, inc);
        }
        // preserve the user's current ordering first, then append new ones
        next = existing.map(c => byId.get(c.id)).filter(Boolean);
        for (const [id, c] of byId.entries()) {
          if (!next.some(x => x.id === id)) next.push(c);
        }
      }

      await writeList(next);
      return { ok: true, count: next.length };
    } catch (e) {
      console.error(`${MODULE} importFromPayload error`, e);
      return { ok: false, reason: "exception" };
    }
  },

  /** Import containers from JSON. mode: "merge" (keep existing IDs) or "replace". */
  async importJson(text, { mode = "merge" } = {}) {
    let parsed;
    try {
      parsed = JSON.parse(String(text ?? ""));
    } catch (err) {
      throw new Error("Invalid JSON");
    }

    const incomingRaw = Array.isArray(parsed)
      ? parsed
      : (parsed && Array.isArray(parsed.containers) ? parsed.containers : []);

    const current = readList();
    if (mode === "replace") {
      await writeList(incomingRaw);
      return { mode, replaced: current.length, total: incomingRaw.length, added: incomingRaw.length };
    }

    const existing = new Set(current.map(c => c.id));
    const additions = [];
    for (const c of incomingRaw) {
      const id = c?.id;
      if (id && existing.has(String(id))) continue;
      additions.push(c);
    }

    await writeList(current.concat(additions));
    return { mode, kept: current.length, added: additions.length, total: current.length + additions.length };
  },

  async set(list) { await writeList(list); },

  async add() {
    const base = game.i18n.localize("Container") || "Container";
    const all  = readList();
    const next = `${base} ${1 + all.filter(c => c.name?.startsWith(base)).length}`;
    const id   = newId();

    const entry = {
      id,
      name: next,
      patterns: next,
      regex: buildRegexFromPatterns(next),
      categories: "equipment, armor, weapon, shield, consumable, treasure, coins, container",
      emptyChance: 25,
      countRange: "1, 5",
      filters: []
    };

    all.unshift(entry);
    await writeList(all);
    return entry;
  },

  async remove(id) {
    await writeList(readList().filter(c => c.id !== id));
  },

  matchByName(name) {
    const n = String(name ?? "");
    for (const c of readList()) {
      const rx = c.regex ? new RegExp(c.regex, "i") : null;
      if (rx?.test(n)) return c;
    }
    return null;
  },

  typeStringFor(id) { return `custom:${id}`; },

  getById(id) { return readList().find(c => c.id === id) || null; },

  parseType(typeStr) {
    const m = String(typeStr||"").match(/^custom:(.+)$/);
    return m ? this.getById(m[1]) : null;
  },

  // ===== usado por el generador =====
  getEmptyChanceFor(typeStr) {
    const c = this.parseType(typeStr);
    const n = Number(c?.emptyChance);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 25;
  },

  getCountRangeFor(typeStr) {
    const c = this.parseType(typeStr);
    return c ? parseCountRange(c.countRange, [1,5]) : [1,5];
  },

  getAllowedCategoriesFor(typeStr) {
    const c = this.parseType(typeStr);
    return c ? catsToArray(c.categories) : [];
  },

  getFiltersFor(typeStr) {
    const c = this.parseType(typeStr);
    return Array.isArray(c?.filters) ? c.filters : [];
  },

  // ===== soporte Tagify =====
  getFilterWhitelist() {
    const catalog = getFilterCatalogForSystem();
    return catalog.map(x => ({
      value: x.id, label: x.label, group: x.group, kind: x.kind, parent: x.parent
    }));
  },

  allAsPromptOptions() {
    return readList().map(c => ({ value: this.typeStringFor(c.id), label: c.name || c.id }));
  }
};

window.pf2eAutolootCustom = API;

