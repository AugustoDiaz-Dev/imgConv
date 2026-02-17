import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  pickFolder: () => ipcRenderer.invoke("pick-folder"),
  runConvert: (opts: Record<string, unknown>) =>
    ipcRenderer.invoke("run-convert", opts),
  openFolder: (p: string) => ipcRenderer.invoke("open-folder", p),
  onProgress: (cb: (e: unknown) => void) => {
    ipcRenderer.on("progress-event", (_evt, e) => cb(e));
  },
});
