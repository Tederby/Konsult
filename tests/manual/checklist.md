# Konsult — Manual Testing Checklist

> Use `npm start` (or `npx web-ext run --firefox="C:\Program Files\Mozilla Firefox\firefox.exe"`) to run an isolated Firefox test instance.

---

## Milestone 0 & 1 Verification Steps

### 1. Launching & Keyboard Shortcut
- [ ] **Step 1.1:** Press `Ctrl+Shift+Space`.
  - **Expected:** Konsult launcher popup opens anchored to the toolbar icon.
  - **Verify:** The search input receives keyboard focus immediately.
- [ ] **Step 1.2:** Test opening from restricted contexts:
  - Open `about:addons`, press `Ctrl+Shift+Space`.
  - Open `about:newtab`, press `Ctrl+Shift+Space`.
  - Open an AMO page (e.g. `addons.mozilla.org`), press `Ctrl+Shift+Space`.
  - **Expected:** Popup opens seamlessly because `_execute_action` is browser chrome.
- [ ] **Step 1.3:** Escape key behavior:
  - Type some letters in the input box, press `Escape`.
  - **Expected:** The input text is cleared, but popup remains open.
  - With empty input, press `Escape`.
  - **Expected:** The popup closes immediately.

---

### 2. Web Search (Feature 1)
- [ ] **Step 2.1:** With search box open, type `firefox extensions tutorial`.
  - **Expected:** The bottom item displays: `Search <DefaultEngine> for "firefox extensions tutorial"`.
- [ ] **Step 2.2:** Press `Enter` (or `Shift+Enter`).
  - **Expected:** A new tab opens displaying search results from your default search engine. The extension does not hardcode Google.
- [ ] **Step 2.3:** In Firefox Settings (`about:preferences#search`), change your default search engine to DuckDuckGo or Bing.
  - Re-open Konsult and type a query.
  - **Expected:** The search row label and favicon reflect the newly chosen default engine.
- [ ] **Step 2.4:** Direct URL navigation:
  - Type `github.com`.
  - **Expected:** First row shows `Open https://github.com (Navigate directly to URL)`.
  - Press `Enter` -> Opens `https://github.com`.

---

### 3. Tab Switcher & Multi-Window (Feature 2)
- [ ] **Step 3.1:** Open 5–10 tabs with various titles across 2 different Firefox windows.
- [ ] **Step 3.2:** In window A, open Konsult and search for a tab located in window B.
  - Press `Enter`.
  - **Expected:** Firefox brings window B to the foreground and activates the selected tab.
- [ ] **Step 3.3:** Tab state indicators:
  - Pin a tab -> verify it displays the `Pinned` badge.
  - Play audio in a tab -> verify it displays the `Audio` badge.
  - Discard a tab (via `about:unloads` or memory saver) -> verify it displays the `Sleeping` badge.
- [ ] **Step 3.4:** Sorting & Grouping:
  - Open Konsult Options (`about:addons` > Konsult > Options).
  - Enable **Group Tabs by Domain** and click **Save Changes**.
  - Open Konsult.
  - **Expected:** Tab results are visually grouped under domain headers (e.g. `github.com`, `mozilla.org`).
  - Use `↑` and `↓` arrow keys.
  - **Expected:** Arrow keys navigate between tab rows and cleanly skip group headers.
  - Change **Default Tab Sort Mode** to **Alphabetical** in Options.
  - **Expected:** Tabs are sorted alphabetically by title with natural number handling.

---

### 4. Commands & Fallback Actions (Feature 3)
- [ ] **Step 4.1:** Type `@`.
  - **Expected:** Mode badge displays `ACTIONS`. Builtin actions are listed (`@newtab`, `@window`, `@private`, `@reload`, `@addons`, etc.).
- [ ] **Step 4.2:** Type `@pin` and press `Enter`.
  - **Expected:** The currently active tab toggles its pinned state.
- [ ] **Step 4.3:** Type `@addons` and press `Enter`.
  - **Expected:** Notification displays `Copied "about:addons" to clipboard! Paste into address bar.` and shortcut `Ctrl+Shift+A` is suggested.

---

### 5. Developer Tools & M0 Probe
- [ ] **Step 5.1:** Open Konsult Options page.
- [ ] **Step 5.2:** Scroll to **Developer Tools & M0 Probe**.
- [ ] **Step 5.3:** Click **Run About-URL Probe**.
  - **Expected:** The probe cycles through the list of `about:*` URLs and outputs the real-time matrix of allowed vs blocked URLs.
