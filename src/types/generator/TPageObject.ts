import { Page } from 'pdfObjects/IntermediateObjects/Page';

export type TPageObject = {
  pdfPage: Page;
  yStart: number;
  yEnd?: number;
  pageNumber: number;
  headerOffset?: number;
  footerOffset?: number;
};

