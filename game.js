// shortcut: cyrb53 is a fast non-crypto hash, so a determined player can brute-force answers from the source; move the check server-side if cheating matters.
const HASH = { 1: 167446857489532, 2: 5261493545640404, 3: 3662394563868604, 4: 7971426210917555 };

function cyrb53(s) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

// Is `word` the answer to puzzle page `page`? Case and spaces don't matter.
const ok = (page, word) => cyrb53("archivist:" + word.trim().toLowerCase()) === HASH[page];

// iv + AES-GCM ciphertext of the next website's password, keyed by the four answers. Change it with: node encrypt.js "NEW CODE"
// shortcut: key is a plain SHA-256 of the four words, fine for a game; use PBKDF2 if the code guards anything valuable.
const BLOB = "2V1uNO2hMJ4I8BtasPRonhcWBxWINnUHBfjwqaFvHJRRkq+ZlsNez6pX";

async function reveal(words) {
  const b = Uint8Array.from(atob(BLOB), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", await crypto.subtle.digest("SHA-256", new TextEncoder().encode(words.join("|"))), "AES-GCM", false, ["decrypt"]);
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: b.slice(0, 12) }, key, b.slice(12)));
}

const page = +document.body.dataset.page;
const $ = id => document.getElementById(id);

// Wire a single-word form: right answer calls onOpen, wrong one shows a message.
function lock(form, answerPage, onOpen) {
  form.onsubmit = e => {
    e.preventDefault();
    if (ok(answerPage, form.elements.w.value)) return onOpen();
    form.querySelector(".msg").textContent = "Nothing happens. Try again.";
  };
}

// Pages 2-4 are locked until the previous page's word is entered.
if ($("gate")) lock($("gate"), page - 1, () => { $("gate").hidden = true; $("content").hidden = false; });

// Pages 1-4: solving shows the link to the next room.
if ($("answer")) lock($("answer"), page, () => { $("answer").hidden = true; $("next").hidden = false; });

// Page 5: all four words, one per dial.
if ($("final")) {
  $("final").onsubmit = e => {
    e.preventDefault();
    const f = e.target;
    const words = [1, 2, 3, 4].map(i => f.elements["w" + i].value.trim().toLowerCase());
    if (words.every((w, i) => ok(i + 1, w))) {
      f.hidden = true;
      $("found").hidden = false;
      reveal(words).then(c => ($("code").textContent = c), () => ($("code").textContent = "Could not decrypt. Open this page through Live Server or a web host, not a plain http address."));
    } else {
      f.querySelector(".msg").textContent = "The lock stays shut.";
    }
  };
}
