const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("inkShelfDesktop", {
  platform: process.platform,
  isDesktop: true,
  loadData: () => ipcRenderer.invoke("inkshelf:load-data"),
  saveData: (rawJson) => ipcRenderer.invoke("inkshelf:save-data", rawJson),
  getStorageInfo: () => ipcRenderer.invoke("inkshelf:storage-info"),
});
