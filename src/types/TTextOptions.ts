import { TRGB } from './colors';

export type TTextOptions = {
  alignment?: string; // TODO: make this to an enum ('left' | 'center' | 'right' | 'justify') make justify work
  maxWidth?: number;
  color?: TRGB;
};
