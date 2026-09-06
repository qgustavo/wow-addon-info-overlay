const {
  app,
  BrowserWindow,
  clipboard,
  globalShortcut,
  ipcMain,
  screen,
  shell,
} = require("electron");
const fs = require("fs");
const path = require("path");

const DATA_ROOT = path.resolve(__dirname, "..", "data");
const CLIPBOARD_MS = 200;
const DEFAULT_HOTKEY = "F8";

let win = null;
let panelVisible = false;
let rebinding = false;
let settings = {
  locked: false,
  bounds: null,
  classId: 6,
  specId: 250,
  hotkey: DEFAULT_HOTKEY,
};

function settingsPath() {
  return path.join(app.getPath("userData"), "overlay-settings.json");
}

function loadSettings() {
  try {
    const raw = fs.readFileSync(settingsPath(), "utf8");
    const parsed = JSON.parse(raw);
    settings = { ...settings, ...parsed };
  } catch {
    /* first run */
  }
}

function saveSettings() {
  try {
    fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2), "utf8");
  } catch {
    /* ignore */
  }
}

function defaultBounds() {
  const { workArea } = screen.getPrimaryDisplay();
  const width = Math.round(workArea.width * 0.3);
  return {
    x: workArea.x + workArea.width - width,
    y: workArea.y,
    width,
    height: workArea.height,
  };
}

function boundsOnScreen(bounds) {
  if (!bounds) return false;
  return screen.getAllDisplays().some((d) => {
    const a = d.workArea;
    return (
      bounds.x + bounds.width > a.x &&
      bounds.x < a.x + a.width &&
      bounds.y + bounds.height > a.y &&
      bounds.y < a.y + a.height
    );
  });
}

function windowBounds() {
  if (boundsOnScreen(settings.bounds)) return settings.bounds;
  return defaultBounds();
}

function persistBounds() {
  if (!win || win.isDestroyed()) return;
  settings.bounds = win.getBounds();
  saveSettings();
}

function applyLock() {
  if (!win || win.isDestroyed()) return;
  win.setMovable(!settings.locked);
  win.setResizable(!settings.locked);
  win.webContents.send("lock-changed", settings.locked);
}

function setPanelVisible(visible) {
  if (!win || win.isDestroyed()) return;
  if (!visible && rebinding) {
    rebinding = false;
    settings.hotkey = registerHotkey(settings.hotkey || DEFAULT_HOTKEY);
    win.webContents.send("rebind-hotkey", false);
    win.webContents.send("hotkey-changed", settings.hotkey);
  }
  panelVisible = visible;
  if (visible) {
    win.setIgnoreMouseEvents(false);
    win.show();
    win.setAlwaysOnTop(true, "screen-saver");
    win.moveTop();
  } else {
    win.setIgnoreMouseEvents(true);
    win.hide();
  }
}

function parseWqr(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed.startsWith("WQR|")) return null;
  const parts = trimmed.split("|");
  if (parts.length < 4) return null;
  const classId = Number(parts[1]);
  const specId = Number(parts[2]);
  const action = parts[3];
  if (!Number.isInteger(classId) || !Number.isInteger(specId)) return null;
  if (action !== "open" && action !== "rebind") return null;
  return { classId, specId, action };
}

function acceleratorFromInput(input) {
  if (!input || input.type !== "keyDown" || input.isAutoRepeat) return null;
  const skip = {
    Shift: true,
    Control: true,
    Alt: true,
    Meta: true,
    AltGraph: true,
    Escape: true,
    Tab: true,
    CapsLock: true,
    NumLock: true,
    ScrollLock: true,
    Fn: true,
    Unidentified: true,
  };
  if (skip[input.key]) return null;
  const parts = [];
  if (input.control) parts.push("Control");
  if (input.meta) parts.push("Super");
  if (input.alt) parts.push("Alt");
  if (input.shift) parts.push("Shift");
  let key = input.key;
  if (key === " ") key = "Space";
  else if (key.length === 1) key = key.toUpperCase();
  parts.push(key);
  return parts.join("+");
}

function registerHotkey(acc) {
  globalShortcut.unregisterAll();
  const wanted = acc || DEFAULT_HOTKEY;
  const toggle = () => {
    if (rebinding) return;
    setPanelVisible(!panelVisible);
  };
  if (globalShortcut.register(wanted, toggle)) return wanted;
  if (wanted !== DEFAULT_HOTKEY && globalShortcut.register(DEFAULT_HOTKEY, toggle)) {
    return DEFAULT_HOTKEY;
  }
  return wanted;
}

