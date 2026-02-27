// Replace with your own OpenWeatherMap API key
const API_KEY = 'YOUR_API_KEY_HERE';   // ←←← change this!

function WeatherApp(apiKey) {
  this.apiKey = apiKey;
  this.apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
  this.forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';

  this.searchBtn = document.getElementById('search-btn');
  this.cityInput = document.getElementById('city-input');
  this.weatherDisplay = document.getElementById('weather-display');
  this.recentSearchesSection = document.getElementById('recent-searches-section');
  this.recentSearchesContainer = document.getElementById('recent-searches-container');
  this.clearBtn = document.getElementById('clear-history-btn');

  this.recentSearches = [];
  this.maxRecentSearches = 5;

  this.init();
}

WeatherApp.prototype.init = function() {
  this.searchBtn.addEventListener('click', this.handleSearch.bind(this));
  this.cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') this.handleSearch();
  });

  if (this.clearBtn) {
    this.clearBtn.addEventListener('click', this.clearHistory.bind(this));
  }

  this.loadRecentSearches();
  this.loadLastCity();
};

WeatherApp.prototype.handleSearch = function() {
  const city = this.cityInput.value.trim();
  if (!city) return;
  this.getWeather(city);
};

WeatherApp.prototype.getWeather = async function(city) {
  this.showLoading();
  this.searchBtn.disabled = true;
  this.searchBtn.textContent = 'Searching...';

  const currentUrl = `${this.apiUrl}?q=${city}&appid=${this.apiKey}&units=metric`;
  const forecastUrl = `${this.forecastUrl}?q=${city}&appid=${this.apiKey}&units=metric`;

  try {
    const [currentRes, forecastRes] = await Promise.all([
      axios.get(currentUrl),
      axios.get(forecastUrl)
    ]);

    this.displayWeather(currentRes.data);
    this.displayForecast(forecastRes.data);

    this.saveRecentSearch(city);
    localStorage.setItem('lastCity', city);

  } catch (err) {
    console.error(err);
    const msg = err.response?.status === 404 
      ? 'City not found. Please check spelling.'
      : 'Something went wrong. Try again later.';
    this.showError(msg);
  } finally {
    this.searchBtn.disabled = false;
    this.searchBtn.textContent = 'Search';
  }
};

WeatherApp.prototype.displayWeather = function(data) {
  const icon = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  const html = `
    <div class="card">
      <h2>${data.name}, ${data.sys.country}</h2>
      <img src="${icon}" alt="${data.weather[0].description}">
      <p><strong>${Math.round(data.main.temp)}°C</strong></p>
      <p>${data.weather[0].description}</p>
      <p>Humidity: ${data.main.humidity}%</p>
      <p>Wind: ${data.wind.speed} m/s</p>
    </div>
  `;
  this.weatherDisplay.innerHTML = html;
};

WeatherApp.prototype.displayForecast = function(data) {
  let forecastHTML = '<h3>5-Day Forecast</h3><div class="forecast-container">';
  
  // Take one reading per day (approx every 8th item = ~24h)
  for (let i = 0; i < data.list.length; i += 8) {
    const day = data.list[i];
    const icon = `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`;
    const date = new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    forecastHTML += `
      <div class="card">
        <p><strong>${date}</strong></p>
        <img src="${icon}" alt="">
        <p>${Math.round(day.main.temp)}°C</p>
        <p>${day.weather[0].description}</p>
      </div>
    `;
  }

  forecastHTML += '</div>';
  this.weatherDisplay.innerHTML += forecastHTML;
};

WeatherApp.prototype.saveRecentSearch = function(city) {
  let searches = JSON.parse(localStorage.getItem('recentSearches')) || [];
  const cityTitle = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

  searches = searches.filter(c => c !== cityTitle);
  searches.unshift(cityTitle);

  if (searches.length > this.maxRecentSearches) {
    searches = searches.slice(0, this.maxRecentSearches);
  }

  localStorage.setItem('recentSearches', JSON.stringify(searches));
  this.recentSearches = searches;
  this.displayRecentSearches();
};

WeatherApp.prototype.loadRecentSearches = function() {
  const saved = localStorage.getItem('recentSearches');
  if (saved) {
    this.recentSearches = JSON.parse(saved);
    this.displayRecentSearches();
  }
};

WeatherApp.prototype.displayRecentSearches = function() {
  this.recentSearchesContainer.innerHTML = '';

  if (this.recentSearches.length === 0) {
    this.recentSearchesSection.style.display = 'none';
    return;
  }

  this.recentSearchesSection.style.display = 'block';

  this.recentSearches.forEach(city => {
    const btn = document.createElement('button');
    btn.className = 'recent-search-btn';
    btn.textContent = city;
    btn.addEventListener('click', () => {
      this.cityInput.value = city;
      this.getWeather(city);
    });
    this.recentSearchesContainer.appendChild(btn);
  });
};

WeatherApp.prototype.loadLastCity = function() {
  const lastCity = localStorage.getItem('lastCity');
  if (lastCity) {
    this.cityInput.value = lastCity;
    this.getWeather(lastCity);
  } else {
    this.showWelcome();
  }
};

WeatherApp.prototype.showWelcome = function() {
  this.weatherDisplay.innerHTML = `
    <div class="welcome-message">
      <h2>Welcome to SkyFetch! 🌍</h2>
      <p>Search for a city to get current weather and 5-day forecast.</p>
      <p>Examples: London, Tokyo, New York, Berlin</p>
    </div>
  `;
};

WeatherApp.prototype.showLoading = function() {
  this.weatherDisplay.innerHTML = '<p class="welcome-message">Loading weather data...</p>';
};

WeatherApp.prototype.showError = function(msg) {
  this.weatherDisplay.innerHTML = `<p class="error-message" style="color:#ffcccc;">${msg}</p>`;
};

WeatherApp.prototype.clearHistory = function() {
  if (confirm('Clear all recent searches?')) {
    this.recentSearches = [];
    localStorage.removeItem('recentSearches');
    localStorage.removeItem('lastCity');
    this.displayRecentSearches();
    this.showWelcome();
  }
};

// Start the app
const app = new WeatherApp(API_KEY);