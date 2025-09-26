import { app, session, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, nativeImage, screen, type MenuItem } from 'electron';
import * as path from 'node:path';
import Store from "electron-store";
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

type Prefs = {
  selectedDisplayIndex: number;
  selectedPosition: "bottom-right" | "bottom-left" | "top-right" | "top-left";
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const store = new Store<Prefs>({
  defaults: {
    selectedDisplayIndex: 0,
    selectedPosition: "bottom-right",
  } satisfies Prefs,
});
const isMac = process.platform === 'darwin';
const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';
const isDev = !!process.env.OVERLAY_URL;

let overlayWin: BrowserWindow | null = null;
let hudWin: BrowserWindow | null = null;
let tray: Tray | null = null;

let selectedDisplayIndex = store.get("selectedDisplayIndex") ?? 0;
let selectedPosition = store.get("selectedPosition") ?? "bottom-right";

let monitorItems: MenuItem[] = [];
let positionItems: MenuItem[] = [];

function res(p: string) {
  // Files placed by electron-builder into process.resourcesPath at runtime
  return path.join(process.resourcesPath, p);
}

function preload(p: string) {
  // Dist paths at dev/prod
  return path.join(__dirname, p);
}

function determinePosition(bounds: Electron.Rectangle, width: number, height: number) {
  let x, y;
  
  switch (selectedPosition) {
    case "bottom-right":
      x = bounds.x + bounds.width - width - 24;
      y = bounds.y + bounds.height - height - 40;
      break;
    case "bottom-left":
      x = bounds.x + 24;
      y = bounds.y + bounds.height - height - 40;
      break;
    case "top-right":
      x = bounds.x + bounds.width - width - 24;
      y = bounds.y + 40;
      break;
    case "top-left":
      x = bounds.x + 24;
      y = bounds.y + 40;
      break;
  }

  return { x, y }
}

function createHUD() {
  if (hudWin) {
    hudWin.close();
    hudWin = null;
  }

  const displays = screen.getAllDisplays();
  const target = displays[selectedDisplayIndex] ?? displays[0];
  const { bounds } = target;

  hudWin = new BrowserWindow({
    x: bounds.x + bounds.width - 320 - 47,
    y: bounds.y + bounds.height - 600,
    width: 320,
    height: 150,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: true,
    alwaysOnTop: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preload('preload/hud.preload.cjs')
    }
  });

  const hudURL = isDev
    ? process.env.HUD_URL!
    : 'file://' + path.join(res('ui/hud'), 'index.html');

  hudWin.loadURL(hudURL);
}

function createOverlay() {
  if (overlayWin) {
    overlayWin.close();
    overlayWin = null;
  }

  const displays = screen.getAllDisplays();
  const target = displays[selectedDisplayIndex] ?? displays[0];
  const { bounds } = target;

  overlayWin = new BrowserWindow({
    x: determinePosition(bounds, 380, 420).x,
    y: determinePosition(bounds, 380, 420).y,
    // x: bounds.x + bounds.width - 380 - 24,
    // y: bounds.y + bounds.height - 420 - 40,
    width: 380,
    height: 420,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreenable: false,
    focusable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      preload: preload("preload/overlay.preload.cjs"),
    },
  });

  overlayWin.setIgnoreMouseEvents(true, { forward: true });

  if (isMac) {
    overlayWin.setAlwaysOnTop(true, 'screen-saver');
    overlayWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }
  if (isWindows) {
    overlayWin.setAlwaysOnTop(true, 'screen-saver');
  }

  const overlayURL = isDev
    ? process.env.OVERLAY_URL!
    : 'file://' + path.join(res('ui/overlay'), 'index.html');

  overlayWin.loadURL(overlayURL);
}

async function createWindows() {
  // createHUD();
  createOverlay();

  setupTray();
  setupShortcuts();
  setupIpc();
}

function setupTray() {
  const iconPath = isDev ? path.join(process.cwd(), 'assets', 'tray.png') : res('assets/tray.png');

  let icon = nativeImage.createFromPath(iconPath);

  // On macOS, resize & force template image
  if (process.platform === "darwin") {
    icon = icon.resize({ width: 16, height: 16 });
    icon.setTemplateImage(true);
  }

  const buildMenu = () => {
    const displays = screen.getAllDisplays();

    const monitorMenu = displays.map((d, i) => ({
      label: `Monitor ${i + 1} (${d.bounds.width}x${d.bounds.height})`,
      type: "radio" as const,
      checked: i === selectedDisplayIndex,
      click: (item: MenuItem) => {
        selectedDisplayIndex = i;
        store.set("selectedDisplayIndex", i);
        monitorItems.forEach((mi) => (mi.checked = false));
        item.checked = true;
        createOverlay();
        // createHUD();
        tray!.setContextMenu(Menu.buildFromTemplate(buildMenu()));
      },
    }));

    const positionMenu = ["bottom-right", "bottom-left", "top-right", "top-left"].map((pos) => ({
      label: pos,
      type: "radio" as const,
      checked: pos === selectedPosition,
      click: (item: MenuItem) => {
        selectedPosition = pos as typeof selectedPosition;
        store.set("selectedPosition", pos);
        positionItems.forEach((pi) => (pi.checked = false));
        item.checked = true;
        createOverlay();
        // createHUD();
        tray!.setContextMenu(Menu.buildFromTemplate(buildMenu()));
      },
    }));

    return [
      { label: "Choose Monitor", submenu: monitorMenu },
      { label: "Assistant Position", submenu: positionMenu },
      { type: "separator" as const },
      { label: 'Show Overlay', click: () => overlayWin?.show() },
      { label: 'Hide Overlay', click: () => overlayWin?.hide() },
      { type: "separator" as const },
      { label: "Quit", click: () => app.quit() },
    ];
  };

  tray = new Tray(icon);
  tray.setToolTip('AI Desktop Companion');
  tray.setContextMenu(Menu.buildFromTemplate(buildMenu()));
}

function setupShortcuts() {
  // Example: Ctrl+Space = push-to-talk (we just toggle a status for now)
  globalShortcut.register(isMac ? 'Command+Space' : 'Control+Space', () => {
    hudWin?.webContents.send('aiGirl/status', { listening: true });
    setTimeout(() => hudWin?.webContents.send('aiGirl/status', { listening: false }), 800);
  });
}

function setupIpc() {
  ipcMain.handle('aiGirl/app/quit', () => {
    app.quit();

    return { ok: true };
  });
}

function patchCSPForProd() {
  // Only touch CSP in packaged builds, not during Vite dev
  if (!app.isPackaged) return;

  const ses = session.defaultSession;
  // Scope to your app protocol (electron-builder uses app:// in prod)
  ses.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          // allow self, blobs, data URIs, file:// for textures
          "default-src 'self' blob: data: filesystem: file:;",
          "img-src 'self' blob: data: filesystem: file:;",
          "media-src 'self' blob: data: filesystem: file:;"
        ],
      },
    });
  });
}

app.whenReady().then(async () => {
  // 1. Patch CSP before creating windows
  patchCSPForProd();

  // 2. Then create windows
  await createWindows();

  // 3. macOS re-activate logic
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindows();
  });
});

app.on('window-all-closed', () => {
  if (!isMac) app.quit();
});

app.on("before-quit", () => {
});
