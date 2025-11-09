const MODULE = 'pf2e-autoloot';

/* ===========================
 * Util: espera a Tagify si lo carga el sistema
 * =========================== */
async function ensureTagifyLoaded() {
  if (globalThis.Tagify) return true;
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 100));
    if (globalThis.Tagify) return true;
  }
  console.warn("[pf2e-autoloot] Tagify is not available; the fields will function as plain text.");
  return false;
}

/* ===========================
 * Grupos de settings
 * =========================== */
const SETTINGS_GROUPS = {
  General: [
    'autoloot',
    'budgetFraction',
    'favorQuantity',
    'maxStack',
    'avoidNamesRegex'
  ],
  Compendia: [
    'pack-equipment',
    'preloadOnReady'
  ],
  Advanced: [
    'rarityWeightsJson',
    'debug',
    'uniqueRegistryJson'
  ]
};

let currentAutolootConfigApp = null;

/* ===========================
 *   AutolootConfigApp (ApplicationV2)
 * =========================== */
export class AutolootConfigApp extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: 'pf2e-autoloot-config',
    tag: 'div',
    window: {
      title: 'PF2E Autoloot',
      icon: 'fas fa-box-open',
      resizable: true
    },
    position: { width: 700, height: 600 },
    actions: {
      submit: AutolootConfigApp._onSubmit,
      switchGroup: AutolootConfigApp._onSwitchGroup,
      closeApp: AutolootConfigApp._onCloseApp,
      preloadCache: AutolootConfigApp._onPreloadCache,
      clearUniqueRegistry: AutolootConfigApp._onClearUniqueRegistry
    },
    classes: ['pf2e-autoloot-settings-window'],
  };

  constructor(options = {}) {
    super(options);
    try {
      this.options.window.title = "PF2E Autoloot";
    } catch (_) {}
    this.activeGroupKey = 'General';
    this._pendingChanges = {};
    currentAutolootConfigApp = this;
  }

  async _prepareContext() {
    const categories = [
      { key: 'General',    title: game.i18n.localize("General")    || "General",    active: this.activeGroupKey === 'General' },
      { key: 'Containers', title: game.i18n.localize("Containers") || "Containers", active: this.activeGroupKey === 'Containers' },
      { key: 'Custom',     title: game.i18n.localize("Custom")     || "Custom",     active: this.activeGroupKey === 'Custom' },
      { key: 'Compendia',  title: game.i18n.localize("Compendia")  || "Compendia",  active: this.activeGroupKey === 'Compendia' },
      { key: 'Advanced',   title: game.i18n.localize("Advanced")   || "Advanced",   active: this.activeGroupKey === 'Advanced' }
    ];

    const groups = [];
    let customContainers = [];

    if (this.activeGroupKey === 'Containers') {
      groups.push(...this._buildContainerGroups());
    } else if (this.activeGroupKey === 'Custom') {
      const CC = window.pf2eAutolootCustom;
      const raw = CC ? CC.list() : [];
      customContainers = raw.map(c => ({
        ...c,
        filtersJson: JSON.stringify(c.filters ?? [])
      }));
    } else {
      const keys = SETTINGS_GROUPS[this.activeGroupKey] || [];
      const items = this._buildSettingsItems(keys);
      groups.push({ title: this.activeGroupKey, items });
    }

    return { categories, groups, activeGroupKey: this.activeGroupKey, customContainers };
  }

  _buildSettingsItems(keys) {
    return keys.map(key => {
      const cfg = game.settings.settings?.get?.(`${MODULE}.${key}`);
      if (!cfg) return null;

      const value = game.settings.get(MODULE, key);

      let inputType = 'text';
      if (cfg.type === Boolean) inputType = 'checkbox';
      else if (cfg.type === Number) inputType = 'number';

      let choices = null;
      if (cfg.choices && typeof cfg.choices === 'object' && Object.keys(cfg.choices).length) {
        inputType = 'select';
        choices = Object.entries(cfg.choices).map(([val, labelKey]) => ({
          value: val,
          label: typeof labelKey === 'string' ? (game.i18n.localize(labelKey) || labelKey) : String(labelKey)
        }));
      }

      const min  = cfg.range?.min ?? null;
      const max  = cfg.range?.max ?? null;
      const step = cfg.range?.step ?? (inputType === 'number' ? 1 : null);

      const name = typeof cfg.name === 'string' ? (game.i18n.localize(cfg.name) || cfg.name) : (cfg.name || key);
      const hint = typeof cfg.hint === 'string' ? (game.i18n.localize(cfg.hint) || cfg.hint) : (cfg.hint || '');

      const isEmptyChance = key.startsWith('empty-');
      const isBudget      = key === 'budgetFraction';
      let ui = null;
      if ((isEmptyChance || isBudget) && inputType === 'number') ui = 'range';

      return { key, name, hint, value, inputType, min, max, step, ui, choices };
    }).filter(Boolean);
  }

  _buildContainerGroups() {
    const groups = [];
    const by = (keys, title) => groups.push({ title, items: this._buildSettingsItems(keys) });

    by(['name-barrel','empty-barrel','count-barrel'], game.i18n.localize("pf2e-autoloot.container.barrel") || "Barrel");
    by(['name-crate','empty-crate','count-crate','crateLevelOffset'], game.i18n.localize("pf2e-autoloot.container.crate") || "Crate");
    by(['name-chest','empty-chest','count-chest','minimumChestLevelOffset','maximumChestLevelOffset'], game.i18n.localize("pf2e-autoloot.container.chest") || "Chest");
    by(['name-pouch','empty-pouch','count-pouch'], game.i18n.localize("pf2e-autoloot.container.pouch") || "Pouch");
    by(['name-stash','empty-stash','stashLevelOffset'], game.i18n.localize("pf2e-autoloot.container.stash") || "Stash");

    return groups;
  }

  async _renderHTML(context) {
    return await foundry.applications.handlebars.renderTemplate(
      'modules/pf2e-autoloot/templates/settings-menu.hbs',
      context
    );
  }

  async _replaceHTML(result, content) {
    content.innerHTML = result;

    const wc = content.closest('.window-content');
    if (wc) {
      wc.style.display = 'flex';
      wc.style.flexDirection = 'column';
      wc.style.height = '100%';
    }

    content.querySelectorAll('[data-action="switchGroup"][data-key]')?.forEach(btn => {
      btn.addEventListener('click', () => AutolootConfigApp._onSwitchGroup(null, btn));
    });

    content.querySelector('[data-action="submit"]')?.addEventListener('click', (ev) => AutolootConfigApp._onSubmit.call(this, ev, ev.currentTarget));
    content.querySelector('[data-action="closeApp"]')?.addEventListener('click', (ev) => AutolootConfigApp._onCloseApp.call(this, ev, ev.currentTarget));

    content.querySelector('[data-action="preload-cache"]')?.addEventListener('click', () => AutolootConfigApp._onPreloadCache());
    content.querySelector('[data-action="clear-unique-registry"]')?.addEventListener('click', () => AutolootConfigApp._onClearUniqueRegistry());

    content.querySelector('[data-action="add-custom-container"]')?.addEventListener('click', async () => {
      try {
        await window.pf2eAutolootCustom?.add();
        this.render({ force: true });
      } catch (e) { console.warn(`[${MODULE}] add-custom-container`, e); }
    });
    content.querySelectorAll('[data-action="remove-custom-container"]')?.forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset?.id;
        if (!id) return;
        try {
          await window.pf2eAutolootCustom?.remove(id);
          this.render({ force: true });
        } catch (e) { console.warn(`[${MODULE}] remove-custom-container`, e); }
      });
    });

    if (this.activeGroupKey === 'Custom') {
      await ensureTagifyLoaded();
      this._initTagifyFilters(content);
    }
    
    const form = content.querySelector('form.pf2e-autoloot-settings');
    if (form) {
      form.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' && ev.target?.closest('.tagify')) ev.preventDefault();
      }, true);
    }

    return content;
  }

  /* ===========================
   * Tagify helpers
   * =========================== */
  _initTagifyFilters(rootEl) {
    if (!window.Tagify) {
      console.warn("[pf2e-autoloot] Tagify is not available; the fields will function as plain text.");
      return;
    }

    const wl = (globalThis.pf2eAutolootCustom?.getFilterWhitelist?.() || [])
      .map(x => ({
        value: x.id ?? x.value ?? "",
        label: x.label || x.id || "",
        group: x.group || "",
        kind: x.kind || "",
        parent: x.parent || ""
      }))
      .filter(x => x.value);

    const byValue = Object.fromEntries(wl.map(x => [x.value, x]));

    const inputs = rootEl.querySelectorAll('input[data-tagify="filters"]');
    inputs.forEach((el) => {
      if (el.__tagify) return;

      
      function esc(s) {
        const str = String(s ?? "");
        if (foundry?.utils?.escapeHTML) return foundry.utils.escapeHTML(str);
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

    let initial = [];
      try {
        const v = el.value?.trim();
        const raw = v?.startsWith("[") && v?.endsWith("]") ? JSON.parse(v) : (v ? v.split(",").map(s=>s.trim()) : []);
        const arr = Array.isArray(raw) ? raw : [];
        initial = arr
          .map(val => typeof val === "string" ? val : (val?.value ?? ""))
          .filter(Boolean)
          .map(v => ({ value: v, label: byValue[v]?.label || v }));
      } catch (_) {}

      const tagify = new window.Tagify(el, {
        enforceWhitelist: true,
        whitelist: wl,
        tagTextProp: "label",
        originalInputValueFormat: (vals) => JSON.stringify(vals.map(v => v.value)),
        delimiters: null,
        addTagOnBlur: true,
        dropdown: {
          enabled: 1,
          closeOnSelect: false,
          highlightFirst: true,
          searchKeys: ["value", "label", "group"],
          mapValueTo: "label"
        },
        templates: {
          tag(s){
            const value = foundry?.utils?.escapeHTML ? foundry.utils.escapeHTML(s.value) : String(s.value);
            const label = foundry?.utils?.escapeHTML ? foundry.utils.escapeHTML(s.label || s.value) : String(s.label || s.value);
            return `
              <tag title="${value}" contenteditable="false" class="tagify__tag" value="${value}">
                <x class="tagify__tag__removeBtn" aria-label="remove tag"></x>
                <div><span class="tagify__tag-text">${label}</span></div>
              </tag>`;
          }
        }
      });

      if (initial.length) {
        tagify.removeAllTags();
        tagify.addTags(initial, true);
      }

      const inputEl = tagify.DOM.input;
      inputEl.addEventListener("keydown", (ev) => {
        if (ev.key !== "Enter") return;
        ev.preventDefault(); ev.stopPropagation();

        const dd = tagify.DOM.dropdown;
        const activeEl = dd?.content?.querySelector(".tagify__dropdown__item--active");
        if (activeEl) {
          const value = activeEl.getAttribute("data-value");
          if (value) {
            const meta = byValue[value] || {};
            tagify.addTags([{ value, label: meta.label ?? value }], true, true);
            tagify.dropdown.hide();
            tagify.DOM.input.blur();
            setTimeout(() => tagify.DOM.input.focus(), 0);
          }
          return;
        }

        const txt = (inputEl.textContent || "").trim();
        if (txt && byValue[txt]) {
          const meta = byValue[txt];
          tagify.addTags([{ value: meta.value, label: meta.label ?? meta.value }], true, true);
          tagify.dropdown.hide();
        }
      });
      let cleanupDropdownHandlers = null;

      const onDropdownShow = () => {
        const dd = tagify.DOM.dropdown;
        if (!dd?.content) return;

        const handler = (ev) => {
          const item = ev.target.closest('.tagify__dropdown__item[data-selectable]');
          if (!item) return;
          tagify.dropdown.selectOption(item);
        };

        dd.content.addEventListener('mousedown', handler);
        dd.content.addEventListener('click', handler);

        cleanupDropdownHandlers = () => {
          dd.content.removeEventListener('mousedown', handler);
          dd.content.removeEventListener('click', handler);
          cleanupDropdownHandlers = null;
        };
      };

      const onDropdownHide = () => {
        if (cleanupDropdownHandlers) cleanupDropdownHandlers();
      };

      tagify.on('dropdown:show', onDropdownShow);
      tagify.on('dropdown:hide', onDropdownHide);

      const form = rootEl.closest("form");
      if (form) {
        form.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter" && ev.target?.closest(".tagify")) ev.preventDefault();
        }, true);
      }

      el.__tagify = tagify;
    });
  }


  /* ===========================
   * Captura y guardado
   * =========================== */
  _capturePendingChanges() {
    const form = this.element?.querySelector?.('form.pf2e-autoloot-settings');
    if (!form) return;

    const inputs = form.querySelectorAll('[name^="settings."]');
    inputs.forEach((el) => {
      const name = el.name;
      if (!name) return;
      if (el.type === 'checkbox') this._pendingChanges[name] = !!el.checked;
      else this._pendingChanges[name] = el.value;
    });
  }

  async _saveCustomContainers() {
    const CC = window.pf2eAutolootCustom;
    if (!CC) return;

    const form = this.element?.querySelector?.('form.pf2e-autoloot-settings');
    if (!form) return;

    const blocks = form.querySelectorAll('fieldset[data-custom-id]');
    const list = [];

    for (const fs of blocks) {
      const id = fs.getAttribute('data-custom-id');
      const pick = (sel) => fs.querySelector(sel);

      const name        = pick(`input[name="custom.${id}.name"]`)?.value ?? "";
      const patterns    = pick(`input[name="custom.${id}.patterns"]`)?.value ?? "";
      const categories  = pick(`input[name="custom.${id}.categories"]`)?.value ?? "";
      const emptyChance = Number(pick(`input[name="custom.${id}.emptyChance"]`)?.value ?? 25);
      const countRange  = pick(`input[name="custom.${id}.countRange"]`)?.value ?? "1, 5";

      let filters = [];
      const input = pick(`input[name="custom.${id}.filters"]`);
      const tagify = input && input.__tagify;
      if (tagify && Array.isArray(tagify.value)) {
        filters = tagify.value.map(t => t.value).filter(Boolean);
      } else {
        try {
          const raw = input?.value || "[]";
          const arr = JSON.parse(raw);
          filters = Array.isArray(arr) ? arr.map(x => (typeof x === "string" ? x : x?.value)).filter(Boolean) : [];
        } catch { filters = []; }
      }

      list.push({ id, name, patterns, categories, emptyChance, countRange, filters });
    }

    await CC.set(list);
  }

  /* ===========================
   * Acciones (estáticas)
   * =========================== */
  static _onSwitchGroup(_event, button) {
    const key = button?.dataset?.key;
    if (!key) return;
    const app = currentAutolootConfigApp;
    if (!app) return;

    try { app._capturePendingChanges(); } catch (_) {}
    app.activeGroupKey = key;
    app.render({ force: true });
  }

  static async _onSubmit(event, _button) {
    const app = currentAutolootConfigApp || this;
    try {
      const formEl = app.element?.querySelector?.('form.pf2e-autoloot-settings');
      if (!formEl) return app.close();

      try { app._capturePendingChanges(); } catch (_) {}
      try { await app._saveCustomContainers(); } catch (e) {
        console.warn(`[${MODULE}] Error saving custom containers`, e);
      }

      const fd = new FormData(formEl);
      const rawNow = Object.fromEntries(fd.entries());
      const raw = { ...app._pendingChanges, ...rawNow };

      const allKeys = Object.keys(raw)
        .filter(k => k.startsWith('settings.'))
        .map(k => k.slice('settings.'.length));

      for (const key of allKeys) {
        const cfg = game.settings.settings?.get?.(`${MODULE}.${key}`);
        const formKey = `settings.${key}`;
        let value = raw[formKey];
        const saved = game.settings.get(MODULE, key);
        if (!cfg) continue;

        if (cfg.type === Boolean)      value = (value === 'on' || value === 'true' || value === true);
        else if (cfg.type === Number)  value = value != null && value !== '' ? Number(value) : saved;
        else                           value = value ?? saved;

        if (value !== saved) await game.settings.set(MODULE, key, value);
      }

      app._pendingChanges = {};
      await app.close();
    } catch (e) {
      console.warn(`[${MODULE}] Error saving settings`, e);
    }
  }

  static async _onCloseApp(_event, _button) {
    try { await (currentAutolootConfigApp || this).close(); } catch (_) {}
  }

  static async _onPreloadCache() {
    try {
      await game.modules.get(MODULE)?.api?.preloadCache?.();
      ui.notifications.info(game.i18n.localize("pf2e-autoloot.msg.preloaded") || "Autoloot: preloaded cache.");
    } catch (e) {
      ui.notifications.warn("Autoloot: Unable to preload the cache.");
      console.warn(e);
    }
  }

  static async _onClearUniqueRegistry() {
    try {
      await game.settings.set(MODULE, "uniqueRegistryJson", "{}");
      ui.notifications.info(game.i18n.localize("pf2e-autoloot.msg.uniqueCleared") || "Unique records cleaned.");
    } catch (e) {
      ui.notifications.warn("Autoloot: Could not clear the unique log.");
      console.warn(e);
    }
  }
}

function __titleCase(s) {
  return String(s || "")
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function __prettyLabelFromValue(value) {
  const v = String(value || "");
  if (v.startsWith("armor:")) {
    const kind = v.split(":")[1] || "";
    return `${__titleCase(kind)} Armor`;
  }
  const last = v.split(":").pop();
  return __titleCase(last);
}


export function openAutolootSettings() {
  new AutolootConfigApp().render({ force: true });
}
