// make-release-assets.js — writes + SIGNS the two auto-update assets.  npm run release:assets
// Requires the one-time signing key (npm run keys). Attach BOTH outputs to the GitHub release:
// dist/game-payload.html + dist/payload-manifest.json
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { payloadProblems } = require("./payload-validation");

const root = path.join(__dirname, "..");
const pkg = require(path.join(root, "package.json"));
const src = path.join(root, "Systemic Survival v2.dc.html");
const privPath = path.join(root, "release-signing-key.json");
const pubPath = path.join(__dirname, "release-pubkey.json");
const dist = path.join(root, "dist");
fs.mkdirSync(dist, { recursive: true });

if (!fs.existsSync(privPath)) {
  console.error("No signing key. Run `npm run keys` once on this machine, rebuild the exe, then retry.");
  process.exit(1);
}
const privateKey = crypto.createPrivateKey({ key: JSON.parse(fs.readFileSync(privPath, "utf8")), format: "jwk" });
// guard: the pubkey baked into builds must belong to THIS private key
const derivedPub = crypto.createPublicKey(privateKey).export({ format: "jwk" });
let bakedPub = null;
try { bakedPub = JSON.parse(fs.readFileSync(pubPath, "utf8")); } catch {}
if (!bakedPub || bakedPub.x !== derivedPub.x || bakedPub.y !== derivedPub.y) {
  console.error("electron/release-pubkey.json is missing or does not match release-signing-key.json.");
  console.error("Run `npm run keys` (or restore the matching pair) and rebuild the exe.");
  process.exit(1);
}

const buf = fs.readFileSync(src);
const text = buf.toString("utf8");
const bad = payloadProblems(text);
if (bad.length) {
  console.error("payload is NOT release-safe:", bad.join(" · "));
  process.exit(1);
}

const tag = "v" + pkg.version;
const file = "game-payload.html";
const wrapperMin = pkg.wrapperMin || "0.1.0";
const sha = crypto.createHash("sha256").update(buf).digest("hex");
const sig = crypto.createSign("SHA256").update(tag + "\n" + file + "\n" + sha + "\n" + wrapperMin).sign(privateKey, "base64");

fs.writeFileSync(path.join(dist, file), buf);
fs.writeFileSync(path.join(dist, "payload-manifest.json"), JSON.stringify({
  tag,
  file,
  sha256: sha,
  sig,
  wrapperMin,
  note: "signed payload-only update asset — installed exes verify sig + sha256 + wrapperMin before booting it",
}, null, 2));
console.log("release assets written → dist/game-payload.html + dist/payload-manifest.json");
console.log("  tag", tag, "· wrapperMin", wrapperMin, "· sha256", sha.slice(0, 16) + "… · signed ✔");
