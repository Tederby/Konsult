// src/providers/search.js
import { BaseProvider } from "./base.js";
import { isUrlLike, normalizeUrl } from "../core/url-utils.js";

export class SearchProvider extends BaseProvider {
  constructor() {
    super("search");
    /** @type {string} */
    this.defaultEngineName = "Search";
    /** @type {string | null} */
    this.defaultEngineIcon = null;
  }

  /**
   * Pre-fetch default search engine name and icon.
   * @param {import('./base.js').ProviderContext} ctx
   */
  async init(ctx) {
    if (typeof browser !== "undefined" && browser.search?.get) {
      try {
        const engines = await browser.search.get();
        const defaultEngine = engines.find(e => e.isDefault);
        if (defaultEngine) {
          this.defaultEngineName = defaultEngine.name;
          this.defaultEngineIcon = defaultEngine.favIconUrl || null;
        }
      } catch (err) {
        console.warn("[Spotlight Search] Failed to get default engine:", err);
      }
    }
  }

  /**
   * Produce the Search row candidate based on user query.
   * @param {import('../core/query-parser.js').ParsedQuery} parsedQuery
   * @param {import('./base.js').ProviderContext} ctx
   * @returns {Promise<import('../core/ranker.js').RankedItem[]>}
   */
  async query(parsedQuery, ctx) {
    if (parsedQuery.mode === "actions" || parsedQuery.mode === "tabs" || parsedQuery.mode === "bookmarks") {
      return [];
    }

    const text = parsedQuery.text.trim();
    if (!text) {
      return [];
    }

    const isUrl = isUrlLike(text);
    const results = [];

    // If query looks like a valid URL and user has navigateUrlLike enabled, provide a direct navigation item
    if (isUrl && ctx.settings.search.navigateUrlLike) {
      const url = normalizeUrl(text);
      results.push({
        id: "navigate-url",
        provider: "search",
        title: `Open ${url}`,
        subtext: "Navigate directly to URL",
        url,
        rawScore: 0.95,
        finalScore: 0.95,
        data: {
          type: "navigate",
          url
        }
      });
    }

    // Standard search row
    results.push({
      id: "web-search",
      provider: "search",
      title: `Search ${this.defaultEngineName} for "${text}"`,
      subtext: `Default search engine`,
      favIconUrl: this.defaultEngineIcon || undefined,
      rawScore: 0.35,
      finalScore: 0.35,
      data: {
        type: "search",
        query: text
      }
    });

    return results;
  }

  /**
   * Execute search or URL navigation synchronously inside user action handler.
   * @param {import('../core/ranker.js').RankedItem} item
   * @param {import('./base.js').ProviderContext} ctx
   * @param {{ forceSearch?: boolean, backgroundTab?: boolean }} [modifiers]
   */
  async execute(item, ctx, modifiers = {}) {
    if (modifiers.forceSearch && item.data?.query) {
      this.executeWebSearch(item.data.query, modifiers.backgroundTab);
      return true;
    }

    if (item.data?.type === "navigate") {
      const url = item.data.url;
      if (typeof browser !== "undefined" && browser.tabs?.create) {
        await browser.tabs.create({
          url,
          active: !modifiers.backgroundTab
        });
        window.close();
      }
      return true;
    }

    if (item.data?.type === "search" || item.provider === "search") {
      const queryText = item.data?.query || item.title;
      this.executeWebSearch(queryText, modifiers.backgroundTab);
      return true;
    }

    return false;
  }

  /**
   * Execute browser search with NEW_TAB disposition synchronously.
   * @param {string} query
   * @param {boolean} [backgroundTab=false]
   */
  executeWebSearch(query, backgroundTab = false) {
    if (typeof browser !== "undefined" && browser.search?.search) {
      try {
        // Synchronous call first before any promise or await
        browser.search.search({
          query,
          disposition: "NEW_TAB"
        });
      } catch (err) {
        console.error("[Spotlight Search] search.search failed:", err);
      }
    }
    if (typeof window !== "undefined") {
      window.close();
    }
  }
}
