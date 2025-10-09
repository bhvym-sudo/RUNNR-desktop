const searchInput = document.getElementById('searchInput');
const mainContent = document.getElementById('mainContent');
const dashboard = document.getElementById('dashboard');
const homeBtn = document.getElementById('homeBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const seekBar = document.getElementById('seekBar');
const currentImg = document.getElementById('currentImg');
const currentTitle = document.getElementById('currentTitle');
const currentSubtitle = document.getElementById('currentSubtitle');
const currentTimeDisplay = document.getElementById('currentTime');
const totalDurationDisplay = document.getElementById('totalDuration');
const addToPlaylistBtn = document.getElementById('addToPlaylistBtn');
const rightSidebarImg = document.getElementById('rightSidebarImg');
const rightSidebarTitle = document.getElementById('rightSidebarTitle');
const rightSidebarSubtitle = document.getElementById('rightSidebarSubtitle');

let audio = new Audio();
let isPlaying = false;
let currentSong = null;
let seekUpdateInterval;
let currentPlayingCard = null;
let currentPlaylist = [];
let currentPlaylistIndex = -1;
let shuffleMode = false;
let repeatMode = 0;
let originalPlaylistOrder = [];

const defaultHeaders = {
"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138 Safari/537.36",
"Referer": "https://www.jiosaavn.com/",
"Origin": "https://www.jiosaavn.com",
"Accept": "application/json"
};

const fs = require('fs');
const path = require('path');

function showWelcomeSlides() {
const slidesPath = path.join(__dirname, 'slides.json');
if (!fs.existsSync(slidesPath)) return;
const slidesData = JSON.parse(fs.readFileSync(slidesPath, 'utf8'));
let currentSlide = 0;
const backdrop = document.createElement('div');
backdrop.className = 'dialog-backdrop';
const dialog = document.createElement('div');
dialog.className = 'welcome-dialog';
function renderSlide() {
const slide = slidesData[currentSlide];
dialog.innerHTML = `
<div class="slide active">
<div class="slide-emoji">${slide.emoji}</div>
<div class="slide-title">${slide.title}</div>
<div class="slide-description">${slide.description}</div>
</div>
<div class="slide-controls">
<div class="slide-dots">
${slidesData.map((_, i) => `<div class="dot ${i === currentSlide ? 'active' : ''}"></div>`).join('')}
</div>
<div>
${currentSlide < slidesData.length - 1 ? 
`<button class="slide-nav-btn skip">Skip</button>
<button class="slide-nav-btn next">Next</button>` :
`<button class="slide-nav-btn finish">Get Started</button>`}
</div>
</div>
`;
const dots = dialog.querySelectorAll('.dot');
dots.forEach((dot, i) => {
dot.addEventListener('click', () => {
currentSlide = i;
renderSlide();
});
});
const nextBtn = dialog.querySelector('.next');
if (nextBtn) {
nextBtn.addEventListener('click', () => {
if (currentSlide < slidesData.length - 1) {
currentSlide++;
renderSlide();
}
});
}
const skipBtn = dialog.querySelector('.skip');
if (skipBtn) {
skipBtn.addEventListener('click', () => {
backdrop.remove();
dialog.remove();
});
}
const finishBtn = dialog.querySelector('.finish');
if (finishBtn) {
finishBtn.addEventListener('click', () => {
backdrop.remove();
dialog.remove();
});
}
}
renderSlide();
document.getElementById('welcomeSlidesContainer').appendChild(backdrop);
document.getElementById('welcomeSlidesContainer').appendChild(dialog);
}

window.addEventListener('DOMContentLoaded', () => {
showWelcomeSlides();
});

searchInput.addEventListener('input', async () => {
const query = searchInput.value.trim();
if (query.length === 0) {
dashboard.style.display = 'block';
const oldResults = document.getElementById('searchResults');
if (oldResults) oldResults.remove();
return;
}
try {
const response = await fetch(
`https://www.jiosaavn.com/api.php?__call=search.getResults&p=1&q=${encodeURIComponent(query)}&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=20`,
{ headers: defaultHeaders }
);
const text = await response.text();
const cleaned = text.replace(/^\)\]\}',?/, '');
const data = JSON.parse(cleaned);
const songs = data.results || [];
renderSearchResults(songs);
} catch (err) {
console.error('Search failed:', err);
}
});

