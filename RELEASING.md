# Releasing Systemic Survival via GitHub Releases

There are two repos:

- `tracehooten4452/systemic-survival` is the player-facing/source repo. Its Releases page
  shows **one asset only**: `Systemic-Survival-X.Y.Z-portable.exe`.
- `tracehooten4452/systemic-survival-updates` is the public update-feed repo. Its Releases
  carry only `game-payload.html` + `payload-manifest.json`, which installed exes fetch and
  verify anonymously.

Players (your son) only ever touch the `systemic-survival` Releases page.

Version numbers below (`0.2.0`) are **examples** — every command derives the real version
from `package.json`, so nothing here needs editing per release.

---

## Step 0 — Preflight (run every time; it's cheap)

All commands run **inside the package folder** — the folder that contains `package.json`
(e.g. `C:\Users\trace\OneDrive\Desktop\Systemic Survival`). This folder is the repo root.

```powershell
cd "C:\Users\trace\OneDrive\Desktop\Systemic Survival"   # adjust to your path
Test-Path .\package.json    # must print True — if False, you're in the wrong folder
```

`.gitignore` must sit in THIS folder (next to `package.json`). If it's missing, create it
before any `git add`:

```powershell
@"
node_modules/
dist/
Systemic Survival/
*.zip
*.log
.DS_Store
Thumbs.db
release-signing-key.json
"@ | Set-Content .gitignore
```

Then sanity-check what git would stage — `node_modules/`, `dist/`, and `*.zip` must NOT
appear:

```powershell
git status --short
```

## One-time setup

1. Create both GitHub repos:
   - `tracehooten4452/systemic-survival` for source + the single player download exe.
   - `tracehooten4452/systemic-survival-updates` for signed updater payloads.
   The update-feed repo must be PUBLIC. Shipped apps carry NO tokens (by design — a secret
   inside an exe is not a secret), so installed copies fetch update assets anonymously.
2. **Generate the release signing key** — one time, on this build machine:

   ```powershell
   npm install
   npm run keys
   ```

   `release-signing-key.json` (PRIVATE) stays here — repo-ignored; never commit or share it.
   `electron/release-pubkey.json` (public) gets committed and ships inside every exe. Releases
   are signed with the private key; installed exes refuse any payload whose manifest signature
   doesn't verify. Exes built BEFORE the key exists have updates disabled.
3. From the package folder (after Step 0):

   ```powershell
   git init
   git add .
   git commit -m "Systemic Survival package"
   git branch -M main
   git remote add origin https://github.com/<you>/systemic-survival.git
   git push -u origin main
   ```

## Every release — in this exact order

> Order matters in two places: **smoke-test before zipping** (so the zip is made from a
> verified build), and **commit + push before tagging the release** (so the tag points at
> the commit that actually contains this version).

**1. Sync the newest game payload** (if a new game build shipped):

```powershell
node electron/sync-game.js <path-to-new-game.html>
```

**2. Bump the version** in `package.json` (e.g. `"version": "0.2.0"`), then load it into
the shell — every later command uses this:

```powershell
$version = (Get-Content .\package.json -Raw | ConvertFrom-Json).version
$version   # confirm it prints the number you just set
```

**3. Build:**

```powershell
npm install     # first time on a machine
npm run pack:win
```

This produces `dist\Systemic-Survival-$version-portable.exe` **and** the raw
`dist\win-unpacked\` app folder. The unpacked folder is tested locally but not published
as a public release asset.

**4. Smoke-test BOTH artifacts** (both ship, so both get verified — expected receipt is
`"ok": true` with `"blockedRequests": []`):

```powershell
# 4a — portable exe
$receipt = Join-Path $env:TEMP 'ss-portable-smoke.json'
Remove-Item -LiteralPath $receipt -Force -ErrorAction SilentlyContinue
& ".\dist\Systemic-Survival-$version-portable.exe" "--smoke-test-output=$receipt"
Get-Content -LiteralPath $receipt

# 4b — unpacked app (the zip fallback is made from this exact folder)
$receipt2 = Join-Path $env:TEMP 'ss-unpacked-smoke.json'
Remove-Item -LiteralPath $receipt2 -Force -ErrorAction SilentlyContinue
& ".\dist\win-unpacked\Systemic Survival.exe" "--smoke-test-output=$receipt2"
Get-Content -LiteralPath $receipt2

