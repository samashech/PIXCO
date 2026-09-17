const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("brickboxDesktop", {
  onPause(callback) {
    const listener = () => callback();
    ipcRenderer.on("brickbox:pause", listener);
    return () => ipcRenderer.removeListener("brickbox:pause", listener);
  },
});
