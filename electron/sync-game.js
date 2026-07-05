#!/usr/bin/env node
/**
 * sync-game.js — transplant a new game build into the packaged app WITHOUT
 * touching the wrapper (head/title/icon, offline scrub, electron files).
 *
 * The contract: everything between <x-dc> and the end of the data-dc-script
 * <script> block is THE GAME PAYLOAD (template + logic). The wrapper owns
 * everything outside it. Updates — even total rewrites of the game — only
 * ever replace the payload, so the .exe packaging can never be broken by one.
 *
 * Usage:
 *   node electron/sync-game.js <path-to-new-game.html> [<path-to-new-support.js>]
 *
 * Then rebuild + verify:
 *   npm run pack:win
 *   .\dist\Systemic-Survival-0.1.0-portable.exe --smoke-test-output=%TEMP%\ss-smoke.json
 */
const fs = require("node:fs");
const path = require("node:path");

const TARGET_HTML = path.join(__dirname, "..", "Systemic Survival v2.dc.html");
const TARGET_SUPPORT = path.join(__dirname, "..", "support.js");
const LOCAL_FONTS_CSS = path.join(__dirname, "..", "vendor", "fonts", "fonts.css");

function extractPayload(html, label) {
  const start = html.indexOf("<x-dc>");
  if (start < 0) fail(`${label}: no <x-dc> found`);
  const scriptTag = html.indexOf("data-dc-script", start);
  if (scriptTag < 0) fail(`${label}: no data-dc-script block found`);
  const end = html.indexOf("</script>", scriptTag);
  if (end < 0) fail(`${label}: data-dc-script block never closes`);
  return { start, end: end + "</script>".length };
}

function fail(msg) {
  console.error("SYNC FAILED: " + msg);
  process.exit(1);
}

const srcPath = process.argv[2];
if (!srcPath) fail("pass the path to the new game html");
const src = fs.readFileSync(path.resolve(srcPath), "utf8");
const dst = fs.readFileSync(TARGET_HTML, "utf8");

// 1. lift the payload out of the incoming build
const sp = extractPayload(src, "source");
let payload = src.slice(sp.start, sp.end);

// 2. offline scrub — the wrapper blocks all external requests, and the smoke
//    test fails on ANY blocked request, so external font/link tags must go.
const scrubbed = [];
payload = payload
  .split("\n")
  .filter((line) => {
    const external = /https?:\/\//.test(line) && /<link|@import/.test(line);
    if (external) scrubbed.push(line.trim());
    return !external;
  })
  .join("\n");

// 3. if local fonts are vendored, point the helmet at them
if (fs.existsSync(LOCAL_FONTS_CSS)) {
  payload = payload.replace(
    "<helmet>",
    '<helmet>\n<link rel="stylesheet" href="./vendor/fonts/fonts.css">'
  );
}

// 4. splice the payload into the packaged html, keeping the wrapper's own
//    head (title, icon) and tail exactly as they are
const dp = extractPayload(dst, "target");
const out = dst.slice(0, dp.start) + payload + dst.slice(dp.end);
fs.writeFileSync(TARGET_HTML, out);
console.log(`payload transplanted: ${sp.end - sp.start} chars in, wrapper preserved`);
if (scrubbed.length) console.log("offline-scrubbed lines:\n  " + scrubbed.join("\n  "));

// 5. support.js travels with the game build — sync it when provided
const supPath = process.argv[3];
if (supPath) {
  fs.copyFileSync(path.resolve(supPath), TARGET_SUPPORT);
  console.log("support.js synced");
} else {
  console.log("NOTE: support.js not synced — pass it as the 2nd arg if the game build came with a newer one");
}

console.log("\nnext: npm run pack:win, then run the smoke test (see PACKAGING.md)");
