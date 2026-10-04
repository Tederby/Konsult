// src/core/fuzzy.js
import { score as fzyScore, positions as fzyPositions, hasMatch } from "../vendor/fzy.js";

/**
 * Normalize an fzy raw score to approximately 0..1 range.
 * Raw scores typically range from negative values for gaps to positive numbers based on needle length.
 * @param {number} rawScore
 * @param {number} needleLength
 * @param {number} haystackLength
 * @returns {number} Value between 0 and 1
 */
export function normalizeScore(rawScore, needleLength, haystackLength) {
  if (rawScore === -Infinity || needleLength === 0) return 0;
  // Maximum possible score is approximately needleLength * SCORE_MATCH_CONSECUTIVE + bonuses
  const maxPossible = needleLength * 1.5 + 1.0;
  // Minimum sensible score
  const minPossible = -0.05 * haystackLength;
  const clamped = Math.max(minPossible, Math.min(maxPossible, rawScore));
  return Math.max(0, Math.min(1, (clamped - minPossible) / (maxPossible - minPossible)));
}

/**
 * Match a single token against a text string.
 * @param {string} token
 * @param {string} text
 * @returns {{ matched: boolean, score: number, positions: number[] }}
 */
export function matchToken(token, text) {
  if (!token || !text) {
    return { matched: false, score: 0, positions: [] };
  }
  if (!hasMatch(token, text)) {
    return { matched: false, score: 0, positions: [] };
  }

  const raw = fzyScore(token, text);
  if (raw === -Infinity) {
    return { matched: false, score: 0, positions: [] };
  }

  const norm = normalizeScore(raw, token.length, text.length);
  const pos = fzyPositions(token, text);

  return {
    matched: true,
    score: norm,
    positions: pos
  };
}

/**
 * Multi-token fuzzy match against multiple weighted fields.
 * Every token in query must match at least one field (AND conjunction).
 * @param {string[]} tokens Query split by whitespace
 * @param {{ text: string, weight: number, key: string }[]} fields
 * @returns {{ matched: boolean, score: number, highlights: Record<string, number[]> }}
 */
export function matchTokensAgainstFields(tokens, fields) {
  if (!tokens || tokens.length === 0) {
    return { matched: true, score: 1.0, highlights: {} };
  }

  let totalScore = 0;
  /** @type {Record<string, number[]>} */
  const highlights = {};

  for (const token of tokens) {
    let tokenBestScore = -1;
    let tokenBestField = null;
    let tokenBestPositions = [];

    for (const field of fields) {
      if (!field.text) continue;
      const res = matchToken(token, field.text);
      if (res.matched) {
        const weightedScore = res.score * field.weight;
        if (weightedScore > tokenBestScore) {
          tokenBestScore = weightedScore;
          tokenBestField = field.key;
          tokenBestPositions = res.positions;
        }
      }
    }

    if (tokenBestScore < 0) {
      // Token did not match ANY field
      return { matched: false, score: 0, highlights: {} };
    }

    totalScore += tokenBestScore;
    if (tokenBestField) {
      if (!highlights[tokenBestField]) {
        highlights[tokenBestField] = [];
      }
      highlights[tokenBestField].push(...tokenBestPositions);
    }
  }

  const avgScore = totalScore / tokens.length;
  return {
    matched: true,
    score: avgScore,
    highlights
  };
}
