/**
 * Gets a random number between min and max
 * @param {number} min
 * @param {number} max
 * @returns {number} Random number between min and max
 */
export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
