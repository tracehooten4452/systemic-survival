// updater.js — payload-level auto-update over GitHub Releases. (red-team v2)
//
// THREAT MODEL: the game PAGE is always fully network-blocked (session deny-all in main.js).
// Only this main-process module talks out — https GET to pinned GitHub hosts, PUBLIC repo only
// (no tokens: a shipped app must carry NO secrets). Trust comes from a SIGNED manifest: the
// build machine signs {tag, file, sha256} with a private key that never leaves it; the exe
// carries only the public key (electron/release-pubkey.json). A payload is booted only if its
// manifest signature verifies (checked at download AND re-checked at EVERY boot), its SHA-256
// matches, and its content passes invariant checks.
// The bundled payload is the permanent fallback — a bad download can never brick the install.
//
// STAGING IS RUNTIME-COMPLETE: the payload HTML references ./support.js, ./vendor/*, and
// optional ./assets/* beside it, so we stage into userData/updates/rt-<wrapperVersion>/ and
// copy those siblings from the installed app (they version with the WRAPPER — a payload that
// needs a newer runtime must raise wrapperMin, which forces a full exe release instead).
const { app } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");
const crypto = require("node:crypto");
const { validPayloadText } = require("./payload-validation");

const APP_ROOT = path.join(__dirname, "..");
const PKG = require(path.join(APP_ROOT, "package.json"));
const REPO = PKG.updateRepo || null;              // "owner/name" — must be a PUBLIC repo
const WRAPPER_VERSION = PKG.version || "0.0.0";
const BUILT_TAG = "v" + WRAPPER_VERSION;          // the payload baked into this exe at build time
let PUBKEY = null;
try { PUBKEY = require("./release-pubkey.json"); } catch { /* updates disabled until keys exist */ }

const ALLOWED_HOSTS = new Set([
  "api.github.com",
  "objects.githubusercontent.com",
  "release-assets.githubusercontent.com",
  "github-releases.githubusercontent.com",
]);
const TIMEOUT_MS = 9000;
const MAX_BYTES = 40 * 1024 * 1024;

function updDir() {
  const d = path.join(app.getPath("userData"), "updates");
  fs.mkdirSync(d, { recursive: true });
  return d;
}
function manifestPath() { return path.join(updDir(), "manifest.json"); }
function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }
function readManifest() {
  try { return JSON.parse(fs.readFileSync(manifestPath(), "utf8")); } catch { return null; }
}
function semverNewer(a, b) {   // a > b ?
  const p = (v) => String(v || "0").replace(/^v/i, "").replace(/-.*$/, "").split(".").map((n) => parseInt(n, 10) || 0);
  const A = p(a), B = p(b);
  for (let i = 0; i < 3; i++) {
    if ((A[i] || 0) > (B[i] || 0)) return true;
    if ((A[i] || 0) < (B[i] || 0)) return false;
  }
  return false;
}
function manifestSigPayload(tag, file, sha, wrapperMin) {
  return String(tag) + "\n" + String(file) + "\n" + String(sha).toLowerCase() + "\n" + String(wrapperMin || "0.1.0");
}
function verifySigParts(tag, file, sha, wrapperMin, sig) {
  if (!PUBKEY || !sig) return false;
  try {
    const key = crypto.createPublicKey({ key: PUBKEY, format: "jwk" });
    return crypto.createVerify("SHA256")
      .update(manifestSigPayload(tag, file, sha, wrapperMin))
      .verify(key, String(sig), "base64");
  } catch { return false; }
}

// ---- runtime-complete staging ---------------------------------------------------------------
function ensureRuntime() {
  const rt = path.join(updDir(), "rt-" + WRAPPER_VERSION);
  const marker = path.join(rt, "support.js");
  if (!fs.existsSync(marker)) {
    fs.mkdirSync(rt, { recursive: true });
    fs.copyFileSync(path.join(APP_ROOT, "support.js"), marker);
    for (const d of ["vendor", "assets"]) {
      const s = path.join(APP_ROOT, d);
      if (fs.existsSync(s)) fs.cpSync(s, path.join(rt, d), { recursive: true });
    }
  }
  return rt;
}
function stagePayload(buf, tag, shaHex, sigFile, sig, wrapperMin) {
  const rt = ensureRuntime();
  const fname = "payload-" + String(tag).replace(/[^\w.-]/g, "_") + ".html";
  const rel = path.join("rt-" + WRAPPER_VERSION, fname);
  const tmp = path.join(rt, fname + ".tmp");
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, path.join(rt, fname));                       // atomic
  const old = readManifest();
  fs.writeFileSync(manifestPath(), JSON.stringify({
    tag,
    sha256: shaHex,
    file: rel,
    sigFile: sigFile || null,
    sig: sig || null,
    wrapperMin: wrapperMin || "0.1.0",
    fetched: new Date().toISOString(),
  }, null, 2));
  if (old && old.file && old.file !== rel) {
    try { fs.rmSync(path.join(updDir(), old.file), { force: true }); } catch {}
  }
  return rel;
}

