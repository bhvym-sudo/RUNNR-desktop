const searchInput = document.getElementById('searchInput');
const mainContent = document.getElementById('mainContent');
const dashboard = document.getElementById('dashboard');
const homeBtn = document.getElementById('homeBtn');

homeBtn.addEventListener('click', () => {
  const resultsContainer = document.getElementById('searchResults');
  if (resultsContainer) resultsContainer.remove();
  searchInput.value = '';
  dashboard.style.display = 'block';
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
    const response = await fetch(`https://www.jiosaavn.com/api.php?p=1&q=${encodeURIComponent(query)}&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=20&__call=search.getResults`, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': `https://www.jiosaavn.com/search/song/${encodeURIComponent(query)}`,
      }
    });

    const text = await response.text();
    const cleaned = text.replace(/^\)\]\}',?/, '');
    const data = JSON.parse(cleaned);
    const songs = data?.results || [];
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
    const card = document.createElement('div');
    card.className = 'song-card';
    card.innerHTML = `
      <img src="${song.image}" alt="Album Art" />
      <div class="song-info">
        <div class="song-title">${song.title}</div>
        <div class="song-subtitle">${song.subtitle}</div>
      </div>
      <div class="song-duration">${formatDuration(song.more_info?.duration)}</div>
    `;

    resultsContainer.appendChild(card);
  });
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

