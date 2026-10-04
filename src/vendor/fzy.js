// src/vendor/fzy.js
// Ported and adapted from John Hawthorn's fzy algorithm (MIT license)

const SCORE_MIN = -Infinity;
const SCORE_MAX = Infinity;

const SCORE_GAP_LEADING = -0.005;
const SCORE_GAP_TRAILING = -0.005;
const SCORE_GAP_INNER = -0.01;
const SCORE_MATCH_CONSECUTIVE = 1.0;
const SCORE_MATCH_SLASH = 0.9;
const SCORE_MATCH_WORD = 0.8;
const SCORE_MATCH_CAPITAL = 0.7;
const SCORE_MATCH_DOT = 0.6;

function isWordSeparator(c) {
  return c === "/" || c === "\\" || c === " " || c === "-" || c === "_" || c === ":" || c === ".";
}

function isLower(c) {
  return c.toLowerCase() === c && c.toUpperCase() !== c;
}

function isUpper(c) {
  return c.toUpperCase() === c && c.toLowerCase() !== c;
}

function bonusForChar(prev, curr) {
  if (!prev) return SCORE_MATCH_SLASH;
  if (prev === "/" || prev === "\\") return SCORE_MATCH_SLASH;
  if (prev === "-") return SCORE_MATCH_WORD;
  if (prev === "_") return SCORE_MATCH_WORD;
  if (prev === " ") return SCORE_MATCH_WORD;
  if (prev === ".") return SCORE_MATCH_DOT;
  if (prev === ":") return SCORE_MATCH_WORD;
  if (isLower(prev) && isUpper(curr)) return SCORE_MATCH_CAPITAL;
  return 0;
}

/**
 * Check if needle is a subsequence of haystack.
 * @param {string} needle
 * @param {string} haystack
 * @returns {boolean}
 */
export function hasMatch(needle, haystack) {
  const nLen = needle.length;
  const hLen = haystack.length;
  if (nLen === 0) return true;
  if (nLen > hLen) return false;

  const lowerNeedle = needle.toLowerCase();
  const lowerHaystack = haystack.toLowerCase();

  let nIdx = 0;
  let hIdx = 0;
  while (nIdx < nLen && hIdx < hLen) {
    if (lowerNeedle[nIdx] === lowerHaystack[hIdx]) {
      nIdx++;
    }
    hIdx++;
  }
  return nIdx === nLen;
}

/**
 * Calculate match matrices for dynamic programming.
 * @param {string} needle
 * @param {string} haystack
 */
function computeScoreMatrices(needle, haystack) {
  const n = needle.length;
  const m = haystack.length;

  const lowerNeedle = needle.toLowerCase();
  const lowerHaystack = haystack.toLowerCase();

  // D[i][j]: best score ending with needle[i] matching haystack[j]
  // M[i][j]: best overall score for needle[0..i] in haystack[0..j]
  const D = Array.from({ length: n }, () => new Float64Array(m));
  const M = Array.from({ length: n }, () => new Float64Array(m));

  for (let i = 0; i < n; i++) {
    let prevScore = SCORE_MIN;
    const gapScore = i === n - 1 ? SCORE_GAP_TRAILING : SCORE_GAP_INNER;

    for (let j = 0; j < m; j++) {
      if (lowerNeedle[i] === lowerHaystack[j]) {
        let score = SCORE_MIN;
        const bonus = bonusForChar(j > 0 ? haystack[j - 1] : "", haystack[j]);

        if (i === 0) {
          score = (j * SCORE_GAP_LEADING) + bonus;
        } else if (j > 0) {
          const matchConsecutive = D[i - 1][j - 1] + SCORE_MATCH_CONSECUTIVE;
          const matchGap = M[i - 1][j - 1] + bonus;
          score = Math.max(matchConsecutive, matchGap);
        }
        D[i][j] = score;
        M[i][j] = prevScore = Math.max(score, prevScore + gapScore);
      } else {
        D[i][j] = SCORE_MIN;
        M[i][j] = prevScore = prevScore + gapScore;
      }
    }
  }

  return { D, M };
}

/**
 * Compute fuzzy match score.
 * Higher score is better. Returns SCORE_MIN if no match.
 * @param {string} needle
 * @param {string} haystack
 * @returns {number}
 */
export function score(needle, haystack) {
  const n = needle.length;
  const m = haystack.length;

  if (n === 0) return 0;
  if (n > m) return SCORE_MIN;
  if (!hasMatch(needle, haystack)) return SCORE_MIN;

  const { M } = computeScoreMatrices(needle, haystack);
  return M[n - 1][m - 1];
}

/**
 * Compute matched character indices in haystack.
 * @param {string} needle
 * @param {string} haystack
 * @returns {number[]} Array of indices in haystack
 */
export function positions(needle, haystack) {
  const n = needle.length;
  const m = haystack.length;

  if (n === 0 || n > m || !hasMatch(needle, haystack)) {
    return [];
  }

  const { D, M } = computeScoreMatrices(needle, haystack);
  const result = new Array(n);

  let matchRequired = false;
  let j = m - 1;

  for (let i = n - 1; i >= 0; i--) {
    for (; j >= 0; j--) {
      const d = D[i][j];
      const mScore = M[i][j];

      if (d !== SCORE_MIN && (matchRequired || d === mScore)) {
        matchRequired = (i > 0 && j > 0 && (mScore === D[i - 1][j - 1] + SCORE_MATCH_CONSECUTIVE));
        result[i] = j;
        j--;
        break;
      }
    }
  }

  return result;
}
