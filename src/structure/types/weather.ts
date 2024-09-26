import type { COMPASS, UK_DEFRA_INDEX, US_EPA_INDEX, UV_INDEX } from 'constants/weather';

/**
 * Example location object
 *
 * lat: 51.52
 * lon: -0.11
 * name: "London"
 * region: "City of London, Greater London"
 * country: "United Kingdom"
 * tz_id: "Europe/London"
 * localtime_epoch: 1714070038
 * localtime: "2024-04-25 19:33"
 */
export type Location = {
  lat: number; // Latitude in decimal degrees
  lon: number; // Longitude in decimal degrees
  name: string; // Name of the location
  region: string; // Region of the location
  country: string; // Country of the location
  tz_id: string; // Timezone ID
  localtime_epoch: number; // Local time in seconds since 01/01/1970
  localtime: string; // Local time in 24-hour format
};

/**
 * Example astronomy object
 *
 * sunrise: "05:43 AM"
 * sunset: "08:14 PM"
 * moonrise: "10:33 PM"
 * moonset: "10:33 PM"
 * moon_phase: "Waning Gibbous"
 * moon_illumination: 99
 * is_moon_up: 0
 * is_sun_up: 1
 */
export type Astronomy = {
  sunrise: string; // Sunrise time in 24-hour format
  sunset: string; // Sunset time in 24-hour format
  moonrise: string; // Moonrise time in 24-hour format
  moonset: string; // Moonset time in 24-hour format
  moon_phase: string; // Moon phase
  moon_illumination: number; // Moon illumination in percent
  is_moon_up: number; // 1 = Yes 0 = No
  is_sun_up: number; // 1 = Yes 0 = No
};

export type Condition = {
  text: string; // Text description of the condition
  icon: string; // Icon of the condition
  code: number; // Code of the condition
};

/**
 * Example air quality object
 *
 * co: 260
 * o3: 31.5
 * no2: 53.6
 * so2: 11:2
 * pm2_5: 3.4
 * pm10: 4
 * us-epa-index: 1
 * gb-defra-index: 1
 */
export type AirQuality = {
  co: number; // Carbon monoxide (CO) in parts per million (ppm)
  o3: number; // Ozone (O3) in parts per million (ppm)
  no2: number; // Nitrogen dioxide (NO2) in parts per million (ppm)
  so2: number; // Sulphur dioxide (SO2) in parts per million (ppm)
  pm2_5: number; // Particulate matter (PM2.5) in micrograms per cubic meter (µg/m3)
  pm10: number; // Particulate matter (PM10) in micrograms per cubic meter (µg/m3)
  'us-epa-index': keyof typeof US_EPA_INDEX; // US EPA index
  'gb-defra-index': keyof typeof UK_DEFRA_INDEX; // UK Defra index
};

/**
 * Example current weather object
 *
 * last_updated: "2024-04-25 19:30"
 * last_updated_epoch: 1714069800
 * temp_c: 8.1
 * temp_f: 46.6
 * is_day: 1
 * condition: Condition
 * wind_mph: 2.2
 * wind_kph: 3.6
 * wind_degree: 34
 * wind_dir: "NE"
 * pressure_mb: 1002
 * pressure_in: 29.58
 * precip_mm: 0
 * precip_in: 0
 * humidity: 80
 * cloud: 93
 * feelslike_c: 8.1
 * feelslike_f: 46.6
 * vis_km: 10
 * vis_miles: 6
 * uv: 2
 * gust_mph: 2.3
 * gust_kph: 3.7
 * air_quality: AirQuality
 */
export type CurrentWeather = {
  last_updated: string; // Last updated time in 24-hour format
  last_updated_epoch: number; // Last updated time in seconds since 01/01/1970
  temp_c: number; // Temperature in Celsius
  temp_f: number; // Temperature in Fahrenheit
  is_day: number; // Day or night icon (1 = Yes 0 = No)
  condition: Condition; // Condition object
  wind_mph: number; // Wind speed in miles per hour
  wind_kph: number; // Wind speed in kilometers per hour
  wind_degree: number; // Wind direction in degrees
  wind_dir: keyof typeof COMPASS; // Wind direction (16 point)
  pressure_mb: number; // Pressure in millibars
  pressure_in: number; // Pressure in inches
  precip_mm: number; // Precipitation amount in millimeter
  precip_in: number; // Precipitation amount in inches
  humidity: number; // Humidity as percentage
  cloud: number; // Cloud cover as percentage
  feelslike_c: number; // Feels like temperature as Celsius
  feelslike_f: number; // Feels like temperature as Fahrenheit
  vis_km: number; // Visibility in kilometer
  vis_miles: number; // Visibility in miles
  uv: keyof typeof UV_INDEX; // UV index
  gust_mph: number; // Wind gust in miles per hour
  gust_kph: number; // Wind gust in kilometer per hour
  air_quality: AirQuality; // Air quality object
};

