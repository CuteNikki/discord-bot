import { WEATHER_API_URL } from 'constants/weather';

import type { CurrentWeatherWrapper, HistoricWeatherWrapper, WeatherForecastWrapper } from 'types/weather';

import { keys } from 'constants/keys';
import { logger } from 'utils/logger';

/**
 * Gets the current weather for a given location
 * @param {string} location - The location to get the weather for
 * @returns {Promise<CurrentWeatherWrapper | null>} The current weather for the given location
 */
export async function getCurrentWeather(location: string): Promise<CurrentWeatherWrapper | null> {
  const url = new URL(`${WEATHER_API_URL}/current.json`);
  url.searchParams.append('key', keys.WEATHER_API_KEY);
  url.searchParams.append('q', location);
  url.searchParams.append('aqi', 'yes');

  const response = await fetch(url.href).catch((err) => logger.debug({ err, location }, 'Could not fetch weather'));
  if (!response?.ok) return null;

  const data = await response.json();
  if (!data.location) return null;

  return data;
}

export async function getWeatherForecast(location: string, days: string = '1'): Promise<WeatherForecastWrapper | null> {
  const url = new URL(`${WEATHER_API_URL}/forecast.json`);
  url.searchParams.append('key', keys.WEATHER_API_KEY);
  url.searchParams.append('days', days);
  url.searchParams.append('q', location);
  url.searchParams.append('aqi', 'yes');

  const response = await fetch(url.href).catch((err) => logger.debug({ err, location }, 'Could not fetch weather'));
  if (!response?.ok) return null;

  const data = await response.json();
  if (!data.location) return null;

  return data;
}

export async function getHistoricWeather(location: string, date: string): Promise<HistoricWeatherWrapper | null> {
  const url = new URL(`${WEATHER_API_URL}/history.json`);
  url.searchParams.append('key', keys.WEATHER_API_KEY);
  url.searchParams.append('q', location);
  url.searchParams.append('dt', date);

  const response = await fetch(url.href).catch((err) => logger.debug({ err, location }, 'Could not fetch weather'));
  if (!response?.ok) return null;

  const data = await response.json();
  if (!data.location) return null;

  return data;
}
