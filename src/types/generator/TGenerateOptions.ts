import { PdfPageLayout, PdfPageMode, PdfVersion } from 'enums';
import { TViewerPreferences } from '../TViewerPreferences';

export type TGenerateOptions = {
  margin?: number | [number, number] | [number, number, number, number];
  filename?: string;
  title?: string;
  version?: PdfVersion;
  pageSize?: [number, number];
  resizeScrollElements?: Boolean; // TODO: Not available
  splitElementsOnPageBreak?: Boolean; // TODO: Not available
  ignoreElementsByClass?: string | string[];
  ignoreElements?: string | string[];
  useCustomPageNumbering?: Boolean; // TODO: Not available
  usePageHeaders?: Boolean;
  usePageFooters?: Boolean;
  pageBreakBeforeElements?: string | string[];
  pageBreakAfterElements?: string | string[];
  outlineForHeadings?: Boolean;
  author?: string;
  subject?: string;
  keywords?: string;
  pdfOptions?: {
    // TODO: add this to fillOptions and make it work
    viewerPreferences?: TViewerPreferences;
    pageMode?: PdfPageMode;
    pageLayout?: PdfPageLayout;
  };
  iFrameWidth?: number;
  addFirstPage?: Boolean;
  avoidBreakingElements?: string | string[];
};

export type TFilledGenerateOptions = {
  margin: [number, number, number, number];
  filename: string;
  title: string;
  version: PdfVersion;
  pageSize: [number, number];
  resizeScrollElements: Boolean;
  splitElementsOnPageBreak: Boolean;
  ignoreElementsByClass: string[];
  ignoreElements: string[];
  useCustomPageNumbering: Boolean;
  usePageHeaders: Boolean;
  usePageFooters: Boolean;
  pageBreakBeforeElements: string[];
  pageBreakAfterElements: string[];
  outlineForHeadings: Boolean;
  author: string;
  subject: string;
  keywords: string;
  pdfOptions: {
    viewerPreferences: TViewerPreferences;
    pageMode: PdfPageMode;
    pageLayout: PdfPageLayout;
  };
  iFrameWidth: number;
  addFirstPage: Boolean;
  avoidBreakingElements: string[];
};
