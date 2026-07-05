# Releasing Systemic Survival Via GitHub Releases

The repo is the hub: source lives on `main`; playable builds are attached to GitHub
Releases. Players only need the Releases page.

Current local project folder:

```powershell
cd "C:\Users\trace\OneDrive\Desktop\Systemic Survival"
```

## One-Time Setup

The local repo is already initialized and has an initial commit. Before pushing, create the
real GitHub repo, then replace the placeholder remote:

```powershell
git remote set-url origin https://github.com/<your-user-or-org>/systemic-survival.git
git remote -v
```

If Git asks for identity, set it locally for this repo:

```powershell
git config user.name "Trace Hooten"
git config user.email "tracehooten@gmail.com"
```

Do not commit generated files. `.gitignore` excludes `node_modules/`, `dist/`, nested upload
copies, and zip files. If `git status` ever shows thousands of `node_modules` files staged,
clear the index and stage again:

```powershell
git restore --staged -- .
git status --short
```

## Every Release

1. Sync the newest game payload if needed:

   ```powershell
   node electron/sync-game.js "C:\path\to\new-game.html"
   ```

2. Bump the version in `package.json`, then capture it for the commands below:

   ```powershell
   $version = (Get-Content -Raw .\package.json | ConvertFrom-Json).version
   $portable = ".\dist\Systemic-Survival-$version-portable.exe"
   $zip = ".\dist\Systemic-Survival-$version-win-unpacked.zip"
   ```

3. Build:

   ```powershell
   npm install
   npm run pack:win
   ```

4. Smoke-test the unpacked app:

   ```powershell
   $receipt = Join-Path $env:TEMP "systemic-survival-$version-unpacked-smoke.json"
   Remove-Item -LiteralPath $receipt -Force -ErrorAction SilentlyContinue
   $p = Start-Process -FilePath ".\dist\win-unpacked\Systemic Survival.exe" -ArgumentList "--smoke-test-output=$receipt" -PassThru
   Wait-Process -Id $p.Id -Timeout 45
   Get-Content -LiteralPath $receipt
   ```

   Expected: `"ok": true`, `"blockedRequests": []`, `hasReact`, `hasRoot`, and `hasCanvas`
   all true.

5. Refresh the zipped fallback from the verified unpacked build:

   ```powershell
   Remove-Item -LiteralPath $zip -Force -ErrorAction SilentlyContinue
   Compress-Archive -Path ".\dist\win-unpacked\*" -DestinationPath $zip -CompressionLevel Optimal
   ```

6. Smoke-test the portable EXE:

   ```powershell
   $receipt = Join-Path $env:TEMP "systemic-survival-$version-portable-smoke.json"
   Remove-Item -LiteralPath $receipt -Force -ErrorAction SilentlyContinue
   & $portable "--smoke-test-output=$receipt"
   Get-Content -LiteralPath $receipt
   ```

7. Commit and push the source before creating the release tag:

   ```powershell
   git status --short
   git add -- .gitattributes .gitignore README.md PACKAGING.md RELEASING.md package.json package-lock.json "Systemic Survival v2.dc.html" support.js assets electron vendor
   git diff --cached --stat
   git commit -m "v$version"
   git push -u origin main
   ```

8. Publish the GitHub Release. Attach only the two built assets from `dist/`:

   ```text
   dist/Systemic-Survival-X.Y.Z-portable.exe
   dist/Systemic-Survival-X.Y.Z-win-unpacked.zip
   ```

   Web UI path: Releases -> Draft a new release -> tag `vX.Y.Z` -> attach both assets -> Publish.

   If GitHub CLI is installed:

   ```powershell
   gh release create "v$version" $portable $zip --title "Systemic Survival v$version" --notes "Release v$version."
   ```

## Player Flow

1. Open the repo Releases page.
2. Download `Systemic-Survival-X.Y.Z-portable.exe`.
3. Run it. SmartScreen warning -> More info -> Run anyway.
4. Blocked by policy? Download `Systemic-Survival-X.Y.Z-win-unpacked.zip`, unzip it, and run
   `Systemic Survival.exe`.

Saves persist on the player's machine between versions. Breaking save-schema changes are
handled inside the game by versioned save keys.

## Troubleshooting

- `warning: ... node_modules/... LF will be replaced by CRLF`: `node_modules` was staged. Run
  `git restore --staged -- .`, make sure `.gitignore` is present, then stage only source files.
- `Author identity unknown`: run the local `git config user.name` and `git config user.email`
  commands above.
- `src refspec main does not match any`: the commit failed, so there is no local `main` commit
  to push. Fix the error, commit, then push.
- `https://github.com/<you>/systemic-survival.git`: this is only a placeholder. Replace it with
  the actual GitHub repo URL before pushing.
- GitHub CLI is optional. If `gh` is not installed, publish releases in the GitHub web UI.

## Notes

- Release assets can be up to 2 GB each on the free tier.
- Keep old releases as rollback points.
- The app intentionally blocks external network requests; auto-update would require a deliberate
  network-policy change.
