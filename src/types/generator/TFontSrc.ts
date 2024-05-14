export type TFontSrc = {
  url: string;
  format: string;
};

export type TFontInfo = {
  family: string;
  style: string;
  weight: number;
  stretch: string;
  src: Array<TFontSrc>;
  name: string;
  inPDF: boolean;
};