/**
 * Example weather hour object
 *
 * time_epoch: 1713999600
 * time: "2024-04-25 00:00"
 * temp_c: 4.2
 * temp_f: 39.6
 * is_day: 1
 * condition: Condition
 * wind_mph: 2.2
 * wind_kph: 3.6
 * wind_degree: 34
 * wind_dir: "NE"
 * pressure_mb: 1002
 * pressure_in: 29.58
 * precip_mm: 0
 * precip_in: 0
 * snow_cm: 0
 * humidity: 80
 * cloud: 93
 * feelslike_c: 4.2
 * feelslike_f: 39.6
 * windchill_c: 4.2
 * windchill_f: 39.6
 * heatindex_c: 4.2
 * heatindex_f: 39.6
 * dewpoint_c: 1.1
 * dewpoint_f: 34
 * will_it_rain: 0
 * chance_of_rain: 0
 * will_it_snow: 0
 * chance_of_snow: 0
 * vis_km: 10
 * vis_miles: 6
 * gust_mph: 2.3
 * gust_kph: 3.7
 * uv: 1
 * short_rad: 5.81
 * diff_rad: 2.74
 */
export type WeatherHour = {
  time_epoch: number; // Time as unix
  time: string; // Time in 24-hour format
  temp_c: number; // Temperature in Celsius
  temp_f: number; // Temperature in Fahrenheit
  is_day: number; // Day icon or night icon (1 = Yes 0 = No)
  condition: Condition; // Condition object
  wind_mph: number; // Maximum wind speed in miles per hour
  wind_kph: number; // Maximum wind speed in kilometers per hour
  wind_degree: number; // Wind direction in degrees
  wind_dir: keyof typeof COMPASS; // Wind direction (16 point)
  pressure_mb: number; // Pressure in millibars
  pressure_in: number; // Pressure in inches
  precip_mm: number; // Precipitation amount in millimeter
  precip_in: number; // Precipitation amount in inches
  snow_cm: number; // Snowfall in centimeters
  humidity: number; // Humidity as percentage
  cloud: number; // Cloud cover as percentage
  feelslike_c: number; // Feels like temperature as Celsius
  feelslike_f: number; // Feels like temperature as Fahrenheit
  windchill_c: number; // Windchill temperature in Celsius
  windchill_f: number; // Windchill temperature in Fahrenheit
  heatindex_c: number; // Heat index in Celsius
  heatindex_f: number; // Heat index in Fahrenheit
  dewpoint_c: number; // Dew point in Celsius
  dewpoint_f: number; // Dew point in Fahrenheit
  will_it_rain: number; // Will it rain or not (1 = Yes 0 = No)
  chance_of_rain: number; // Chance of rain as percentage
  will_it_snow: number; // Will it snow or not (1 = Yes 0 = No)
  chance_of_snow: number; // Chance of snow as percentage
  vis_km: number; // Visibility in kilometer
  vis_miles: number; // Visibility in miles
  gust_mph: number; // Wind gust in miles per hour
  gust_kph: number; // Wind gust in kilometer per hour
  uv: keyof typeof UV_INDEX; // UV index
  short_rad: number; // Shortwave solar radiation or Global horizontal Irradiation (GHI) W/m²
  diff_rad: number; // Diffuse Horizontal Irradiation (DHI) W/m²
};

/**
 * Example forecast day object
 *
 * maxtemp_c: 11.9
 * maxtemp_f: 53.4
 * mintemp_c: 3.8
 * mintemp_f: 38.8
 * avgtemp_c: 7.4
 * avgtemp_f: 45.4
 * maxwind_mph: 11.4
 * maxwind_kph: 18.4
 * totalprecip_mm: 2.43
 * totalprecip_in: 0.1
 * totalsnow_cm: 0
 * avgvis_km: 9.7
 * avgvis_miles: 6
 * avghumidity: 76
 * daily_will_it_rain: 1
 * daily_chance_of_rain: 95
 * daily_will_it_snow: 0
 * daily_chance_of_snow: 0
 * uv: 4
 * condition: Condition
 * air_quality: AirQuality
 */
