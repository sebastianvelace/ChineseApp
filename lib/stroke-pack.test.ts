import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { hasStroke, pickStroke } from "./stroke-pack";

test("the stroke pack lists every committed glyph", () => {
  const onDisk = readdirSync("public/strokes")
    .filter((name) => name.endsWith(".json") && name !== "index.json")
    .map((name) => name.slice(0, -".json".length))
    .sort((a, b) => a.localeCompare(b, "zh"));
  const index = JSON.parse(readFileSync("public/strokes/index.json", "utf8")) as string[];
  assert.deepEqual([...index].sort((a, b) => a.localeCompare(b, "zh")), onDisk);
  assert.equal(hasStroke("你"), true);
  assert.equal(hasStroke("A"), false);
});

test("a stroke quiz uses a character that has data, or nothing", () => {
  const has = (char: string) => char === "好";
  assert.deepEqual(pickStroke([{ id: "ni", hanzi: "你" }, { id: "hao", hanzi: "好" }], has), { char: "好", itemId: "hao" });
  assert.deepEqual(pickStroke([{ id: "word", hanzi: "你好" }], has), { char: "好", itemId: "word" });
  assert.equal(pickStroke([{ id: "word", hanzi: "你好" }], () => false), null);
});
