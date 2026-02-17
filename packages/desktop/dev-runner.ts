import { spawn } from "child_process";
import path from "path";
import fs from "fs";

// With npm workspaces, electron is often hoisted to repo root
const localElectron = path.resolve(__dirname, "node_modules/.bin/electron");
const rootElectron = path.resolve(__dirname, "../../node_modules/.bin/electron");
const electronBin = fs.existsSync(localElectron) ? localElectron : rootElectron;
const entry = path.resolve(__dirname, "dist/main.js");

const p = spawn(electronBin, [entry], { stdio: "inherit" });
p.on("exit", (code) => process.exit(code ?? 0));
