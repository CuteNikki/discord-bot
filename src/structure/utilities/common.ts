/**
 * Gets a random number between min and max
 * @param {number} min
 * @param {number} max
 * @returns {number} Random number between min and max
 */
export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Slices an array into chunks of a given size
 * @param {type[]} arr Array to chunk
 * @param {number} size Size of each chunk
 * @returns {type[][]} Chunked array
 */
export function chunk<type>(arr: type[], size: number): type[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_: type, i: number) => arr.slice(i * size, i * size + size));
}