function renderSearchResults(songs) {
dashboard.style.display = 'none';
const playlistView = document.getElementById('playlistView');
if (playlistView) playlistView.remove();
let resultsContainer = document.getElementById('searchResults');
if (resultsContainer) {
resultsContainer.innerHTML = '';
} else {
resultsContainer = document.createElement('section');
resultsContainer.id = 'searchResults';
resultsContainer.className = 'results-container';
mainContent.appendChild(resultsContainer);
}
if (songs.length === 0) {
resultsContainer.innerHTML = '<p class="empty-playlist-message">No results found.</p>';
return;
}
songs.forEach(song => {
const { title, subtitle, image, more_info } = song;
const encryptedUrl = more_info.encrypted_media_url;
const duration = more_info.duration;
const card = document.createElement('div');
card.className = 'song-card';
card.innerHTML = `
<div class="song-image-container">
<img src="${image.replace('150x150', '500x500')}" alt="${title}">
<div class="play-overlay">
<button class="play-button"></button>
</div>
</div>
<div class="song-info">
<div class="song-title">${title}</div>
<div class="song-subtitle">${subtitle}</div>
</div>
<button class="song-actions-btn">⋮</button>
`;
const playBtn = card.querySelector('.play-button');
playBtn.addEventListener('click', (e) => {
e.stopPropagation();
playSong({ title, subtitle, image, encryptedUrl, duration }, card);
});
const actionsBtn = card.querySelector('.song-actions-btn');
actionsBtn.addEventListener('click', (e) => {
e.stopPropagation();
showAddToPlaylistMenu({ title, subtitle, image, encryptedUrl, duration }, e);
});
resultsContainer.appendChild(card);
});
}

async function playSong(song, cardElement) {
if (currentSong && currentSong.encryptedUrl === song.encryptedUrl) {
togglePlayPause();
return;
}
if (currentPlayingCard) {
const oldBtn = currentPlayingCard.querySelector('.play-button');
if (oldBtn) oldBtn.classList.remove('playing');
}
currentSong = song;
currentPlayingCard = cardElement;
currentImg.src = song.image.replace('150x150', '500x500');
currentTitle.textContent = song.title;
currentSubtitle.textContent = song.subtitle;
rightSidebarImg.src = song.image.replace('150x150', '500x500');
rightSidebarTitle.textContent = song.title;
rightSidebarSubtitle.textContent = song.subtitle;
try {
const response = await fetch(
`https://www.jiosaavn.com/api.php?__call=song.generateAuthToken&url=${encodeURIComponent(song.encryptedUrl)}&bitrate=320&_format=json&ctx=web6dot0&_marker=0`,
{ headers: defaultHeaders }
);
const text = await response.text();
const cleaned = text.replace(/^\)\]\}',?/, '');
const data = JSON.parse(cleaned);
const audioUrl = data.auth_url;
audio.src = audioUrl;
audio.play();
isPlaying = true;
playPauseBtn.classList.add('playing');
if (cardElement) {
const playBtn = cardElement.querySelector('.play-button');
if (playBtn) playBtn.classList.add('playing');
}
clearInterval(seekUpdateInterval);
seekUpdateInterval = setInterval(updateSeekBar, 1000);
} catch (err) {
console.error('Failed to play song:', err);
}
}

function togglePlayPause() {
if (isPlaying) {
audio.pause();
isPlaying = false;
playPauseBtn.classList.remove('playing');
if (currentPlayingCard) {
const playBtn = currentPlayingCard.querySelector('.play-button');
if (playBtn) playBtn.classList.remove('playing');
}
} else {
audio.play();
isPlaying = true;
playPauseBtn.classList.add('playing');
if (currentPlayingCard) {
const playBtn = currentPlayingCard.querySelector('.play-button');
if (playBtn) playBtn.classList.add('playing');
}
}
}

