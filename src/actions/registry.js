// src/actions/registry.js

/**
 * @typedef {Object} ActionDefinition
 * @property {string} id Unique action identifier (e.g. "newtab")
 * @property {string} title Human-readable label
 * @property {string} subtext Descriptive subtitle or fallback hint
 * @property {string[]} keywords Search synonyms
 * @property {string} [shortcutHint] Native keyboard shortcut hint if any
 * @property {string} [blockedUrl] If targets a blocked about: page
 * @property {boolean} [gated] Whether must run synchronously inside user gesture
 * @property {(ctx: any) => Promise<boolean | void>} run
 */

/** @type {ActionDefinition[]} */
export const BUILTIN_ACTIONS = [
  {
    id: "newtab",
    title: "New Tab",
    subtext: "Open a fresh blank tab (about:newtab)",
    keywords: ["open", "create", "tab"],
    shortcutHint: "Ctrl+T",
    async run() {
      if (typeof browser !== "undefined" && browser.tabs?.create) {
        await browser.tabs.create({});
      }
    }
  },
  {
    id: "newwindow",
    title: "New Window",
    subtext: "Open a new browser window",
    keywords: ["window", "open", "create"],
    shortcutHint: "Ctrl+N",
    async run() {
      if (typeof browser !== "undefined" && browser.windows?.create) {
        await browser.windows.create({});
      }
    }
  },
  {
    id: "private",
    title: "New Private Window",
    subtext: "Open a new private browsing window",
    keywords: ["incognito", "private", "secret", "window"],
    shortcutHint: "Ctrl+Shift+P",
    async run() {
      if (typeof browser !== "undefined" && browser.windows?.create) {
        await browser.windows.create({ incognito: true });
      }
    }
  },
  {
    id: "reload",
    title: "Reload Current Tab",
    subtext: "Refresh active tab",
    keywords: ["refresh", "f5"],
    shortcutHint: "Ctrl+R",
    async run() {
      if (typeof browser !== "undefined" && browser.tabs?.query) {
        const [active] = await browser.tabs.query({ active: true, currentWindow: true });
        if (active?.id) {
          await browser.tabs.reload(active.id);
        }
      }
    }
  },
  {
    id: "hardreload",
    title: "Hard Reload Current Tab",
    subtext: "Refresh active tab bypassing cache",
    keywords: ["refresh", "cache", "f5"],
    shortcutHint: "Ctrl+Shift+R",
    async run() {
      if (typeof browser !== "undefined" && browser.tabs?.query) {
        const [active] = await browser.tabs.query({ active: true, currentWindow: true });
        if (active?.id) {
          await browser.tabs.reload(active.id, { bypassCache: true });
        }
      }
    }
  },
  {
    id: "duplicate",
    title: "Duplicate Current Tab",
    subtext: "Clone active tab in the same window",
    keywords: ["clone", "copy"],
    async run() {
      if (typeof browser !== "undefined" && browser.tabs?.query) {
        const [active] = await browser.tabs.query({ active: true, currentWindow: true });
        if (active?.id) {
          await browser.tabs.duplicate(active.id);
        }
      }
    }
  },
  {
    id: "pin",
    title: "Toggle Pin Tab",
    subtext: "Pin or unpin the active tab",
    keywords: ["unpin", "sticky"],
    async run() {
      if (typeof browser !== "undefined" && browser.tabs?.query) {
        const [active] = await browser.tabs.query({ active: true, currentWindow: true });
        if (active?.id) {
          await browser.tabs.update(active.id, { pinned: !active.pinned });
        }
      }
    }
  },
  {
    id: "mute",
    title: "Toggle Mute Tab",
    subtext: "Mute or unmute active tab audio",
    keywords: ["audio", "sound", "volume", "silence"],
    async run() {
      if (typeof browser !== "undefined" && browser.tabs?.query) {
        const [active] = await browser.tabs.query({ active: true, currentWindow: true });
        if (active?.id) {
          const isMuted = Boolean(active.mutedInfo?.muted);
          await browser.tabs.update(active.id, { muted: !isMuted });
        }
      }
    }
  },
  {
    id: "close",
    title: "Close Current Tab",
    subtext: "Close active tab in this window",
    keywords: ["remove", "kill"],
    shortcutHint: "Ctrl+W",
    async run() {
      if (typeof browser !== "undefined" && browser.tabs?.query) {
        const [active] = await browser.tabs.query({ active: true, currentWindow: true });
        if (active?.id) {
          await browser.tabs.remove(active.id);
        }
      }
    }
  },
  {
    id: "reader",
    title: "Toggle Reader View",
    subtext: "Switch into or out of Firefox Reader Mode",
    keywords: ["reading", "clean", "article"],
    shortcutHint: "Ctrl+Alt+R",
    async run() {
      if (typeof browser !== "undefined" && browser.tabs?.toggleReaderMode) {
        await browser.tabs.toggleReaderMode();
      }
    }
  },
  {
    id: "options",
    title: "Konsult Settings",
    subtext: "Open Konsult preferences",
    keywords: ["config", "preferences", "konsult"],
    async run() {
      if (typeof browser !== "undefined" && browser.runtime?.openOptionsPage) {
        await browser.runtime.openOptionsPage();
      }
    }
  },
  // Honest fallback actions for blocked about: pages
  {
    id: "addons",
    title: "Add-ons & Themes",
    subtext: "Press shortcut or click to copy about:addons",
    keywords: ["extensions", "plugins", "manager"],
    shortcutHint: "Ctrl+Shift+A",
    blockedUrl: "about:addons",
    async run() {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText("about:addons");
      }
    }
  },
  {
    id: "settings",
    title: "Firefox Settings",
    subtext: "Click to copy about:preferences",
    keywords: ["preferences", "options"],
    blockedUrl: "about:preferences",
    async run() {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText("about:preferences");
      }
    }
  },
  {
    id: "config",
    title: "Firefox Advanced Config",
    subtext: "Click to copy about:config",
    keywords: ["flags", "advanced", "about:config"],
    blockedUrl: "about:config",
    async run() {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText("about:config");
      }
    }
  }
];
