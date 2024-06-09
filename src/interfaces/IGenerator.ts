import { PdfPageLayout, PdfPageMode, PdfVersion } from 'enums';
import PDFDocument from 'pdfDocument';
import Page from 'pdfObjects/IntermediateObjects/Page';
import { TBookmarkObject, TElement, TFontInfo, TGenerateOptions, TInternalLink, TPageObject, TPosition, TRGB, TTextLine } from 'types';

export interface IGenerator {
  title: string;
  version: PdfVersion;
  author: string;
  margin: [number, number, number, number];
  filename: string;
  pageSize: [number, number];
  ignoreElementsByClass: string[];
  ignoreElements: string[];
  usePageHeaders: boolean;
  usePageFooters: boolean;
  pageBreakBeforeElements: string[];
  pageBreakAfterElements: string[];
  outlineForHeadings: boolean;
  subject: string;
  keywords: string;
  pdfOptions: {
    pageMode: PdfPageMode;
    pageLayout: PdfPageLayout;
    viewerPreferences: {
      // hideToolbar: boolean;
      // hideMenubar: boolean;
      // hideWindowUI: boolean;
      // fitToWindow: boolean;
      // centerWindow: boolean;
      displayDocTitle: boolean;
    };
  };
  linkBorderColor?: TRGB;
  linkBorderStroke?: number;
  inputEl: HTMLElement | null;
  availableDefaultPageHeight: number;
  pdf: PDFDocument;
  fontsOfWebsite: Array<TFontInfo>;
  fontsUsedInPDF: Array<{ fontFamily: string; weight: number; style: string; name: string }>; // TODO: Move this into type
  scrollLeft: number;
  scrollTop: number;
  offsetX: number;
  offsetY: number;
  pages: Array<TPageObject>;
  bookmarks: Array<TBookmarkObject>;
  currentHeader: Array<HTMLElement>;
  currentHeaderHeight: number;
  currentFooter: Array<HTMLElement>;
  currentFooterHeight: number;
  currentAvailableHeight: number;
  elementsWithId: Array<{ id: string; page: Page; position: TPosition }>; // TODO: Should be type and maybe a Map
  elementsForEnd: Array<TElement>;
  internalLinkingElements: Array<TInternalLink>;
  startTime?: Date;

  generate(inputEl: HTMLElement): Promise<void>;
  downloadPdf(): void;
  goTroughElements(element: TElement, page?: Page): Promise<void>;
  createTElement(element: HTMLElement): TElement;
  handleTextNode(node: Text, page?: Page): Promise<void>;
  handleElementNode(element: TElement, page?: Page): Promise<void>;
  addExternalLinkToPdf(element: HTMLElement, rect: DOMRect, href: string, page?: Page): void;
  addBackgroundToPdf(computedStyles: CSSStyleDeclaration, rect: DOMRect, isInline?: Boolean, inlinePosition?: 'first' | 'last'|'middle'): void;
  addBordersToPdf(computedStyles: CSSStyleDeclaration, rect: DOMRect, isInline?: Boolean, inlinePosition?: 'first' | 'last'|'middle'): void;
  findBookmarkPosition(
    bookmarks: Array<TBookmarkObject>,
    level: number,
    positionArray: Array<number>,
  ): { bookmarks: Array<TBookmarkObject>; positions: Array<number> }; // TODO: Should be type
  enoughSpaceOnPageForElement(element: HTMLElement | Node, rect: DOMRect): void;
  getTextLinesOfNode(element: Node): Array<TTextLine>;
  addPageToPdf(yPos: number): Promise<void>;
  getFontsOfWebsite(): void;
  hideIgnoredElements(inputEl: HTMLElement): void;
  showIgnoredElements(): void;
  getUsedFont(
    fontFamily: string,
    fontWeight: number | string,
    fontStyle: string,
  ): Promise<TFontInfo>;
}
