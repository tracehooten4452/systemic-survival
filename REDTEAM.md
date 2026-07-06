# REDTEAM.md — pre-merge audit protocol for Systemic Survival

## Standing order

Codex reads this file before every merge gate, release gate, and payload-only publish gate.
Nothing merges, ships, or gets called green until REDTEAM passes. Payload-only releases are
not exempt: installed exes auto-apply signed payloads, so payload bugs ship themselves.

You are the red team. A candidate update is NOT mergeable until every gate below passes.
Players run this game offline on machines we never see, and installed exes auto-apply signed
payload updates — a bad merge ships itself. Bias toward **No**.

## Verdict format (always this shape)

```
**Safe To Merge: Yes/No**
Candidate fingerprint: <git SHA or zip SHA-256> · package.json <version> · payload sha256 <first 16>
**Blockers** (merge-stopping, with file:line evidence)
**Also Fix** (non-blocking risks)
**Checks Run** (every command + receipt, pass/fail)
```

## AUDIT QUEUE — pending package surfaces

Every package drop must add an entry here before merge. A REDTEAM pass works every open queue
entry plus the standing gates below. When an entry passes, move it to CLEARED AUDIT HISTORY
with date, candidate fingerprint, verdict, and any follow-up release/tag notes.

### No pending entries

## CLEARED AUDIT HISTORY

- 2026-07-06: v0.3.7 launch gate readability/logging repair and updater self-swap fix.
  Drop-kit launch HTML SHA-256
  `EA59379E25841FB35F0454E84408501BEF92D87F445831421A44ABCEEAA43FE6`;
  payload SHA-256 unchanged at
  `7DF06A4A1D2177DD1D96CE3F0C2370EFAE71D3269C10F1311B859266AB285552`;
  portable exe SHA-256
  `A0E10EBAFAE3819B2D17CE42A2FEE423182B9CF40B73A62CEE60037B43337D59`.
  Verdict: green after the gate gained an on-screen event log, click-hold + PLAY release,
  visible up-to-date countdown, and persistent `updates/gate.log`. Repo-side fixes keep the
  gate open until the game is visible + 800ms, add `--gate-verbose`, log every gate/updater
  decision, keep the 5s cap to the checking phase only, and save future portable wrapper
  downloads beside the original double-clicked exe instead of the temp extracted inner exe.
  Checks: kit SHA verification, `node --check` for wrapper scripts, `npm run validate:payload`,
  `npm run pack:win`, source/unpacked/staged/portable smokes with `blockedRequests: []`, normal
  gate-log probe (`feed.check.start` -> `game.visible` -> `gate.close`), verbose hold probe
  (log written, no boot/close without PLAY), and live v0.3.5 -> v0.3.6 compatibility probe.
  Follow-up: publish/tag the player-facing v0.3.7 exe. Keep the update-feed latest at the
  re-signed v0.3.6 compatibility manifest (`wrapperMin 0.3.5`, SHA-256
  `767A9F8C76709D6246D65F79B7EC9A62C6BCA68DB5ED3AE3E853DDDA0228CDB7`) because shipped
  0.3.5/0.3.6 wrappers cannot auto-receive the wrapper repair; they can only auto-stage the
  current game payload.
- 2026-07-06: v0.3.6 M7.3 ship lane plus stable payload rename. Candidate kit payload
  SHA-256 `8A2067CD126A883F83946AC7534E858FD18D1C01835A9CAEA88837CCA87A60F6`;
  shipped payload SHA-256 `7DF06A4A1D2177DD1D96CE3F0C2370EFAE71D3269C10F1311B859266AB285552`
  after `sync-game.js` auto-wired `./vendor/fonts/fonts.css`; portable exe SHA-256
  `A2E4E0D133A295D5F1EB7A4CEC901A8DD5468456DF5348D457D41B90E8846E06`;
  signed manifest SHA-256 `AA09FA186D56757AF47658EC4FA655F85A273D722216B47D6ED8F55DD9CE0A06`.
  Verdict: green after M7.3 added field save slots/export/import, threat-scaled 500-zombie
  siege cap, console balance harness, vendored OFL fonts, and the stable `Systemic Survival.dc.html`
  payload name. Checks: kit SHA verification, `npm run validate:payload`, wrapper script syntax,
  isolated Electron M7.3 probe (local font loading, export download, 10MB garbage import rejection,
  owner-lock restamp source check, active/idle harness smoke, 500-zombie perf at ~0.59ms update /
  ~6.13ms draw with `blockedRequests: []`), `npm run pack:win`, portable/unpacked/staged smokes,
  packaged font/license presence, `npm run release:assets`, four-way payload hash parity, and
  manifest SHA/signature verification. Follow-up: publish/tag `v0.3.6`; this is a wrapper
  release because the payload filename and vendored fonts changed package/runtime shape.
