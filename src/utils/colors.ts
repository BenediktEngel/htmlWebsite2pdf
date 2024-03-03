import type { TCMYK, THSL, TRGB } from '../types';

export const RGB = {
  /**
   * Convert the RGB value to CMYK value, the range of the RGB value can be 0-1 or 0-255
   * @param {TRGB} value - The RGB value to convert
   * @returns {TCMYK} The CMYK value
   * @throws {Error} - If the RGB value is invalid
   */
  toCMYK: (value: TRGB): TCMYK => {
    const { r, g, b } = RGB.changeRange1(value);
    const k = 1 - Math.max(r, g, b);
    const c = (1 - r - k) / (1 - k);
    const m = (1 - g - k) / (1 - k);
    const y = (1 - b - k) / (1 - k);
    return { c, m, y, k };
  },
  /**
   * Convert the RGB value to an RGB hex string, the range of the RGB value can be 0-1 or 0-255
   * @param {TRGB} value - The RGB value to convert
   * @returns {string} The RGB hex string with the format #RRGGBB
   * @throws {Error} - If the RGB value is invalid
   */
  toRGBHex: (value: TRGB): string => {
    const { r, g, b } = RGB.changeRange255(value);
    const rHex = r.toString(16).padStart(2, '0');
    const gHex = g.toString(16).padStart(2, '0');
    const bHex = b.toString(16).padStart(2, '0');
    return `#${rHex}${gHex}${bHex}`;
  },
  /**
   * Convert the RGB value to HSL value, the range of the RGB value can be 0-1 or 0-255
   * @param {TRGB} value - The RGB value to convert
   * @returns {THSL} The HSL value
   * @throws {Error} - If the RGB value is invalid
   */
  toHSL: (value: TRGB): THSL => {
    const { r, g, b } = RGB.changeRange1(value);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const l = (max + min) / 2;
    let h = 0;
    if (delta !== 0) {
      if (max === r) h = (g - b) / delta + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / delta + 2;
      else h = (r - g) / delta + 4;
      h *= 60;
    }
    const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    return { h, s, l };
  },
  /**
   * Change the range of the RGB value to 0-1 if the value is 0-255
   * @param {TRGB} value - The RGB value to change the range
   * @returns {TRGB} The RGB value with the range 0-1
   * @throws {Error} - If the RGB value is invalid
   */
  changeRange1: (value: TRGB): TRGB => {
    const r = value.r <= 1 ? value.r : value.r / 255;
    const g = value.g <= 1 ? value.g : value.g / 255;
    const b = value.b <= 1 ? value.b : value.b / 255;
    if (r > 1 || g > 1 || b > 1) throw new Error('Invalid RGB value');
    return { r, g, b };
  },
  /**
   * Change the range of the RGB value to 0-255 if the value is 0-1
   * @param {TRGB} value - The RGB value to change the range
   * @returns {TRGB} The RGB value with the range 0-255
   * @throws {Error} - If the RGB value is invalid
   */
  changeRange255: (value: TRGB): TRGB => {
    const r = value.r <= 1 ? value.r * 255 : value.r;
    const g = value.g <= 1 ? value.g * 255 : value.g;
    const b = value.b <= 1 ? value.b * 255 : value.b;
    if (r > 255 || g > 255 || b > 255) throw new Error('Invalid RGB value');
    return { r, g, b };
  },
};

export const RGBHex = {
  /**
   * Convert the RGB hex string to CMYK value
   * @param {string} value - The RGB hex string to convert, the format can be #RRGGBB or #RGB
   * @returns {TCMYK} The CMYK value
   * @throws {Error} - If the RGB hex string is invalid
   */
  toCMYK: (value: string): TCMYK => RGB.toCMYK(RGBHex.toRGB(value)),
  /**
   * Convert the RGB hex string to RGB value
   * @param {string} value - The RGB hex string to convert, the format can be #RRGGBB or #RGB
   * @returns {TRGB} The RGB value
   * @throws {Error} - If the RGB hex string is invalid
   */
  toRGB: (value: string): TRGB => {
    if (!/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(value)) throw new Error('Invalid RGB hex string');
    const sizeParam = value.length === 4 ? 1 : 2;
    const r = parseInt(value.slice(1, 1 + sizeParam), 16);
    const g = parseInt(value.slice(1 + sizeParam, 1 + sizeParam * 2), 16);
    const b = parseInt(value.slice(1 + sizeParam * 2, 1 + sizeParam * 3), 16);
    return { r, g, b };
  },
  /**
   * Convert the RGB hex string to HSL value
   * @param {string} value - The RGB hex string to convert, the format can be #RRGGBB or #RGB
   * @returns {THSL} The HSL value
   * @throws {Error} - If the RGB hex string is invalid
   */
  toHSL: (value: string): THSL => RGB.toHSL(RGBHex.toRGB(value)),
};

