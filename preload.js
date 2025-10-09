const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
searchSongs: (query) => ipcRenderer.invoke('search-songs', query)
});
