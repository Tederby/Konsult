// src/core/url-utils.js

/**
 * Extract clean hostname from a URL string, stripping 'www.'.
 * @param {string} rawUrl
 * @returns {string}
 */
export function getHostname(rawUrl) {
  if (!rawUrl) return "";
  try {
    const parsed = new URL(rawUrl);
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith("www.")) {
      host = host.slice(4);
    }
    return host;
  } catch {
    // If not a full URL with scheme, fallback heuristic
    const match = rawUrl.match(/^(?:https?:\/\/)?(?:www\.)?([^/:?#]+)/i);
    return match ? match[1].toLowerCase() : "";
  }
}

/**
 * Check if a query text looks like a URL/domain name.
 * e.g. "github.com/foo", "http://localhost", "reddit.com"
 * @param {string} text
 * @returns {boolean}
 */
export function isUrlLike(text) {
  if (!text || text.includes(" ")) return false;
  if (/^https?:\/\//i.test(text)) return true;
  if (/^localhost(?::\d+)?(?:$|\/)/i.test(text)) return true;
  // Domain with standard TLD followed by optional path or port
  return /^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?::\d+)?(?:$|\/.*)/i.test(text);
}

/**
 * Normalize an input string into a valid absolute URL.
 * @param {string} text
 * @returns {string}
 */
export function normalizeUrl(text) {
  const trimmed = text.trim();
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}
