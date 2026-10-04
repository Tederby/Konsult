// tests/unit/fuzzy.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { hasMatch, score, positions } from "../../src/vendor/fzy.js";
import { matchToken, matchTokensAgainstFields } from "../../src/core/fuzzy.js";

test("fzy: basic subsequence matching", () => {
  assert.equal(hasMatch("git", "github"), true);
  assert.equal(hasMatch("gith", "github.com"), true);
  assert.equal(hasMatch("xyz", "github"), false);
  assert.equal(hasMatch("", "anything"), true);
});

test("fzy: scoring preferences", () => {
  const scorePrefix = score("git", "github");
  const scoreInner = score("git", "digital");
  assert.ok(scorePrefix > scoreInner, "Prefix match should score higher than inner match");
});

test("fzy: match positions", () => {
  const pos = positions("git", "github");
  assert.deepEqual(pos, [0, 1, 2]);
});

test("fuzzy: matchToken normalization", () => {
  const res = matchToken("fox", "Firefox Browser");
  assert.equal(res.matched, true);
  assert.ok(res.score > 0 && res.score <= 1);
  assert.ok(res.positions.length > 0);
});

test("fuzzy: multi-token AND conjunction across fields", () => {
  const fields = [
    { key: "title", text: "React Documentation", weight: 1.0 },
    { key: "hostname", text: "react.dev", weight: 0.9 },
    { key: "url", text: "https://react.dev/learn", weight: 0.6 }
  ];

  const res1 = matchTokensAgainstFields(["react", "learn"], fields);
  assert.equal(res1.matched, true);
  assert.ok(res1.score > 0);
  assert.ok(res1.highlights.title || res1.highlights.url);

  // If one token cannot be found anywhere, it must fail (AND rule)
  const res2 = matchTokensAgainstFields(["react", "nonexistenttoken123"], fields);
  assert.equal(res2.matched, false);
});
