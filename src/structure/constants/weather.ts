export const WEATHER_API_URL = `https://api.weatherapi.com/v1`;

export const COMPASS = {
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

/**
 *                        US - EPA standard.
 *                         1 means                             Good
 *                         2 means                         Moderate
 *                         3 means    Unhealthy for sensitive group
 *                         4 means                        Unhealthy
 *                         5 means                   Very Unhealthy
 *                         6 means                        Hazardous
 */
export const US_EPA_INDEX = {
  1: '1 - Good (0-15 PM2.5 µg/m3)',
  2: '2 - Moderate (16-40 PM2.5 µg/m3)',
  3: '3 - Unhealthy for sensitive (41-65 PM2.5 µg/m3)',
  4: '4 - Unhealthy (66-150 PM2.5 µg/m3)',
  5: '5 - Very Unhealthy (151-250 PM2.5 µg/m3)',
  6: '6 - Hazardous (251+ PM2.5 µg/m3)',
};

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
export const UK_DEFRA_INDEX = {
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

export const UV_INDEX = {
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