// ---- boot-time resolution: newest VERIFIED staged payload, else the bundled one -------------
function resolveGamePayload(bundledFile, opts) {
  const allowUnsigned = !!(opts && opts.allowUnsigned);   // set ONLY by the --smoke-staged process flag — never by file content
  try {
    const m = readManifest();
    if (!m || !m.tag || !m.file) return bundledFile;
    if (!semverNewer(m.tag, BUILT_TAG)) return bundledFile;       // a fresh exe outruns old downloads
    const f = path.join(updDir(), m.file);
    const buf = fs.readFileSync(f);
    if (sha256(buf) !== String(m.sha256 || "").toLowerCase()) throw new Error("sha mismatch");
    if (!validPayloadText(buf.toString("utf8"))) throw new Error("invariants failed");
    if (m.wrapperMin && semverNewer(m.wrapperMin, WRAPPER_VERSION)) throw new Error("wrapper too old");
    if (!allowUnsigned && !verifySigParts(m.tag, m.sigFile, m.sha256, m.wrapperMin, m.sig)) throw new Error("staged manifest signature invalid");   // boot re-verification — a planted manifest with a matching sha is NOT enough
    ensureRuntime();                                              // self-heal missing siblings
    if (!fs.existsSync(path.join(path.dirname(f), "support.js"))) throw new Error("runtime siblings missing");
    console.log("[updater] booting staged payload", m.tag);
    return f;
  } catch (e) {
    console.warn("[updater] staged payload rejected — using bundled:", String((e && e.message) || e));
    try { fs.rmSync(manifestPath(), { force: true }); } catch {}
    return bundledFile;
  }
}

// ---- staged-update SMOKE support: prove the staging path boots, no network involved ---------
function stageForSmoke(bundledFile) {
  const buf = fs.readFileSync(bundledFile);
  stagePayload(buf, "v99.99.99-smoke", sha256(buf), null, null);
  // unsigned is permitted ONLY here — gated by the process flag in main.js, so a planted
  // 'smoke'-looking manifest on a user machine still fails the normal-boot signature check
  return resolveGamePayload(bundledFile, { allowUnsigned: true });
}
function cleanupSmokeStage() {
  try {
    const m = readManifest();
    if (m && /smoke/.test(String(m.tag))) {
      fs.rmSync(manifestPath(), { force: true });
      if (m.file) fs.rmSync(path.join(updDir(), m.file), { force: true });
    }
  } catch {}
}

// ---- pinned https GET (main process only; the renderer stays blocked) -----------------------
function get(url, redirects) {
  redirects = redirects == null ? 3 : redirects;
  return new Promise((resolve, reject) => {
    let u;
    try { u = new URL(url); } catch (e) { return reject(e); }
    if (u.protocol !== "https:" || !ALLOWED_HOSTS.has(u.hostname)) {
      return reject(new Error("host not allowed: " + u.hostname));
    }
    const req = https.get(u, {
      headers: { "User-Agent": "systemic-survival-updater", Accept: "application/vnd.github+json, application/octet-stream" },
      timeout: TIMEOUT_MS,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        res.resume();
        return resolve(get(new URL(res.headers.location, u).toString(), redirects - 1));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error("HTTP " + res.statusCode + " " + u.hostname + u.pathname)); }
      const chunks = []; let total = 0;
      res.on("data", (c) => {
        total += c.length;
        if (total > MAX_BYTES) { req.destroy(new Error("asset too large")); return; }
        chunks.push(c);
      });
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

function notify(win, text) {
  try {
    if (win && !win.isDestroyed()) {
      win.webContents
        .executeJavaScript(`window.__SS && window.__SS.milestone(${JSON.stringify(text)});`)
        .catch(() => {});
    }
  } catch {}
}

// ---- the background check (fire-and-forget; offline/errors are silent no-ops) ---------------
async function checkForUpdates(win) {
  if (!REPO) { console.log("[updater] no updateRepo configured — updates disabled"); return; }
  if (!PUBKEY) { console.log("[updater] no release-pubkey baked into this build — updates disabled"); return; }
  try {
    const rel = JSON.parse((await get(`https://api.github.com/repos/${REPO}/releases/latest`)).toString("utf8"));
    const assets = rel.assets || [];
    const manAsset = assets.find((a) => a.name === "payload-manifest.json");
    const payAsset = assets.find((a) => a.name === "game-payload.html");
    if (!manAsset || !payAsset) { console.log("[updater] latest release carries no payload assets — skipping"); return; }
    const man = JSON.parse((await get(manAsset.browser_download_url)).toString("utf8"));
    const wrapperMin = man.wrapperMin || "0.1.0";
    if (!verifySigParts(man.tag, man.file, man.sha256, wrapperMin, man.sig)) throw new Error("manifest signature invalid — refusing payload");
    const staged = readManifest();
    const current = staged && semverNewer(staged.tag, BUILT_TAG) ? staged.tag : BUILT_TAG;
    if (!semverNewer(man.tag, current)) { console.log("[updater] up to date at", current); return; }
    if (semverNewer(wrapperMin, WRAPPER_VERSION)) {
      console.log("[updater]", man.tag, "needs wrapper", wrapperMin, "— full exe download required");
      notify(win, "⭳ MAJOR UPDATE " + man.tag + " — GRAB THE NEW EXE FROM THE RELEASES PAGE");
      return;
    }
    console.log("[updater] downloading payload", man.tag);
    const buf = await get(payAsset.browser_download_url);
    const shaHex = sha256(buf);
    if (shaHex !== String(man.sha256 || "").toLowerCase()) throw new Error("sha256 mismatch");
    if (!validPayloadText(buf.toString("utf8"))) throw new Error("payload failed invariants");
    stagePayload(buf, man.tag, shaHex, man.file, man.sig, wrapperMin);
    console.log("[updater] payload", man.tag, "staged — applies on next launch");
    notify(win, "⭳ UPDATE " + man.tag + " DOWNLOADED — RESTART TO PLAY IT");
  } catch (e) {
    console.warn("[updater] check failed (offline is fine):", String((e && e.message) || e));
  }
}

module.exports = { resolveGamePayload, checkForUpdates, stageForSmoke, cleanupSmokeStage };
