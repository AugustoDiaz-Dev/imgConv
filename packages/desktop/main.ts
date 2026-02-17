import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "path";
import fs from "fs-extra";
import { convertFolder, ConvertOptions, ProgressEvent } from "core";

let win: BrowserWindow | null = null;

function createWindow() {
  win = new BrowserWindow({
    width: 980,
    height: 720,
    title: "ImgConv",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  win.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("pick-folder", async () => {
  const res = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (res.canceled || res.filePaths.length === 0) return null;
  return res.filePaths[0];
});

ipcMain.handle("run-convert", async (_evt, opts: ConvertOptions) => {
  await fs.ensureDir(opts.outputDir);

  const events: ProgressEvent[] = [];

  const result = await convertFolder(opts, (e) => {
    events.push(e);
    win?.webContents.send("progress-event", e);
  });

  return { result, eventsCount: events.length };
});

ipcMain.handle("open-folder", async (_evt, folderPath: string) => {
  await shell.openPath(folderPath);
  return true;
});
