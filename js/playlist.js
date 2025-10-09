const { ipcRenderer } = require('electron');
const playlistsContainer = document.getElementById('playlistsContainer');
const createPlaylistBtn = document.getElementById('createPlaylistBtn');

let playlists = [];

function loadPlaylists() {
ipcRenderer.invoke('load-playlists').then(loadedPlaylists => {
playlists = loadedPlaylists || [];
renderPlaylists();
}).catch(err => {
console.error('Failed to load playlists:', err);
playlists = [];
renderPlaylists();
});
}

function savePlaylists() {
ipcRenderer.invoke('save-playlists', playlists).catch(err => {
console.error('Failed to save playlists:', err);
});
}

function renderPlaylists() {
playlistsContainer.innerHTML = '';
if (playlists.length === 0) {
const emptyMessage = document.createElement('div');
emptyMessage.className = 'empty-playlist-message';
emptyMessage.textContent = 'No playlists yet';
playlistsContainer.appendChild(emptyMessage);
return;
}
playlists.forEach((playlist, index) => {
const li = document.createElement('li');
li.innerHTML = `
<div class="playlist-info-container">
<span class="playlist-name">${playlist.name}</span>
<span class="playlist-count">${playlist.songs.length} songs</span>
</div>
<button class="playlist-menu-btn">⋮</button>
`;
const playlistInfo = li.querySelector('.playlist-info-container');
playlistInfo.addEventListener('click', () => {
openPlaylist(index);
});
const menuBtn = li.querySelector('.playlist-menu-btn');
menuBtn.addEventListener('click', (e) => {
e.stopPropagation();
showPlaylistOptionsMenu(index, e);
});
playlistsContainer.appendChild(li);
});
}

createPlaylistBtn.addEventListener('click', () => {
showCreatePlaylistModal();
});

function showCreatePlaylistModal() {
const modal = document.createElement('div');
modal.className = 'modal-overlay';
modal.innerHTML = `
<div class="modal-content">
<h3>Create New Playlist</h3>
<input type="text" id="playlistNameInput" placeholder="Playlist name">
<div class="modal-buttons">
<button id="cancelPlaylistBtn">Cancel</button>
<button id="createPlaylistConfirmBtn">Create</button>
</div>
</div>
`;
document.body.appendChild(modal);
const input = modal.querySelector('#playlistNameInput');
const cancelBtn = modal.querySelector('#cancelPlaylistBtn');
const confirmBtn = modal.querySelector('#createPlaylistConfirmBtn');
cancelBtn.addEventListener('click', () => {
modal.remove();
});
confirmBtn.addEventListener('click', () => {
const name = input.value.trim();
if (name) {
playlists.push({ name, songs: [] });
savePlaylists();
renderPlaylists();
modal.remove();
}
});
input.addEventListener('keypress', (e) => {
if (e.key === 'Enter') {
confirmBtn.click();
}
});
input.focus();
}

function showAddToPlaylistMenu(song, event) {
const existingMenu = document.querySelector('.playlist-menu');
if (existingMenu) existingMenu.remove();
const menu = document.createElement('div');
menu.className = 'playlist-menu';
let menuHTML = '<div class="playlist-menu-header">Add to Playlist</div>';
if (playlists.length === 0) {
menuHTML += '<div class="playlist-menu-empty">No playlists available</div>';
} else {
playlists.forEach((playlist, index) => {
menuHTML += `<div class="playlist-menu-item" data-playlist-index="${index}">${playlist.name}</div>`;
});
}
menu.innerHTML = menuHTML;
document.body.appendChild(menu);
const menuRect = menu.getBoundingClientRect();
const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;
let left = event.clientX;
let top = event.clientY;
if (left + menuRect.width > windowWidth) {
left = windowWidth - menuRect.width - 10;
}
if (top + menuRect.height > windowHeight) {
top = windowHeight - menuRect.height - 10;
}
if (left < 0) left = 10;
if (top < 0) top = 10;
menu.style.position = 'fixed';
menu.style.left = `${left}px`;
menu.style.top = `${top}px`;
menu.querySelectorAll('.playlist-menu-item').forEach(item => {
item.addEventListener('click', () => {
const playlistIndex = parseInt(item.getAttribute('data-playlist-index'));
addSongToPlaylist(playlistIndex, song);
menu.remove();
});
});
setTimeout(() => {
document.addEventListener('click', function removeMenu() {
menu.remove();
document.removeEventListener('click', removeMenu);
}, { once: true });
}, 10);
}

function addSongToPlaylist(playlistIndex, song) {
const playlist = playlists[playlistIndex];
const exists = playlist.songs.some(s => s.encryptedUrl === song.encryptedUrl);
if (!exists) {
playlist.songs.push(song);
savePlaylists();
renderPlaylists();
const playlistView = document.getElementById('playlistView');
if (playlistView && playlistView.dataset.playlistIndex == playlistIndex) {
openPlaylist(playlistIndex);
}
}
}