# 4c — STAGED-UPDATE path (proves a downloaded payload can actually boot)
$receipt3 = Join-Path $env:TEMP 'ss-staged-smoke.json'
Remove-Item -LiteralPath $receipt3 -Force -ErrorAction SilentlyContinue
& ".\dist\win-unpacked\Systemic Survival.exe" "--smoke-staged" "--smoke-test-output=$receipt3"
Get-Content -LiteralPath $receipt3
```

The 4c receipt must show `"ok": true` AND a `gameFile` inside `updates\rt-…` with
`"stagedMode": true` — that is the proof the update path loads, not just the bundled file.

If any receipt is not `ok: true`, stop here — fix, rebuild, re-verify.

**5. Build the auto-update assets** (installed exes read these from the update-feed repo instead of
re-downloading the whole game):

```powershell
npm run release:assets
```

Writes `dist\game-payload.html` + `dist\payload-manifest.json` (SHA-256, version tag, minimum
wrapper). Attach both to the matching release in `tracehooten4452/systemic-survival-updates`.

**6. Commit and push the version bump FIRST** — the release tag must point at this commit:

```powershell
git add -A
git commit -m "v$version"
git push
```

**7. Publish the releases** (tags are created on the commit you just pushed):

```powershell
gh release create "v$version" ".\dist\Systemic-Survival-$version-portable.exe" `
  --repo tracehooten4452/systemic-survival `
  --title "Systemic Survival v$version" `
  --notes "What changed in this build, in one or two lines."

gh release create "v$version" ".\dist\game-payload.html" ".\dist\payload-manifest.json" `
  --repo tracehooten4452/systemic-survival-updates `
  --title "Systemic Survival payload v$version" `
  --notes "Signed payload for Systemic Survival v$version."
```

No GitHub CLI? Web UI works the same. In the player repo, attach only the portable exe. In
the update-feed repo, attach only the two signed payload assets. Just make sure step 6
happened first.

## Content-only releases (the usual case, once players have the exe)

When only the GAME changed (nothing in `electron/`, no Electron/build-config changes),
installed exes update THEMSELVES — you publish just the payload, no exe rebuild:

1. `node electron/sync-game.js <path-to-new-game.html>`
2. Bump `"version"` in package.json (leave `"wrapperMin"` alone)
3. `npm run release:assets`
4. Commit + push, then publish ONLY to the update-feed repo:

   ```powershell
   $version = (Get-Content .\package.json -Raw | ConvertFrom-Json).version
   gh release create "v$version" ".\dist\game-payload.html" ".\dist\payload-manifest.json" --repo tracehooten4452/systemic-survival-updates --title "Systemic Survival payload v$version" --notes "..."
   ```

   Do not create a player-facing release for content-only updates. Players skip instructions;
   the public download page stays dummy-proof by showing only the exe when an exe is needed.

When the WRAPPER changed (anything in `electron/`, Electron version, build config): run the
FULL flow above, set `"wrapperMin"` in package.json to the new version, and say "grab the new
exe" in the notes — installed copies show that message instead of auto-updating.

**How the updater behaves:** at launch (online) the exe checks
`tracehooten4452/systemic-survival-updates`, downloads a newer `game-payload.html` (~0.6 MB), verifies the
manifest SIGNATURE against its baked-in public key, then SHA-256 + game invariants, and stages
it WITH its runtime siblings (support.js/vendor/assets copied beside it) so it boots exactly
like the bundled file — on the NEXT start (in-game toast announces it). Offline = silent skip.
A failed/corrupt/unsigned download is discarded — the bundled payload is always the fallback.
The game page itself stays fully network-blocked; only the wrapper's main process performs
pinned, read-only GitHub fetches. **Releases must be public; the app ships no secrets.**

## The player's flow (send him this once)

1. Open the `systemic-survival` repo → **Releases** → the top entry.
2. Download `Systemic-Survival-X.Y.Z-portable.exe`.
3. Run it. SmartScreen warning → **More info → Run anyway** (unsigned prototype).
4. Blocked by strict local policy? Ask for a direct unpacked build. It is not published as
   a public release asset because the Releases page intentionally shows one obvious download.

Saves persist on his machine between versions — replacing the exe never touches them
(breaking save-schema changes are handled inside the game by versioned save keys).
Once installed, **the game updates itself**: when online at launch it fetches new game content
(~0.6 MB) from Releases and applies it on the next start — a fresh exe download is only needed
when a release says the wrapper changed.

## Notes

- Release assets can be up to 2 GB each on the free tier — both artifacts fit easily.
- Keep old releases up: they're your rollback path if a build misbehaves.
- In-app auto-update is BUILT IN (payload-level, `electron/updater.js`) — see "Content-only
  releases" above. The old "not now, by doctrine" note is superseded: the game page remains
  fully network-blocked; only the wrapper checks GitHub.
