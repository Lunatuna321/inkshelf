const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("inkShelfDesktop", {
  platform: process.platform,
  isDesktop: true,
});