function startRebind() {
  if (!win || win.isDestroyed()) return;
  rebinding = true;
  globalShortcut.unregisterAll();
  setPanelVisible(true);
  win.focus();
  win.webContents.send("rebind-hotkey", true);
}

function cancelRebind() {
  rebinding = false;
  settings.hotkey = registerHotkey(settings.hotkey || DEFAULT_HOTKEY);
  if (win && !win.isDestroyed()) {
    win.webContents.send("rebind-hotkey", false);
    win.webContents.send("hotkey-changed", settings.hotkey);
  }
}

function loadSpecs() {
  const dir = path.join(DATA_ROOT, "specs");
  let names = [];
  try {
    names = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  const specs = [];
  for (const name of names) {
    try {
      specs.push(JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")));
    } catch {
      /* skip bad file */
    }
  }
  return specs;
}

function loadEncounters() {
  const file = path.join(DATA_ROOT, "encounters", "season2.json");
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return { patch: "12.1", season: 2, raid: [], mythicplus: [] };
  }
}

function openExternal(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;
    shell.openExternal(parsed.href);
  } catch {
    /* ignore */
  }
}

function createWindow() {
  const bounds = windowBounds();
  win = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    minWidth: 280,
    minHeight: 360,
    frame: false,
    transparent: false,
    backgroundColor: "#0b0d10",
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: !settings.locked,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.setMenu(null);
  win.setAlwaysOnTop(true, "screen-saver");
  applyLock();
  win.loadFile(path.join(__dirname, "index.html"));

  win.once("ready-to-show", () => {
    setPanelVisible(false);
  });

  win.webContents.on("before-input-event", (event, input) => {
    if (!rebinding || input.type !== "keyDown") return;
    event.preventDefault();
    if (input.key === "Escape") {
      cancelRebind();
      return;
    }
    const acc = acceleratorFromInput(input);
    if (!acc) return;
    rebinding = false;
    settings.hotkey = registerHotkey(acc);
    saveSettings();
    win.webContents.send("rebind-hotkey", false);
    win.webContents.send("hotkey-changed", settings.hotkey);
  });

  win.on("moved", persistBounds);
  win.on("resized", persistBounds);
  win.on("close", persistBounds);
}

function startClipboardPoll() {
  let lastText = "";
  setInterval(() => {
    const text = clipboard.readText();
    if (!text || text === lastText) return;
    lastText = text;
    const parsed = parseWqr(text);
    if (!parsed) return;
    clipboard.clear();
    lastText = "";
    settings.classId = parsed.classId;
    settings.specId = parsed.specId;
    saveSettings();
    if (parsed.action === "rebind") {
      startRebind();
      if (win && !win.isDestroyed()) {
        win.webContents.send("open-spec", parsed);
      }
      return;
    }
    setPanelVisible(true);
    if (win && !win.isDestroyed()) {
      win.webContents.send("open-spec", parsed);
    }
  }, CLIPBOARD_MS);
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => setPanelVisible(true));

  app.whenReady().then(() => {
    loadSettings();
    createWindow();
    startClipboardPoll();
    settings.hotkey = registerHotkey(settings.hotkey || DEFAULT_HOTKEY);
  });
}

ipcMain.handle("get-data", () => ({
  specs: loadSpecs(),
  encounters: loadEncounters(),
}));

ipcMain.handle("get-settings", () => ({
  locked: settings.locked,
  classId: settings.classId,
  specId: settings.specId,
  hotkey: settings.hotkey || DEFAULT_HOTKEY,
}));

ipcMain.handle("set-locked", (_event, locked) => {
  settings.locked = Boolean(locked);
  persistBounds();
  applyLock();
  saveSettings();
  return settings.locked;
});

ipcMain.handle("set-spec", (_event, payload) => {
  const classId = Number(payload && payload.classId);
  const specId = Number(payload && payload.specId);
  if (Number.isInteger(classId) && Number.isInteger(specId)) {
    settings.classId = classId;
    settings.specId = specId;
    saveSettings();
  }
  return { classId: settings.classId, specId: settings.specId };
});

ipcMain.on("hide-panel", () => setPanelVisible(false));
ipcMain.on("open-external", (_event, url) => openExternal(url));
ipcMain.on("start-rebind", () => startRebind());

app.on("window-all-closed", () => {
  globalShortcut.unregisterAll();
  app.quit();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
