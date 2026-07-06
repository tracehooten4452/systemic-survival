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

function createWindow({ gameFile = currentGameFile(), smokeTest = false, blockedRequests = [], gateWin = null } = {}) {
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
    if (gateWin && !gateWin.isDestroyed()) gateWin.close();
    win.show();
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
    width: 560,
    height: 360,
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
  gateWin.loadFile(GATE_FILE).catch((err) => {
    console.warn("[launch-gate] failed to load gate:", String((err && err.message) || err));
  });
  return gateWin;
}

function sendGateStatus(gateWin, status) {
  if (!gateWin || gateWin.isDestroyed()) return;
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
  const stopPolling = pollGateAction(gateWin, () => {
    cancelled = true;
    bootCurrent();
  });

  const bootGame = (gameFile) => {
    if (booted) return;
    booted = true;
    stopPolling();
    createWindow({ gameFile, blockedRequests, gateWin });
  };
  const bootCurrent = () => bootGame(currentGameFile());

  const launchCheck = updater.prepareLaunchUpdate(GAME_BUNDLED, {
    isCancelled: () => cancelled,
    onStatus: (status) => {
      if (!cancelled && !booted) sendGateStatus(gateWin, status);
    }
  });

  const result = await Promise.race([
    launchCheck,
    delay(5000).then(() => ({ kind: "timeout", gameFile: currentGameFile(), note: "Update check timed out." }))
  ]);

  if (booted) return;

  if (result.kind === "timeout") {
    cancelled = true;
    sendGateStatus(gateWin, { state: "offline", note: "Update check timed out. Launching the current build." });
    await delay(350);
    bootGame(result.gameFile);
    return;
  }

  if (result.kind === "wrapper-restarting") {
    stopPolling();
    await delay(250);
    app.quit();
    return;
  }

  if (result.kind === "payload-staged") {
    bootGame(result.gameFile);
    return;
  }

  if (result.kind === "up-to-date") {
    sendGateStatus(gateWin, { state: "uptodate", current: result.current, latest: result.latest, autoPlayMs: 0 });
    await delay(650);
    bootGame(result.gameFile);
    return;
  }

  const state = result.kind === "error" ? "error" : "offline";
  sendGateStatus(gateWin, { state, current: result.current, note: result.note || "Launching the current build." });
  await delay(650);
  bootGame(result.gameFile || currentGameFile());
}

app.whenReady().then(() => {
  const blockedRequests = [];
  blockExternalNetwork(blockedRequests);
  if (SMOKE_TEST) {
    createWindow({ gameFile: smokeGameFile(), smokeTest: true, blockedRequests });
  } else {
    launchWithGate(blockedRequests).catch((err) => {
      console.warn("[launch-gate] failed open:", String((err && err.message) || err));
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
