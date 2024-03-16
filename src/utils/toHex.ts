/**
 * Convert a number to a hex string
 * @param {number} num The number to convert
 * @param {number} [length=4] The length of the hex string, default is 4
 * @returns {string} The hex string
 */
export function toHex(num: number, length: number = 4): string {
  return `${'0'.repeat(length)}${num.toString(16)}`.slice(-length);
}

export default { toHex };
