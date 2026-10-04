// src/settings/schema.js

/**
 * @typedef {Object} TabsSettings
 * @property {"native" | "alpha"} sortMode
 * @property {boolean} currentWindowFirst
 * @property {boolean} groupByDomain
 * @property {"sort" | "mru"} emptyQueryOrder
 * @property {boolean} showPinned
 * @property {boolean} showDiscarded
 * @property {"sameContext" | "all"} privateMixing
 */

/**
 * @typedef {Object} SearchSettings
 * @property {"topResult" | "alwaysSearch"} enterBehavior
 * @property {boolean} navigateUrlLike
 * @property {boolean} foreground
 */

/**
 * @typedef {Object} ActionsSettings
 * @property {string} sigil
 * @property {string[]} disabled
 */

/**
 * @typedef {Object} UiSettings
 * @property {"system" | "dark" | "light"} theme
 * @property {number} maxResults
 * @property {boolean} showUrls
 * @property {boolean} showFavicons
 */

/**
 * @typedef {Object} RankingSettings
 * @property {boolean} learnFromUsage
 */

/**
 * @typedef {Object} ExtensionSettings
 * @property {number} schemaVersion
 * @property {TabsSettings} tabs
 * @property {SearchSettings} search
 * @property {ActionsSettings} actions
 * @property {UiSettings} ui
 * @property {RankingSettings} ranking
 */

/** @type {ExtensionSettings} */
export const DEFAULT_SETTINGS = Object.freeze({
  schemaVersion: 1,
  tabs: {
    sortMode: "native",
    currentWindowFirst: true,
    groupByDomain: false,
    emptyQueryOrder: "sort",
    showPinned: true,
    showDiscarded: true,
    privateMixing: "sameContext"
  },
  search: {
    enterBehavior: "topResult",
    navigateUrlLike: true,
    foreground: true
  },
  actions: {
    sigil: "@",
    disabled: []
  },
  ui: {
    theme: "system",
    maxResults: 50,
    showUrls: true,
    showFavicons: true
  },
  ranking: {
    learnFromUsage: true
  }
});
