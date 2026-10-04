// src/core/ranker.js
import { RANKING_CONFIG } from "./ranking-config.js";

/**
 * @typedef {Object} RankedItem
 * @property {string} id
 * @property {"tabs" | "actions" | "search" | "bookmarks"} provider
 * @property {string} title
 * @property {string} [subtext]
 * @property {string} [url]
 * @property {string} [favIconUrl]
 * @property {number} [tabId]
 * @property {number} [windowId]
 * @property {boolean} [isCurrentWindow]
 * @property {number} [lastAccessed]
 * @property {number} rawScore Fuzzy match score 0..1
 * @property {number} finalScore Combined ranking score
 * @property {Record<string, number[]>} [highlights]
 * @property {Record<string, any>} [data]
 */

/**
 * Calculate the final score for a candidate item.
 * @param {RankedItem} item
 * @param {number} now
 * @param {Record<string, number>} [usageStats]
 * @returns {number}
 */
export function calculateFinalScore(item, now, usageStats = {}) {
  const providerWeight = RANKING_CONFIG.PROVIDER_WEIGHTS[item.provider] || 1.0;
  let score = item.rawScore * providerWeight;

  // Recency bonus for tabs
  if (item.provider === "tabs" && typeof item.lastAccessed === "number" && item.lastAccessed > 0) {
    const ageMs = Math.max(0, now - item.lastAccessed);
    const recency = Math.exp(-ageMs / RANKING_CONFIG.RECENCY_HALFLIFE_MS);
    score += recency * RANKING_CONFIG.RECENCY_MAX_BONUS;
  }

  // Current window bonus
  if (item.isCurrentWindow) {
    score += RANKING_CONFIG.CURRENT_WINDOW_BONUS;
  }

  // Usage bonus
  const usageKey = `${item.provider}:${item.id}`;
  const count = usageStats[usageKey] || 0;
  if (count > 0) {
    score += Math.log1p(count) * RANKING_CONFIG.USAGE_BONUS_MULTIPLIER;
  }

  return score;
}

/**
 * Rank items and insert the search row appropriately.
 * @param {RankedItem[]} items
 * @param {RankedItem | null} searchRow
 * @param {Object} options
 * @param {"topResult" | "alwaysSearch"} [options.enterBehavior="topResult"]
 * @param {number} [options.maxResults=50]
 * @returns {RankedItem[]}
 */
export function rankResults(items, searchRow, options = {}) {
  const { enterBehavior = "topResult", maxResults = 50 } = options;

  // Sort matched candidate items descending by final score
  items.sort((a, b) => b.finalScore - a.finalScore);

  if (!searchRow) {
    return items.slice(0, maxResults);
  }

  if (enterBehavior === "alwaysSearch") {
    // User preference forces search to top
    return [searchRow, ...items].slice(0, maxResults);
  }

  // If there are no items, search row is #1
  if (items.length === 0) {
    return [searchRow];
  }

  const bestScore = items[0].finalScore;
  if (bestScore < RANKING_CONFIG.SEARCH_ROW_THRESHOLD) {
    // Top tab match is weak -> search row floats to the top
    return [searchRow, ...items].slice(0, maxResults);
  } else {
    // Good match exists -> place search row right after good matches or at position 1..N
    // If top score >= threshold, search row is positioned after the high-confidence matches
    const goodMatches = items.filter(it => it.finalScore >= RANKING_CONFIG.SEARCH_ROW_THRESHOLD);
    const restMatches = items.filter(it => it.finalScore < RANKING_CONFIG.SEARCH_ROW_THRESHOLD);

    return [...goodMatches, searchRow, ...restMatches].slice(0, maxResults);
  }
}

/**
 * Group ranked tab items by hostname / domain.
 * Groups are ordered by the best member's score, members inside group by score.
 * @param {RankedItem[]} items
 * @returns {{ domain: string, items: RankedItem[] }[]}
 */
export function groupItemsByDomain(items) {
  /** @type {Map<string, RankedItem[]>} */
  const groups = new Map();

  for (const item of items) {
    const domain = (item.data && item.data.domain) ? item.data.domain : "Other";
    if (!groups.has(domain)) {
      groups.set(domain, []);
    }
    groups.get(domain).push(item);
  }

  /** @type {{ domain: string, items: RankedItem[], bestScore: number }[]} */
  const result = [];
  for (const [domain, memberList] of groups.entries()) {
    memberList.sort((a, b) => b.finalScore - a.finalScore);
    result.push({
      domain,
      items: memberList,
      bestScore: memberList[0] ? memberList[0].finalScore : 0
    });
  }

  // Sort groups by the best member's score
  result.sort((a, b) => b.bestScore - a.bestScore);

  return result.map(({ domain, items }) => ({ domain, items }));
}
