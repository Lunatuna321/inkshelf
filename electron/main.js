const path = require("node:path");
const { app, BrowserWindow } = require("electron");
const { startServer } = require("../server");

let mainWindow = null;
let serverHandle = null;

async function createWindow() {
  serverHandle = await startServer();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 760,
    backgroundColor: "#f3ede3",
    title: "InkShelf",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  await mainWindow.loadURL(serverHandle.url);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", async () => {
  if (serverHandle?.server) {
    await new Promise((resolve) => serverHandle.server.close(resolve));
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});
