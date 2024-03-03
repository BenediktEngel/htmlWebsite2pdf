export const cm = {
  toInch: (x: number): number => x / 2.54,
  toMm: (x: number): number => x * 10,
  toPt: (x: number): number => x * 28.3464567,
  toPx: (x: number): number => x * 37.79527559,
};

export const inch = {
  toCm: (x: number): number => x * 2.54,
  toMm: (x: number): number => x * 25.4,
  toPt: (x: number): number => x * 72,
  toPx: (x: number): number => x * 96,
};

export const mm = {
  toCm: (x: number): number => x / 10,
  toInch: (x: number): number => x / 25.4,
  toPt: (x: number): number => x * 2.83464567,
  toPx: (x: number): number => x * 3.779527559,
};

export const pt = {
  toCm: (x: number): number => x / 28.3464567,
  toInch: (x: number): number => x / 72,
  toMm: (x: number): number => x / 2.83464567,
  toPx: (x: number): number => x * 1.333333333,
};

export const px = {
  toCm: (x: number): number => x / 37.79527559,
  toInch: (x: number): number => x / 96,
  toMm: (x: number): number => x / 3.779527559,
  toPt: (x: number): number => x / 1.333333333,
};

export default { cm, inch, mm, pt, px };
