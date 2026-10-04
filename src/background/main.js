// src/background/main.js

/**
 * Firefox Spotlight Launcher — Background Event Page (MV3)
 */

browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    try {
      const existing = await browser.storage.sync.get("settings");
      if (!existing || !existing.settings) {
        // Initial setup with defaults
        const { DEFAULT_SETTINGS } = await import("../settings/schema.js");
        await browser.storage.sync.set({ settings: DEFAULT_SETTINGS });
      }
    } catch (e) {
      console.error("[Spotlight BG] Error during onInstalled initialization:", e);
    }
  }
});

// Executor for multi-step or background actions
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "execute") {
    return false;
  }

  (async () => {
    try {
      switch (message.action) {
        case "focusTab": {
          const { tabId, windowId } = message;
          if (typeof windowId === "number") {
            await browser.windows.update(windowId, { focused: true });
          }
          if (typeof tabId === "number") {
            await browser.tabs.update(tabId, { active: true });
          }
          return { ok: true };
        }

        case "closeTab": {
          const { tabId } = message;
          if (typeof tabId === "number") {
            await browser.tabs.remove(tabId);
          }
          return { ok: true };
        }

        case "duplicateTab": {
          const { tabId } = message;
          if (typeof tabId === "number") {
            await browser.tabs.duplicate(tabId);
          }
          return { ok: true };
        }

        default:
          return { ok: false, error: `Unknown action: ${message.action}` };
      }
    } catch (err) {
      console.error("[Spotlight BG] Action failed:", err);
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  })().then(sendResponse);

  return true; // Keep message channel open for async response
});
