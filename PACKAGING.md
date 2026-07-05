# Systemic Survival Packaging

## Play Without A Local Server

Use the Electron app:

```powershell
npm install
npm start
```

The wrapper loads `Systemic Survival v2.dc.html` directly from disk and blocks external
HTTP/HTTPS requests. React and ReactDOM are vendored in `vendor/`.

## Build A Sendable Windows EXE

```powershell
npm install
npm run pack:win
```

The portable build is written to:

```text
dist/Systemic-Survival-0.1.0-portable.exe
```

That `.exe` includes Chromium, Electron, the game HTML, `support.js`, and the local vendor files.
It can be sent to another Windows user as a single download.

The custom game icon lives in:

```text
assets/systemic-survival-icon.png
assets/systemic-survival-icon.ico
```

`electron-builder` gives the portable NSIS wrapper its icon during build. The post-build
`electron/stamp-icons.js` step stamps only the unpacked inner app exe; do not post-edit the
portable wrapper with `rcedit`, because that can break the NSIS integrity check.

A zipped fallback of the verified unpacked app is also available at:

```text
dist/Systemic-Survival-0.1.0-win-unpacked.zip
```

Use that if a recipient's Windows policy blocks NSIS portable/self-extracting executables.

## Verify The Build

```powershell
$receipt = Join-Path $env:TEMP 'systemic-survival-portable-smoke.json'
Remove-Item -LiteralPath $receipt -Force -ErrorAction SilentlyContinue
& '.\dist\Systemic-Survival-0.1.0-portable.exe' "--smoke-test-output=$receipt"
Get-Content -LiteralPath $receipt
```

Expected receipt:

```json
{
  "ok": true,
  "blockedRequests": [],
  "result": {
    "hasReact": true,
    "hasRoot": true,
    "hasCanvas": true,
    "rawTemplateRemoved": true,
    "containsTitle": true
  }
}
```

On this machine, `Start-Process`/low-level process launch can be blocked by local Application
Control for the NSIS portable wrapper, while direct shell launch works and verifies cleanly.
The unpacked packaged app at `dist/win-unpacked/Systemic Survival.exe` also passes the same
offline smoke test.

## Updating The Game (modularity contract)

The game and the wrapper are decoupled. Everything between `<x-dc>` and the end of the
`data-dc-script` `<script>` block is **the game payload** (template + logic); the wrapper owns
everything outside it (title, icon link, electron files, assets). An update — even a total
rewrite of the game — only ever replaces the payload:

```powershell
node electron/sync-game.js <path-to-new-game.html> [<path-to-new-support.js>]
npm run pack:win
# then run the smoke test below
```

`sync-game.js` also scrubs any external `<link>`/`@import` URLs from the incoming payload
(the wrapper blocks all network requests, and the smoke test fails on any blocked request),
and auto-wires `vendor/fonts/fonts.css` into the helmet if that file exists.

Stable interface the game side guarantees (smoke-test hooks — a game update must keep these):

- `#ss-canvas` — the game canvas element id
- visible text containing `SYSTEMIC` (the HUD wordmark)
- no external URLs required at runtime
- breaking save-schema changes bump the localStorage key (`ss_outpost_vN`) inside the game,
  so a stale save can never crash a newer build

If a game build ships with a newer `support.js`, pass it as the second argument — the two
files version together. Note: this package's `support.js` is patched to load React from
`vendor/` first (with SRI integrity intact); if you sync a newer runtime, re-apply that patch
or the app will try the CDN and fail offline.

## Notes

- No local server is used by the packaged app.
- The app intentionally blocks external network requests so offline behavior is enforced.
- The player save uses the game's existing local storage key, `ss_outpost_v6`.
- Windows builds are unsigned prototype artifacts. SmartScreen or local enterprise policy may
  warn on first launch until the app is code-signed.
