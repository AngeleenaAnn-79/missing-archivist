// Usage: node encrypt.js "NEXT-SITE-PASSWORD"  -> prints the blob to paste into BLOB in game.js.
// The key is the four answers, so it must match the scheme in reveal() in game.js.
const WORDS = ["ledger", "clock", "spiral", "tower"].join("|");

async function encrypt(text) {
  const key = await crypto.subtle.importKey("raw", await crypto.subtle.digest("SHA-256", new TextEncoder().encode(WORDS)), "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text)));
  return Buffer.from([...iv, ...ct]).toString("base64");
}

if (require.main === module) encrypt(process.argv[2]).then(console.log);
module.exports = { encrypt };
