// src/providers/base.js

/**
 * @interface Provider
 *
 * @typedef {Object} ProviderContext
 * @property {import('../settings/schema.js').ExtensionSettings} settings
 * @property {number} currentWindowId
 * @property {boolean} isIncognito
 * @property {Record<string, number>} usageStats
 */

export class BaseProvider {
  /**
   * @param {string} name
   */
  constructor(name) {
    this.name = name;
  }

  /**
   * Initialize or pre-warm any data before queries begin.
   * @param {ProviderContext} ctx
   * @returns {Promise<void>}
   */
  async init(ctx) {}

  /**
   * Query candidate results.
   * @param {import('../core/query-parser.js').ParsedQuery} parsedQuery
   * @param {ProviderContext} ctx
   * @returns {Promise<import('../core/ranker.js').RankedItem[]>}
   */
  async query(parsedQuery, ctx) {
    return [];
  }

  /**
   * Execute an item selection.
   * @param {import('../core/ranker.js').RankedItem} item
   * @param {ProviderContext} ctx
   * @param {{ forceSearch?: boolean, backgroundTab?: boolean }} [modifiers]
   * @returns {Promise<boolean>} Whether action was handled
   */
  async execute(item, ctx, modifiers = {}) {
    return false;
  }
}
