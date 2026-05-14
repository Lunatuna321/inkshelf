const path = require("node:path");
const fs = require("node:fs/promises");
const { app, BrowserWindow, ipcMain, nativeImage } = require("electron");
const { startServer } = require("../server");

let mainWindow = null;
let serverHandle = null;
let storageInitialized = false;

function getStoragePaths() {
  const userDataDir = app.getPath("userData");
  return {
    userDataDir,
    dataFile: path.join(userDataDir, "inkshelf-data.json"),
    backupFile: path.join(userDataDir, "inkshelf-data.backup.json"),
  };
}

function getAppIconPath() {
  return path.join(__dirname, "..", "build", "icon.png");
}

async function ensureStorageHandlers() {
  if (storageInitialized) {
    return;
  }

  ipcMain.handle("inkshelf:storage-info", async () => {
    return getStoragePaths();
  });

  ipcMain.handle("inkshelf:load-data", async () => {
    const { dataFile, backupFile } = getStoragePaths();
    const attempts = [dataFile, backupFile];

    for (const file of attempts) {
      try {
        return await fs.readFile(file, "utf8");
      } catch {
        // Try next file.
      }
    }

    return null;
  });

  ipcMain.handle("inkshelf:save-data", async (_event, rawJson) => {
    const { userDataDir, dataFile, backupFile } = getStoragePaths();
    await fs.mkdir(userDataDir, { recursive: true });
    await fs.writeFile(dataFile, rawJson, "utf8");
    await fs.writeFile(backupFile, rawJson, "utf8");
    return {
      ok: true,
      savedAt: new Date().toISOString(),
      dataFile,
      backupFile,
    };
  });

  storageInitialized = true;
}

async function createWindow() {
  await ensureStorageHandlers();
  serverHandle = await startServer();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 760,
    backgroundColor: "#f3ede3",
    title: "InkShelf",
    icon: getAppIconPath(),
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
  if (process.platform === "darwin") {
    const dockIcon = nativeImage.createFromPath(getAppIconPath());
    if (!dockIcon.isEmpty()) {
      app.dock.setIcon(dockIcon);
    }
  }

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