function showPlaylistOptionsMenu(playlistIndex, event) {
const existingMenu = document.querySelector('.playlist-menu');
if (existingMenu) existingMenu.remove();
const menu = document.createElement('div');
menu.className = 'playlist-menu';
menu.innerHTML = `
<div class="playlist-menu-item remove-option" data-action="delete">Delete Playlist</div>
`;
document.body.appendChild(menu);
const menuRect = menu.getBoundingClientRect();
const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;
let left = event.clientX;
let top = event.clientY;
if (left + menuRect.width > windowWidth) {
left = windowWidth - menuRect.width - 10;
}
if (top + menuRect.height > windowHeight) {
top = windowHeight - menuRect.height - 10;
}
if (left < 0) left = 10;
if (top < 0) top = 10;
menu.style.position = 'fixed';
menu.style.left = `${left}px`;
menu.style.top = `${top}px`;
menu.querySelector('[data-action="delete"]').addEventListener('click', () => {
playlists.splice(playlistIndex, 1);
savePlaylists();
renderPlaylists();
const playlistView = document.getElementById('playlistView');
if (playlistView) playlistView.remove();
dashboard.style.display = 'block';
menu.remove();
});
setTimeout(() => {
document.addEventListener('click', function removeMenu() {
menu.remove();
document.removeEventListener('click', removeMenu);
}, { once: true });
}, 10);
}

function openPlaylist(playlistIndex) {
const playlist = playlists[playlistIndex];
dashboard.style.display = 'none';
const searchResults = document.getElementById('searchResults');
if (searchResults) searchResults.remove();
let playlistView = document.getElementById('playlistView');
if (playlistView) playlistView.remove();
playlistView = document.createElement('section');
playlistView.id = 'playlistView';
playlistView.dataset.playlistIndex = playlistIndex;
playlistView.innerHTML = `
<div class="playlist-header">
<h3>${playlist.name}</h3>
<p class="playlist-info">${playlist.songs.length} songs</p>
</div>
<div class="results-container" id="playlistSongsContainer"></div>
`;
mainContent.appendChild(playlistView);
const songsContainer = playlistView.querySelector('#playlistSongsContainer');
if (playlist.songs.length === 0) {
songsContainer.innerHTML = '<p class="empty-playlist-message">No songs in this playlist</p>';
currentPlaylist = [];
currentPlaylistIndex = -1;
return;
}
currentPlaylist = [];
playlist.songs.forEach((song, idx) => {
const card = document.createElement('div');
card.className = 'song-card';
card.innerHTML = `
<div class="song-image-container">
<img src="${song.image.replace('150x150', '500x500')}" alt="${song.title}">
<div class="play-overlay">
<button class="play-button"></button>
</div>
</div>
<div class="song-info">
<div class="song-title">${song.title}</div>
<div class="song-subtitle">${song.subtitle}</div>
</div>
<button class="song-actions-btn">⋮</button>
`;
const playBtn = card.querySelector('.play-button');
playBtn.addEventListener('click', (e) => {
e.stopPropagation();
currentPlaylistIndex = idx;
playSong(song, card);
});
const actionsBtn = card.querySelector('.song-actions-btn');
actionsBtn.addEventListener('click', (e) => {
e.stopPropagation();
showPlaylistSongMenu(playlistIndex, idx, song, e);
});
songsContainer.appendChild(card);
currentPlaylist.push({ song, card });
});
}

function showPlaylistSongMenu(playlistIndex, songIndex, song, event) {
const existingMenu = document.querySelector('.playlist-menu');
if (existingMenu) existingMenu.remove();
const menu = document.createElement('div');
menu.className = 'playlist-menu';
menu.innerHTML = `
<div class="playlist-menu-subheader">Add to other playlists</div>
${playlists.map((pl, idx) => {
if (idx !== playlistIndex) {
return `<div class="playlist-menu-item" data-add-to="${idx}">${pl.name}</div>`;
}
return '';
}).join('')}
<div class="playlist-menu-separator"></div>
<div class="playlist-menu-item remove-option" data-action="remove">Remove from Playlist</div>
`;
document.body.appendChild(menu);
const menuRect = menu.getBoundingClientRect();
const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;
let left = event.clientX;
let top = event.clientY;
if (left + menuRect.width > windowWidth) {
left = windowWidth - menuRect.width - 10;
}
if (top + menuRect.height > windowHeight) {
top = windowHeight - menuRect.height - 10;
}
if (left < 0) left = 10;
if (top < 0) top = 10;
menu.style.position = 'fixed';
menu.style.left = `${left}px`;
menu.style.top = `${top}px`;
menu.querySelectorAll('[data-add-to]').forEach(item => {
item.addEventListener('click', () => {
const targetPlaylistIndex = parseInt(item.getAttribute('data-add-to'));
addSongToPlaylist(targetPlaylistIndex, song);
menu.remove();
});
});
menu.querySelector('[data-action="remove"]').addEventListener('click', () => {
playlists[playlistIndex].songs.splice(songIndex, 1);
savePlaylists();
renderPlaylists();
openPlaylist(playlistIndex);
menu.remove();
});
setTimeout(() => {
document.addEventListener('click', function removeMenu() {
menu.remove();
document.removeEventListener('click', removeMenu);
}, { once: true });
}, 10);
}

loadPlaylists();
