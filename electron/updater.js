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
const { spawn } = require("node:child_process");
const { validPayloadText } = require("./payload-validation");

const APP_ROOT = path.join(__dirname, "..");
const PKG = require(path.join(APP_ROOT, "package.json"));
const REPO = PKG.updateRepo || null;              // "owner/name" — must be a PUBLIC repo
const WRAPPER_REPO = PKG.wrapperRepo || (REPO && /-updates$/i.test(REPO) ? REPO.replace(/-updates$/i, "") : null);
const WRAPPER_VERSION = PKG.version || "0.0.0";
const BUILT_TAG = "v" + WRAPPER_VERSION;          // the payload baked into this exe at build time
let PUBKEY = null;
try { PUBKEY = require("./release-pubkey.json"); } catch { /* updates disabled until keys exist */ }

const ALLOWED_HOSTS = new Set([
  "api.github.com",
  "github.com",
  "objects.githubusercontent.com",
  "release-assets.githubusercontent.com",
  "github-releases.githubusercontent.com",
]);
const TIMEOUT_MS = 9000;
const MAX_BYTES = 40 * 1024 * 1024;
const MAX_WRAPPER_BYTES = 220 * 1024 * 1024;
const STAGE_LOCK_MS = 5000;

function updDir() {
  const d = path.join(app.getPath("userData"), "updates");
  fs.mkdirSync(d, { recursive: true });
  return d;
}
function manifestPath() { return path.join(updDir(), "manifest.json"); }
function gateLogPath() { return path.join(updDir(), "gate.log"); }
function appendGateLog(event, data) {
  try {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      event,
      ...(data || {}),
    }) + "\n";
    fs.appendFileSync(gateLogPath(), line, "utf8");
  } catch {}
}
function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }
function readManifest() {
  try { return JSON.parse(fs.readFileSync(manifestPath(), "utf8")); } catch { return null; }
}
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
function withStageLock(fn) {
  const lock = path.join(updDir(), "stage.lock");
  const started = Date.now();
  let fd = null;
  while (!fd) {
    try {
      fd = fs.openSync(lock, "wx");
    } catch (e) {
      try {
        const age = Date.now() - fs.statSync(lock).mtimeMs;
        if (age > 30000) fs.rmSync(lock, { force: true });
      } catch {}
      if (Date.now() - started > STAGE_LOCK_MS) throw new Error("update stage lock busy");
      sleepSync(75);
    }
  }
  try {
    return fn();
  } finally {
    try { fs.closeSync(fd); } catch {}
    try { fs.rmSync(lock, { force: true }); } catch {}
  }
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
function displayTag(tag) {
  return String(tag || "").replace(/^v/i, "");
}
function validRepoName(repo) {
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(String(repo || ""));
}
function safeAssetName(name) {
  const base = path.basename(String(name || ""));
  if (!/^Systemic-Survival-[0-9A-Za-z_.-]+-portable\.exe$/.test(base)) {
    throw new Error("wrapper asset name rejected");
  }
  return base;
}
function wrapperSpecFromManifest(man) {
  const w = man && typeof man.wrapper === "object" ? man.wrapper : null;
  if (!w) return null;
  const file = safeAssetName(w.file);
  const shaHex = String(w.sha256 || "").toLowerCase();
  const wrapperMin = man.wrapperMin || "0.1.0";
  if (!/^[a-f0-9]{64}$/.test(shaHex)) throw new Error("wrapper sha256 missing or invalid");
  if (!verifySigParts(man.tag, file, shaHex, wrapperMin, w.sig)) {
    throw new Error("wrapper signature invalid");
  }
  const repo = w.repo || WRAPPER_REPO;
  if (!validRepoName(repo)) throw new Error("wrapper repo missing or invalid");
  return { file, sha256: shaHex, repo };
}
function wrapperDownloadDir() {
  if (process.env.PORTABLE_EXECUTABLE_FILE) return path.dirname(process.env.PORTABLE_EXECUTABLE_FILE);
  if (process.env.PORTABLE_EXECUTABLE_DIR) return process.env.PORTABLE_EXECUTABLE_DIR;
  return path.dirname(process.execPath);
}
function currentPayloadTag(bundledFile) {
  resolveGamePayload(bundledFile);
  const staged = readManifest();
  return staged && semverNewer(staged.tag, BUILT_TAG) ? staged.tag : BUILT_TAG;
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
  return withStageLock(() => {
    const rt = ensureRuntime();
    const fname = "payload-" + String(tag).replace(/[^\w.-]/g, "_") + ".html";
    const rel = path.join("rt-" + WRAPPER_VERSION, fname);
    const tmp = path.join(rt, fname + "." + process.pid + "." + Date.now() + ".tmp");
    fs.writeFileSync(tmp, buf);
    fs.renameSync(tmp, path.join(rt, fname));                       // atomic
    const old = readManifest();
    const manTmp = manifestPath() + "." + process.pid + "." + Date.now() + ".tmp";
    fs.writeFileSync(manTmp, JSON.stringify({
      tag,
      sha256: shaHex,
      file: rel,
      sigFile: sigFile || null,
      sig: sig || null,
      wrapperMin: wrapperMin || "0.1.0",
      fetched: new Date().toISOString(),
    }, null, 2));
    fs.renameSync(manTmp, manifestPath());                          // atomic manifest swap
    if (old && old.file && old.file !== rel) {
      try { fs.rmSync(path.join(updDir(), old.file), { force: true }); } catch {}
    }
    appendGateLog("payload.staged", { tag, sha256: shaHex, file: rel, wrapperMin: wrapperMin || "0.1.0" });
    return rel;
  });
}

// ---- boot-time resolution: newest VERIFIED staged payload, else the bundled one -------------
function resolveGamePayload(bundledFile, opts) {
  const allowUnsigned = !!(opts && opts.allowUnsigned);   // set ONLY by the --smoke-staged process flag — never by file content
  try {
    const m = readManifest();
    if (!m || !m.tag || !m.file) {
      appendGateLog("boot.resolve", { verdict: "bundled", reason: "no-staged-manifest", target: bundledFile });
      return bundledFile;
    }
    if (!semverNewer(m.tag, BUILT_TAG)) {
      appendGateLog("boot.resolve", { verdict: "bundled", reason: "staged-not-newer", stagedTag: m.tag, builtTag: BUILT_TAG, target: bundledFile });
      return bundledFile;       // a fresh exe outruns old downloads
    }
    const f = path.join(updDir(), m.file);
    const buf = fs.readFileSync(f);
    if (sha256(buf) !== String(m.sha256 || "").toLowerCase()) throw new Error("sha mismatch");
    if (!validPayloadText(buf.toString("utf8"))) throw new Error("invariants failed");
    if (m.wrapperMin && semverNewer(m.wrapperMin, WRAPPER_VERSION)) throw new Error("wrapper too old");
    if (!allowUnsigned && !verifySigParts(m.tag, m.sigFile, m.sha256, m.wrapperMin, m.sig)) throw new Error("staged manifest signature invalid");   // boot re-verification — a planted manifest with a matching sha is NOT enough
    ensureRuntime();                                              // self-heal missing siblings
    if (!fs.existsSync(path.join(path.dirname(f), "support.js"))) throw new Error("runtime siblings missing");
    console.log("[updater] booting staged payload", m.tag);
    appendGateLog("boot.resolve", { verdict: "staged", tag: m.tag, target: f });
    return f;
  } catch (e) {
    const reason = String((e && e.message) || e);
    console.warn("[updater] staged payload rejected — using bundled:", reason);
    appendGateLog("boot.resolve", { verdict: "bundled", reason, target: bundledFile });
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
function get(url, redirects, onProgress, maxBytes) {
  redirects = redirects == null ? 3 : redirects;
  maxBytes = maxBytes || MAX_BYTES;
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
        return resolve(get(new URL(res.headers.location, u).toString(), redirects - 1, onProgress, maxBytes));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error("HTTP " + res.statusCode + " " + u.hostname + u.pathname)); }
      const chunks = []; let total = 0;
      const expected = parseInt(res.headers["content-length"], 10) || 0;
      res.on("data", (c) => {
        total += c.length;
        if (total > maxBytes) { req.destroy(new Error("asset too large")); return; }
        chunks.push(c);
        if (onProgress && expected > 0) onProgress(Math.round((total / expected) * 100), total, expected);
      });
      res.on("end", () => {
        if (onProgress) onProgress(100, total, expected);
        resolve(Buffer.concat(chunks));
      });
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

function cancelledError() {
  const err = new Error("launch update cancelled");
  err.cancelled = true;
  return err;
}
function assertNotCancelled(isCancelled) {
  if (isCancelled && isCancelled()) throw cancelledError();
}
async function fetchLatestRelease() {
  return JSON.parse((await get(`https://api.github.com/repos/${REPO}/releases/latest`)).toString("utf8"));
}
function releaseAsset(rel, name) {
  return (rel.assets || []).find((a) => a.name === name);
}
async function fetchPayloadManifest(rel) {
  const manAsset = releaseAsset(rel, "payload-manifest.json");
  const payAsset = releaseAsset(rel, "game-payload.html");
  if (!manAsset || !payAsset) return null;
  const man = JSON.parse((await get(manAsset.browser_download_url)).toString("utf8"));
  const wrapperMin = man.wrapperMin || "0.1.0";
  if (!verifySigParts(man.tag, man.file, man.sha256, wrapperMin, man.sig)) {
    throw new Error("manifest signature invalid - refusing payload");
  }
  return { man, payAsset, wrapperMin };
}
async function downloadWrapperPortable(man, wrapperMin, onStatus, isCancelled) {
  const spec = wrapperSpecFromManifest(man);
  if (!spec) throw new Error("signed wrapper asset metadata missing");
  const latest = displayTag(man.tag);
  appendGateLog("wrapper.download.start", { tag: man.tag, wrapperMin, repo: spec.repo, file: spec.file, sha256: spec.sha256 });
  onStatus({ state: "downloading", latest, pct: 0, note: "Downloading the new launcher." });
  const rel = JSON.parse((await get(`https://api.github.com/repos/${spec.repo}/releases/tags/${encodeURIComponent(man.tag)}`)).toString("utf8"));
  assertNotCancelled(isCancelled);
  const asset = releaseAsset(rel, spec.file);
  if (!asset) throw new Error("wrapper asset not found in release");
  let lastPct = -1;
  let lastBytes = 0;
  const buf = await get(asset.browser_download_url, 3, (pct, bytes, expected) => {
    lastBytes = bytes || lastBytes;
    if (pct !== lastPct) {
      lastPct = pct;
      appendGateLog("wrapper.download.progress", { tag: man.tag, pct, bytes: bytes || 0, expected: expected || 0 });
    }
    onStatus({ state: "downloading", latest, pct, note: "Downloading the new launcher." });
  }, MAX_WRAPPER_BYTES);
  assertNotCancelled(isCancelled);
  if (sha256(buf) !== spec.sha256) throw new Error("wrapper sha256 mismatch");
  appendGateLog("wrapper.verify", { tag: man.tag, verdict: "ok", bytes: lastBytes || buf.length, sha256: spec.sha256 });
  const destDir = wrapperDownloadDir();
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, spec.file);
  const tmp = dest + "." + process.pid + ".download";
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, dest);
  appendGateLog("wrapper.staged", { tag: man.tag, path: dest });
  onStatus({ state: "restarting", latest, pct: 100, note: "Starting the updated launcher." });
  spawn(dest, [], { detached: true, stdio: "ignore" }).unref();
  appendGateLog("wrapper.spawned", { tag: man.tag, path: dest });
  return { kind: "wrapper-restarting", exe: dest, wrapperMin };
}
async function prepareLaunchUpdate(bundledFile, opts) {
  opts = opts || {};
  const onStatus = opts.onStatus || (() => {});
  const isCancelled = opts.isCancelled || (() => false);
  const current = displayTag(currentPayloadTag(bundledFile));
  appendGateLog("feed.check.start", { repo: REPO, current, wrapperVersion: WRAPPER_VERSION, builtTag: BUILT_TAG });
  onStatus({ state: "checking", current, note: "Contacting the update feed." });

  if (!REPO) {
    appendGateLog("feed.verdict", { verdict: "offline", reason: "no-update-repo" });
    return { kind: "offline", gameFile: resolveGamePayload(bundledFile), note: "No update feed is configured." };
  }
  if (!PUBKEY) {
    appendGateLog("feed.verdict", { verdict: "offline", reason: "no-public-key" });
    return { kind: "offline", gameFile: resolveGamePayload(bundledFile), note: "No release public key is baked into this launcher." };
  }

  try {
    const rel = await fetchLatestRelease();
    appendGateLog("feed.release.seen", { tag: rel.tag_name, assets: (rel.assets || []).map((a) => ({ name: a.name, size: a.size })) });
    assertNotCancelled(isCancelled);
    const fetched = await fetchPayloadManifest(rel);
    assertNotCancelled(isCancelled);
    if (!fetched) {
      appendGateLog("feed.verdict", { verdict: "offline", reason: "missing-payload-assets", releaseTag: rel.tag_name });
      return { kind: "offline", gameFile: resolveGamePayload(bundledFile), note: "Latest release has no payload manifest." };
    }
    const { man, payAsset, wrapperMin } = fetched;
    const latest = displayTag(man.tag);
    const remoteNewer = semverNewer(man.tag, "v" + current);
    const visibleLatest = remoteNewer ? latest : current;
    appendGateLog("manifest.verified", { tag: man.tag, file: man.file, sha256: man.sha256, wrapperMin, remoteNewer, current, latest: visibleLatest, wrapper: man.wrapper ? { repo: man.wrapper.repo, file: man.wrapper.file, sha256: man.wrapper.sha256 } : null });
    onStatus({ state: "checking", current, latest: visibleLatest, note: "Signed manifest verified." });

    if (!remoteNewer) {
      appendGateLog("feed.verdict", { verdict: "up-to-date", current, latest: visibleLatest });
      return { kind: "up-to-date", gameFile: resolveGamePayload(bundledFile), current, latest: visibleLatest };
    }

    if (semverNewer(wrapperMin, WRAPPER_VERSION)) {
      appendGateLog("feed.verdict", { verdict: "wrapper-required", currentWrapper: WRAPPER_VERSION, wrapperMin, latest });
      try {
        return await downloadWrapperPortable(man, wrapperMin, onStatus, isCancelled);
      } catch (e) {
        if (e && e.cancelled) throw e;
        appendGateLog("feed.verdict", { verdict: "wrapper-error", latest, reason: String((e && e.message) || e) });
        return {
          kind: "error",
          gameFile: resolveGamePayload(bundledFile),
          current,
          latest,
          note: "This update needs a newer launcher, but the portable exe could not be verified."
        };
      }
    }

    appendGateLog("payload.download.start", { tag: man.tag, asset: payAsset.name, size: payAsset.size || 0 });
    onStatus({ state: "downloading", current, latest, pct: 0, note: "Downloading the signed payload." });
    let lastPayloadPct = -1;
    let lastPayloadBytes = 0;
    const buf = await get(payAsset.browser_download_url, 3, (pct, bytes, expected) => {
      lastPayloadBytes = bytes || lastPayloadBytes;
      if (pct !== lastPayloadPct) {
        lastPayloadPct = pct;
        appendGateLog("payload.download.progress", { tag: man.tag, pct, bytes: bytes || 0, expected: expected || 0 });
      }
      onStatus({ state: "downloading", current, latest, pct, note: "Downloading the signed payload." });
    });
    assertNotCancelled(isCancelled);
    onStatus({ state: "applying", current, latest, pct: 100, note: "Verifying and staging the payload." });
    const shaHex = sha256(buf);
    if (shaHex !== String(man.sha256 || "").toLowerCase()) throw new Error("sha256 mismatch");
    if (!validPayloadText(buf.toString("utf8"))) throw new Error("payload failed invariants");
    appendGateLog("payload.verify", { tag: man.tag, verdict: "ok", bytes: lastPayloadBytes || buf.length, sha256: shaHex });
    stagePayload(buf, man.tag, shaHex, man.file, man.sig, wrapperMin);
    const gameFile = resolveGamePayload(bundledFile);
    appendGateLog("feed.verdict", { verdict: "payload-staged", current, latest, bootTarget: gameFile });
    return { kind: "payload-staged", gameFile, current, latest, tag: man.tag };
  } catch (e) {
    const reason = String((e && e.message) || e);
    if (e && e.cancelled) {
      appendGateLog("feed.verdict", { verdict: "cancelled", current });
      return { kind: "cancelled", gameFile: resolveGamePayload(bundledFile), current };
    }
    console.warn("[updater] launch gate check failed:", reason);
    appendGateLog("feed.verdict", { verdict: "error", current, reason });
    return { kind: "error", gameFile: resolveGamePayload(bundledFile), current, note: reason };
  }
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

module.exports = { resolveGamePayload, prepareLaunchUpdate, checkForUpdates, stageForSmoke, cleanupSmokeStage, appendGateLog, gateLogPath };
