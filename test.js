// Run with: node test.js  (checks every puzzle really yields its answer, and the hashes match)
const fs = require("fs"), assert = require("assert");
const read = f => fs.readFileSync(f, "utf8");
const { ok, reveal } = new Function("document", read("game.js") + ";return { ok, reveal }")({ body: { dataset: {} }, getElementById: () => null });

["ledger", "clock", "spiral", "tower"].forEach((w, i) => {
  assert(ok(i + 1, ` ${w.toUpperCase()} `), `hash for ${w}`);
  assert(!ok(i + 1, "nope"));
});

const titles = f => [...read(f).matchAll(/class="t">([^<]*)</g)].map(m => m[1]);

// Page 1: first letters of the shelf titles
assert.strictEqual(titles("index.html").map(t => t[0]).join("").toLowerCase(), "ledger");

// Page 2: CLOCK appears exactly once in the 7x7 grid, in any of 8 directions
const grid = [...read("reading-room.html").matchAll(/<tr>((?:<td>[A-Z]<\/td>){7})<\/tr>/g)].map(m => [...m[1].matchAll(/>([A-Z])</g)].map(x => x[1]));
assert.strictEqual(grid.length, 7);
let hits = 0;
for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0], [-1, -1], [-1, 1]])
  if ([..."CLOCK"].every((ch, i) => (grid[r + dr * i] || [])[c + dc * i] === ch)) hits++;
assert.strictEqual(hits, 1, "CLOCK must appear exactly once");

// Page 3: capitals in the middle of sentences in Mira's bio
const bio = read("staff.html").match(/id="mira">([^<]*)</)[1];
const caps = bio.split(". ").flatMap(s => s.split(" ").slice(1).filter(w => /^[A-Z]/.test(w)).map(w => w[0]));
assert.strictEqual(caps.join("").toLowerCase(), "spiral");

// Page 4: circled dates in stamp order, 1 = A
const circled = new Function("return " + read("calendar.html").match(/const circled = (\{[^}]*\})/)[1])();
const word = Object.entries(circled).sort((a, b) => a[1] - b[1]).map(([d]) => String.fromCharCode(96 + +d)).join("");
assert.strictEqual(word, "tower");

// Final page: the four answers decrypt the code; a wrong word set must fail
(async () => {
  assert.strictEqual(await reveal(["ledger", "clock", "spiral", "tower"]), "ARCH-5VY6-RR9C");
  await assert.rejects(reveal(["ledger", "clock", "spiral", "wrong"]));
  console.log("all puzzle checks pass");
})();
