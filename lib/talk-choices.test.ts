import assert from "node:assert/strict";
import test from "node:test";
import { talkChoices } from "./talk-choices";

test("a talk check offers the answer, the other check, and one other word", () => {
  assert.deepEqual(talkChoices("李", "你好", ["你", "好"]), ["李", "你好", "你"]);
});

test("pads with 是 不 好 when the unit words are already the answer", () => {
  assert.deepEqual(talkChoices("是", "是", ["是"]), ["是", "不", "好"]);
});
