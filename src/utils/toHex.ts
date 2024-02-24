/**
 * Convert a number to a 4 digit hex string
 * @param num The number to convert
 * @returns The 4 digit hex string
 */
export function toHex(num: number): string {
  return `0000${num.toString(16)}`.slice(-4);
}

export default { toHex };
