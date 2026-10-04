// tests/unit/query-parser.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { parseQuery } from "../../src/core/query-parser.js";

test("query-parser: default mode 'all'", () => {
  const q = parseQuery("react documentation");
  assert.equal(q.mode, "all");
  assert.equal(q.text, "react documentation");
  assert.deepEqual(q.tokens, ["react", "documentation"]);
});

test("query-parser: action prefix '@'", () => {
  const q1 = parseQuery("@");
  assert.equal(q1.mode, "actions");
  assert.equal(q1.text, "");
  assert.deepEqual(q1.tokens, []);

  const q2 = parseQuery("@newtab");
  assert.equal(q2.mode, "actions");
  assert.equal(q2.text, "newtab");
  assert.deepEqual(q2.tokens, ["newtab"]);
});

test("query-parser: tabs prefix '%'", () => {
  const q = parseQuery("% github pr");
  assert.equal(q.mode, "tabs");
  assert.equal(q.text, "github pr");
  assert.deepEqual(q.tokens, ["github", "pr"]);
});

test("query-parser: bookmarks prefix '*'", () => {
  const q = parseQuery("* docs");
  assert.equal(q.mode, "bookmarks");
  assert.equal(q.text, "docs");
  assert.deepEqual(q.tokens, ["docs"]);
});
