// src/options/options.js
import { getSettings, saveSettings } from "../settings/store.js";
import { DEFAULT_SETTINGS } from "../settings/schema.js";
import { runAboutProbe } from "../../tools/probe-about-urls.js";

async function init() {
  const sortModeEl = /** @type {HTMLSelectElement} */ (document.getElementById("sortMode"));
  const currentWindowFirstEl = /** @type {HTMLInputElement} */ (document.getElementById("currentWindowFirst"));
  const groupByDomainEl = /** @type {HTMLInputElement} */ (document.getElementById("groupByDomain"));
  const emptyQueryOrderEl = /** @type {HTMLSelectElement} */ (document.getElementById("emptyQueryOrder"));
  const showPinnedEl = /** @type {HTMLInputElement} */ (document.getElementById("showPinned"));
  const showDiscardedEl = /** @type {HTMLInputElement} */ (document.getElementById("showDiscarded"));

  const enterBehaviorEl = /** @type {HTMLSelectElement} */ (document.getElementById("enterBehavior"));
  const navigateUrlLikeEl = /** @type {HTMLInputElement} */ (document.getElementById("navigateUrlLike"));

  const actionSigilEl = /** @type {HTMLInputElement} */ (document.getElementById("actionSigil"));
  const maxResultsEl = /** @type {HTMLInputElement} */ (document.getElementById("maxResults"));

  const saveBtn = document.getElementById("save-btn");
  const resetBtn = document.getElementById("reset-btn");
  const toast = document.getElementById("toast");
  const incognitoNotice = document.getElementById("incognito-notice");

  const runProbeBtn = /** @type {HTMLButtonElement} */ (document.getElementById("run-probe-btn"));
  const probeResults = document.getElementById("probe-results");
  const probeSummary = document.getElementById("probe-summary");
  const probeMarkdown = /** @type {HTMLTextAreaElement} */ (document.getElementById("probe-markdown"));

  // Check incognito access permission
  if (typeof browser !== "undefined" && browser.extension?.isAllowedIncognitoAccess) {
    try {
      const allowed = await browser.extension.isAllowedIncognitoAccess();
      if (!allowed && incognitoNotice) {
        incognitoNotice.style.display = "block";
      }
    } catch {}
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = "block";
    setTimeout(() => {
      toast.style.display = "none";
    }, 2500);
  }

  function populate(settings) {
    sortModeEl.value = settings.tabs.sortMode;
    currentWindowFirstEl.checked = settings.tabs.currentWindowFirst;
    groupByDomainEl.checked = settings.tabs.groupByDomain;
    emptyQueryOrderEl.value = settings.tabs.emptyQueryOrder;
    showPinnedEl.checked = settings.tabs.showPinned;
    showDiscardedEl.checked = settings.tabs.showDiscarded;

    enterBehaviorEl.value = settings.search.enterBehavior;
    navigateUrlLikeEl.checked = settings.search.navigateUrlLike;

    actionSigilEl.value = settings.actions.sigil;
    maxResultsEl.value = String(settings.ui.maxResults);
  }

  const currentSettings = await getSettings();
  populate(currentSettings);

  saveBtn?.addEventListener("click", async () => {
    const updates = {
      tabs: {
        sortMode: /** @type {"native" | "alpha"} */ (sortModeEl.value),
        currentWindowFirst: currentWindowFirstEl.checked,
        groupByDomain: groupByDomainEl.checked,
        emptyQueryOrder: /** @type {"sort" | "mru"} */ (emptyQueryOrderEl.value),
        showPinned: showPinnedEl.checked,
        showDiscarded: showDiscardedEl.checked,
        privateMixing: currentSettings.tabs.privateMixing
      },
      search: {
        enterBehavior: /** @type {"topResult" | "alwaysSearch"} */ (enterBehaviorEl.value),
        navigateUrlLike: navigateUrlLikeEl.checked,
        foreground: currentSettings.search.foreground
      },
      actions: {
        sigil: actionSigilEl.value.trim() || "@",
        disabled: currentSettings.actions.disabled
      },
      ui: {
        theme: currentSettings.ui.theme,
        maxResults: parseInt(maxResultsEl.value, 10) || 50,
        showUrls: currentSettings.ui.showUrls,
        showFavicons: currentSettings.ui.showFavicons
      }
    };

    await saveSettings(updates);
    showToast("Settings saved successfully!");
  });

  resetBtn?.addEventListener("click", async () => {
    if (confirm("Reset all settings to default values?")) {
      await saveSettings(DEFAULT_SETTINGS);
      populate(DEFAULT_SETTINGS);
      showToast("Reset to default settings!");
    }
  });

  // M0 Probe runner
  runProbeBtn?.addEventListener("click", async () => {
    runProbeBtn.disabled = true;
    runProbeBtn.textContent = "Probing about: URLs...";
    if (probeResults) probeResults.style.display = "block";
    if (probeSummary) probeSummary.textContent = "Starting probe tests across tabs...";

    try {
      const { results, markdownTable } = await runAboutProbe((p) => {
        if (probeSummary) {
          probeSummary.textContent = `Testing (${p.current}/${p.total}): ${p.url}`;
        }
      });

      const allowedCount = results.filter(r => r.allowed).length;
      const blockedCount = results.filter(r => !r.allowed).length;

      if (probeSummary) {
        probeSummary.textContent = `Completed! ${allowedCount} allowed, ${blockedCount} blocked.`;
      }
      if (probeMarkdown) {
        probeMarkdown.value = markdownTable;
      }
    } catch (e) {
      if (probeSummary) {
        probeSummary.textContent = `Probe failed: ${e.message}`;
      }
    } finally {
      runProbeBtn.disabled = false;
      runProbeBtn.textContent = "Run About-URL Probe";
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
