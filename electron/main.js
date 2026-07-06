const { app, BrowserWindow, session } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const GAME_BUNDLED = path.join(__dirname, "..", "Systemic Survival.dc.html");
const GATE_FILE = path.join(__dirname, "launch-gate", "launch.html");
const ICON_FILE = path.join(__dirname, "..", "assets", "systemic-survival-icon.ico");
const SMOKE_OUTPUT_ARG = process.argv.find((arg) => arg.startsWith("--smoke-test-output="));
const SMOKE_OUTPUT = SMOKE_OUTPUT_ARG ? path.resolve(SMOKE_OUTPUT_ARG.slice("--smoke-test-output=".length)) : null;
const SMOKE_STAGED = process.argv.includes("--smoke-staged");
const SMOKE_TEST = process.argv.includes("--smoke-test") || SMOKE_STAGED || Boolean(SMOKE_OUTPUT);
const GATE_VERBOSE = process.argv.includes("--gate-verbose");
const updater = require("./updater");
function smokeGameFile() {
  // Plain smoke runs the shipped payload (deterministic artifact check); --smoke-staged pushes
  // the bundled payload through the REAL staging path and boots THAT, proving a downloaded
  // update can load. The launch gate is never created for any smoke receipt.
  return SMOKE_STAGED ? updater.stageForSmoke(GAME_BUNDLED) : GAME_BUNDLED;
}
function currentGameFile() {
  return updater.resolveGamePayload(GAME_BUNDLED);
}

function blockExternalNetwork(blockedRequests) {
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ["http://*/*", "https://*/*"] },
    (details, callback) => {
      blockedRequests.push(details.url);
      callback({ cancel: true });
    }
  );
}

async function isGateHeld(gateWin) {
  if (!gateWin || gateWin.isDestroyed()) return false;
  try {
    return Boolean(await gateWin.webContents.executeJavaScript("Boolean(window.__gateHeld)", true));
  } catch {
    return false;
  }
}

async function closeGateAfterGameVisible(gateWin, reason, canCloseHeld) {
  if (!gateWin || gateWin.isDestroyed()) return;
  await delay(800);
  while (gateWin && !gateWin.isDestroyed()) {
    const held = await isGateHeld(gateWin);
    if (!held || (canCloseHeld && canCloseHeld())) break;
    await delay(250);
  }
  if (gateWin && !gateWin.isDestroyed()) {
    updater.appendGateLog("gate.close", { reason });
    gateWin.close();
  }
}

function createWindow({ gameFile = currentGameFile(), smokeTest = false, blockedRequests = [], gateWin = null, gateCloseReason = "game-visible", gateCanCloseHeld = () => false } = {}) {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: "#070b0c",
    autoHideMenuBar: true,
    icon: ICON_FILE,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  if (!smokeTest) win.once("ready-to-show", () => {
    win.show();
    updater.appendGateLog("game.visible", { target: gameFile });
    closeGateAfterGameVisible(gateWin, gateCloseReason, gateCanCloseHeld);
  });

  win.loadFile(gameFile).then(() => {
    if (smokeTest) runSmokeTest(win, blockedRequests, gameFile);
  }).catch((err) => {
    console.error(err);
    app.exit(1);
  });

  return win;
}

async function runSmokeTest(win, blockedRequests, gameFile) {
  try {
    const result = await win.webContents.executeJavaScript(`
      new Promise((resolve) => {
        const started = Date.now();
        const probe = () => {
          const root = document.querySelector("#dc-root");
          const canvas = document.querySelector("#ss-canvas");
          const text = document.body ? document.body.innerText : "";
          const result = {
            title: document.title,
            hasReact: Boolean(window.React && window.ReactDOM),
            hasRoot: Boolean(root),
            hasCanvas: Boolean(canvas),
            rawTemplateRemoved: !document.querySelector("x-dc"),
            textLength: text.length,
            containsTitle: text.includes("SYSTEMIC")
          };

          if (
            result.hasReact &&
            result.hasRoot &&
            result.hasCanvas &&
            result.rawTemplateRemoved &&
            result.containsTitle
          ) {
            resolve(result);
            return;
          }

          if (Date.now() - started > 15000) {
            result.timedOut = true;
            resolve(result);
            return;
          }

          setTimeout(probe, 100);
        };

        probe();
      });
    `);

    const ok = result.hasReact &&
      result.hasRoot &&
      result.hasCanvas &&
      result.rawTemplateRemoved &&
      result.containsTitle &&
      blockedRequests.length === 0 &&
      !result.timedOut;

    finishSmoke({
      ok,
      gameFile,
      args: process.argv,
      blockedRequests,
      result
    }, ok ? 0 : 1);
  } catch (err) {
    finishSmoke({
      ok: false,
      gameFile,
      args: process.argv,
      error: err && err.stack ? err.stack : String(err)
    }, 1);
  }
}

