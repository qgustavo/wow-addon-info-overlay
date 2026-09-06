const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("wqr", {
  getData: () => ipcRenderer.invoke("get-data"),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  setLocked: (locked) => ipcRenderer.invoke("set-locked", locked),
  setSpec: (classId, specId) => ipcRenderer.invoke("set-spec", { classId, specId }),
  hide: () => ipcRenderer.send("hide-panel"),
  startRebind: () => ipcRenderer.send("start-rebind"),
  openExternal: (url) => ipcRenderer.send("open-external", url),
  onLockChanged: (cb) => {
    ipcRenderer.on("lock-changed", (_event, locked) => cb(locked));
  },
  onRebindHotkey: (cb) => {
    ipcRenderer.on("rebind-hotkey", (_event, active) => cb(active));
  },
  onHotkeyChanged: (cb) => {
    ipcRenderer.on("hotkey-changed", (_event, hotkey) => cb(hotkey));
  },
});
