export const cm = {
  /**
   * Converts a value from centimeters to inches.
   * @param {number} x The input in centimeters
   * @returns {number} The value in inches
   */
  toInch: (x: number): number => x / 2.54,
  /**
   * Converts a value from centimeters to millimeters.
   * @param {number} x The input in centimeters
   * @returns {number} The value in millimeters
   */
  toMm: (x: number): number => x * 10,
  /**
   * Converts a value from centimeters to points.
   * @param {number} x The input in centimeters
   * @returns {number} The value in points
   */
  toPt: (x: number): number => x * 28.3464567,
  /**
   * Converts a value from centimeters to pixels.
   * @param {number} x The input in centimeters
   * @returns {number} The value in pixels
   */
  toPx: (x: number): number => x * 37.79527559,
};

export const inch = {
  /**
   * Converts a value from inches to centimeters.
   * @param {number} x The input in inches
   * @returns {number} The value in centimeters
   */
  toCm: (x: number): number => x * 2.54,
  /**
   * Converts a value from inches to millimeters.
   * @param {number} x The input in inches
   * @returns {number} The value in millimeters
   */
  toMm: (x: number): number => x * 25.4,
  /**
   * Converts a value from inches to points.
   * @param {number} x The input in inches
   * @returns {number} The value in points
   */
  toPt: (x: number): number => x * 72,
  /**
   * Converts a value from inches to pixels.
   * @param {number} x The input in inches
   * @returns {number} The value in pixels
   */
  toPx: (x: number): number => x * 96,
};

export const mm = {
  /**
   * Converts a value from millimeters to centimeters.
   * @param {number} x The input in millimeters
   * @returns {number} The value in centimeters
   */
  toCm: (x: number): number => x / 10,
  /**
   * Converts a value from millimeters to inches.
   * @param {number} x The input in millimeters
   * @returns {number} The value in inches
   */
  toInch: (x: number): number => x / 25.4,
  /**
   * Converts a value from millimeters to points.
   * @param {number} x The input in millimeters
   * @returns {number} The value in points
   */
  toPt: (x: number): number => x * 2.83464567,
  /**
   * Converts a value from millimeters to pixels.
   * @param {number} x The input in millimeters
   * @returns {number} The value in pixels
   */
  toPx: (x: number): number => x * 3.779527559,
};

export const pt = {
  /**
   * Converts a value from points to centimeters.
   * @param {number} x The input in points
   * @returns {number} The value in centimeters
   */
  toCm: (x: number): number => x / 28.3464567,
  /**
   * Converts a value from points to inches.
   * @param {number} x The input in points
   * @returns {number} The value in inches
   */
  toInch: (x: number): number => x / 72,
  /**
   * Converts a value from points to millimeters.
   * @param {number} x The input in points
   * @returns {number} The value in millimeters
   */
  toMm: (x: number): number => x / 2.83464567,
  /**
   * Converts a value from points to pixels.
   * @param {number} x The input in points
   * @returns {number} The value in pixels
   */
  toPx: (x: number): number => x * 1.333333333,
};

export const px = {
  /**
   * Converts a value from pixels to centimeters.
   * @param {number} x The input in pixels
   * @returns {number} The value in centimeters
   */
  toCm: (x: number): number => x / 37.79527559,
  /**
   * Converts a value from pixels to inches.
   * @param {number} x The input in pixels
   * @returns {number} The value in inches
   */
  toInch: (x: number): number => x / 96,
  /**
   * Converts a value from pixels to millimeters.
   * @param {number} x The input in pixels
   * @returns {number} The value in millimeters
   */
  toMm: (x: number): number => x / 3.779527559,
  /**
   * Converts a value from pixels to points.
   * @param {number} x The input in pixels
   * @returns {number} The value in points
   */
  toPt: (x: number): number => x / 1.333333333,
};

export default { cm, inch, mm, pt, px };
