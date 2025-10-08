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
      <span class="playlist-name">${playlist.name}</span>
      <span class="playlist-count">${playlist.songs.length} songs</span>
    `;
    
    li.addEventListener('click', () => {
      showPlaylistSongs(playlist);
    });
    
    playlistsContainer.appendChild(li);
  });
}

function createPlaylist(name) {
  const newPlaylist = {
    id: Date.now().toString(),
    name,
    songs: []
  };
  
  playlists.push(newPlaylist);
  savePlaylists();
  renderPlaylists();
  return newPlaylist;
}

function addSongToPlaylist(playlistId, song) {
  const playlist = playlists.find(p => p.id === playlistId);
  if (!playlist) return false;
  
  const songExists = playlist.songs.some(s => s.title === song.title);
  if (songExists) return false;
  
  playlist.songs.push(song);
  savePlaylists();
  renderPlaylists();
  return true;
}

// Format duration helper function
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Function to create a song card for display
function createSongCard(song) {
  const { title, subtitle, image, duration, encryptedUrl } = song;
  
  const card = document.createElement('div');
  card.className = 'song-card';
  card.innerHTML = `
    <div class="song-image-container">
      <img src="${image}" alt="Album Art" />
      <div class="play-overlay">
        <button class="play-button"></button>
      </div>
    </div>
    <div class="song-info">
      <div class="song-title">${title}</div>
      <div class="song-subtitle">${subtitle}</div>
    </div>
    <div style="font-size: 12px; color: #ccc;">${formatDuration(duration)}</div>
    <button class="song-actions-btn">⋮</button>
  `;

  const playButton = card.querySelector('.play-button');
  playButton.addEventListener('click', (e) => {
    e.stopPropagation();
    playSong(encryptedUrl, { title, subtitle, image, duration }, card);
  });

  const actionsButton = card.querySelector('.song-actions-btn');
  actionsButton.addEventListener('click', (e) => {
    e.stopPropagation();
    showAddToPlaylistMenu(song, actionsButton);
  });

  card.addEventListener('click', () => {
    playSong(encryptedUrl, { title, subtitle, image, duration }, card);
  });

  return card;
}

function showPlaylistSongs(playlist) {
  dashboard.style.display = 'none';
  
  const oldResults = document.getElementById('searchResults');
  if (oldResults) oldResults.remove();
  
  const playlistView = document.createElement('section');
  playlistView.id = 'playlistView';
  playlistView.className = 'results-container';
  
  const header = document.createElement('div');
  header.className = 'playlist-header';
  header.innerHTML = `
    <h2>${playlist.name}</h2>
    <div class="playlist-info">${playlist.songs.length} songs</div>
  `;
  
  playlistView.appendChild(header);
  
  if (playlist.songs.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-playlist-message';
    emptyMessage.textContent = 'No songs in this playlist';
    playlistView.appendChild(emptyMessage);
  } else {
    playlist.songs.forEach(song => {
      const card = createSongCard(song);
      playlistView.appendChild(card);
    });
  }
  
  mainContent.appendChild(playlistView);
}

function showAddToPlaylistMenu(song, element) {
  const existingMenu = document.querySelector('.playlist-menu');
  if (existingMenu) existingMenu.remove();
  
  const menu = document.createElement('div');
  menu.className = 'playlist-menu';
  
  const header = document.createElement('div');
  header.className = 'playlist-menu-header';
  header.textContent = 'Add to playlist';
  menu.appendChild(header);
  
  if (playlists.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'playlist-menu-empty';
    emptyMessage.textContent = 'Create some playlists';
    menu.appendChild(emptyMessage);
  } else {
    playlists.forEach(playlist => {
      const item = document.createElement('div');
      item.className = 'playlist-menu-item';
      item.textContent = playlist.name;
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        addSongToPlaylist(playlist.id, song);
        menu.remove();
      });
      
      menu.appendChild(item);
    });
  }
  
  document.body.appendChild(menu);
  
  // Get element position
  const rect = element.getBoundingClientRect();
  
  // Position menu initially to get its dimensions
  menu.style.top = '0px';
  menu.style.left = '0px';
  
  // Now get menu dimensions
  const menuRect = menu.getBoundingClientRect();
  
  // Calculate positions
  let top = rect.bottom + 5;
  let left = rect.left;
  
  // Check if menu would go off the bottom of the screen
  if (top + menuRect.height > window.innerHeight) {
    top = rect.top - menuRect.height - 5;
    // If still off-screen at the top, position at top of viewport with small margin
    if (top < 0) {
      top = 10;
    }
  }
  
  // Check if menu would go off the right of the screen
  if (left + menuRect.width > window.innerWidth) {
    left = window.innerWidth - menuRect.width - 10;
  }
  
  // Ensure menu doesn't go off the left side
  if (left < 0) {
    left = 10;
  }
  
  // Apply the calculated positions
  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
  
  document.addEventListener('click', function closeMenu(e) {
    if (!menu.contains(e.target) && e.target !== element) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  });
}


// Create a custom modal dialog function
function showCreatePlaylistDialog(callback) {
  // Create modal container
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Create Playlist</h3>
      <input type="text" id="playlistNameInput" placeholder="Enter playlist name" />
      <div class="modal-buttons">
        <button id="cancelPlaylistBtn">Cancel</button>
        <button id="createPlaylistConfirmBtn">Create</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Focus the input field
  const input = document.getElementById('playlistNameInput');
  setTimeout(() => input.focus(), 100);
  
  // Handle button clicks
  document.getElementById('cancelPlaylistBtn').addEventListener('click', () => {
    modal.remove();
  });
  
  document.getElementById('createPlaylistConfirmBtn').addEventListener('click', () => {
    const name = input.value;
    modal.remove();
    if (name && name.trim()) {
      callback(name.trim());
    }
  });
  
  // Allow pressing Enter to confirm
  input.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      const name = input.value;
      modal.remove();
      if (name && name.trim()) {
        callback(name.trim());
      }
    }
  });
}

// Combine all DOMContentLoaded event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Load playlists
  loadPlaylists();
  
  // Add click event for create playlist button
  createPlaylistBtn.addEventListener('click', () => {
    showCreatePlaylistDialog((name) => {
      createPlaylist(name);
    });
  });
});