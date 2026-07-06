// make-signing-key.js — one-time keypair for signed payload releases.  npm run keys
// PRIVATE key → release-signing-key.json (repo-ignored; NEVER commit or share it).
// PUBLIC  key → electron/release-pubkey.json (packaged into the exe; commit it).
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = path.join(__dirname, "..");
const privPath = path.join(root, "release-signing-key.json");
const pubPath = path.join(__dirname, "release-pubkey.json");

if (fs.existsSync(privPath)) {
  console.log("release-signing-key.json already exists — refusing to overwrite.");
  console.log("(Delete it manually ONLY if you intend to rotate keys; old exes will then reject new releases.)");
  process.exit(1);
}

const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const privJwk = privateKey.export({ format: "jwk" });
const pubJwk = publicKey.export({ format: "jwk" });

fs.writeFileSync(privPath, JSON.stringify(privJwk, null, 2));
fs.writeFileSync(pubPath, JSON.stringify(pubJwk, null, 2));
console.log("✔ private key → release-signing-key.json  (repo-ignored — keep it on this machine)");
console.log("✔ public key  → electron/release-pubkey.json  (commit this; it ships inside the exe)");
console.log("Rebuild the exe (npm run pack:win) so installed copies carry the public key.");
