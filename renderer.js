const searchInput = document.getElementById('searchInput');
const mainContent = document.getElementById('mainContent');
const dashboard = document.getElementById('dashboard');
const homeBtn = document.getElementById('homeBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const seekBar = document.getElementById('seekBar');
const currentImg = document.getElementById('currentImg');
const currentTitle = document.getElementById('currentTitle');
const currentSubtitle = document.getElementById('currentSubtitle');
const currentTimeDisplay = document.getElementById('currentTime');
const totalDurationDisplay = document.getElementById('totalDuration');

let audio = new Audio();
let isPlaying = false;
let currentSong = null;
let seekUpdateInterval;

searchInput.addEventListener('input', async () => {
  const query = searchInput.value.trim();
  if (query.length === 0) {
    dashboard.style.display = 'block';
    const oldResults = document.getElementById('searchResults');
    if (oldResults) oldResults.remove();
    return;
  }

  try {
    const response = await fetch(`https://www.jiosaavn.com/api.php?__call=search.getResults&p=1&q=${encodeURIComponent(query)}&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=20`);
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
    resultsContainer.innerHTML = '<p>No results found.</p>';
    return;
  }

  songs.forEach(song => {
    const { title, subtitle, image, more_info } = song;
    const encryptedUrl = more_info.encrypted_media_url;
    const duration = more_info.duration;

    const card = document.createElement('div');
    card.className = 'song-card';
    card.innerHTML = `
      <img src="${image}" alt="Album Art" />
      <div class="song-info">
        <div class="song-title">${title}</div>
        <div class="song-subtitle">${subtitle}</div>
      </div>
      <div style="font-size: 12px; color: #ccc;">${formatDuration(duration)}</div>
    `;

    card.addEventListener('click', () => {
      playSong(encryptedUrl, { title, subtitle, image, duration });
    });

    resultsContainer.appendChild(card);
  });
}

async function playSong(encryptedUrl, meta) {
  try {
    const response = await fetch(`https://www.jiosaavn.com/api.php?__call=song.generateAuthToken&url=${encodeURIComponent(encryptedUrl)}&bitrate=320&api_version=4&_format=json&ctx=web6dot0&_marker=0`);
    const text = await response.text();
    const cleaned = text.replace(/^\)\]\}',?/, '');
    const data = JSON.parse(cleaned);
    let streamUrl = data.auth_url;
    if (streamUrl) {
      streamUrl = streamUrl.split('?')[0].replace('ac.cf.saavncdn.com', 'aac.saavncdn.com');
    }

    audio.src = streamUrl;
    audio.play();
    isPlaying = true;
    playPauseBtn.textContent = '⏸';

    currentImg.src = meta.image;
    currentTitle.textContent = meta.title;
    currentSubtitle.textContent = meta.subtitle;
    seekBar.value = 0;
    seekBar.max = meta.duration;
    currentTimeDisplay.textContent = '0:00';
    totalDurationDisplay.textContent = formatDuration(meta.duration);

    if (seekUpdateInterval) clearInterval(seekUpdateInterval);
    seekUpdateInterval = setInterval(updateSeekBar, 500);
  } catch (err) {
    console.error('Failed to stream:', err);
  }
}

playPauseBtn.addEventListener('click', () => {
  if (!audio.src) return;
  if (audio.paused) {
    audio.play();
    isPlaying = true;
    playPauseBtn.textContent = '⏸';
  } else {
    audio.pause();
    isPlaying = false;
    playPauseBtn.textContent = '▶';
  }
});

seekBar.addEventListener('input', () => {
  if (!audio.duration) return;
  audio.currentTime = seekBar.value;
});

function updateSeekBar() {
  if (!audio.duration) return;
  seekBar.value = audio.currentTime;
  currentTimeDisplay.textContent = formatDuration(Math.floor(audio.currentTime));
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

homeBtn?.addEventListener('click', () => {
  dashboard.style.display = 'block';
  const searchResults = document.getElementById('searchResults');
  if (searchResults) searchResults.remove();
  searchInput.value = '';
});