- 2026-07-06: v0.3.5 launch gate wrapper release plus repaired repo payload. Candidate
  payload SHA-256 `828435BBE7CF6BF3102147785D10219033065E822E00896F12E782E088F3EEFD`;
  portable exe SHA-256 `65A2C259D457C3A319B07F792D077911F5DAF126B3360D90BED4C51440F91901`;
  signed manifest SHA-256 `B524DE50ABE51FC501A5DD59FD8A3D52811F867BD136AE4BD81EE9965FC91ED5`.
  Verdict: green after the drop-kit payload replaced the dirty browser-dev copy, removing
  external font links and restoring the Codex v0.3.4 payload fixes with `GAME_VER 0.3.5`.
  Checks: kit SHA verification, `npm run validate:payload`, `node --check` for wrapper files,
  `npm run pack:win`, portable/unpacked/staged smoke receipts with `blockedRequests: []`,
  signed payload staging probe, tampered-manifest rejection, wrapperMin-too-high fallback,
  `npm run release:assets`, and manifest SHA/signature verification. Follow-up: publish/tag
  `v0.3.5`; this is a wrapper release, so player notes must say to grab the new exe.
- 2026-07-06: v0.3.1-v0.3.4 package pass: combat feel, tesla knockdown, M5 closeout
  (gunsmith 3->1, sector loot, TACMAP v2), settings/pause v2, onboarding, session-owner
  save lock, and toast-lane fix. Candidate payload SHA-256
  `D616F9EF0E4C59D9A3FCF63B363CE1AAF2519D557444496893A3789B975F14A7`; portable exe
  SHA-256 `A8AF7771216D18762C75DA92D4015692C765E579B8C6DBC9F4A3817B72E8282E`;
  signed manifest SHA-256 `4BA305DB727B2DBD5EB05068C3F36EB8C2913F28F006AEE8F6395567522FBE63`.
  Verdict: green after Codex fixed the offline font/title drift, bumped package metadata to
  `0.3.4`, synced the stale upload/package mirrors, clamped persisted settings/physics dials,
  reclaimed save ownership on restart, and normalized fresh hero/unit gear fields. Checks:
  payload parse, `npm run validate:payload`, source smoke, old-save probe, `npm run pack:win`,
  portable/unpacked/staged smoke receipts, `npm run release:assets`, manifest SHA/signature
  verification, tracked secret scan, and anonymous update-feed repo/tag check. Follow-up:
  publish/tag `v0.3.4`; M7.3 balance harness, 500-zombie perf gate, save export/import, and
  vendored fonts remain the next batch.
- 2026-07-05/06: Distribution updater hardening, signed payload staging, and live updater loop.
  Verdict: closed after v0.2.2 wrapper release and v0.2.3 content-only proof. Follow-up added:
  GitHub asset URLs may originate at `github.com` before redirecting to the asset CDN; Step 4
  now preserves that allowlist probe.
- 2026-07-05/06: v0.3.0 package pass: SCAVENGER AUTOMATION, M5 POWERS, STAND-TO, President
  support calls, structure ballistics, and M6.1 audio. Candidate file SHA-256
  `80AEA91EAA25A216FACA82BF4B3084239ED43AC24D2D628F94B20A6A2CEB9DD5`; payload slice
  `BCD43CC0B124D693`; verdict green after the public update-feed repo
  `tracehooten4452/systemic-survival-updates` was created.

## Step 0 — CONFIRM THE CANDIDATE (stale-artifact guard)

A previous round audited an outdated zip and re-reported fixed findings. Never again:

1. Record the candidate's identity: `git rev-parse HEAD` (or SHA-256 of the zip) + `package.json` version.
2. Fingerprint the tree — ALL must hold or you are holding a stale candidate:
   - `package.json`: `"updateRepo": "tracehooten4452/systemic-survival-updates"` (public update-feed repo)
   - zero matches for the legacy updater credential hook name (`update` + `Token`) anywhere
   - `electron/main.js` contains `--smoke-staged`
   - `electron/updater.js` verifies signatures at download AND in `resolveGamePayload`
   - `electron/release-pubkey.json` exists; `release-signing-key.json` does NOT exist in git
     (`git log --all --oneline -- release-signing-key.json` → empty)
3. State in the verdict which fingerprints you checked.

## Step 1 — Classify the release

- **PAYLOAD-ONLY** (the common case): diff touches only `Systemic Survival.dc.html`,
  `package.json` version, lockfile self-version. `wrapperMin` unchanged.
- **WRAPPER**: anything in `electron/`, `support.js`, `vendor/`, build config, or Electron
  version. `wrapperMin` MUST be raised to the new version, and release notes must say
  "grab the new exe".

**Blocker:** a payload-only diff that also edits wrapper files, or a wrapper diff that
doesn't raise `wrapperMin`.

**Legacy exception:** v0.3.5/v0.3.6 wrappers had a broken full-wrapper self-swap path
(the 5s gate race cancelled large exe downloads, and downloads targeted the temporary
extracted inner exe folder). Until the installed floor is known to be v0.3.7 or newer,
do not make the public update-feed latest require a newer wrapper unless you are willing
to strand those old exes. Keep a compatibility payload feed available and tell players to
download the fixed portable exe once.