function updateSeekBar() {
const currentTime = audio.currentTime;
const duration = audio.duration || 0;
if (duration > 0) {
seekBar.value = (currentTime / duration) * 100;
currentTimeDisplay.textContent = formatTime(currentTime);
totalDurationDisplay.textContent = formatTime(duration);
}
}

function formatTime(seconds) {
const mins = Math.floor(seconds / 60);
const secs = Math.floor(seconds % 60);
return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

playPauseBtn.addEventListener('click', togglePlayPause);

seekBar.addEventListener('input', () => {
const duration = audio.duration || 0;
audio.currentTime = (seekBar.value / 100) * duration;
updateSeekBar();
});

audio.addEventListener('ended', () => {
if (repeatMode === 2) {
audio.currentTime = 0;
audio.play();
} else {
playNextSong();
}
});

homeBtn.addEventListener('click', () => {
searchInput.value = '';
dashboard.style.display = 'block';
const oldResults = document.getElementById('searchResults');
if (oldResults) oldResults.remove();
const playlistView = document.getElementById('playlistView');
if (playlistView) playlistView.remove();
});

addToPlaylistBtn.addEventListener('click', (e) => {
if (currentSong) {
showAddToPlaylistMenu(currentSong, e);
}
});

shuffleBtn.addEventListener('click', () => {
shuffleMode = !shuffleMode;
if (shuffleMode) {
shuffleBtn.classList.add('active');
shufflePlaylist();
} else {
shuffleBtn.classList.remove('active');
unshufflePlaylist();
}
});

repeatBtn.addEventListener('click', () => {
repeatMode = (repeatMode + 1) % 3;
if (repeatMode === 0) {
repeatBtn.classList.remove('active');
repeatBtn.textContent = '⟲';
} else if (repeatMode === 1) {
repeatBtn.classList.add('active');
repeatBtn.textContent = '⟲';
} else {
repeatBtn.classList.add('active');
repeatBtn.textContent = '🔂';
}
});

prevBtn.addEventListener('click', () => {
playPreviousSong();
});

nextBtn.addEventListener('click', () => {
playNextSong();
});

function playNextSong() {
if (currentPlaylist.length === 0) return;
if (currentPlaylistIndex < currentPlaylist.length - 1) {
currentPlaylistIndex++;
const nextSong = currentPlaylist[currentPlaylistIndex];
playSong(nextSong.song, nextSong.card);
} else {
if (repeatMode === 1) {
currentPlaylistIndex = 0;
const nextSong = currentPlaylist[currentPlaylistIndex];
playSong(nextSong.song, nextSong.card);
} else {
audio.pause();
isPlaying = false;
playPauseBtn.classList.remove('playing');
if (currentPlayingCard) {
const playBtn = currentPlayingCard.querySelector('.play-button');
if (playBtn) playBtn.classList.remove('playing');
}
}
}
}

function playPreviousSong() {
if (currentPlaylist.length === 0) return;
if (currentPlaylistIndex > 0) {
currentPlaylistIndex--;
const prevSong = currentPlaylist[currentPlaylistIndex];
playSong(prevSong.song, prevSong.card);
}
}

function shufflePlaylist() {
if (currentPlaylist.length === 0) return;
originalPlaylistOrder = [...currentPlaylist];
const currentSongData = currentPlaylist[currentPlaylistIndex];
const remaining = currentPlaylist.filter((_, idx) => idx !== currentPlaylistIndex);
for (let i = remaining.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[remaining[i], remaining[j]] = [remaining[j], remaining[i]];
}
currentPlaylist = [currentSongData, ...remaining];
currentPlaylistIndex = 0;
}

function unshufflePlaylist() {
if (originalPlaylistOrder.length === 0) return;
const currentSongData = currentPlaylist[currentPlaylistIndex];
currentPlaylist = [...originalPlaylistOrder];
currentPlaylistIndex = currentPlaylist.findIndex(item => item.song.encryptedUrl === currentSongData.song.encryptedUrl);
if (currentPlaylistIndex === -1) currentPlaylistIndex = 0;
}
