import { PdfVersion } from 'enums';

export type TDocumentOptions = {
  version: PdfVersion;
  title: string;
  subject: string;
  keywords: string;
  author: string;
};
