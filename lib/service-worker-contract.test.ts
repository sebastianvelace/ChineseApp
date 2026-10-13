import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("service worker installation is resilient to a missing optional asset", async () => {
  const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.match(source, /const CACHE = "hanlu-v7"/);
  assert.doesNotMatch(source, /cache\.addAll\(/);
  assert.match(source, /cache\.add\(url\)\.catch\(\(\) => undefined\)/);
  assert.match(source, /catch \{\n        \/\/ The worker can still cache the core shell/);
});
