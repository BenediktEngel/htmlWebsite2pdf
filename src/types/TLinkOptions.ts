import { TRGB } from './colors/TRGB';

export type TLinkOptions = {
  border?: {
    width?: number;
    color: TRGB;
    cornerRadius?: number;
    style?: 'dashed' | 'dotted' | 'solid'; // TODO: Should be better custamizable
  }
};
