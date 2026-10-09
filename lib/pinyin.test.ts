import assert from "node:assert/strict";
import test from "node:test";
import { markPinyin, markSyllable } from "./pinyin";

test("tone marks follow a, e, then o, then the last vowel", () => {
  assert.equal(markSyllable("ni3"), "nǐ");
  assert.equal(markSyllable("hao3"), "hǎo");
  assert.equal(markSyllable("mei3"), "měi");
  assert.equal(markSyllable("ou1"), "ōu");
  assert.equal(markSyllable("liu2"), "liú");
  assert.equal(markSyllable("gui1"), "guī");
  assert.equal(markSyllable("nv3"), "nǚ");
  assert.equal(markSyllable("de5"), "de");
  assert.equal(markPinyin("ba4ba5"), "bàba");
});
