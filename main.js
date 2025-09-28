import { app, BrowserWindow } from "electron/main";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Set the app name
app.setName("LinkedOut - BlockArena");

loadEnvFile();

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    title: "LinkedOut - BlockArena",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile("index.html");

  // Open DevTools to see console logs
  // win.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function loadEnvFile() {
  // For development: .env is in the project root
  // For production builds: .env will be in the app bundle root
  const possiblePaths = [
    join(process.cwd(), ".env"),              // Development and some production builds
    join(app.getAppPath(), ".env"),           // Most production builds
    join(app.getPath("userData"), ".env")     // Fallback for user data directory
  ];

  let envPath = null;
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      envPath = path;
      console.log(`🔧 [ENV] Found .env file at: ${path}`);
      break;
    }
  }

  if (!envPath) {
    console.log("⚠️ [ENV] No .env file found in expected locations");
    return;
  }

  try {
    const content = readFileSync(envPath, "utf-8");
    const lines = content.split(/\r?\n/);
    let loadedCount = 0;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        return;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      if (key && !(key in process.env)) {
        process.env[key] = value;
        loadedCount++;
        console.log(`✅ [ENV] Loaded: ${key}`);
      }
    });

    console.log(`🎯 [ENV] Successfully loaded ${loadedCount} environment variables`);
  } catch (error) {
    console.error("❌ [ENV] Error loading .env file:", error.message);
  }
}
