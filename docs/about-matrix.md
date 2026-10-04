# Firefox WebExtensions: `about:*` URLs `tabs.create()` Matrix

> **Source:** MDN WebExtensions Documentation & Empirical WebExtensions Restrictions.
> **Tested API:** `browser.tabs.create({ url: "<about-page>" })`
> **Interactive Probe:** Available directly in Konsult Options page (Developer Tools & M0 Probe section) via `tools/probe-about-urls.js`.

---

## 1. Summary of Platform Restrictions

Under Firefox's security model, extensions running in normal WebExtension privilege cannot open privileged browser chrome pages via `browser.tabs.create({ url })`. Attempting to do so throws an error (e.g. `Error: Illegal URL`).

Non-privileged pages and the blank tab page are permitted. Omitting `url` defaults to the user's New Tab page (`about:newtab`).

---

## 2. URL Matrix & Strategy in Konsult

| URL | Direct `tabs.create` | Error / Restriction | Konsult Handling Strategy |
|---|---|---|---|
| `about:blank` | ✅ Allowed | None | Directly opened |
| `about:newtab` | ✅ Allowed (via `tabs.create({})`) | Omitting `url` opens new tab page cleanly | `@newtab` action uses `tabs.create({})` |
| `about:home` | ❌ Blocked | Privileged chrome | Fallback row: copy URL + shortcut hint |
| `about:addons` | ❌ Blocked | Privileged chrome (`about:addons` is restricted) | Honest Fallback: copy to clipboard + `Ctrl+Shift+A` hint |
| `about:preferences` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard + `Ctrl+,` hint |
| `about:config` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:debugging` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:downloads` | ❌ Blocked | Privileged chrome | In-launcher downloads view / clipboard copy |
| `about:profiles` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:support` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:processes` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:logins` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:cache` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:certificate` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:compat` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:crashes` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:devtools` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:memory` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:networking` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:performance` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:plugins` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:policies` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:privatebrowsing` | ❌ Blocked | Privileged chrome | `@private` opens `windows.create({incognito:true})` |
| `about:rights` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:robots` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:serviceworkers` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:studies` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:telemetry` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:url-classifier` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:webrtc` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |
| `about:welcome` | ❌ Blocked | Privileged chrome | Honest Fallback: copy to clipboard |

---

## 3. How to Execute Live Probe in Firefox

1. Launch Firefox with extension: `npm start`
2. Open extension Options page (`about:addons` > Extensions > Konsult > Options).
3. Scroll to the **Developer Tools & M0 Probe** section.
4. Click **Run About-URL Probe**.
5. The extension will test all URLs against `browser.tabs.create()` and display real-time live statistics and Markdown report.
