// tools/probe-about-urls.js

/**
 * List of about: URLs to probe for WebExtensions tabs.create() permissions.
 */
export const ABOUT_URLS_TO_PROBE = [
  "about:blank",
  "about:newtab",
  "about:home",
  "about:addons",
  "about:preferences",
  "about:config",
  "about:debugging",
  "about:downloads",
  "about:profiles",
  "about:support",
  "about:processes",
  "about:logins",
  "about:cache",
  "about:certificate",
  "about:compat",
  "about:crashes",
  "about:devtools",
  "about:memory",
  "about:networking",
  "about:performance",
  "about:plugins",
  "about:policies",
  "about:privatebrowsing",
  "about:rights",
  "about:robots",
  "about:serviceworkers",
  "about:studies",
  "about:telemetry",
  "about:url-classifier",
  "about:webrtc",
  "about:welcome"
];

/**
 * Probe a single about: URL using tabs.create.
 * @param {string} url
 * @returns {Promise<{ url: string, allowed: boolean, error?: string }>}
 */
export async function probeUrl(url) {
  if (typeof browser === "undefined" || !browser.tabs?.create) {
    return { url, allowed: false, error: "browser.tabs.create is not available" };
  }

  try {
    const tab = await browser.tabs.create({ url, active: false });
    if (tab && tab.id) {
      // Clean up test tab immediately
      await browser.tabs.remove(tab.id);
    }
    return { url, allowed: true };
  } catch (err) {
    return {
      url,
      allowed: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

/**
 * Probe all about: URLs sequentially.
 * @param {(progress: { current: number, total: number, url: string }) => void} [onProgress]
 * @returns {Promise<{ results: Array<{ url: string, allowed: boolean, error?: string }>, markdownTable: string }>}
 */
export async function runAboutProbe(onProgress) {
  const results = [];
  const total = ABOUT_URLS_TO_PROBE.length;

  for (let i = 0; i < total; i++) {
    const url = ABOUT_URLS_TO_PROBE[i];
    if (onProgress) {
      onProgress({ current: i + 1, total, url });
    }
    const res = await probeUrl(url);
    results.push(res);
  }

  let table = "# Firefox WebExtensions: `about:*` URLs `tabs.create()` Matrix\n\n";
  table += `> Generated on ${new Date().toISOString()}\n\n`;
  table += "| URL | Status | Details / Error |\n";
  table += "|---|---|---|\n";

  for (const r of results) {
    const status = r.allowed ? "✅ Allowed" : "❌ Blocked";
    const details = r.allowed ? "Opened & closed cleanly" : `\`${r.error || "Blocked"}\``;
    table += `| \`${r.url}\` | ${status} | ${details} |\n`;
  }

  return { results, markdownTable: table };
}