## Step 2 — Invariant gates (hard blockers)

Payload (`Systemic Survival.dc.html`):
- contains `ss-canvas`, visible `SYSTEMIC` wordmark text, `<x-dc>` marker
- NO external references: `<script src="http…">`, `<link href="http…">`,
  `@import url(http…)`, quoted `file://`, `fonts.googleapis|fonts.gstatic`
- `npm run validate:payload` passes

Versioning:
- `package.json` version is SEMVER-NEWER than the latest published release tag
  (same-tag payloads are ignored by installed updaters — that IS a blocker)
- `package-lock.json` self-version fields (root + `packages[""]`) match package.json

Signing chain:
- `npm run release:assets` succeeds; `payload-manifest.json` sha256 matches the payload file
- manifest signature verifies against `electron/release-pubkey.json`; signed fields include
  tag, file, sha256, and wrapperMin
- no secret material anywhere in the tree (grep for `BEGIN.*PRIVATE`, `token`, `PAT`, `"d":`
  in any committed JWK)

Save-schema discipline:
- new save fields must be ADDITIVE with load-time validation/defaults, OR the localStorage
  key `ss_outpost_vN` is bumped. A schema change without either = blocker (it crashes
  players' existing saves).

## Step 3 — Build + smoke battery (all must pass, receipts in the verdict)

```powershell
npm install
npm run validate:payload
npm run pack:win
# 3 smokes — each must report ok:true AND blockedRequests:[]
<portable exe>   --smoke-test-output=r1.json
<win-unpacked>   --smoke-test-output=r2.json
<win-unpacked>   --smoke-staged --smoke-test-output=r3.json
```

- r3 must show `"stagedMode": true` and a `gameFile` inside `updates\rt-…` — that is the
  proof a DOWNLOADED update can boot, not just the bundled file.
- Any smoke with `blockedRequests` non-empty = the game page tried to reach the network =
  blocker, no exceptions.

## Step 4 — Adversarial updater probes (each must be REJECTED)

Stage these by hand into `%APPDATA%/Systemic Survival/updates/` and boot normally:

1. Unsigned manifest with a CORRECT sha256 → boot must fall back to bundled
   ("staged manifest signature invalid").
2. Signed manifest, payload tampered after signing (sha mismatch) → fall back.
3. Signed manifest whose payload contains `<script src="https://example.invalid/evil.js">`
   → invariant rejection.
4. Unsigned manifest tagged `v99.99.99-smoke` → NORMAL boot must reject it (the smoke
   bypass is a process flag, never file content — verify).
5. Confirm the allowlist: updater must accept GitHub release asset flows that start at
   `github.com` and redirect to `objects.githubusercontent.com`,
   `release-assets.githubusercontent.com`, or `github-releases.githubusercontent.com`; it
   must refuse any redirect/host outside that set plus `api.github.com`. This specifically
   guards the live-test bug where `browser_download_url` began at `github.com`.
6. Manifest with `wrapperMin` above the wrapper version → no stage; "grab the new exe" path.

After each probe: delete the planted files; confirm the bundled game still boots clean.

## Step 5 — Game-regression spot checks (payload changes)

- Load a SAVE from the previous release (keep one per release in your audit stash): no
  console errors, colony intact, HUD populated (top bar shows scrap/threat/day).
- Boot a FRESH colony (`localStorage.removeItem('ss_outpost_v6')` equivalent via RESTART):
  no errors, tutorial tip renders.
- Doctrine tripwires in the DIFF (each is a design-law violation → at minimum Also Fix,
  usually blocker):
  - core functions put on wall-clock timers (construction/economy must stay logistics-paced)
  - threat/difficulty ramping without the player's Raise Threat action
  - `fetch(`/`XMLHttpRequest`/`WebSocket` introduced anywhere in the payload
  - hard save-key bump without a release-note migration warning
- If tooling allows, sanity-time the sim: update loop should stay ~≤1.5ms with a 200-walker
  horde (the project's standing perf gate). Regressions of 2×+ = Also Fix with numbers.

## Step 6 — Publish-shape check (when the release is being cut)

- Player-facing repo `tracehooten4452/systemic-survival` release assets show ONLY
  `Systemic-Survival-<version>-portable.exe`. No zips, payloads, manifests, REDTEAM files,
  source drops, or backend/build artifacts.
- Update-feed repo `tracehooten4452/systemic-survival-updates` release assets show ONLY
  `game-payload.html` + `payload-manifest.json`. This repo must be PUBLIC because installed
  updaters read anonymously.
- Tag equals `v<package.json version>` in both repos; tags point at the merge/build commit,
  not before it.
- If the update-feed repo is missing, private, or has extra confusing assets, the release is
  not green.

---
*Maintained alongside RELEASING.md. When a NEW class of bug slips past this protocol, add
its check here in the same PR that fixes it — this file is the immune system's memory.*