export const CMYK = {
  /**
   * Convert the CMYK value to RGB value
   * @param {TCMYK} value - The CMYK value to convert
   * @returns {TRGB} The RGB value
   * @throws {Error} - If the CMYK value is invalid
   */
  toRGB: (value: TCMYK): TRGB => {
    const { c, m, y, k } = CMYK.changeRange1(value);
    const r = 255 * (1 - c) * (1 - k);
    const g = 255 * (1 - m) * (1 - k);
    const b = 255 * (1 - y) * (1 - k);
    return { r, g, b };
  },
  /**
   * Convert the CMYK value to RGB hex string
   * @param {TCMYK} value - The CMYK value to convert
   * @returns {string} The RGB hex string
   * @throws {Error} - If the CMYK value is invalid
   */
  toRGBHex: (value: TCMYK): string => RGB.toRGBHex(CMYK.toRGB(value)),
  /**
   * Convert the CMYK value to HSL value
   * @param {TCMYK} value - The CMYK value to convert
   * @returns {THSL} The HSL value
   * @throws {Error} - If the CMYK value is invalid
   */
  toHSL: (value: TCMYK): THSL => RGB.toHSL(CMYK.toRGB(value)),
  /**
   * Change the range of the CMYK value to 0-1 if the value is 0-100
   * @param {TCMYK} value - The CMYK value to change the range
   * @returns {TCMYK} The CMYK value with the range 0-1
   * @throws {Error} - If the CMYK value is invalid
   */
  changeRange1: (value: TCMYK): TCMYK => {
    const c = value.c <= 1 ? value.c : value.c / 100;
    const m = value.m <= 1 ? value.m : value.m / 100;
    const y = value.y <= 1 ? value.y : value.y / 100;
    const k = value.k <= 1 ? value.k : value.k / 100;
    if (c > 1 || m > 1 || y > 1 || k > 1) throw new Error('Invalid CMYK value');
    return { c, m, y, k };
  },
  /**
   * Change the range of the CMYK value to 0-100 if the value is 0-1
   * @param {TCMYK} value - The CMYK value to change the range
   * @returns {TCMYK} The CMYK value with the range 0-100
   * @throws {Error} - If the CMYK value is invalid
   */
  changeRange100: (value: TCMYK): TCMYK => {
    const c = value.c <= 1 ? value.c * 100 : value.c;
    const m = value.m <= 1 ? value.m * 100 : value.m;
    const y = value.y <= 1 ? value.y * 100 : value.y;
    const k = value.k <= 1 ? value.k * 100 : value.k;
    if (c > 100 || m > 100 || y > 100 || k > 100) throw new Error('Invalid CMYK value');
    return { c, m, y, k };
  },
};

export const HSL = {
  /**
   * Convert the HSL value to RGB value
   * @param {THSL} value - The HSL value to convert
   * @returns {TRGB} The RGB value
   * @throws {Error} - If the HSL value is invalid
   */
  toRGB: (value: THSL): TRGB => {
    if (value.s > 100) console.warn('HSL value s is greater than 100, using 100 instead');
    if (value.l > 100) console.warn('HSL value l is greater than 100, using 100 instead');
    if (value.h < 0 || value.h > 360) throw new Error('HSL value h is out of range');
    if (value.s < 0) throw new Error('HSL value s is out of range');
    if (value.l < 0) throw new Error('HSL value l is out of range');
    const s = value.s > 100 ? 100 : value.s;
    const l = value.l > 100 ? 100 : value.l;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((value.h / 60) % 2) - 1));
    const m = l - c / 2;
    const [r1, g1, b1] = [
      [c, x, 0],
      [x, c, 0],
      [0, c, x],
      [0, x, c],
      [x, 0, c],
      [c, 0, x],
    ][Math.floor(value.h / 60)];
    const [r, g, b] = [r1, g1, b1].map((v) => v + m);
    return { r, g, b };
  },
  /**
   * Convert the HSL value to RGB hex string
   * @param {THSL} value - The HSL value to convert
   * @returns {string} The RGB hex string
   * @throws {Error} - If the HSL value is invalid
   */
  toRGBHex: (value: THSL): string => {
    const { r, g, b } = HSL.toRGB(value);
    return RGB.toRGBHex({ r, g, b });
  },
  /**
   * Convert the HSL value to CMYK value
   * @param {THSL} value - The HSL value to convert
   * @returns {TCMYK} The CMYK value
   * @throws {Error} - If the HSL value is invalid
   */
  toCMYK: (value: THSL): TCMYK => {
    const { r, g, b } = HSL.toRGB(value);
    return RGB.toCMYK({ r, g, b });
  },
};

export default { RGB, RGBHex, CMYK, HSL };
