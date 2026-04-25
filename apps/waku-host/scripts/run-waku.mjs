import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const wakuPackagePath = require.resolve("waku/package.json");
const wakuPackage = require("waku/package.json");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");
const wakuRoot = path.dirname(wakuPackagePath);
const wakuCli = path.resolve(wakuRoot, wakuPackage.bin.waku);

const [command, ...args] = process.argv.slice(2);
const currentNodeVersion = process.versions.node
  .split(".")
  .map((part) => Number.parseInt(part, 10));

function isNodeVersionAtLeast(version, minimum) {
  const [major = 0, minor = 0, patch = 0] = version;
  const [minimumMajor = 0, minimumMinor = 0, minimumPatch = 0] = minimum;

  if (major !== minimumMajor) {
    return major > minimumMajor;
  }

  if (minor !== minimumMinor) {
    return minor > minimumMinor;
  }

  return patch >= minimumPatch;
}

function isSupportedByCurrentWakuDocs(version) {
  return (
    isNodeVersionAtLeast(version, [24, 0, 0]) ||
    isNodeVersionAtLeast(version, [22, 12, 0]) ||
    isNodeVersionAtLeast(version, [20, 19, 0])
  );
}

const isSupportedNode = isSupportedByCurrentWakuDocs(currentNodeVersion);

if (
  command === "dev" &&
  !isSupportedNode &&
  process.env.WAKU_ALLOW_UNSUPPORTED_NODE !== "1"
) {
  console.error(
    [
      `waku-host dev requires a Node.js version supported by waku ${wakuPackage.version}.`,
      `Current Node.js: ${process.version}`,
      "Waku docs requirement: ^24.0.0 or ^22.12.0 or ^20.19.0",
      `Installed package engines: ${wakuPackage.engines?.node ?? "unknown"}`,
      "",
      "Use Node.js 24.x, 22.12+, or 20.19+ for `npm run waku-host:dev`, for example:",
      "  nvm use 24",
      "  npm run waku-host:dev",
      "",
      "If you still want to try the current Node anyway, run:",
      "  WAKU_ALLOW_UNSUPPORTED_NODE=1 npm run waku-host:dev",
    ].join("\n"),
  );
  process.exit(1);
}

const child = spawn(process.execPath, [wakuCli, command, ...args], {
  cwd: appRoot,
  stdio: "inherit",
  env: process.env,
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
