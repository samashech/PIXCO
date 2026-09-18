const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("pixcoDesktop", {
  onPause(callback) {
    const listener = () => callback();
    ipcRenderer.on("pixco:pause", listener);
    return () => ipcRenderer.removeListener("pixco:pause", listener);
  },
});
