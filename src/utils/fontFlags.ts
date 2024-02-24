import FontFlagTypes from 'enums/FontFlagTypes';

/**
 * Convert an array of FontFlagTypes to the byte value
 * @param flags The array of FontFlagTypes
 * @returns The byte value
 */
export function fontFlagsAsInt(flags: Array<FontFlagTypes>): number {
  const bits = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  flags.forEach((flag) => {
    bits[flag - 1] = 1;
  });
  return parseInt(bits.reverse().toString().replace(/,/g, ''), 2);
}

export default fontFlagsAsInt;
