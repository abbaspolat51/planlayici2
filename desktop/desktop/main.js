// Planlayıcı masaüstü (Windows): web sürümünü kendi penceresinde açar.
// Uygulama içeriği GitHub Pages'ten gelir; GitHub'a yüklediğin her güncelleme
// masaüstü uygulamasına da kendiliğinden yansır, yeniden kurmana gerek kalmaz.
const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

const APP_URL = 'https://abbaspolat51.github.io/planlayici2/';
const APP_ID = 'com.abbaspolat51.planlayici';

// Windows bildirimlerinin uygulama adıyla görünmesi için
app.setAppUserModelId(APP_ID);

// Aynı anda tek pencere: ikinci kez açınca mevcut pencere öne gelir
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let win = null;

function inApp(url) {
  return url.startsWith(APP_URL) || url.startsWith('file:');
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 380,
    minHeight: 560,
    title: 'Planlayıcı',
    icon: path.join(__dirname, 'build', 'icon.png'),
    backgroundColor: '#EDF2F3',
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, sandbox: true, spellcheck: false },
  });
  Menu.setApplicationMenu(null);
  win.once('ready-to-show', () => win.show());
  win.loadURL(APP_URL);

  // İnternet yoksa sade bir uyarı sayfası göster
  win.webContents.on('did-fail-load', (e, code, desc, url, isMainFrame) => {
    if (isMainFrame && code !== -3) win.loadFile(path.join(__dirname, 'offline.html'));
  });

  // Dış bağlantılar (ör. PDF, web siteleri) varsayılan tarayıcıda açılsın
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (inApp(url)) return { action: 'allow' };
    shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!inApp(url)) { e.preventDefault(); shell.openExternal(url); }
  });

  // Kısayollar: F5 / Ctrl+R yenile, F11 tam ekran, Ctrl + / - / 0 yakınlaştır
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    const k = input.key, ctrl = input.control || input.meta;
    if (k === 'F5' || (ctrl && k.toLowerCase() === 'r')) { win.webContents.reload(); e.preventDefault(); }
    else if (k === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    else if (ctrl && (k === '+' || k === '=')) { win.webContents.setZoomLevel(win.webContents.getZoomLevel() + 0.5); e.preventDefault(); }
    else if (ctrl && k === '-') { win.webContents.setZoomLevel(win.webContents.getZoomLevel() - 0.5); e.preventDefault(); }
    else if (ctrl && k === '0') { win.webContents.setZoomLevel(0); e.preventDefault(); }
  });

  win.on('closed', () => { win = null; });
}

app.on('second-instance', () => {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