export type ForecastDay = {
  maxtemp_c: number; // Maximum temperature in Celsius
  maxtemp_f: number; // Maximum temperature in Fahrenheit
  mintemp_c: number; // Minimum temperature in Celsius
  mintemp_f: number; // Minimum temperature in Fahrenheit
  avgtemp_c: number; // Average temperature in Celsius
  avgtemp_f: number; // Average temperature in Fahrenheit
  maxwind_mph: number; // Maximum wind speed in miles per hour
  maxwind_kph: number; // Maximum wind speed in kilometers per hour
  totalprecip_mm: number; // Total precipitation in millimeter
  totalprecip_in: number; // Total precipitation in inches
  totalsnow_cm: number; // Total snowfall in centimeters
  avgvis_km: number; // Average visibility in kilometers
  avgvis_miles: number; // Average visibility in miles
  avghumidity: number; // Average humidity as percentage
  daily_will_it_rain: number; // Will it rain or not (1 = Yes 0 = No)
  daily_chance_of_rain: number; // Chance of rain as percentage
  daily_will_it_snow: number; // Will it snow or not (1 = Yes 0 = No)
  daily_chance_of_snow: number; // Chance of snow as percentage
  uv: keyof typeof UV_INDEX; // UV index
  condition: Condition; // Condition object
  air_quality: AirQuality; // Air quality object
};

/**
 * Example historic day object
 *
 * maxtemp_c: 11.9
 * maxtemp_f: 53.4
 * mintemp_c: 3.8
 * mintemp_f: 38.8
 * avgtemp_c: 7.4
 * avgtemp_f: 45.4
 * maxwind_mph: 11.4
 * maxwind_kph: 18.4
 * totalprecip_mm: 2.43
 * totalprecip_in: 0.1
 * totalsnow_cm: 0
 * avgvis_km: 9.7
 * avgvis_miles: 6
 * avghumidity: 76
 * daily_will_it_rain: 1
 * daily_chance_of_rain: 95
 * daily_will_it_snow: 0
 * daily_chance_of_snow: 0
 * uv: 4
 * condition: Condition
 */
export type HistoricDay = {
  maxtemp_c: number; // Maximum temperature in Celsius
  maxtemp_f: number; // Maximum temperature in Fahrenheit
  mintemp_c: number; // Minimum temperature in Celsius
  mintemp_f: number; // Minimum temperature in Fahrenheit
  avgtemp_c: number; // Average temperature in Celsius
  avgtemp_f: number; // Average temperature in Fahrenheit
  maxwind_mph: number; // Maximum wind speed in miles per hour
  maxwind_kph: number; // Maximum wind speed in kilometers per hour
  totalprecip_mm: number; // Total precipitation in millimeter
  totalprecip_in: number; // Total precipitation in inches
  totalsnow_cm: number; // Total snowfall in centimeters
  avgvis_km: number; // Average visibility in kilometers
  avgvis_miles: number; // Average visibility in miles
  avghumidity: number; // Average humidity as percentage
  daily_will_it_rain: number; // Will it rain or not (1 = Yes 0 = No)
  daily_chance_of_rain: number; // Chance of rain as percentage
  daily_will_it_snow: number; // Will it snow or not (1 = Yes 0 = No)
  daily_chance_of_snow: number; // Chance of snow as percentage
  uv: keyof typeof UV_INDEX; // UV index
  condition: Condition; // Condition object
};

export type HistoricDayWrapper = {
  date: string; // Date in YYYY-MM-DD format
  date_epoch: number; // Date in seconds since 01/01/1970
  day: HistoricDay; // Historic day object
  astro: Astronomy; // Astronomy object
  hour: WeatherHour; // Weather hour object
};

export type ForecastDayWrapper = {
  date: string; // Date in YYYY-MM-DD format
  date_epoch: number; // Date in seconds since 01/01/1970
  day: ForecastDay; // Forecast day object
  astro: Astronomy; // Astronomy object
  hour: WeatherHour; // Weather hour object
};

export type CurrentWeatherWrapper = {
  location: Location; // Location object
  current: CurrentWeather; // Current weather object
};

export type WeatherForecastWrapper = {
  location: Location; // Location object
  current: CurrentWeather; // Current weather object
  forecast: {
    forecastday: ForecastDayWrapper[]; // Forecast day array
  };
};

export type HistoricWeatherWrapper = {
  location: Location; // Location object
  current: CurrentWeather; // Current weather object
  forecast: {
    forecastday: HistoricDayWrapper[]; // Forecast day array
  };
};
