const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const ROOT = path.join(__dirname, "..");

function wantsLive() {
  const nodeEnv = String(process.env.NODE_ENV || "").toLowerCase();
  const appEnv = String(process.env.APP_ENV || "").toLowerCase();
  return (
    process.argv.includes("--live") ||
    nodeEnv === "live" ||
    nodeEnv === "production" ||
    appEnv === "live" ||
    appEnv === "production"
  );
}

function loadFile(filePath, { override = false, required = false } = {}) {
  if (!fs.existsSync(filePath)) {
    if (required) {
      throw new Error(`Required env file not found: ${path.basename(filePath)}`);
    }
    return false;
  }

  const result = dotenv.config({ path: filePath, override });
  if (result.error) {
    throw new Error(`Failed to load ${path.basename(filePath)}: ${result.error.message}`);
  }
  return true;
}

function resolveOverlayPath() {
  if (process.env.ENV_FILE) {
    return path.resolve(ROOT, process.env.ENV_FILE);
  }
  return path.join(ROOT, wantsLive() ? ".env.live" : ".env.development");
}

if (!process.env.__BIRCHWOOD_ENV_LOADED) {
  const commonPath = path.join(ROOT, ".env");
  const overlayPath = resolveOverlayPath();
  const loaded = [];

  if (loadFile(commonPath, { override: false, required: true })) {
    loaded.push(path.basename(commonPath));
  }

  if (loadFile(overlayPath, { override: true, required: true })) {
    loaded.push(path.basename(overlayPath));
  }

  const loadedLabel = loaded.join(" + ");
  process.env.__BIRCHWOOD_ENV_LOADED = loadedLabel;
  console.log(`Loaded environment from ${loadedLabel}`);
}

module.exports = {
  envPath: process.env.__BIRCHWOOD_ENV_LOADED,
  envFile: process.env.__BIRCHWOOD_ENV_LOADED,
  envFiles: String(process.env.__BIRCHWOOD_ENV_LOADED || "")
    .split(" + ")
    .filter(Boolean),
};
