import { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, nativeImage } from 'electron';
import * as path from 'node:path';

const isMac = process.platform === 'darwin';
const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';

const isDev = !!process.env.OVERLAY_URL;

let overlayWin: BrowserWindow | null = null;
let hudWin: BrowserWindow | null = null;
let tray: Tray | null = null;

function res(p: string) {
  // Files placed by electron-builder into process.resourcesPath at runtime
  return path.join(process.resourcesPath, p);
}

function preload(p: string) {
  // Dist paths at dev/prod
  return path.join(__dirname, p);
}

async function createWindows() {
  // Overlay (transparent, always-on-top, click-through)
  overlayWin = new BrowserWindow({
    width: 380,
    height: 420,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreenable: false,
    focusable: false, // never grabs focus
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preload('preload/overlay.preload.cjs'),
      backgroundThrottling: false
    }
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

  // HUD (focusable control panel)
  hudWin = new BrowserWindow({
    width: 320,
    height: 160,
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

  // Position windows (example positions; adjust to taste)
  const displays = require('electron').screen.getAllDisplays();
  const primary = displays.find((d: any) => d.bounds.x === 0 && d.bounds.y === 0) || displays[0];

  overlayWin.setBounds({
    x: primary.workArea.x + primary.workArea.width - 380 - 24,
    y: primary.workArea.y + primary.workArea.height - 460,
    width: 380,
    height: 420,
  });
  hudWin.setBounds({
    x: primary.workArea.x + primary.workArea.width - 320 - 47,
    y: primary.workArea.y + primary.workArea.height - 600,
    width: 320,
    height: 150,
  });

  setupTray();
  setupShortcuts();
  setupIpc();
}

function setupTray() {
  const iconPath = isDev ? path.join(process.cwd(), 'assets', 'tray.png') : res('assets/tray.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);
  const menu = Menu.buildFromTemplate([
    { label: 'Show Overlay', click: () => overlayWin?.show() },
    { label: 'Hide Overlay', click: () => overlayWin?.hide() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
  tray.setToolTip('AI Girl');
  tray.setContextMenu(menu);
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

app.whenReady().then(async () => {
  await createWindows();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindows();
  });
});

app.on('window-all-closed', () => {
  if (!isMac) app.quit();
});

app.on("before-quit", () => {
});
