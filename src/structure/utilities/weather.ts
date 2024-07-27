import { keys } from 'utils/keys';
import { logger } from 'utils/logger';

const API_KEY = keys.WEATHER_API_KEY;
const API_URL = 'http://api.weatherapi.com/v1';

export async function getCurrentWeather(location: string): Promise<CurrentWeatherWrapper | null> {
  const url = new URL(`${API_URL}/current.json`);
  url.searchParams.append('key', API_KEY);
  url.searchParams.append('q', location);
  url.searchParams.append('aqi', 'yes');

  const res = await fetch(url.href).catch((error) => logger.debug({ error }, 'Could not fetch weather'));
  if (!res) return null;

  const data = await res.json();
  if (!data.location) return null;

  return data;
}

export async function getWeatherForecast(location: string, days: string = '1'): Promise<WeatherForecastWrapper | null> {
  const url = new URL(`${API_URL}/forecast.json`);
  url.searchParams.append('key', API_KEY);
  url.searchParams.append('days', days);
  url.searchParams.append('q', location);
  url.searchParams.append('aqi', 'yes');

  const res = await fetch(url.href).catch((error) => logger.debug({ error }, 'Could not fetch weather'));
  if (!res) return null;

  const data = await res.json();
  if (!data.location) return null;

  return data;
}

export async function getHistoricWeather(location: string, date: string): Promise<HistoricWeatherWrapper | null> {
  const url = new URL(`${API_URL}/history.json`);
  url.searchParams.append('key', API_KEY);
  url.searchParams.append('q', location);
  url.searchParams.append('dt', date);

  const res = await fetch(url.href).catch((error) => logger.debug({ error }, 'Could not fetch weather'));
  if (!res) return null;

  const data = await res.json();
  if (!data.location) return null;

  return data;
}

// 16-wind compass
export const compass = {
  NNW: 'North-Northwest',
  NW: 'Northwest',
  N: 'North',
  NNE: 'North-Northeast',
  ENE: 'East-Northeast',
  NE: 'Northeast',
  E: 'East',
  ESE: 'East-Southeast',
  SE: 'Southeast',
  SSE: 'South-Southeast',
  S: 'South',
  SSW: 'South-Southwest',
  SW: 'Southwest',
  WSW: 'West-Southwest',
  W: 'West',
  WNW: 'West-Northwest',
};
// US EPA Index
export const epaIndex = {
  1: '1 - Good (0-15 PM2.5 µg/m3)',
  2: '2 - Moderate (16-40 PM2.5 µg/m3)',
  3: '3 - Unhealthy for sensitive (41-65 PM2.5 µg/m3)',
  4: '4 - Unhealthy (66-150 PM2.5 µg/m3)',
  5: '5 - Very Unhealthy (151-250 PM2.5 µg/m3)',
  6: '6 - Hazardous (251+ PM2.5 µg/m3)',
};
// UK Defra Index
export const defraIndex = {
  1: '1 - Low (0-11 PM2.5 µg/m3)',
  2: '2 - Low (12-23 PM2.5 µg/m3)',
  3: '3 - Low (24-35 PM2.5 µg/m3)',
  4: '4 - Moderate (36-41 PM2.5 µg/m3)',
  5: '5 - Moderate (42-47 PM2.5 µg/m3)',
  6: '6 - Moderate (48-53 PM2.5 µg/m3)',
  7: '7 - High (54-58 PM2.5 µg/m3)',
  8: '8 - High (59-64 PM2.5 µg/m3)',
  9: '9 - High (65-70 PM2.5 µg/m3)',
  10: '10 - Very High (71+ PM2.5 µg/m3)',
};
// UV Index (Highest recorded UV Index was 43,3)
export const uvIndex = {
  1: '1 - Low',
  2: '2 - Low',
  3: '3 - Moderate',
  4: '4 - Moderate',
  5: '5 - Moderate',
  6: '6 - High',
  7: '7 - High',
  8: '8 - Very High',
  9: '9 - Very High',
  10: '10 - Very High',
  11: '11 - Extreme',
  12: '11+ - Extreme',
  13: '11+ - Extreme',
  14: '11+ - Extreme',
  15: '11+ - Extreme',
  16: '11+ - Extreme',
  17: '11+ - Extreme',
  18: '11+ - Extreme',
  19: '11+ - Extreme',
  20: '11+ - Extreme',
  21: '11+ - Extreme',
  22: '11+ - Extreme',
  23: '11+ - Extreme',
  24: '11+ - Extreme',
  25: '11+ - Extreme',
  26: '11+ - Extreme',
  27: '11+ - Extreme',
  28: '11+ - Extreme',
  29: '11+ - Extreme',
  30: '11+ - Extreme',
  31: '11+ - Extreme',
  32: '11+ - Extreme',
  33: '11+ - Extreme',
  34: '11+ - Extreme',
  35: '11+ - Extreme',
  36: '11+ - Extreme',
  37: '11+ - Extreme',
  38: '11+ - Extreme',
  39: '11+ - Extreme',
  40: '11+ - Extreme',
  41: '11+ - Extreme',
  42: '11+ - Extreme',
  43: '11+ - Extreme',
  44: '11+ - Extreme',
  45: '11+ - Extreme',
  46: '11+ - Extreme',
  47: '11+ - Extreme',
  48: '11+ - Extreme',
  49: '11+ - Extreme',
  50: '11+ - Extreme',
};

