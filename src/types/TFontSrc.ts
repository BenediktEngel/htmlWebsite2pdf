export type TFontSrc = {
  url: string;
  format: string;
};

export type TFontInfo = {
  fontFamily: string;
  fontStyle: string;
  fontWeight: number;
  fontStretch: string;
  src: Array<TFontSrc>;
};
