// tests/unit/settings.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SETTINGS } from "../../src/settings/schema.js";
import { deepMerge } from "../../src/settings/store.js";

test("settings: default values are preserved and validated", () => {
  assert.equal(DEFAULT_SETTINGS.schemaVersion, 1);
  assert.equal(DEFAULT_SETTINGS.tabs.sortMode, "native");
  assert.equal(DEFAULT_SETTINGS.tabs.currentWindowFirst, true);
  assert.equal(DEFAULT_SETTINGS.actions.sigil, "@");
});

test("settings: deepMerge merges nested updates without mutating target", () => {
  const base = {
    tabs: { sortMode: "native", currentWindowFirst: true },
    ui: { maxResults: 50 }
  };
  const update = {
    tabs: { sortMode: "alpha" }
  };

  const merged = deepMerge(base, update);
  assert.equal(merged.tabs.sortMode, "alpha");
  assert.equal(merged.tabs.currentWindowFirst, true);
  assert.equal(merged.ui.maxResults, 50);
  assert.equal(base.tabs.sortMode, "native"); // original intact
});
