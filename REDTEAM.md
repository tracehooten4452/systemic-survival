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

### Pending: SCAVENGER AUTOMATION

Surface:
- Squads on HUNT can crack hero-stocked caches during quiet stretches.
- Cache claim system prevents dogpiles.
- Gatherers can take SCAVENGER duty from inspector after comms tower.
- Scavengers circuit stocked caches, carry up to three finds, deposit at HQ steps, and stage
  by the gate when the world is picked clean.
- Save persistence covers new scavenger/claim/cache state.

Required probes:
- Old-save merge: load a pre-scavenger save and confirm new research/duty/cache keys default
  safely without wiping colony state.
- Squad cache contention: multiple HUNT squads target the same hero-stocked cache; exactly one
  claim wins, no dogpile, no duplicate payout.
- Quiet-window behavior: squad crack happens only during intended quiet stretches and does not
  create wall-clock economy bypasses.
- Gatherer duty gating: SCAVENGER duty is unavailable before comms tower and available after.
- Full scavenger loop: search -> carry up to three finds -> deposit at HQ steps -> return/retask.
- Picked-clean behavior: scavenger stages by the gate without thrashing or burning sim time.
- Save/load persistence: cache claims, carried finds, duty, and deposits survive reload.
- Perf sanity: scavenger/caching work remains negligible under horde load.

### Pending: M5 POWERS

Surface:
- Powers wheel and spend paths.
- New research/save keys.
- Overclock and magazine interactions.
- Smoke-curtain behavior.

Required probes:
- Old-save merge: load a pre-M5 save and confirm new research/power keys default safely.
- Spend-path race: rapid open/close/click/hotkey around the powers UI cannot double-spend,
  unlock the wrong power, or desync HUD state.
- Resource validation: every spend path checks current resources at execution, not stale render
  state.
- Overclock x magazine interaction: stacking does not create runaway fire rate, ammo underflow,
  reload lock, or permanent buff leakage.
- Smoke-curtain permanence exploit: smoke expires, does not permanently suppress targeting,
  pathing, threat, breach, or projectile logic.
- Save/load persistence: unlocked powers, cooldowns, and active/expired effects reload cleanly.
- Fresh colony: powers UI starts locked/empty as designed and does not throw console errors.

## CLEARED AUDIT HISTORY

- 2026-07-05/06: Distribution updater hardening, signed payload staging, and live updater loop.
  Verdict: closed after v0.2.2 wrapper release and v0.2.3 content-only proof. Follow-up added:
  GitHub asset URLs may originate at `github.com` before redirecting to the asset CDN; Step 4
  now preserves that allowlist probe.

## Step 0 — CONFIRM THE CANDIDATE (stale-artifact guard)

A previous round audited an outdated zip and re-reported fixed findings. Never again:

1. Record the candidate's identity: `git rev-parse HEAD` (or SHA-256 of the zip) + `package.json` version.
2. Fingerprint the tree — ALL must hold or you are holding a stale candidate:
   - `package.json`: `"updateRepo": "tracehooten4452/systemic-survival"` (hyphen, public)
   - zero matches for `updateToken` anywhere
   - `electron/main.js` contains `--smoke-staged`
   - `electron/updater.js` verifies signatures at download AND in `resolveGamePayload`
   - `electron/release-pubkey.json` exists; `release-signing-key.json` does NOT exist in git
     (`git log --all --oneline -- release-signing-key.json` → empty)
3. State in the verdict which fingerprints you checked.

## Step 1 — Classify the release

- **PAYLOAD-ONLY** (the common case): diff touches only `Systemic Survival v2.dc.html`,
  `package.json` version, lockfile self-version. `wrapperMin` unchanged.
- **WRAPPER**: anything in `electron/`, `support.js`, `vendor/`, build config, or Electron
  version. `wrapperMin` MUST be raised to the new version, and release notes must say
  "grab the new exe".

**Blocker:** a payload-only diff that also edits wrapper files, or a wrapper diff that
doesn't raise `wrapperMin`.

## Step 2 — Invariant gates (hard blockers)

Payload (`Systemic Survival v2.dc.html`):
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

- Release carries `game-payload.html` + `payload-manifest.json` (payload-only) or those plus
  portable exe + win-unpacked zip (wrapper release).
- Tag equals `v<package.json version>`; tag points at the merge commit, not before it.
- Repo remains PUBLIC (installed updaters read anonymously — a visibility flip bricks
  updates silently).

---
*Maintained alongside RELEASING.md. When a NEW class of bug slips past this protocol, add
its check here in the same PR that fixes it — this file is the immune system's memory.*
