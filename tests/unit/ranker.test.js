// tests/unit/ranker.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { calculateFinalScore, rankResults, groupItemsByDomain } from "../../src/core/ranker.js";

test("ranker: final score incorporates recency and window", () => {
  const now = Date.now();
  const recentTab = {
    id: "tab-1",
    provider: "tabs",
    title: "Recent tab",
    rawScore: 0.8,
    lastAccessed: now - 1000,
    isCurrentWindow: true
  };

  const oldTab = {
    id: "tab-2",
    provider: "tabs",
    title: "Old tab",
    rawScore: 0.8,
    lastAccessed: now - (24 * 60 * 60 * 1000),
    isCurrentWindow: false
  };

  const scoreRecent = calculateFinalScore(recentTab, now);
  const scoreOld = calculateFinalScore(oldTab, now);

  assert.ok(scoreRecent > scoreOld, "Recent tab in current window should rank higher");
});

test("ranker: search row promotion logic", () => {
  const searchRow = {
    id: "web-search",
    provider: "search",
    title: "Search Google",
    rawScore: 0.35,
    finalScore: 0.35
  };

  // Case 1: High confidence match (score >= 0.35) -> match is placed before search row
  const strongMatch = {
    id: "tab-strong",
    provider: "tabs",
    title: "Exact match",
    rawScore: 0.9,
    finalScore: 0.9
  };
  const ranked1 = rankResults([strongMatch], searchRow, { enterBehavior: "topResult" });
  assert.equal(ranked1[0].id, "tab-strong");
  assert.equal(ranked1[1].id, "web-search");

  // Case 2: Weak match (score < 0.35) -> search row is promoted to #1
  const weakMatch = {
    id: "tab-weak",
    provider: "tabs",
    title: "Weak match",
    rawScore: 0.2,
    finalScore: 0.2
  };
  const ranked2 = rankResults([weakMatch], searchRow, { enterBehavior: "topResult" });
  assert.equal(ranked2[0].id, "web-search");
  assert.equal(ranked2[1].id, "tab-weak");
});

test("ranker: groupItemsByDomain", () => {
  const items = [
    { id: "1", provider: "tabs", title: "Repo 1", finalScore: 0.9, data: { domain: "github.com" } },
    { id: "2", provider: "tabs", title: "Issue 2", finalScore: 0.7, data: { domain: "github.com" } },
    { id: "3", provider: "tabs", title: "Video", finalScore: 0.8, data: { domain: "youtube.com" } }
  ];

  const grouped = groupItemsByDomain(items);
  assert.equal(grouped.length, 2);
  assert.equal(grouped[0].domain, "github.com"); // best score 0.9 > youtube 0.8
  assert.equal(grouped[0].items.length, 2);
  assert.equal(grouped[1].domain, "youtube.com");
});
