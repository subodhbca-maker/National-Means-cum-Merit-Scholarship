/* Basic Pathshala - NMMS : Windows desktop shell (Electron). Loads the same web app from ./app */
const { app, BrowserWindow, shell, Menu, session } = require('electron');
const path = require('path');

const TITLE = 'Basic Pathshala - NMMS';
const APP_DIR = path.join(__dirname, 'app');

if (!app.requestSingleInstanceLock()) app.quit();

let win = null;

function isInternal(url) {
  return url === 'about:blank' || url.startsWith('file:') || url.startsWith('blob:') || url.startsWith('data:');
}

function createWindow() {
  win = new BrowserWindow({
    width: 1366, height: 860, minWidth: 900, minHeight: 600,
    title: TITLE,
    icon: path.join(__dirname, 'icon.ico'),
    backgroundColor: '#f4f6fb',
    show: false,
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, spellcheck: false }
  });
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  win.loadFile(path.join(APP_DIR, 'index.html'));

  // print / report windows (window.open('')) open inside the app; web links open in the browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isInternal(url)) {
      return { action: 'allow', overrideBrowserWindowOptions: { width: 1000, height: 800, autoHideMenuBar: true, icon: path.join(__dirname, 'icon.ico'), title: TITLE } };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!isInternal(url)) { e.preventDefault(); shell.openExternal(url); }
  });
  win.on('page-title-updated', (e) => { e.preventDefault(); win.setTitle(TITLE); });
}

app.on('second-instance', () => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});

app.whenReady().then(() => {
  app.setAppUserModelId('com.basicpathshala.nmms');
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'File', submenu: [{ role: 'reload', label: 'Reload' }, { type: 'separator' }, { role: 'quit', label: 'Exit' }] },
    { label: 'View', submenu: [{ role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'resetZoom' }, { type: 'separator' }, { role: 'togglefullscreen' }, { role: 'toggleDevTools' }] },
    { label: 'Help', submenu: [{ label: 'About', click: () => require('electron').dialog.showMessageBox(win, { type: 'info', title: TITLE, message: TITLE, detail: `Version ${app.getVersion()}\n\n© Basic Pathshala\nConcept & Development: Subodh Maurya` }) }] }
  ]));
  // camera access for OMR photos
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => cb(['media', 'clipboard-sanitized-write'].includes(permission)));
  createWindow();
});

app.on('window-all-closed', () => app.quit());
