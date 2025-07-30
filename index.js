const { app, BrowserWindow, session } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
      icon: path.join(__dirname, 'assets', 'icon.png'),
    }
  });
  win.maximize();
  win.setMenuBarVisibility(false);
  win.show();
  win.setIcon(path.join(__dirname, 'assets', 'icon.png'));

  win.loadFile('index.html');

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Access-Control-Allow-Origin': ['*']
      }
    });
  });
}

app.whenReady().then(createWindow);