function finishSmoke(payload, exitCode) {
  payload.stagedMode = SMOKE_STAGED;   // receipt proves WHICH path booted (gameFile shows updates\rt-… when staged)
  const serialized = JSON.stringify(payload, null, 2);
  console.log(serialized);

  if (SMOKE_OUTPUT) {
    fs.writeFileSync(SMOKE_OUTPUT, serialized);
  }

  if (SMOKE_STAGED) updater.cleanupSmokeStage();
  app.exit(exitCode);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createGateWindow() {
  const gateWin = new BrowserWindow({
    width: 600,
    height: 440,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    backgroundColor: "#070b0c",
    autoHideMenuBar: true,
    icon: ICON_FILE,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  gateWin.once("ready-to-show", () => {
    if (!gateWin.isDestroyed()) gateWin.show();
  });
  gateWin.webContents.once("did-finish-load", () => {
    updater.appendGateLog("gate.loaded", { verbose: GATE_VERBOSE });
    if (GATE_VERBOSE) {
      gateWin.webContents.executeJavaScript(`
        (() => {
          window.__gateVerbose = true;
          if (!window.__gateHeld) document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          const hint = document.getElementById('holdHint');
          if (hint) hint.textContent = '■ HELD — VERBOSE DIAGNOSTIC MODE · PLAY WHEN READY';
        })();
      `).catch(() => {});
    }
  });
  gateWin.loadFile(GATE_FILE).catch((err) => {
    console.warn("[launch-gate] failed to load gate:", String((err && err.message) || err));
    updater.appendGateLog("gate.load.error", { reason: String((err && err.message) || err) });
  });
  return gateWin;
}

function sendGateStatus(gateWin, status) {
  if (!gateWin || gateWin.isDestroyed()) return;
  updater.appendGateLog("gate.status", status);
  const script = "window.__gate && window.__gate.set(" + JSON.stringify(status) + ")";
  gateWin.webContents.executeJavaScript(script).catch(() => {});
}

function pollGateAction(gateWin, onAction) {
  let stopped = false;
  const poll = async () => {
    if (stopped || !gateWin || gateWin.isDestroyed()) return;
    try {
      const action = await gateWin.webContents.executeJavaScript(`
        (() => {
          const action = window.__gateAction || null;
          window.__gateAction = null;
          return action;
        })();
      `);
      if (action === "play" || action === "skip") {
        stopped = true;
        updater.appendGateLog("gate.action", { action });
        onAction(action);
        return;
      }
    } catch {}
    setTimeout(poll, 150);
  };
  poll();
  return () => { stopped = true; };
}

async function launchWithGate(blockedRequests) {
  const gateWin = createGateWindow();
  let booted = false;
  let cancelled = false;
  let gateActionConsumed = false;
  let pendingGateContinue = null;
  let gatePhase = "checking";

  const waitForGateContinue = (gameFile, fallbackMs) => new Promise((resolve) => {
    let settled = false;
    pendingGateContinue = {
      gameFile,
      resolve: (target) => {
        if (settled) return;
        settled = true;
        pendingGateContinue = null;
        resolve(target || gameFile);
      }
    };
    if (fallbackMs && !GATE_VERBOSE) {
      setTimeout(async () => {
        if (settled || pendingGateContinue == null) return;
        if (await isGateHeld(gateWin)) return;
        pendingGateContinue.resolve(gameFile);
      }, fallbackMs);
    }
  });

  const waitIfHeld = async (gameFile) => {
    if (GATE_VERBOSE || await isGateHeld(gateWin)) {
      return waitForGateContinue(gameFile, 0);
    }
    return gameFile;
  };

  const stopPolling = pollGateAction(gateWin, (action) => {
    gateActionConsumed = true;
    if (pendingGateContinue) {
      const pending = pendingGateContinue;
      pending.resolve(action === "skip" ? currentGameFile() : pending.gameFile);
      return;
    }
    cancelled = true;
    bootCurrent("user-action");
  });

  const bootGame = (gameFile, reason) => {
    if (booted) return;
    booted = true;
    updater.appendGateLog("boot.target", { reason: reason || "launch", target: gameFile });
    createWindow({
      gameFile,
      blockedRequests,
      gateWin,
      gateCloseReason: reason || "game-visible",
      gateCanCloseHeld: () => gateActionConsumed,
    });
  };
  const bootCurrent = (reason) => bootGame(currentGameFile(), reason || "current");

  const launchCheck = updater.prepareLaunchUpdate(GAME_BUNDLED, {
    isCancelled: () => cancelled,
    onStatus: (status) => {
      gatePhase = status && status.state ? status.state : gatePhase;
      if (!cancelled && !booted) sendGateStatus(gateWin, status);
    }
  });

  const checkTimeout = delay(5000).then(() => {
    if (gatePhase === "checking") {
      return { kind: "timeout", gameFile: currentGameFile(), note: "Update check timed out." };
    }
    return launchCheck;
  });
  const result = await Promise.race([
    launchCheck,
    checkTimeout
  ]);

  if (booted) return;

  if (result.kind === "timeout") {
    cancelled = true;
    sendGateStatus(gateWin, { state: "offline", note: "Update check timed out. Launching the current build." });
    await delay(350);
    bootGame(await waitIfHeld(result.gameFile), "timeout");
    return;
  }

  if (result.kind === "wrapper-restarting") {
    stopPolling();
    updater.appendGateLog("gate.close", { reason: "wrapper-restarting" });
    await delay(250);
    app.quit();
    return;
  }

  if (result.kind === "payload-staged") {
    if (GATE_VERBOSE || await isGateHeld(gateWin)) {
      sendGateStatus(gateWin, {
        state: "uptodate",
        current: result.current,
        latest: result.latest,
        note: "Update staged and verified. Press PLAY to launch v" + result.latest + ".",
        autoPlayMs: 0,
      });
      bootGame(await waitForGateContinue(result.gameFile, 0), "payload-staged-held");
    } else {
      bootGame(result.gameFile, "payload-staged");
    }
    return;
  }

  if (result.kind === "up-to-date") {
    sendGateStatus(gateWin, { state: "uptodate", current: result.current, latest: result.latest, autoPlayMs: GATE_VERBOSE ? 0 : 2600 });
    bootGame(await waitForGateContinue(result.gameFile, GATE_VERBOSE ? 0 : 8000), "up-to-date");
    return;
  }

  const state = result.kind === "error" ? "error" : "offline";
  sendGateStatus(gateWin, { state, current: result.current, note: result.note || "Launching the current build." });
  await delay(650);
  bootGame(await waitIfHeld(result.gameFile || currentGameFile()), state);
}

app.whenReady().then(() => {
  const blockedRequests = [];
  blockExternalNetwork(blockedRequests);
  if (SMOKE_TEST) {
    createWindow({ gameFile: smokeGameFile(), smokeTest: true, blockedRequests });
  } else {
    launchWithGate(blockedRequests).catch((err) => {
      console.warn("[launch-gate] failed open:", String((err && err.message) || err));
      updater.appendGateLog("gate.failed-open", { reason: String((err && err.message) || err) });
      createWindow({ gameFile: currentGameFile(), blockedRequests });
    });
  }

  if (!SMOKE_TEST) app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow({ blockedRequests });
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
