const { app, BrowserWindow, session } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const GAME_FILE = path.join(__dirname, "..", "Systemic Survival v2.dc.html");
const ICON_FILE = path.join(__dirname, "..", "assets", "systemic-survival-icon.ico");
const SMOKE_OUTPUT_ARG = process.argv.find((arg) => arg.startsWith("--smoke-test-output="));
const SMOKE_OUTPUT = SMOKE_OUTPUT_ARG ? path.resolve(SMOKE_OUTPUT_ARG.slice("--smoke-test-output=".length)) : null;
const SMOKE_TEST = process.argv.includes("--smoke-test") || Boolean(SMOKE_OUTPUT);

function blockExternalNetwork(blockedRequests) {
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ["http://*/*", "https://*/*"] },
    (details, callback) => {
      blockedRequests.push(details.url);
      callback({ cancel: true });
    }
  );
}

function createWindow({ smokeTest = false, blockedRequests = [] } = {}) {
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
  });

  win.loadFile(GAME_FILE).then(() => {
    if (smokeTest) runSmokeTest(win, blockedRequests);
  }).catch((err) => {
    console.error(err);
    app.exit(1);
  });
}

async function runSmokeTest(win, blockedRequests) {
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
      gameFile: GAME_FILE,
      args: process.argv,
      blockedRequests,
      result
    }, ok ? 0 : 1);
  } catch (err) {
    finishSmoke({
      ok: false,
      gameFile: GAME_FILE,
      args: process.argv,
      error: err && err.stack ? err.stack : String(err)
    }, 1);
  }
}

function finishSmoke(payload, exitCode) {
  const serialized = JSON.stringify(payload, null, 2);
  console.log(serialized);

  if (SMOKE_OUTPUT) {
    fs.writeFileSync(SMOKE_OUTPUT, serialized);
  }

  app.exit(exitCode);
}

app.whenReady().then(() => {
  const blockedRequests = [];
  blockExternalNetwork(blockedRequests);
  createWindow({ smokeTest: SMOKE_TEST, blockedRequests });

  if (!SMOKE_TEST) app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
