// src/core/ranking-config.js

export const RANKING_CONFIG = Object.freeze({
  // Search row promotion threshold:
  // If best tab match is below this threshold, search row is promoted to #1
  SEARCH_ROW_THRESHOLD: 0.35,

  // Weights per provider
  PROVIDER_WEIGHTS: {
    tabs: 1.0,
    actions: 1.05,
    bookmarks: 0.85,
    search: 0.35
  },

  // Field weights for tab fuzzy matching
  FIELD_WEIGHTS: {
    title: 1.0,
    hostname: 0.9,
    url: 0.6
  },

  // Recency bonus: max 0.1, half-life 6 hours
  RECENCY_MAX_BONUS: 0.1,
  RECENCY_HALFLIFE_MS: 6 * 60 * 60 * 1000,

  // Current window bonus
  CURRENT_WINDOW_BONUS: 0.03,

  // Usage bonus: 0.05 * log1p(count)
  USAGE_BONUS_MULTIPLIER: 0.05
});