interface Location {
  name: string; //                                              Name:   "London"
  region: string; //                                          Region:   "City of London, Greater London"
  country: string; //                                        Country:   "United Kingdom"
  lat: number; //                                           Latitude:   51.52
  lon: number; //                                          Longitude:   -0.11
  tz_id: string; //                                   Time zone name:   "Europe/London"
  localtime_epoch: number; //       Local date and time in unix time:   1714070038
  localtime: string; //                                   Local time:   "2024-04-25 19:33"
}
interface Astro {
  sunrise: string; //                                  Sunrise time:   "05:43 AM"
  sunset: string; //                                    Sunset time:   "08:14 PM"
  moonset: string; //                                  Moonset time:   "10:33 PM"
  moon_illumination: number; //        Moon illumination as percent:   99
  moon_phase: string; //                                Moon phases:   "Waning Gibbous"
  // (New Moon, Waxing Crescent, First Quarter, Waxing Gibbous, Full Moon, Waning Gibbous, Last Quarter, Waning Crescent)
}
interface WeatherCondition {
  text: string;
  icon: string;
  code: number;
}
interface AirQuality {
  co: number; //                             Carbon Monoxide (μg/m3):   260.4
  o3: number; //                                       Ozone (μg/m3):   31.5
  no2: number; //                           Nitrogen dioxide (μg/m3):   53.6
  so2: number; //                            Sulphur dioxide (μg/m3):   11:2
  pm2_5: number; //                                    PM2.5 (μg/m3):   3.4
  pm10: number; //                                      PM10 (μg/m3):   4
  /**
   *                        US - EPA standard.
   *                         1 means                             Good
   *                         2 means                         Moderate
   *                         3 means    Unhealthy for sensitive group
   *                         4 means                        Unhealthy
   *                         5 means                   Very Unhealthy
   *                         6 means                        Hazardous
   */
  'us-epa-index': keyof typeof epaIndex; //             US EPA Index:   1
  /**
   *                        UK - Defra Index
   *                         1 Low                         0-11 µgm-3
   *                         2 Low                        12-23 µgm-3
   *                         3 Low                        24-35 µgm-3
   *                         4 Moderate                   36-41 µgm-3
   *                         5 Moderate                   42-47 µgm-3
   *                         6 Moderate                   48-53 µgm-3
   *                         7 High                       54-58 µgm-3
   *                         8 High                       59-64 µgm-3
   *                         9 High                       65-70 µgm-3
   *                         10 Very High                   71+ µgm-3
   */
  'gb-defra-index': keyof typeof defraIndex; //       UK Defra Index:   1
}
interface CurrentWeather {
  last_updated: string; //                              Last updated:   "2024-04-25 19:30"
  last_updated_epoch: number; //           Last updated in unix time:   1714069800
  temp_c: number; //                          Temperature in Celsius:   8.1
  temp_f: number; //                       Temperature in Fahrenheit:   46.6
  is_day: number; //              Day or night icon (1 = Yes 0 = No):   1
  condition: WeatherCondition;
  wind_mph: number; //                 Wind speed in miles per hour:   2.2
  wind_kph: number; //            Wind speed in kilometers per hour:   3.6
  wind_degree: number; //                               Wind degree:   34
  wind_dir: keyof typeof compass; //      Wind direction (16 point):   "NE"
  pressure_mb: number; //                     Pressure in millibars:   1002
  pressure_in: number; //                        Pressure in inches:   29.58
  precip_mm: number; //         Precipitation amount in millimeters:   0.27
  precip_in: number; //              Precipitation amount in inches:   0.01
  humidity: number; //                       Humidity as percentage:   89
  cloud: number; //                       Cloud cover as percentage:   100
  feelslike_c: number; //         Feels like temperature as Celsius:   8.1
  feelslike_f: number; //      Feels like temperature as Fahrenheit:   46.6
  vis_km: number; //                        Visibility in kilometer:   10
  vis_miles: number; //                         Visibility in miles:   6
  uv: keyof typeof uvIndex; //                             UV Index:   2
  gust_mph: number; //                  Wind gust in miles per hour:   2.3
  gust_kph: number; //              Wind gust in kilometer per hour:   3.7
  air_quality: AirQuality;
}
interface WeatherHour {
  time_epoch: number; //                               Time as unix:   1713999600
  time: string; //                                    Date and time:   "2024-04-25 00:00"
  temp_c: number; //                         Temperature in Celsius:   4.2
  temp_f: number; //                      Temperature in Fahrenheit:   39.6
  is_day: number; //        Day icon or night icon (1 = Yes 0 = No):   0
  condition: WeatherCondition;
  wind_mph: number; //         Maximum wind speed in miles per hour:   1.1
  wind_kph: number; //    Maximum wind speed in kilometers per hour:   1.8
  wind_degree: number; //                 Wind direction in degrees:   202
  wind_dir: keyof typeof compass; //      Wind direction (16 point):   "SSW"
  pressure_mb: number; //                     Pressure in millibars:   1012
  pressure_in: number; //                        Pressure in inches:   29.89
  precip_mm: number; //         Precipitation amount in millimeters:   0
  precip_in: number; //              Precipitation amount in inches:   0
  snow_cm: number; //                       Snowfall in centimeters:   0
  humidity: number; //                       Humidity as percentage:   80
  cloud: number; //                       Cloud cover as percentage:   93
  feelslike_c: number; //         Feels like temperature as Celsius:   4.2
  feelslike_f: number; //      Feels like temperature as Fahrenheit:   39.6
  windchill_c: number; //          Windchill temperature in Celsius:   4.2
  windchill_f: number; //       Windchill temperature in Fahrenheit:   39.6
  heatindex_c: number; //                     Heat index in Celsius:   4.2
  heatindex_f: number; //                  Heat index in Fahrenheit:   39.6
  dewpoint_c: number; //                       Dew point in Celsius:   1.1
  dewpoint_f: number; //                    Dew point in Fahrenheit:   34
  will_it_rain: number; //     Will it rain or not (1 = Yes 0 = No):   0
  chance_of_rain: number; //           Chance of rain as percentage:   0
  will_it_snow: number; //     Will it snow or not (1 = Yes 0 = No):   0
  chance_of_snow: number; //           Chance of snow as percentage:   0
  vis_km: number; //                        Visibility in kilometer:   10
  vis_miles: number; //                         Visibility in miles:   6
  gust_mph: number; //                  Wind gust in miles per hour:   2
  gust_kph: number; //              Wind gust in kilometer per hour:   3.2
  uv: keyof typeof uvIndex; //                             UV Index:   1
  short_rad: number; // Shortwave solar radiation or Global horizontal Irradiation (GHI) W/m²: 5.81
  diff_rad: number; //    Diffuse Horizontal Irradiation (DHI) W/m²:   2.74
}
interface WeatherForecastDay {
  maxtemp_c: number; //              Maximum temperature in Celsius:   11.9
  maxtemp_f: number; //           Maximum temperature in Fahrenheit:   53.4
  mintemp_c: number; //              Minimum temperature in Celsius:   3.8
  mintemp_f: number; //           Minimum temperature in Fahrenheit:   38.8
  avgtemp_c: number; //              Average temperature in Celsius:   7.4
  avgtemp_f: number; //           Average temperature in Fahrenheit:   45.4
  maxwind_mph: number; //      Maximum wind speed in miles per hour:   11.4
  maxwind_kph: number; // Maximum wind speed in kilometers per hour:   18.4
  totalprecip_mm: number; //      Total precipitation in millimeter:   2.43
  totalprecip_in: number; //          Total precipitation in inches:   0.1
  totalsnow_cm: number; //            Total snowfall in centimeters:   0
  avgvis_km: number; //            Average visibility in kilometers:   9.7
  avgvis_miles: number; //              Average visibility in miles:   6
  avghumidity: number; //            Average humidity as percentage:   76
  daily_will_it_rain: number; // Will it rain or not (1 = Yes 0 = No): 1
  daily_chance_of_rain: number; //     Chance of rain as percentage:   95
  daily_will_it_snow: number; // Will it snow or not (1 = Yes 0 = No): 0
  daily_chance_of_snow: number; //     Chance of snow as percentage:   0
  uv: keyof typeof uvIndex; //                             UV Index:   4
  condition: WeatherCondition;
  air_quality: AirQuality;
}
interface HistoricWeatherDay {
  maxtemp_c: number; //              Maximum temperature in Celsius:   11.9
  maxtemp_f: number; //           Maximum temperature in Fahrenheit:   53.4
  mintemp_c: number; //              Minimum temperature in Celsius:   3.8
  mintemp_f: number; //           Minimum temperature in Fahrenheit:   38.8
  avgtemp_c: number; //              Average temperature in Celsius:   7.4
  avgtemp_f: number; //           Average temperature in Fahrenheit:   45.4
  maxwind_mph: number; //      Maximum wind speed in miles per hour:   11.4
  maxwind_kph: number; // Maximum wind speed in kilometers per hour:   18.4
  totalprecip_mm: number; //      Total precipitation in millimeter:   2.43
  totalprecip_in: number; //          Total precipitation in inches:   0.1
  totalsnow_cm: number; //            Total snowfall in centimeters:   0
  avgvis_km: number; //            Average visibility in kilometers:   9.7
  avgvis_miles: number; //              Average visibility in miles:   6
  avghumidity: number; //            Average humidity as percentage:   76
  daily_will_it_rain: number; // Will it rain or not (1 = Yes 0 = No): 1
  daily_chance_of_rain: number; //     Chance of rain as percentage:   95
  daily_will_it_snow: number; // Will it snow or not (1 = Yes 0 = No): 0
  daily_chance_of_snow: number; //     Chance of snow as percentage:   0
  uv: keyof typeof uvIndex; //                             UV Index:   4
  condition: WeatherCondition;
}
interface HistoricWeatherDayWrapper {
  date: string;
  date_epoch: number;
  day: HistoricWeatherDay;
  astro: Astro;
  hour: WeatherHour;
}
interface WeatherForecastDayWrapper {
  date: string;
  date_epoch: number;
  day: WeatherForecastDay;
  astro: Astro;
  hour: WeatherHour;
}
interface CurrentWeatherWrapper {
  location: Location;
  current: CurrentWeather;
}
interface WeatherForecastWrapper {
  location: Location;
  current: CurrentWeather;
  forecast: {
    forecastday: WeatherForecastDayWrapper[];
  };
}
interface HistoricWeatherWrapper {
  location: Location;
  current: CurrentWeather;
  forecast: {
    forecastday: HistoricWeatherDayWrapper[];
  };
}
