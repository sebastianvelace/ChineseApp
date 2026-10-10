import assert from "node:assert/strict";
import test from "node:test";
import { shellPages, staticAssetUrls } from "./warm-shell";

test("static asset urls come from script and stylesheet tags", () => {
  const html = '<script src="/_next/static/chunks/app.js"></script><link href="/_next/static/chunks/app.css" rel="stylesheet"><script src="/other.js"></script>';
  assert.deepEqual(staticAssetUrls(html), ["/_next/static/chunks/app.js", "/_next/static/chunks/app.css"]);
});

test("the offline catalog includes practice and the first unit", () => {
  const pages = shellPages();
  assert.ok(pages.includes("/practice"));
  assert.ok(pages.includes("/unit/hsk1-u01"));
  assert.ok(pages.includes("/unit/ev-u01"));
});

test("encoded ampersands in asset urls are decoded", () => {
  const html = '<script src="/_next/static/chunks/a.js?dpl=1&amp;v=2"></script>';
  assert.deepEqual(staticAssetUrls(html), ["/_next/static/chunks/a.js?dpl=1&v=2"]);
});
