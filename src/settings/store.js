// src/settings/store.js
import { DEFAULT_SETTINGS } from "./schema.js";

/**
 * Deep merge source into target.
 * @param {any} target
 * @param {any} source
 * @returns {any}
 */
export function deepMerge(target, source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return source !== undefined ? source : target;
  }
  const result = Array.isArray(target) ? [...target] : { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      key in target
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Retrieve user settings merged with defaults.
 * @returns {Promise<import('./schema.js').ExtensionSettings>}
 */
export async function getSettings() {
  if (typeof browser !== "undefined" && browser.storage?.sync) {
    try {
      const data = await browser.storage.sync.get("settings");
      if (data && data.settings) {
        return deepMerge(DEFAULT_SETTINGS, data.settings);
      }
    } catch (err) {
      console.warn("[Spotlight] Failed to read storage.sync, falling back to defaults:", err);
    }
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Persist updated settings to storage.sync.
 * @param {Partial<import('./schema.js').ExtensionSettings>} updates
 * @returns {Promise<import('./schema.js').ExtensionSettings>}
 */
export async function saveSettings(updates) {
  const current = await getSettings();
  const merged = deepMerge(current, updates);
  if (typeof browser !== "undefined" && browser.storage?.sync) {
    await browser.storage.sync.set({ settings: merged });
  }
  return merged;
}
