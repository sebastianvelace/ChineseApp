import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./lint-content.mjs", import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "hanlu-lint-"));
writeFileSync(join(dir, "hsk1-words.json"), JSON.stringify({ words: [{ id: "only", hskIndex: 1, hanzi: "一" }], support: [] }));
writeFileSync(join(dir, "curriculum.json"), JSON.stringify({ tracks: [] }));
writeFileSync(join(dir, "hsk1-sentences.json"), JSON.stringify({ sentences: [], dialogues: [] }));
writeFileSync(join(dir, "radicals.json"), JSON.stringify({ radicals: [] }));
writeFileSync(join(dir, "id-index.json"), JSON.stringify({ ids: {} }));

const result = spawnSync(process.execPath, [script, dir], { encoding: "utf8" });
if (result.status === 0) {
  console.error("broken fixture was accepted");
  process.exit(1);
}
if (!result.stderr.includes("expected 150 words")) {
  console.error(result.stderr);
  console.error("broken fixture did not report the word count");
  process.exit(1);
}
console.log("broken fixture rejected");
