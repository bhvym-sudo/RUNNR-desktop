const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Path for the playlists JSON file
const playlistsFilePath = path.join(app.getPath('userData'), 'playlists.json');

function createWindow () {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      icon: path.join(__dirname, 'assets', 'icon.png'),
    }
  });
  win.maximize();
  win.setMenuBarVisibility(false);
  win.show();
  win.setIcon(path.join(__dirname, 'assets', 'icon.png'));

  win.loadFile('index.html');

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    if (details.url.includes("saavncdn.com")) {
      details.requestHeaders['User-Agent'] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138 Safari/537.36";
      details.requestHeaders['Referer'] = "https://www.jiosaavn.com/";
      details.requestHeaders['Origin'] = "https://www.jiosaavn.com";
    }
    callback({ requestHeaders: details.requestHeaders });
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Access-Control-Allow-Origin': ['*']
      }
    });
  });
}

// IPC handlers for playlist operations
ipcMain.handle('load-playlists', async () => {
  try {
    if (fs.existsSync(playlistsFilePath)) {
      const data = fs.readFileSync(playlistsFilePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading playlists:', error);
    return [];
  }
});

ipcMain.handle('save-playlists', async (event, playlists) => {
  try {
    fs.writeFileSync(playlistsFilePath, JSON.stringify(playlists, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving playlists:', error);
    return false;
  }
});

app.whenReady().then(createWindow);
