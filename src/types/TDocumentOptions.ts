import { PdfPageMode, PdfVersion, PdfPageLayout } from 'enums';
import { TViewerPreferences } from './TViewerPreferences';

export type TDocumentOptions = {
  version?: PdfVersion;
  title?: string;
  subject?: string;
  keywords?: string;
  author?: string;
  pageMode?: PdfPageMode;
  pageLayout?: PdfPageLayout;
  viewerPreferences?: TViewerPreferences;
};
