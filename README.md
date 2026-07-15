# Systemic Survival

An offline, single-player systems-survival game: build the colony's systems — logistics,
defense, economy — grow them into automation, and hold the line. Tower defense meets
Anno-style resource chains with real physics, a living civilian city, and an autonomous
President who runs what you build.

Runs as an offline-first Windows app (Electron) or as a self-contained Browser Edition on
ChromeOS. No account or server is required. The Windows launcher's one network action is an
optional, read-only check of GitHub Releases for **signed** game updates at startup; offline,
it silently skips and the game plays as always.

## Download & Play

Choose the file for your device. The source-code `.zip` and `.tar.gz` files shown by GitHub
are for developers, not for playing the game.

### Windows

**→ [Download the stable Windows release](../../releases/latest)** and choose
`Systemic-Survival-X.Y.Z-portable.exe`. Windows needs the `.exe` because it includes the game
launcher, signed update checks, and offline desktop wrapper.

- Windows may show a SmartScreen warning on first launch (the build is an unsigned
  prototype): click **More info → Run anyway**.
- If you have the 0.3.5 or 0.3.6 portable, download the newest exe once. Those builds can
  receive current game content, but the clearer launch gate and durable update log start with
  the 0.3.7 wrapper.

Your save lives on your own machine and carries across updates (the game only resets saves
on rare breaking changes, and it does so safely). **The game keeps itself current:** when
online at launch, the launch gate downloads and verifies signed game content before play
starts — you only re-download the exe when a release says the wrapper changed.

### Chromebook / ChromeOS Preview

**→ [Download the ChromeOS Browser Edition](../../releases/tag/v0.4.5-browser-preview)** and
choose `Systemic Survival (Browser Edition).html`. Chromebooks cannot run the Windows `.exe`;
this single HTML file contains the game, runtime, fonts, and other resources needed to play.

1. Open the ChromeOS **Files** app and go to **Downloads**.
2. Double-click `Systemic Survival (Browser Edition).html` to open it in Chrome.
3. Keep the file on the Chromebook. Use **Export Save** in the pause menu before replacing
   it with a newer Browser Edition.

The Browser Edition does not use the Windows launcher, so it does not update itself. Download
the newest Browser Edition manually when a new one is released. It is currently a preview
because its embedded v0.4.5 game source is newer than the stable Windows repository source.

### Controls (basics)

- **WASD** move the Main Operator · hold **left-click** to fire
- **Wheel** zoom (zoom out for the 2D tactical map, zoom in for the pitched detail view)
- **Q/E** rotate camera · **middle-drag / arrows** pan · **Space** raise threat (when ready)
- **L** lockdown · **U** upgrades board · **X** expeditions · **H** threat heatmap

## For Developers

This repo is the Electron package source. See `PACKAGING.md` for the full build/verify
pipeline and the game-payload update contract; see `RELEASING.md` for the release checklist.

```powershell
npm install
npm start        # run from source
npm run pack:win # build dist/Systemic-Survival-<version>-portable.exe
```

The game itself is a single self-contained HTML payload (`Systemic Survival.dc.html`) —
the wrapper never changes when the game updates.
