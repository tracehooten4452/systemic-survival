# LAUNCH GATE — integration spec (wrapper-side, for the Codex merge pass)

USER DIRECTION: the game must have the current build BEFORE play starts. Kill the current flow
(play → "update downloaded" toast → quit → relaunch by hand). The gate runs at launch, before the
game window loads anything.

`launch.html` (this folder) is COMPLETE — dark tactical brand, system fonts, zero network calls of
its own, drives entirely off the protocol below. Do not rebuild it; wire it in.

## Flow (main process)

1. `--smoke-test-output` present → SKIP THE GATE ENTIRELY (load game exactly as today). The gate
   must never appear in smoke receipts; `blockedRequests: []` stays the invariant.
2. Create the gate window first (small, frameless-ok, ~560×360, non-resizable), load `launch.html`.
3. Drive it: `send('gate:status', {state, current, latest, pct, note})` if a preload bridge exists,
   else `webContents.executeJavaScript('window.__gate.set(' + JSON.stringify(s) + ')')`.
   States: `checking → (uptodate | downloading → applying → (booting | restarting)) | offline | error`.
4. Feed check = the EXISTING signed-manifest machinery (same allowlisted origin, same signature +
   hash + wrapperMin rejection paths — nothing new is trusted). HARD CAP 5s → `offline`.
5. PAYLOAD-ONLY update: download (progress → `pct`), verify, stage to `updates\` exactly as today —
   then just LOAD THE STAGED PAYLOAD in the game window. No relaunch: nothing was loaded yet.
   That alone removes the quit-and-restart dance for every payload release.
6. WRAPPER update (new exe / wrapperMin above self): portable exes can't overwrite themselves —
   download `Systemic-Survival-X.Y.Z-portable.exe` NEXT TO the current exe, verify hash from the
   signed manifest, state `restarting`, spawn it detached, `app.quit()`. The new exe may delete the
   old one on first run (best-effort; locked file → leave it).
7. Player actions (poll `window.__gateAction` or bridge `gate:action`): `play`/`skip` → proceed to
   game with whatever is currently staged/bundled. Mid-download skip: keep downloading in the
   background if trivial with existing code, else abort cleanly — staging finishes next launch.
8. NEVER strand: offline, timeout, bad manifest, half download → the current build plays. The gate
   is a convenience, not a lock. (launch.html also self-releases after 12s of silence.)

## In-game toast (payload-side, ours — do NOT patch)

With the gate live, the mid-session "update downloaded — restart" toast becomes wrong. We will
reword it payload-side next package ("update staged — applies next launch"). Flag any wrapper
string that says otherwise.

## Acceptance probes (REDTEAM)

- Smoke receipts byte-identical semantics vs pre-gate (gate fully bypassed).
- Feed unreachable / DNS dead / 5s stall → game playable in ≤6s from exe start.
- Tampered manifest / wrong sig / wrapperMin too high at the GATE → rejected to bundled, state
  `error` or silent-continue, never a brick.
- Payload update end-to-end: old exe + new feed → gate downloads, stages, game boots NEW version
  with NO relaunch (wordmark version proves it).
- Exe update end-to-end: new portable spawns, old quits; double-launch race (two gates at once)
  doesn't corrupt `updates\` (existing lock or add one).
- Gate window closes when the game window shows (no orphan).

## Sync discipline

New files only (`electron/launch-gate/`) — no existing wrapper file is touched by this drop, so no
red-team patches are at risk. The `main.js` wiring happens repo-side where the patched truth lives.
