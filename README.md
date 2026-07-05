# Systemic Survival

An offline, single-player systems-survival game: build the colony's systems — logistics,
defense, economy — grow them into automation, and hold the line. Tower defense meets
Anno-style resource chains with real physics, a living civilian city, and an autonomous
President who runs what you build.

Runs as a fully offline Windows app (Electron). No account, no server, no network — the
wrapper blocks all external requests by design.

## Download & Play

**→ [Releases](../../releases/latest)** — download the newest
`Systemic-Survival-X.Y.Z-portable.exe`, then double-click it. That's the whole install.

- Windows may show a SmartScreen warning on first launch (the build is an unsigned
  prototype): click **More info → Run anyway**.
- If your machine's policy blocks portable/self-extracting exes, download the
  `...win-unpacked.zip` asset from the same release instead, unzip it anywhere, and run
  `Systemic Survival.exe` inside.

Your save lives on your own machine and carries across updates (the game only resets saves
on rare breaking changes, and it does so safely).

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

The game itself is a single self-contained HTML payload (`Systemic Survival v2.dc.html`) —
the wrapper never changes when the game updates.
