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

/**
 * Shuffle an array
 * @param {T[]} array Array to shuffle
 * @returns {T[]} Shuffled array
 */
export function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
}
