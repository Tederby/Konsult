// tests/unit/url-utils.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { getHostname, isUrlLike, normalizeUrl } from "../../src/core/url-utils.js";

test("url-utils: getHostname strips www and lowercase", () => {
  assert.equal(getHostname("https://www.google.com/search?q=test"), "google.com");
  assert.equal(getHostname("http://sub.domain.org/path"), "sub.domain.org");
  assert.equal(getHostname("github.com/mozilla"), "github.com");
  assert.equal(getHostname(""), "");
});

test("url-utils: isUrlLike detection", () => {
  assert.equal(isUrlLike("github.com"), true);
  assert.equal(isUrlLike("https://developer.mozilla.org"), true);
  assert.equal(isUrlLike("localhost:8080"), true);
  assert.equal(isUrlLike("not a url"), false);
  assert.equal(isUrlLike("firefox download"), false);
});

test("url-utils: normalizeUrl prefixes https if missing scheme", () => {
  assert.equal(normalizeUrl("github.com"), "https://github.com");
  assert.equal(normalizeUrl("http://insecure.test"), "http://insecure.test");
  assert.equal(normalizeUrl("https://secure.test"), "https://secure.test");
});
