import { RGB } from './colors';
import { TRGB } from '../types';

/**
 * Gets the RGB values from a CSS RGB or RGBA value
 * @param {string} rgb The CSS RGB or RGBA value
 * @returns {TRGB} The RGB values
 */
export function getColorFromCssRGBValue(rgb: string) {
  //TODO: add support for opacity
  let color = rgb.replace('rgb(', '').replace('rgba(', '').replace(')', '').replace(' ', '').split(',');
  return RGB.changeRange1({ r: parseInt(color![0]), g: parseInt(color![1]), b: parseInt(color![2]) } as TRGB);
}
export default getColorFromCssRGBValue;
