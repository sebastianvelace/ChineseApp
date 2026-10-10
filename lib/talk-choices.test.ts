import assert from "node:assert/strict";
import test from "node:test";
import { talkAnswerMatches, talkChoices } from "./talk-choices";

test("a talk check offers the answer, the other check, and one other word", () => {
  assert.deepEqual(talkChoices("李", "你好", ["你", "好"]), ["李", "你好", "你"]);
});

test("pads with 是 不 好 when the unit words are already the answer", () => {
  assert.deepEqual(talkChoices("是", "是", ["是"]), ["是", "不", "好"]);
});

test("a talk answer ignores surrounding space and sentence punctuation", () => {
  assert.equal(talkAnswerMatches("  你好！", "你好"), true);
  assert.equal(talkAnswerMatches("你好？", "你好。"), true);
  assert.equal(talkAnswerMatches("李", "你好"), false);
});
