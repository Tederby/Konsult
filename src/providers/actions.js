// src/providers/actions.js
import { BaseProvider } from "./base.js";
import { BUILTIN_ACTIONS } from "../actions/registry.js";
import { matchTokensAgainstFields } from "../core/fuzzy.js";
import { calculateFinalScore } from "../core/ranker.js";

export class ActionsProvider extends BaseProvider {
  constructor() {
    super("actions");
    this.actions = BUILTIN_ACTIONS;
  }

  /**
   * @param {import('../core/query-parser.js').ParsedQuery} parsedQuery
   * @param {import('./base.js').ProviderContext} ctx
   * @returns {Promise<import('../core/ranker.js').RankedItem[]>}
   */
  async query(parsedQuery, ctx) {
    if (parsedQuery.mode === "tabs" || parsedQuery.mode === "bookmarks") {
      return [];
    }

    const isExplicitAction = parsedQuery.mode === "actions";
    const tokens = parsedQuery.tokens;
    const now = Date.now();

    // If '@' was typed without extra tokens, list all actions
    if (isExplicitAction && tokens.length === 0) {
      return this.actions.map(act => ({
        id: act.id,
        provider: "actions",
        title: `@${act.id} — ${act.title}`,
        subtext: act.shortcutHint ? `${act.subtext} (${act.shortcutHint})` : act.subtext,
        rawScore: 1.0,
        finalScore: 1.05,
        data: { action: act }
      }));
    }

    // In 'all' mode, only match actions if query is at least 2 chars
    if (!isExplicitAction && parsedQuery.text.length < 2) {
      return [];
    }

    /** @type {import('../core/ranker.js').RankedItem[]} */
    const results = [];

    for (const act of this.actions) {
      const fields = [
        { key: "id", text: act.id, weight: 1.1 },
        { key: "title", text: act.title, weight: 1.0 },
        { key: "keywords", text: act.keywords.join(" "), weight: 0.8 }
      ];

      const match = matchTokensAgainstFields(tokens, fields);
      if (match.matched) {
        /** @type {import('../core/ranker.js').RankedItem} */
        const item = {
          id: act.id,
          provider: "actions",
          title: `@${act.id} — ${act.title}`,
          subtext: act.shortcutHint ? `${act.subtext} (${act.shortcutHint})` : act.subtext,
          rawScore: match.score,
          finalScore: 0,
          highlights: match.highlights,
          data: { action: act }
        };

        item.finalScore = calculateFinalScore(item, now, ctx.usageStats);
        results.push(item);
      }
    }

    return results;
  }

  /**
   * Execute action.
   * @param {import('../core/ranker.js').RankedItem} item
   * @param {import('./base.js').ProviderContext} ctx
   */
  async execute(item, ctx) {
    const act = item.data?.action;
    if (!act) return false;

    try {
      await act.run(ctx);

      // Record usage stats in storage.local if not incognito
      if (!ctx.isIncognito && typeof browser !== "undefined" && browser.storage?.local) {
        const usageKey = `actions:${act.id}`;
        const data = await browser.storage.local.get("usage");
        const usage = data?.usage || {};
        usage[usageKey] = (usage[usageKey] || 0) + 1;
        await browser.storage.local.set({ usage });
      }

      // If action is a clipboard fallback, show a brief feedback before closing
      if (act.blockedUrl) {
        const titleEl = document.getElementById("search-input");
        if (titleEl) {
          titleEl.value = `Copied "${act.blockedUrl}" to clipboard! Paste into address bar.`;
          await new Promise(res => setTimeout(res, 800));
        }
      }
    } catch (err) {
      console.error("[Spotlight Action] Failed to execute action:", err);
    }

    if (typeof window !== "undefined") {
      window.close();
    }
    return true;
  }
}
