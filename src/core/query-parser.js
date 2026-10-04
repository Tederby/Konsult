// src/core/query-parser.js

/**
 * @typedef {Object} ParsedQuery
 * @property {"all" | "actions" | "tabs" | "bookmarks"} mode
 * @property {string} text Raw search query text after prefix
 * @property {string[]} tokens Whitespace-separated tokens
 */

/**
 * Parse raw input string into structured search query.
 * Supported prefixes:
 *   - '@' : actions / commands mode
 *   - '%' : tabs only mode
 *   - '*' : bookmarks only mode
 *
 * @param {string} input
 * @param {string} [actionSigil="@"]
 * @returns {ParsedQuery}
 */
export function parseQuery(input, actionSigil = "@") {
  const trimmed = (input || "").trimStart();

  if (trimmed.startsWith(actionSigil)) {
    const text = trimmed.slice(actionSigil.length).trim();
    return {
      mode: "actions",
      text,
      tokens: text.length > 0 ? text.split(/\s+/).filter(Boolean) : []
    };
  }

  if (trimmed.startsWith("%")) {
    const text = trimmed.slice(1).trim();
    return {
      mode: "tabs",
      text,
      tokens: text.length > 0 ? text.split(/\s+/).filter(Boolean) : []
    };
  }

  if (trimmed.startsWith("*")) {
    const text = trimmed.slice(1).trim();
    return {
      mode: "bookmarks",
      text,
      tokens: text.length > 0 ? text.split(/\s+/).filter(Boolean) : []
    };
  }

  const clean = trimmed.trim();
  return {
    mode: "all",
    text: clean,
    tokens: clean.length > 0 ? clean.split(/\s+/).filter(Boolean) : []
  };
}
