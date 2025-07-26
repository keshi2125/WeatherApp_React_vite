import React, { useEffect, useState } from 'react';
import WeatherBackground from './assets/components/WeatherBackground';
import { convertTemperature, getVisibilityValue, getHumidityValue, getWindDirection } from './assets/components/Helper';
import { HumidityIcon, VisibilityIcon, WindIcon, SunriseIcon, SunsetIcon } from './assets/components/Icons';

export const App = () => {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState('');
  const API_KEY = '361680719be71c08f95b0321f1233021';
  const [suggestions, setSuggestions] = useState([]);
  const [unit, setUnit] = useState('C');
  const [error, setError] = useState('');

  // For forecast API, current weather is in list[0], city info in city
  const current = weather && weather.list && weather.list[0];
  const cityInfo = weather && weather.city;

  useEffect(() => {
    if ((city || '').trim().length >= 3 && !weather) {
      const timer = setTimeout(() => fetchSuggestions(city), 500);
      return () => clearTimeout(timer);
    }
    setSuggestions([]);
  }, [city, weather]);

  const fetchSuggestions = async (query) => {
    try {
      const res = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`);
      res.ok ? setSuggestions(await res.json()) : setSuggestions([]);
    } catch {
      setSuggestions([]);
    }
  };

  const fetchWeatherData = async (url, name = '') => {
    setError('');
    setWeather(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error((await response.json()).message || 'City not found');
      const data = await response.json();
      setWeather(data);
      setCity(name || data.city?.name || '');
      setSuggestions([]);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!city.trim()) return setError("Please enter a valid city name.");
    await fetchWeatherData(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city.trim()}&appid=${API_KEY}&units=metric`
    );
  };

  // For background, use first weather in forecast if available
  const getWeatherCondition = () =>
    current && current.weather && current.weather[0] && cityInfo
      ? {
          main: current.weather[0].main,
          isDay:
            Date.now() / 1000 > cityInfo.sunrise &&
            Date.now() / 1000 < cityInfo.sunset
        }
      : null;

  return (
    <div className="min-h-screen">
      <WeatherBackground condition={getWeatherCondition()} />
      <div className="flex items-center justify-center p-6 min-h-screen">
        <div className="bg-transparent backdrop-filter backdrop-blur-md rounded-xl shadow-2xl p-8 max-w-md text-white w-full border border-white/30 relative z-10">
          <h1 className="text-4xl font-extrabold text-center mb-6">
            Weather App
          </h1>

          {!weather ? (
            <form onSubmit={handleSearch} className="flex flex-col relative">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter City or Country (min 2 letters)"
                className="mb-4 p-3 rounded border border-white bg-transparent text-white placeholder-white focus:outline-none focus:border-blue-300 transition duration-300"
              />
              {suggestions.length > 0 && (
                <div className="absolute top-12 left-0 right-0 bg-transparent shadow-md rounded z-10">
                  {suggestions.map((s,idx) => (
                    <button
                      type="button"
                      key={`${s.lat}-${s.lon}-${s.name}-${s.country}-${s.state || ''}-${idx}`}
                      onClick={() =>
                        fetchWeatherData(
                          `https://api.openweathermap.org/data/2.5/forecast?lat=${s.lat}&lon=${s.lon}&appid=${API_KEY}&units=metric`,
                          `${s.name},${s.country}${s.state ? `,${s.state}` : ''}`
                        )
                      }
                      className="block hover:bg-blue-700 bg-transparent px-4 py-2 text-sm text-left w-full transition-colors"
                    >
                      {s.name}, {s.country} {s.state && `, ${s.state}`}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="submit"
                className="bg-purple-700 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                Get Weather
              </button>
            </form>
          ) : (
            <div className="mt-6 text-center transition-opacity duration-500">
              <button
                onClick={() => {
                  setWeather(null);
                  setCity('');
                }}
                className="mb-4 bg-purple-900 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded transition-colors"
              >
                New Search
              </button>

              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">{cityInfo?.name || city}</h2>
                <button
                  onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-1 px-3 rounded transition-colors"
                >
                  &deg;{unit}
                </button>
              </div>
              {current && current.weather && current.weather[0] && (
                <img
                  src={`https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`}
                  alt={current.weather[0].description}
                  className="mx-auto my-4 animate-bounce"
                />
              )}
              <p className="text-4xl">
                {current && current.main
                  ? `${convertTemperature(current.main.temp, unit)} °${unit}`
                  : '--'}
              </p>
              <p className="capitalize">
                {current && current.weather && current.weather[0]
                  ? current.weather[0].description
                  : '--'}
              </p>
              <div className="flex flex-wrap justify-around mt-6">
                {[
                  [
                    HumidityIcon,
                    'Humidity',
                    current && current.main && current.main.humidity !== undefined
                      ? `${current.main.humidity}% (${getHumidityValue(current.main.humidity)})`
                      : '--'
                  ],
                  [
                    WindIcon,
                    'Wind',
                    current && current.wind && current.wind.speed !== undefined
                      ? `${current.wind.speed} m/s ${current.wind.deg ? `(${getWindDirection(current.wind.deg)})` : ''}`
                      : '--'
                  ],
                  [
                    VisibilityIcon,
                    'Visibility',
                    current && current.visibility !== undefined
                      ? getVisibilityValue(current.visibility)
                      : '--'
                  ]
                ].map(([Icon, label, value]) => (
                  <div key={label} className="flex flex-col items-center m-2">
                    <Icon />
                    <p className="mt-1 font-semibold">{label}</p>
                    <p className="text-sm">{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap justify-around mt-6">
                {[
                  [SunriseIcon, 'Sunrise', cityInfo && cityInfo.sunrise],
                  [SunsetIcon, 'Sunset', cityInfo && cityInfo.sunset]
                ].map(([Icon, label, time]) => (
                  <div key={label} className="flex flex-col items-center m-2">
                    <Icon />
                    <p className="mt-1 font-semibold">{label}</p>
                    <p className="text-sm">
                      {time
                        ? new Date(time * 1000).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '--'}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-sm">
                <p>
                  <strong>Feel Like:</strong>{' '}
                  {current && current.main && current.main.feels_like !== undefined
                    ? `${convertTemperature(current.main.feels_like, unit)} °${unit}`
                    : '--'}
                </p>
                <p>
                  <strong>Pressure:</strong>{' '}
                  {current && current.main && current.main.pressure !== undefined
                    ? `${current.main.pressure} hPa`
                    : '--'}
                </p>
              </div>
            </div>
          )}
          {error && <p className="text-red-400 text-center mt-4">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default App;
/*import React, { useEffect, useState } from 'react';
import WeatherBackground from './assets/components/WeatherBackground';
import { convertTemperature, getVisibilityValue, getHumidityValue, getWindDirection } from './assets/components/Helper';
import { HumidityIcon, VisibilityIcon, WindIcon, SunriseIcon, SunsetIcon } from './assets/components/Icons';

export const App = () => {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState('');
  const API_KEY = '361680719be71c08f95b0321f1233021';
  const [suggestions, setSuggestions] = useState([]);
  const [unit, setUnit] = useState('C');
  const [error, setError] = useState('');
  const current = weather && weather.list && weather.list[0];
 const cityInfo = weather && weather.city;

  useEffect(() => {
    if (city.trim().length >= 3 && !weather) {
      const timer = setTimeout(() => fetchSuggestions(city));
      return () => clearTimeout(timer);
    }
    setSuggestions([]);
  }, [city, weather]);

  const fetchSuggestions = async (query) => {
    try {
      const res = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`);
      res.ok ? setSuggestions(await res.json()) : setSuggestions([]);
    } catch {
      setSuggestions([]);
    }
  };

  const fetchWeatherData = async (url, name = '') => {
    setError('');
    setWeather(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error((await response.json()).message || 'City not found');
      const data = await response.json();
      setWeather(data);
      setCity(name || data.name);
      setSuggestions([]);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!city.trim()) return setError("Please enter a valid city name.");
    await fetchWeatherData(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city.trim()}&appid=${API_KEY}&units=metric`
    );
  };

  const getWeatherCondition = () =>
    weather && weather.weather && weather.weather[0] && weather.sys
      ? {
          main: weather.weather[0].main,
          isDay:
            Date.now() / 1000 > weather.sys.sunrise &&
            Date.now() / 1000 < weather.sys.sunset
        }
      : null;

  return (
    <div className="min-h-screen">
      <WeatherBackground condition={getWeatherCondition()} />
      <div className="flex items-center justify-center p-6 min-h-screen">
        <div className="bg-transparent backdrop-filter backdrop-blur-md rounded-xl shadow-2xl p-8 max-w-md text-white w-full border border-white/30 relative z-10">
          <h1 className="text-4xl font-extrabold text-center mb-6">
            Weather App
          </h1>

          {!weather ? (
            <form onSubmit={handleSearch} className="flex flex-col relative">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter City or Country (min 2 letters)"
                className="mb-4 p-3 rounded border border-white bg-transparent text-white placeholder-white focus:outline-none focus:border-blue-300 transition duration-300"
              />
              {suggestions.length > 0 && (
                <div className="absolute top-12 left-0 right-0 bg-transparent shadow-md rounded z-10">
                  {suggestions.map((s) => (
                    <button
                      type="button"
                      key={``}
                      onClick={() =>
                        fetchWeatherData(
                          `https://api.openweathermap.org/data/2.5/forecast?lat=${s.lat}&lon=${s.lon}&appid=${API_KEY}&units=metric`,
                          `${s.name},${s.country}${s.state ? `,${s.state}` : ''}`
                        )
                      }
                      className="block hover:bg-blue-700 bg-transparent px-4 py-2 text-sm text-left w-full transition-colors"
                    >
                      {s.name}, {s.country} {s.state && `, ${s.state}`}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="submit"
                className="bg-purple-700 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                Get Weather
              </button>
            </form>
          ) : (
            <div className="mt-6 text-center transition-opacity duration-500">
              <button
                onClick={() => {
                  setWeather(null);
                  setCity('');
                }}
                className="mb-4 bg-purple-900 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded transition-colors"
              >
                New Search
              </button>

              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">{weather.name}</h2>
                <button
                  onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-1 px-3 rounded transition-colors"
                >
                  &deg;{unit}
                </button>
              </div>
              {weather.weather && weather.weather[0] && (
                <img
                  src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                  alt={weather.weather[0].description}
                  className="mx-auto my-4 animate-bounce"
                />
              )}
             
            </div>
          )}
          
       



<p className="text-4xl">
  {current && current.main
    ? `${convertTemperature(current.main.temp, unit)} °${unit}`
    : '--'}
</p>
<p className="capitalize">
  {current && current.weather && current.weather[0]
    ? current.weather[0].description
    : '--'}
</p>
<div className="flex flex-wrap justify-around mt-6">
  {[
    [
      HumidityIcon,
      'Humidity',
      current && current.main && current.main.humidity !== undefined
        ? `${current.main.humidity}% (${getHumidityValue(current.main.humidity)})`
        : '--'
    ],
    [
      WindIcon,
      'Wind',
      current && current.wind && current.wind.speed !== undefined
        ? `${current.wind.speed} m/s ${current.wind.deg ? `(${getWindDirection(current.wind.deg)})` : ''}`
        : '--'
    ],
    [
      VisibilityIcon,
      'Visibility',
      current && current.visibility !== undefined
        ? getVisibilityValue(current.visibility)
        : '--'
    ]
  ].map(([Icon, label, value]) => (
    <div key={label} className="flex flex-col items-center m-2">
      <Icon />
      <p className="mt-1 font-semibold">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  ))}
</div>
<div className="flex flex-wrap justify-around mt-6">
  {[
    [SunriseIcon, 'Sunrise', cityInfo && cityInfo.sunrise],
    [SunsetIcon, 'Sunset', cityInfo && cityInfo.sunset]
  ].map(([Icon, label, time]) => (
    <div key={label} className="flex flex-col items-center m-2">
      <Icon />
      <p className="mt-1 font-semibold">{label}</p>
      <p className="text-sm">
        {time
          ? new Date(time * 1000).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit'
            })
          : '--'}
      </p>
    </div>
  ))}
</div>
<div className="mt-6 text-sm">
  <p>
    <strong>Feel Like:</strong>{' '}
    {current && current.main && current.main.feels_like !== undefined
      ? `${convertTemperature(current.main.feels_like, unit)} °${unit}`
      : '--'}
  </p>
  <p>
    <strong>Pressure:</strong>{' '}
    {current && current.main && current.main.pressure !== undefined
      ? `${current.main.pressure} hPa`
      : '--'}
  </p>
</div>
          {error && <p className="text-red-400 text-center mt-4">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default App;*/



















