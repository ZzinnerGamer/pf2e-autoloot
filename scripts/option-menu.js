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
      this._enhanceCustomContainersUI(content);
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

  _enhanceCustomContainersUI(html) {
    // Only relevant when the Custom group is active
    if (this.activeGroupKey !== "Custom") return;

    const root = html?.[0] ?? html;
    if (!root) return;

    const list = root.querySelector(".custom-containers");
    if (!list) return;

    // --- Toolbar injection (idempotent)
    let toolbar = root.querySelector(".custom-containers-toolbar");
    if (!toolbar) {
      toolbar = document.createElement("div");
      toolbar.className = "custom-containers-toolbar";
      toolbar.style.display = "flex";
      toolbar.style.gap = "0.5rem";
      toolbar.style.alignItems = "center";
      toolbar.style.margin = "0.5rem 0";

      toolbar.innerHTML = `
        <input type="text" class="custom-containers-search" placeholder="${game.i18n.localize("Search") || "Search"}..." style="flex:1" />
        <button type="button" class="custom-containers-export"><i class="fas fa-file-export"></i> ${game.i18n.localize("Export") || "Export"}</button>
        <button type="button" class="custom-containers-import"><i class="fas fa-file-import"></i> ${game.i18n.localize("Import") || "Import"}</button>
      `;

      list.parentElement?.insertBefore(toolbar, list);
    }

    const searchInput = toolbar.querySelector(".custom-containers-search");
    if (searchInput) {
      if (typeof this._customSearch === "string" && searchInput.value !== this._customSearch) {
        searchInput.value = this._customSearch;
      }
      searchInput.oninput = (ev) => {
        this._customSearch = String(ev?.target?.value ?? "");
        this._filterCustomContainers(root, this._customSearch);
      };
      // Apply initial filter
      this._filterCustomContainers(root, this._customSearch);
    }

    const expBtn = toolbar.querySelector(".custom-containers-export");
    if (expBtn && !expBtn.dataset.bound) {
      expBtn.dataset.bound = "1";
      expBtn.addEventListener("click", () => this._exportCustomContainers());
    }

    const impBtn = toolbar.querySelector(".custom-containers-import");
    if (impBtn && !impBtn.dataset.bound) {
      impBtn.dataset.bound = "1";
      impBtn.addEventListener("click", () => this._importCustomContainers());
    }

    // --- Drag handles (idempotent)
    this._installDragReorder(root);
  }

  _filterCustomContainers(root, query) {
    const q = String(query ?? "").trim().toLowerCase();
    const fieldsets = [...root.querySelectorAll("fieldset.custom-container")];
    for (const fs of fieldsets) {
      // The Custom tab template may not provide a dedicated "custom-name" input.
      // Prefer the name input following our existing naming convention: custom.<id>.name
      const id = fs.dataset.customId || fs.getAttribute("data-custom-id") || "";
      const nameEl =
        (id ? fs.querySelector(`input[name="custom.${CSS.escape(id)}.name"]`) : null) ||
        fs.querySelector("input[name$='.name']") ||
        fs.querySelector("input[type='text']");

      const name = String(nameEl?.value ?? fs.dataset.customName ?? "");
      fs.style.display = !q || name.toLowerCase().includes(q) ? "" : "none";
    }
  }

  _installDragReorder(root) {
    const list = root.querySelector(".custom-containers");
    if (!list) return;

    // Add handle to every container if missing
    for (const fs of list.querySelectorAll("fieldset.custom-container")) {
      if (fs.querySelector(".custom-drag-handle")) continue;

      const handle = document.createElement("a");
      handle.className = "custom-drag-handle";
      handle.title = game.i18n.localize("Reorder") || "Reorder";
      handle.draggable = true;
      handle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
      handle.style.cursor = "grab";
      handle.style.marginRight = "0.5rem";
      handle.style.display = "inline-flex";
      handle.style.alignItems = "center";

      // Try to place it near the container title row, else prepend
      const header = fs.querySelector(".custom-header") || fs.querySelector("legend") || fs;
      header.insertBefore(handle, header.firstChild);

      handle.addEventListener("dragstart", (ev) => {
        this._dragCustomId = fs.dataset.customId || fs.getAttribute("data-custom-id");
        ev.dataTransfer?.setData("text/plain", this._dragCustomId || "");
        ev.dataTransfer?.setDragImage?.(fs, 10, 10);
        fs.classList.add("dragging");
      });

      handle.addEventListener("dragend", () => {
        fs.classList.remove("dragging");
        this._dragCustomId = null;
      });
    }

    // Install drop listeners once
    if (list.dataset.dndBound) return;
    list.dataset.dndBound = "1";

    list.addEventListener("dragover", (ev) => {
      if (!this._dragCustomId) return;
      ev.preventDefault();
    });

    list.addEventListener("drop", (ev) => {
      if (!this._dragCustomId) return;
      ev.preventDefault();

      const dragged = list.querySelector(`fieldset.custom-container[data-custom-id="${this._dragCustomId}"]`);
      const targetFs = ev.target?.closest?.("fieldset.custom-container");
      if (!dragged || !targetFs || dragged === targetFs) return;

      // If search is active, we still reorder but preserve hidden items positions.
      const rect = targetFs.getBoundingClientRect();
      const before = ev.clientY < rect.top + rect.height / 2;
      if (before) {
        list.insertBefore(dragged, targetFs);
      } else {
        list.insertBefore(dragged, targetFs.nextSibling);
      }

      // Persist order + any in-progress edits
      this._saveCustomContainers().catch((err) => console.error("pf2e-autoloot | reorder save failed", err));
    });
  }

  async _exportCustomContainers() {
    const CC = window.pf2eAutolootCustom;
    if (!CC) return;

    await this._saveCustomContainers();
    const json = CC.exportJson({ pretty: true });

    try {
      const saveFn = foundry?.utils?.saveDataToFile ?? globalThis.saveDataToFile;
      if (saveFn) {
        const filename = `pf2e-autoloot-custom-containers-${Date.now()}.json`;
        saveFn(json, "application/json", filename);
      }
    } catch { /* ignore */ }

    // Show copyable dialog
    await this._showJsonDialog({
      title: game.i18n.localize("Export") || "Export",
      body: json,
      ok: game.i18n.localize("Close") || "Close",
    });
  }

  async _importCustomContainers() {
  const t = (key, fallback) => (game.i18n?.localize?.(key) ?? fallback ?? key);

  const DialogV2 = foundry?.applications?.api?.DialogV2;
  if (!DialogV2) {
    ui.notifications?.error("DialogV2 not available");
    return;
  }

  const content = document.createElement("div");
  content.innerHTML = `
    <div class="form-group" style="max-height: 350px; overflow-y: auto;">
      <label>${t("pf2e-autoloot.settings.custom.import.label", "Paste JSON or pick a file")}</label>
      <textarea class="cc-import-text" rows="10" style="width:100%; font-family:monospace; "></textarea>
      <div class="notes" style="max-width: 500px; overflow-y: auto;">${t("pf2e-autoloot.settings.custom.import.hint", "If both are provided, file wins.")}</div>
    </div>
    <div class="form-group">
      <label>${t("pf2e-autoloot.settings.custom.import.file", "JSON File")}</label>
      <input class="cc-import-file" type="file" accept=".json,application/json">
    </div>
    <hr>
    <div class="form-group">
      <label>${t("pf2e-autoloot.settings.custom.import.mode", "Import mode")}</label>
      <label class="radio">
        <input type="radio" name="ccImportMode" value="merge" checked>
        ${t("pf2e-autoloot.settings.custom.import.merge", "Merge (keep existing on same id)")}
      </label>
      <label class="radio">
        <input type="radio" name="ccImportMode" value="replace">
        ${t("pf2e-autoloot.settings.custom.import.replace", "Replace all")}
      </label>
    </div>
  `;

  let captured = null;

  const result = await DialogV2.wait({
    window: { title: t("pf2e-autoloot.settings.custom.import.title", "Import Custom Containers") },
    with: 650,
    height: 500,
    resizable: true,
    content,
    buttons: [
      {
        action: "import",
        icon: '<i class="fas fa-file-import"></i>',
        label: t("Import", "Import"),
        callback: (_event, _button, dialog) => {
          const rootFromDialog = (() => {
            const el = dialog?.element ?? dialog?.el ?? dialog?.app?.element;
            if (!el) return null;
            if (el instanceof HTMLElement) return el;
            // jQuery-like
            if (Array.isArray(el) && el[0] instanceof HTMLElement) return el[0];
            if (el[0] instanceof HTMLElement) return el[0];
            return null;
          })();

          // Fallback: take the last visible import textarea in the DOM
          const root =
            rootFromDialog ||
            document.querySelectorAll("textarea.cc-import-text")?.[
              document.querySelectorAll("textarea.cc-import-text").length - 1
            ]?.closest("form") ||
            document;

          const mode = root.querySelector('input[name="ccImportMode"]:checked')?.value ?? "merge";
          const text = (root.querySelector(".cc-import-text")?.value ?? "").trim();
          const file = root.querySelector(".cc-import-file")?.files?.[0] ?? null;
          captured = { mode, text, file };
        },
      },
      {
        action: "cancel",
        label: t("Cancel", "Cancel"),
      },
    ],
    default: "import",
    rejectClose: false,
  });

  const action = result?.action ?? result;
  if (action !== "import") return;

  const mode = captured?.mode ?? "merge";
  const pasted = captured?.text ?? "";
  const file = captured?.file ?? null;

  let jsonText = pasted;
  if (file) jsonText = await file.text();
  jsonText = (jsonText ?? "").trim();

  if (!jsonText) {
    ui.notifications?.warn(t("pf2e-autoloot.settings.custom.import.nojson", "No JSON provided."));
    return;
  }

  let payload;
  try {
    payload = JSON.parse(jsonText);
  } catch (err) {
    ui.notifications?.error(t("pf2e-autoloot.settings.custom.import.badjson", "Invalid JSON."));
    console.error(err);
    return;
  }

  const list = Array.isArray(payload?.containers) ? payload.containers : (Array.isArray(payload) ? payload : null);
  if (!list) {
    ui.notifications?.error(t("pf2e-autoloot.settings.custom.import.badformat", "JSON format not recognized."));
    return;
  }

  await window.pf2eAutolootCustom?.importFromPayload?.(payload, { mode });
  await this.render(true);
}

  async _showJsonDialog({ title, body, ok = "Ok" } = {}) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <textarea style="height: 16rem; width: 100%">${body?.replaceAll("</", "<\\/") ?? ""}</textarea>
      <p style="opacity:.8">${game.i18n.localize("You can copy this JSON.") || "You can copy this JSON."}</p>
    `;
    await this._showDialogV2({ title, content: wrapper, ok, cancel: null });
  }

  async _showDialogV2({ title, content, ok = "Ok", cancel = "Cancel" } = {}) {
    const DialogV2 = foundry?.applications?.api?.DialogV2;
    if (DialogV2?.wait) {
      const buttons = [{ action: "ok", label: ok, default: true }];
      if (cancel) buttons.push({ action: "cancel", label: cancel });

      const result = await DialogV2.wait({
        window: { title },
        content,
        buttons,
      });
      return { confirmed: result === "ok" };
    }

    // Fallback: legacy Dialog
    return new Promise((resolve) => {
      new Dialog({
        title,
        content: content?.outerHTML ?? String(content ?? ""),
        buttons: {
          ok: { label: ok, callback: () => resolve({ confirmed: true }) },
          ...(cancel ? { cancel: { label: cancel, callback: () => resolve({ confirmed: false }) } } : {}),
        },
        default: "ok",
        close: () => resolve({ confirmed: false }),
      }).render(true);
    });
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
