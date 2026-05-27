import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import nextEnv from "@next/env";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

const { loadEnvConfig } = nextEnv;

loadEnvConfig(projectRoot);

const standaloneRoot = join(projectRoot, ".next", "standalone");
const standaloneServer = join(standaloneRoot, "server.js");
const staticSource = join(projectRoot, ".next", "static");
const staticTarget = join(standaloneRoot, ".next", "static");
const publicSource = join(projectRoot, "public");
const publicTarget = join(standaloneRoot, "public");

function copyDirectoryIfExists(source, target) {
  if (!existsSync(source)) {
    return;
  }

  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target, { recursive: true, force: true });
}

if (!existsSync(standaloneServer)) {
  console.error("Build standalone não encontrado. Execute 'npm run build' antes de iniciar.");
  process.exit(1);
}

copyDirectoryIfExists(staticSource, staticTarget);
copyDirectoryIfExists(publicSource, publicTarget);

const child = spawn(process.execPath, [standaloneServer], {
  cwd: projectRoot,
  env: {
    ...process.env,
    HOSTNAME: process.env.HOSTNAME || "0.0.0.0",
    PORT: process.env.PORT || "4006"
  },
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
