// src/popup/popup.js
import { getSettings } from "../settings/store.js";
import { parseQuery } from "../core/query-parser.js";
import { rankResults, groupItemsByDomain } from "../core/ranker.js";
import { TabsProvider } from "../providers/tabs.js";
import { SearchProvider } from "../providers/search.js";
import { ActionsProvider } from "../providers/actions.js";
import { ListView } from "./list-view.js";
import { setupKeyboardNav } from "./keyboard.js";

async function main() {
  const inputEl = /** @type {HTMLInputElement} */ (document.getElementById("search-input"));
  const clearBtn = /** @type {HTMLButtonElement} */ (document.getElementById("clear-btn"));
  const optionsBtn = /** @type {HTMLButtonElement} */ (document.getElementById("options-btn"));
  const modeBadge = /** @type {HTMLElement} */ (document.getElementById("mode-badge"));
  const container = /** @type {HTMLElement} */ (document.getElementById("results-container"));
  const listEl = /** @type {HTMLElement} */ (document.getElementById("results-list"));
  const emptyEl = /** @type {HTMLElement} */ (document.getElementById("empty-state"));

  // Ensure input gets focused reliably
  function ensureFocus() {
    inputEl.focus();
    requestAnimationFrame(() => inputEl.focus());
  }
  ensureFocus();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) ensureFocus();
  });

  // Settings & Context
  const settings = await getSettings();

  let currentWindowId = -1;
  let isIncognito = false;

  if (typeof browser !== "undefined" && browser.windows?.getCurrent) {
    try {
      const win = await browser.windows.getCurrent();
      currentWindowId = win.id || -1;
      isIncognito = Boolean(win.incognito);
    } catch (e) {
      console.warn("[Spotlight Popup] Could not get current window:", e);
    }
  }

  // Load usage stats (non-incognito only)
  let usageStats = {};
  if (!isIncognito && typeof browser !== "undefined" && browser.storage?.local) {
    try {
      const stored = await browser.storage.local.get("usage");
      usageStats = stored?.usage || {};
    } catch {}
  }

  /** @type {import('../providers/base.js').ProviderContext} */
  const ctx = {
    settings,
    currentWindowId,
    isIncognito,
    usageStats
  };

  // Instantiate providers
  const tabsProvider = new TabsProvider();
  const searchProvider = new SearchProvider();
  const actionsProvider = new ActionsProvider();

  // Initialize in parallel
  await Promise.all([
    tabsProvider.init(ctx),
    searchProvider.init(ctx),
    actionsProvider.init(ctx)
  ]);

  // Execute dispatch
  async function handleExecute(item, modifiers = {}) {
    if (item.provider === "tabs") {
      await tabsProvider.execute(item, ctx, modifiers);
    } else if (item.provider === "actions") {
      await actionsProvider.execute(item, ctx, modifiers);
    } else if (item.provider === "search" || modifiers.forceSearch) {
      await searchProvider.execute(item, ctx, modifiers);
    }
  }

  // List view & keyboard navigation
  const listView = new ListView(container, listEl, emptyEl, handleExecute);
  setupKeyboardNav(
    inputEl,
    listView,
    handleExecute,
    () => window.close()
  );

  // Clear button logic
  clearBtn.addEventListener("click", () => {
    inputEl.value = "";
    inputEl.dispatchEvent(new Event("input"));
    ensureFocus();
  });

  // Options button logic
  optionsBtn.addEventListener("click", () => {
    if (typeof browser !== "undefined" && browser.runtime?.openOptionsPage) {
      browser.runtime.openOptionsPage();
    }
    window.close();
  });

  // Query execution with rAF debounce
  let rafId = null;

  async function updateResults() {
    const rawVal = inputEl.value;
    clearBtn.style.display = rawVal.length > 0 ? "flex" : "none";

    const parsed = parseQuery(rawVal, settings.actions.sigil);

    // Update mode badge
    if (parsed.mode === "actions") {
      modeBadge.textContent = "Actions";
      modeBadge.style.display = "inline-flex";
    } else if (parsed.mode === "tabs") {
      modeBadge.textContent = "Tabs";
      modeBadge.style.display = "inline-flex";
    } else if (parsed.mode === "bookmarks") {
      modeBadge.textContent = "Bookmarks";
      modeBadge.style.display = "inline-flex";
    } else {
      modeBadge.style.display = "none";
    }

    // Query providers
    const [tabItems, searchItems, actionItems] = await Promise.all([
      tabsProvider.query(parsed, ctx),
      searchProvider.query(parsed, ctx),
      actionsProvider.query(parsed, ctx)
    ]);

    const candidates = [...tabItems, ...actionItems];
    const searchRow = searchItems.find(it => it.id === "web-search") || null;
    const directNavigateRow = searchItems.find(it => it.id === "navigate-url") || null;

    if (directNavigateRow) {
      candidates.unshift(directNavigateRow);
    }

    const ranked = rankResults(candidates, searchRow, {
      enterBehavior: settings.search.enterBehavior,
      maxResults: settings.ui.maxResults
    });

    listView.render(ranked, settings.tabs.groupByDomain);
  }

  inputEl.addEventListener("input", () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      updateResults();
    });
  });

  // Initial render (shows open tabs or sorted empty state)
  updateResults();
}

document.addEventListener("DOMContentLoaded", main);
