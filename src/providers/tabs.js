// src/providers/tabs.js
import { BaseProvider } from "./base.js";
import { getHostname } from "../core/url-utils.js";
import { matchTokensAgainstFields } from "../core/fuzzy.js";
import { RANKING_CONFIG } from "../core/ranking-config.js";
import { calculateFinalScore } from "../core/ranker.js";

/**
 * @typedef {Object} IndexedTab
 * @property {number} id
 * @property {number} windowId
 * @property {number} index
 * @property {string} title
 * @property {string} url
 * @property {string} hostname
 * @property {string} [favIconUrl]
 * @property {boolean} pinned
 * @property {boolean} audible
 * @property {boolean} muted
 * @property {boolean} discarded
 * @property {boolean} incognito
 * @property {number} lastAccessed
 * @property {boolean} isCurrentWindow
 */

export class TabsProvider extends BaseProvider {
  constructor() {
    super("tabs");
    /** @type {IndexedTab[]} */
    this.cachedTabs = [];
    /** @type {Intl.Collator} */
    this.alphaCollator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });
  }

  /**
   * Pre-load all open tabs once on popup open.
   * @param {import('./base.js').ProviderContext} ctx
   */
  async init(ctx) {
    if (typeof browser === "undefined" || !browser.tabs?.query) {
      return;
    }

    try {
      const rawTabs = await browser.tabs.query({});
      const now = Date.now();

      this.cachedTabs = rawTabs
        .filter(tab => {
          // Private browsing context filtering (D11)
          if (ctx.settings.tabs.privateMixing !== "all") {
            if (ctx.isIncognito && !tab.incognito) return false;
            if (!ctx.isIncognito && tab.incognito) return false;
          }
          // Pinned filter
          if (!ctx.settings.tabs.showPinned && tab.pinned) return false;
          // Discarded filter
          if (!ctx.settings.tabs.showDiscarded && tab.discarded) return false;

          return true;
        })
        .map(tab => {
          const url = tab.url || "";
          const hostname = getHostname(url);
          const title = tab.title || hostname || url || "Untitled Tab";

          return {
            id: tab.id || 0,
            windowId: tab.windowId || 0,
            index: tab.index || 0,
            title,
            url,
            hostname,
            favIconUrl: tab.favIconUrl,
            pinned: Boolean(tab.pinned),
            audible: Boolean(tab.audible),
            muted: Boolean(tab.mutedInfo?.muted),
            discarded: Boolean(tab.discarded),
            incognito: Boolean(tab.incognito),
            lastAccessed: tab.lastAccessed || now,
            isCurrentWindow: tab.windowId === ctx.currentWindowId
          };
        });
    } catch (err) {
      console.error("[Spotlight Tabs] Failed to query tabs:", err);
    }
  }

  /**
   * Query tabs against tokens or return sorted empty state.
   * @param {import('../core/query-parser.js').ParsedQuery} parsedQuery
   * @param {import('./base.js').ProviderContext} ctx
   * @returns {Promise<import('../core/ranker.js').RankedItem[]>}
   */
  async query(parsedQuery, ctx) {
    if (parsedQuery.mode === "actions" || parsedQuery.mode === "bookmarks") {
      return [];
    }

    const tokens = parsedQuery.tokens;
    const now = Date.now();

    // If query has no tokens, display all tabs according to configured sort order
    if (tokens.length === 0) {
      const sorted = [...this.cachedTabs];
      this.sortTabs(sorted, ctx);

      return sorted.map((tab, idx) => ({
        id: `tab-${tab.id}`,
        provider: "tabs",
        title: tab.title,
        subtext: tab.hostname || tab.url,
        url: tab.url,
        favIconUrl: tab.favIconUrl,
        tabId: tab.id,
        windowId: tab.windowId,
        isCurrentWindow: tab.isCurrentWindow,
        lastAccessed: tab.lastAccessed,
        rawScore: 1.0 - (idx * 0.001),
        finalScore: 1.0 - (idx * 0.001),
        data: {
          tab,
          domain: tab.hostname || "Other"
        }
      }));
    }

    /** @type {import('../core/ranker.js').RankedItem[]} */
    const matched = [];

    for (const tab of this.cachedTabs) {
      const fields = [
        { key: "title", text: tab.title, weight: RANKING_CONFIG.FIELD_WEIGHTS.title },
        { key: "hostname", text: tab.hostname, weight: RANKING_CONFIG.FIELD_WEIGHTS.hostname },
        { key: "url", text: tab.url, weight: RANKING_CONFIG.FIELD_WEIGHTS.url }
      ];

      const matchRes = matchTokensAgainstFields(tokens, fields);
      if (matchRes.matched) {
        /** @type {import('../core/ranker.js').RankedItem} */
        const item = {
          id: `tab-${tab.id}`,
          provider: "tabs",
          title: tab.title,
          subtext: tab.hostname || tab.url,
          url: tab.url,
          favIconUrl: tab.favIconUrl,
          tabId: tab.id,
          windowId: tab.windowId,
          isCurrentWindow: tab.isCurrentWindow,
          lastAccessed: tab.lastAccessed,
          rawScore: matchRes.score,
          finalScore: 0,
          highlights: matchRes.highlights,
          data: {
            tab,
            domain: tab.hostname || "Other"
          }
        };

        item.finalScore = calculateFinalScore(item, now, ctx.usageStats);
        matched.push(item);
      }
    }

    return matched;
  }

  /**
   * Sort tabs based on settings.
   * @param {IndexedTab[]} tabs
   * @param {import('./base.js').ProviderContext} ctx
   */
  sortTabs(tabs, ctx) {
    const { sortMode, currentWindowFirst, emptyQueryOrder } = ctx.settings.tabs;

    if (emptyQueryOrder === "mru") {
      tabs.sort((a, b) => b.lastAccessed - a.lastAccessed);
      return;
    }

    if (sortMode === "alpha") {
      tabs.sort((a, b) => this.alphaCollator.compare(a.title, b.title));
      return;
    }

    // Default "native" sort: current window first (if enabled), then windowId, then index
    tabs.sort((a, b) => {
      if (currentWindowFirst) {
        if (a.isCurrentWindow && !b.isCurrentWindow) return -1;
        if (!a.isCurrentWindow && b.isCurrentWindow) return 1;
      }
      if (a.windowId !== b.windowId) {
        return a.windowId - b.windowId;
      }
      return a.index - b.index;
    });
  }

  /**
   * Execute tab selection: focuses window and tab via background executor.
   * @param {import('../core/ranker.js').RankedItem} item
   * @param {import('./base.js').ProviderContext} ctx
   */
  async execute(item, ctx) {
    if (typeof item.tabId !== "number" || typeof item.windowId !== "number") {
      return false;
    }

    if (typeof browser !== "undefined" && browser.runtime?.sendMessage) {
      try {
        await browser.runtime.sendMessage({
          type: "execute",
          action: "focusTab",
          tabId: item.tabId,
          windowId: item.windowId
        });
      } catch (err) {
        // Fallback: direct API call
        if (browser.windows?.update) {
          await browser.windows.update(item.windowId, { focused: true });
        }
        if (browser.tabs?.update) {
          await browser.tabs.update(item.tabId, { active: true });
        }
      }
    }

    if (typeof window !== "undefined") {
      window.close();
    }
    return true;
  }
}
