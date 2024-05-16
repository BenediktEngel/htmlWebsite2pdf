import PDFDocument from './pdfDocument';
import { IGenerator } from './interfaces';
import {
  TBookmarkObject,
  TFontInfo,
  TFontSrc,
  TGenerateOptions,
  TInternalLink,
  TLinkOptions,
  TPosition,
  TRGB,
  TPageObject,
  TTextNodeData,
  TElement,
} from './types';
import { ImageFormats, PdfPageLayout, PdfPageMode, PdfVersion } from './enums';
import { PageDimensions } from './constants';
import { px, pt, RGBHex, RGB, hashCode, getColorFromCssRGBValue, mm } from './utils';
import Page from 'pdfObjects/IntermediateObjects/Page';

declare global {
  interface Window {
    MSStream: any;
  }
}

export class Generator implements IGenerator {
  /**
   * The title which should be used for the PDF
   * @type {string}
   */
  title: string = '';
  /**
   * The version of the PDF
   * @type {PdfVersion}
   */
  version = PdfVersion.V1_4;
  /**
   * The author of the PDF
   * @type {string}
   */
  author: string = '';
  /**
   * The margin of the PDF, order is [top, right, bottom, left]
   * @type {[number, number, number, number]}
   */
  margin: [number, number, number, number] = [0, 0, 0, 0];
  /**
   * The filename of the PDF
   * @type {string}
   */
  filename: string = 'output.pdf';
  /**
   * The size of the PDF in pt
   * @type {[number, number]}
   */
  pageSize: [number, number] = PageDimensions.A4;
  /**
   * Option if scroll elements should be resized so they are not cut off
   * @type {Boolean}
   */
  resizeScrollElements = true;
  /**
   * Option if elements should be split on page breaks, if false they will be moved to the next page
   * @type {Boolean}
   */
  splitElementsOnPageBreak = true;
  /**
   * Array of class-names of elements which should be ignored
   * @type {string[]}
   */
  ignoreElementsByClass: Array<string> = [];
  /**
   * Array of tag-names of elements which should be ignored
   * @type {string[]}
   */
  ignoreElements: Array<string> = [];
  /**
   * Option if custom page numbering should be used
   * @type {Boolean}
   */
  useCustomPageNumbering = false;
  /**
   * Option if custom page headers should be used
   * @type {Boolean}
   */
  usePageHeaders = false;
  /**
   * Option if custom page footers should be used
   * @type {Boolean}
   */
  usePageFooters: boolean = false;
  /**
   * Array of tag-names of elements before which a page break should be added
   * @type {string[]}
   */
  pageBreakBeforeElements: Array<string> = [];
  /**
   * Array of tag-names of elements after which a page break should be added
   * @type {string[]}
   */
  pageBreakAfterElements: Array<string> = [];
  /**
   * Option if the headings should be added as outline to the PDF
   * @type {Boolean}
   */
  outlineForHeadings = true;
  /**
   * The subject of the PDF
   * @type {string}
   */
  subject: string = '';
  /**
   * The keywords of the PDF
   * @type {string}
   */
  keywords: string = '';
  /**
   * The options for the PDF
   * @type {{viewerPreferences: TViewerPreferences; pageMode: PdfPageMode; pageLayout: PdfPageLayout}}
   */
  pdfOptions = {
    pageMode: PdfPageMode.USE_NONE,
    pageLayout: PdfPageLayout.SINGLE_PAGE,
    viewerPreferences: {
      displayDocTitle: true,
    },
  };
  /**
   * The width of the iFrame which is used to generate the PDF
   * @type {number}
   */
  iFrameWidth = pt.toPx(PageDimensions.A4[0]);
  /**
   * Option if the first page should be added to the PDF (only needed if the first page is not added by the first element)
   * @type {Boolean}
   */
  addFirstPage = true;
  /**
   * The default color of the border of the internal linking elements
   * @type {TRGB|undefined}
   */
  linkBorderColor: TRGB | undefined;
  /**
   * The default stroke of the border of the internal linking elements
   * @type {number|undefined}
   */
  linkBorderStroke: number | undefined;
  /**
   * The element which should be used as the base for generating the PDF
   * @type {HTMLElement | null}
   */
  inputEl: HTMLElement | null = null;
  /**
   * The height of the page without the margins
   * @type {number}
   */
  availableDefaultPageHeight: number;
  /**
   * The PDFDocument instance which is used to create the PDF
   * @type {PDFDocument}
   */
  pdf: PDFDocument;
  /**
   * Array of fonts which are loaded via fontface rules on the website
   * @type {Array<TFontInfo>}
   */
  fontsOfWebsite: Array<TFontInfo> = [];
  /**
   * Array of fonts which are used in the PDF
   * @type {Array<{ fontFamily: string; weight: number; style: string; name: string }>}
   */
  fontsUsedInPDF: Array<{ fontFamily: string; weight: number; style: string; name: string }> = [];
  /**
   * The scrolling offset from the left of the window
   * @type {number}
   */
  scrollLeft = 0;
  /**
   * The scrolling offset from the top of the window
   * @type {number}
   */
  scrollTop = 0;
  /**
   * The offset on the x-axis for placing the elements in the PDF
   * @type {number}
   */
  offsetX = 0;
  /**
   * The current offset on the y-axis while placing the elements in the PDF
   * @type {number}
   */
  offsetY = 0;
  /**
   * Array of all pages which are added to the PDF
   * @type {Array<TPageObject>}
   */
  pages: Array<TPageObject> = [];
  /**
   * Array of all bookmarks (part of the outline) which are added to the PDF
   * @type {Array<TBookmarkObject>}
   */
  bookmarks: Array<TBookmarkObject> = [];
  /**
   * The current header which should be added to each page of the PDF
   * @type {Array<HTMLElement>}
   */
  currentHeader: Array<HTMLElement> = [];
  /**
   * The height of the current header
   * @type {number}
   */
  currentHeaderHeight = 0;
  /**
   * The current footer which should be added to each page of the PDF
   * @type {Array<HTMLElement>}
   */
  currentFooter: Array<HTMLElement> = [];
  /**
   * The height of the current footer
   * @type {number}
   */
  currentFooterHeight = 0;
  /**
   * The current available height on the page for placing the content
   * @type {number}
   */
  currentAvailableHeight = 0;
  /**
   * Array of elements which have an id and are maybe needed for internal linking
   * @type {Array<{ id: string; page: Page; position: TPosition }>}
   */
  elementsWithId: Array<{ id: string; page: Page; position: TPosition; pageId: number }> = [];
  /**
   * Array of elements which are not on the current page and should be placed at the end
   * @type {Array<HTMLElement>}
   */
  elementsForEnd: Array<TElement> = [];
  /**
   * Array of internal linking elements which should be added to the PDF at the end
   * @type {Array<TInternalLink>}
   */
  internalLinkingElements: Array<TInternalLink> = [];
  /**
   * The start time of the generation
   * @type {Date}
   */
  startTime: Date | undefined;
  /**
   * The document of the iframe which is used to generate the PDF
   * @type {Document | undefined}
   */
  iframeDoc: Document | undefined;
  /**
   * The window of the iframe which is used to generate the PDF
   * @type {Window | undefined}
   */
  iframeWin: Window | undefined;
  /**
   * The constructor of the Generator
   * @param {TGenerateOptions} options The options which should be used for generating the PDF
   * @constructor
   * @throws {Error} If options are not valid
   * @returns {void}
   */
  constructor(options: TGenerateOptions) {
    // Check if the options are valid and replace the default values with the given ones
    if (options.margin) {
      if (typeof options.margin === 'number') {
        this.margin = [options.margin, options.margin, options.margin, options.margin];
      } else if (Array.isArray(options.margin) && options.margin.every((el) => typeof el === 'number')) {
        if (options.margin.length === 2) {
          this.margin = [options.margin[0], options.margin[1], options.margin[0], options.margin[1]];
        } else if (options.margin.length === 4) {
          this.margin = options.margin;
        }
      } else {
        throw new Error('Margin must be a number or an array of 2 or 4 numbers');
      }
      this.margin =
        typeof options.margin === 'number'
          ? [options.margin, options.margin, options.margin, options.margin]
          : options.margin.length === 2
          ? [options.margin[0], options.margin[1], options.margin[0], options.margin[1]]
          : options.margin;
    }
    if (options.filename) {
      if (typeof options.filename === 'string') {
        this.filename = options.filename.endsWith('.pdf') ? options.filename : `${options.filename}.pdf`;
      } else {
        throw new Error('Filename must be a string');
      }
    }
    if (options.title) {
      if (typeof options.title === 'string') {
        this.title = options.title;
      } else {
        throw new Error('Title must be a string');
      }
    }
    if (options.version) {
      if (Object.values(PdfVersion).includes(options.version)) {
        this.version = options.version;
      } else {
        throw new Error('Version must be a valid PdfVersion');
      }
    }
    if (options.pageSize) {
      if (Array.isArray(options.pageSize) && options.pageSize.every((el) => typeof el === 'number') && options.pageSize.length === 2) {
        this.pageSize = options.pageSize;
      } else {
        throw new Error('PageSize must be an array of 2 numbers');
      }
    }
    if (options.resizeScrollElements) {
      if (typeof options.resizeScrollElements === 'boolean') {
        this.resizeScrollElements = options.resizeScrollElements;
      } else {
        throw new Error('ResizeScrollElements must be a boolean');
      }
    }
    if (options.splitElementsOnPageBreak) {
      if (typeof options.splitElementsOnPageBreak === 'boolean') {
        this.splitElementsOnPageBreak = options.splitElementsOnPageBreak;
      } else {
        throw new Error('SplitElementsOnPageBreak must be a boolean');
      }
    }
    if (options.ignoreElementsByClass) {
      if (typeof options.ignoreElementsByClass === 'string') {
        this.ignoreElementsByClass = [options.ignoreElementsByClass];
      } else if (Array.isArray(options.ignoreElementsByClass) && options.ignoreElementsByClass.every((el) => typeof el === 'string')) {
        this.ignoreElementsByClass = options.ignoreElementsByClass;
      } else {
        throw new Error('IgnoreElementsByClass must be a string or an array of strings');
      }
    }
    if (options.ignoreElements) {
      if (typeof options.ignoreElements === 'string') {
        this.ignoreElements = [options.ignoreElements];
      } else if (Array.isArray(options.ignoreElements) && options.ignoreElements.every((el) => typeof el === 'string')) {
        this.ignoreElements = options.ignoreElements;
      } else {
        throw new Error('IgnoreElements must be a string or an array of strings');
      }
    }
    if (options.useCustomPageNumbering) {
      if (typeof options.useCustomPageNumbering === 'boolean') {
        this.useCustomPageNumbering = options.useCustomPageNumbering;
      } else {
        throw new Error('UseCustomPageNumbering must be a boolean');
      }
    }
    if (options.usePageHeaders) {
      if (typeof options.usePageHeaders === 'boolean') {
        this.usePageHeaders = options.usePageHeaders;
      } else {
        throw new Error('UsePageHeaders must be a boolean');
      }
    }
    if (options.usePageFooters) {
      if (typeof options.usePageFooters === 'boolean') {
        this.usePageFooters = options.usePageFooters;
      } else {
        throw new Error('UsePageFooters must be a boolean');
      }
    }
    if (options.pageBreakBeforeElements) {
      if (typeof options.pageBreakBeforeElements === 'string') {
        this.pageBreakBeforeElements = [options.pageBreakBeforeElements];
      } else if (Array.isArray(options.pageBreakBeforeElements) && options.pageBreakBeforeElements.every((el) => typeof el === 'string')) {
        this.pageBreakBeforeElements = options.pageBreakBeforeElements;
      } else {
        throw new Error('PageBreakBeforeElements must be a string or an array of strings');
      }
    }
    if (options.pageBreakAfterElements) {
      if (typeof options.pageBreakAfterElements === 'string') {
        this.pageBreakAfterElements = [options.pageBreakAfterElements];
      } else if (Array.isArray(options.pageBreakAfterElements) && options.pageBreakAfterElements.every((el) => typeof el === 'string')) {
        this.pageBreakAfterElements = options.pageBreakAfterElements;
      } else {
        throw new Error('PageBreakAfterElements must be a string or an array of strings');
      }
    }
    if (options.outlineForHeadings) {
      if (typeof options.outlineForHeadings === 'boolean') {
        this.outlineForHeadings = options.outlineForHeadings;
      } else {
        throw new Error('OutlineForHeadings must be a boolean');
      }
    }
    if (options.author) {
      if (typeof options.author === 'string') {
        this.author = options.author;
      } else {
        throw new Error('Author must be a string');
      }
    }
    if (options.subject) {
      if (typeof options.subject === 'string') {
        this.subject = options.subject;
      } else {
        throw new Error('Subject must be a string');
      }
    }
    if (options.keywords) {
      if (typeof options.keywords === 'string') {
        this.keywords = options.keywords;
      } else {
        throw new Error('Keywords must be a string');
      }
    }
    // TODO: Also set linkBorderColor and linkBorderStroke if they exist
    if (options.pdfOptions) {
      if (options.pdfOptions.viewerPreferences) {
        if (typeof options.pdfOptions.viewerPreferences.displayDocTitle === 'boolean') {
          this.pdfOptions.viewerPreferences.displayDocTitle = options.pdfOptions.viewerPreferences.displayDocTitle;
        } else {
          throw new Error('DisplayDocTitle must be a boolean');
        }
      }
      if (options.pdfOptions.pageMode) {
        if (Object.values(PdfPageMode).includes(options.pdfOptions.pageMode)) {
          this.pdfOptions.pageMode = options.pdfOptions.pageMode;
        } else {
          throw new Error('PageMode must be a valid PdfPageMode');
        }
      }
      if (options.pdfOptions.pageLayout) {
        if (Object.values(PdfPageLayout).includes(options.pdfOptions.pageLayout)) {
          this.pdfOptions.pageLayout = options.pdfOptions.pageLayout;
        } else {
          throw new Error('PageLayout must be a valid PdfPageLayout');
        }
      }
    }
    if (options.iFrameWidth) {
      if (typeof options.iFrameWidth === 'number') {
        this.iFrameWidth = options.iFrameWidth;
      } else {
        throw new Error('iFrameWidth must be a number');
      }
    } else {
      this.iFrameWidth = pt.toPx(this.pageSize[0]);
    }
    if (options.addFirstPage !== undefined) {
      if (typeof options.addFirstPage === 'boolean') {
        this.addFirstPage = options.addFirstPage;
      } else {
        throw new Error('AddFirstPage must be a boolean');
      }
    }

    // Calculate the available height of the page for placing the content
    this.availableDefaultPageHeight = this.pageSize[1] - px.toPt(this.margin[0] + this.margin[2]);
    this.currentAvailableHeight = this.availableDefaultPageHeight;

    // Create the PDFDocument
    this.pdf = new PDFDocument({
      title: this.title,
      version: this.version,
      author: this.author,
      subject: this.subject,
      keywords: this.keywords,
      pageMode: this.pdfOptions.pageMode,
      pageLayout: this.pdfOptions.pageLayout,
      viewerPreferences: this.pdfOptions.viewerPreferences,
    });
  }

  /**
   * Generates a PDF from the given element
   * @param {HTMLElement} inputEl The element which should be used as the baseelement to generate the PDF
   */
  async generate(inputEl: HTMLElement): Promise<void> {
    // Set the start time
    this.startTime = new Date();
    // Set the input element
    this.inputEl = inputEl;
    // Move the whole page into an iframe, so the sizing is also on mobile devices correct and the user can still interact with the page
    await this.moveContentToIFrame();
    // Hide all elements which should be ignored
    this.hideIgnoredElements();
    // Get all fonts which are used in the stylesheets
    this.getFontsOfWebsite();
    // Calculate the offset on the x-axis (scrollLeft is needed if window is smaller than the page and it is scrolled)
    this.scrollLeft = this.iframeDoc.documentElement.scrollLeft || this.iframeDoc.body.scrollLeft;
    this.offsetX = this.inputEl.getBoundingClientRect().x + this.scrollLeft;
    // Scroll-Offset if the page is scrolled, needed to calculate the position of the elements
    this.scrollTop = this.iframeDoc.documentElement.scrollTop || this.iframeDoc.body.scrollTop;
    this.offsetY = this.inputEl.getBoundingClientRect().y + this.scrollTop;
    // Add the first page to the PDF
    if (this.addFirstPage) this.addPageToPdf(this.offsetY);
    // Go trough all elements and place them in the PDF, starting with the input element
    await this.goTroughElements(this.createTElement(this.inputEl));

    // Add all internal links to the PDF
    this.addInternalLinks();

    // Now we add all Elements where the position in the Markup didn't fit the current Pages and all Elements with content which comes from us.
    await this.addElementsForEnd();
    // Remove the iframe from the document
    document.body.removeChild(document.querySelector('[data-html-website2pdf-iframe="true"]') as HTMLElement);

    // we dont need to show the ignored elements, because we are in an iframe, but if there is an option to dont use an iframe we should show them
    // this.showIgnoredElements();

    // Save the pdf to a file
    this.downloadPdf();

    console.warn('Time needed for Generation:', (new Date().getTime() - this.startTime.getTime()) * 0.001, 's');
  }

  async moveContentToIFrame() {
    // Add an identifier to the input element so we can find it in the iframe
    this.inputEl.setAttribute('data-htmlWebsite2pdf-inputEl', 'true');

    // Create an iframe, move it out of the viewport
    let iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    // Set the width of the iframe to the page width
    iframe.style.width = `${this.iFrameWidth}px`;
    iframe.setAttribute('sandbox', 'allow-same-origin');

    // Set the content of the iframe to the current page
    iframe.srcdoc = `${document.documentElement.outerHTML}`;
    iframe.dataset.htmlWebsite2pdfIframe = 'true';
    document.body.appendChild(iframe);
    function waitForIFrameLoad(): Promise<void> {
      return new Promise((resolve, reject) => {
        iframe.addEventListener('load', () => {
          resolve();
        });
      });
    }
    // Wait for the iframe to load
    await waitForIFrameLoad();

    // Get the document of the iframe
    this.iframeDoc = iframe.contentWindow.document;
    this.iframeWin = iframe.contentWindow;
    // Get the input element from the iframe
    this.inputEl = this.iframeDoc.querySelector('[data-htmlWebsite2pdf-inputEl]');
  }

  /**
   * Starts the download of the generated PDF
   * @returns {void}
   */
  downloadPdf(): void {
    // Get the PDF as a buffer
    const pdfBuffer = this.pdf.outputFileAsBuffer();
    // create a blob and a url for the blob
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
      // Safari on iOS needs to open the PDF in a new window
      window.open(url, '_blank');
    } else {
      // All other browsers can download the PDF
      // So we create a link and click it
      const a = document.createElement('a');
      a.href = url;
      a.download = this.filename;
      a.click();
    }
  }

  /**
   * Goes through all children of the given element and places them in the PDF
   * @param {TElement} element The element which should be used as the baseelement to check the children
   * @param {Page | undefined} page The page on which the element should be placed
   * @returns {Promise<void>}
   */
  async goTroughElements(element: TElement, page?: Page): Promise<void> {
    for (const child of element.el.childNodes as any) {
      let pageHeader = null;
      let pageFooter = null;
      if (child instanceof HTMLElement && this.iframeWin.getComputedStyle(child).display === 'none') {
        continue;
      }
      if (child.dataset?.htmlwebsite2pdfPagenumberbyid) {
        // Should get filled and placed at the end
        this.elementsForEnd.push(this.createTElement(child));
        continue;
      }
      if (child.dataset?.htmlwebsite2pdfCurrentpagenumber !== undefined) {
        // TODO: Issue here is that the page is not already set into the pages array
        child.innerText = this.pages[this.pages.length - 1].pageNumber + 1;
      }

      switch (child.nodeType) {
        case 1: // Element
          if (['script', 'style'].includes(child.tagName.toLowerCase())) break;
          // check if one child is Header or footer and safe it
          const headerFooterResult = this.checkForPageHeaderFooter(child);
          pageHeader = headerFooterResult.pageHeader;
          pageFooter = headerFooterResult.pageFooter;
          await this.handleElementNode(this.createTElement(child), page);
          break;
        case 3: // Text
          await this.handleTextNode(child, page);
          break;
        default:
          // All other nodeTypes are not supported (and not needed), so we ignore them
          break;
      }

      // Remove the header and footer cause they are not needed anymore
      if (pageHeader) {
        let lastHeader = this.currentHeader.pop();
        if (lastHeader) this.iframeDoc.body.removeChild(lastHeader);
      }
      if (pageFooter) {
        let lastFooter = this.currentFooter.pop();
        if (lastFooter) this.iframeDoc.body.removeChild(lastFooter);
      }
    }
  }

  checkForPageHeaderFooter(child: Element): { pageHeader: Element; pageFooter: Element } {
    let pageHeader = null;
    let pageFooter = null;
    if (this.usePageHeaders) {
      pageHeader = child.querySelector(':scope >[data-htmlWebsite2pdf-header]');
      if (pageHeader !== null) {
        let header = this.iframeDoc.createElement('div');
        header.innerHTML = pageHeader.innerHTML;
        this.iframeDoc.body.appendChild(header);
        this.currentHeader.push(header);
      }
    }
    if (this.usePageFooters) {
      pageFooter = child.querySelector(':scope >[data-htmlWebsite2pdf-footer]');
      if (pageFooter !== null) {
        let footer = this.iframeDoc.createElement('div');
        footer.innerHTML = pageFooter.innerHTML;
        this.iframeDoc.body.appendChild(footer);
        this.currentFooter.push(footer);
      }
    }
    // TODO: maybe only return true or false to save memory
    return { pageHeader, pageFooter };
  }

  createTElement(el: HTMLElement): TElement {
    const isTextNode = el.nodeType === 3;
    const rect = isTextNode ? el.parentElement.getBoundingClientRect() : el.getBoundingClientRect();
    const styles = this.iframeWin.getComputedStyle(isTextNode ? el.parentElement : el);
    return { el, rect, styles };
  }

  /**
   * Handles a text node and places it in the PDF
   * @param {Text} node The text node which should be placed in the PDF
   * @param {Page | undefined} page The page on which the text should be placed
   * @returns {Promise<void>}
   */
  async handleTextNode(node: Text, page?: Page): Promise<void> {
    const textNodes: Array<TTextNodeData> = this.getTextLinesOfNode(node);
    for (const element of textNodes) {
      // Get the font of the node, and add it to the pdf if it is not already added
      const fontOfNode = element.styles.fontFamily.split(',')[0].replace(/['"]+/g, '');
      const usedFont = await this.getUsedFont(fontOfNode, parseInt(element.styles.fontWeight), element.styles.fontStyle);

      const options = { maxWidth: px.toPt(element.position.width), color: getColorFromCssRGBValue(element.styles.color) };

      // Check if the element fits on the current page, if not add a new page
      await this.enoughSpaceOnPageForElement(node, element.position);
      if (element.styles.display === 'inline' || element.styles.display === 'inline-block') {
        this.addBackgroundToPdf(element.styles, element.position);
        this.addBordersToPdf(element.styles, element.position);
      }

      // This is a workaround to place the text more correct (Problem are the descender and ascender of the font, which is not included in the font-size but in the element height)
      const textOffset = element.position.height - parseInt(element.styles.fontSize.replace('px', ''));
      if (element.styles.textAlign === 'justify' && element.wordWidths.length > 2) {
        let words = element.text.split(' ');
        words.forEach((word, idx) => {
          if (word === '') {
            if (idx - 1 < 0) {
              words[idx + 1] = ` ${words[idx + 1]} `;
            } else {
              words[idx - 1] = `${words[idx - 1]} `;
            }
            words.splice(idx, 1);
          } else {
            words[idx] = `${words[idx]} `;
          }
        });
        words.forEach((word, idx) => {
          let wordOffset = 0;
          if (idx > 0) {
            wordOffset = element.wordWidths.slice(0, idx).reduce((a, b) => a + b, 0);
            wordOffset += element.wordSpacing * idx;
          }
          // TODO: if word starts with space add additional wordspacing offset
          this.addTextToPdf(
            word,
            element.position,
            usedFont.name,
            parseInt(element.styles.fontSize.replace('px', '')),
            options,
            textOffset,
            wordOffset,
            page,
          );
        });
      } else {
        this.addTextToPdf(
          element.text,
          element.position,
          usedFont.name,
          parseInt(element.styles.fontSize.replace('px', '')),
          options,
          textOffset,
          0,
          page,
        );
      }
    }
  }

  addTextToPdf(
    text: string,
    position: DOMRect,
    fontName: string,
    fontSize: number,
    options: { maxWidth: number; color: TRGB },
    textOffset: number,
    wordOffset: number,
    page?: Page,
  ): void {
    this.pdf.addTextToPage(
      {
        x: px.toPt(position.x - this.offsetX + wordOffset) + this.margin[3], // TODO: shouldnt this be the second?
        y: this.pageSize[1] - +px.toPt(position.bottom + this.scrollTop - this.offsetY - textOffset) - this.margin[1] - this.currentHeaderHeight,
      },
      text,
      fontName,
      px.toPt(fontSize),
      options,
      page,
    );
  }

  /**
   * Handles an element node, checks for parts with should be placed in the PDF and places them in the PDF
   * @param {TElement} element The element which should be placed in the PDF
   * @returns {Promise<void>}
   */
  async handleElementNode(element: TElement, page?: Page): Promise<void> {
    // TODO: Check if we have styling which is needed to be added to the pdf
    if (this.pageBreakBeforeElements.includes(element.el.tagName.toLowerCase())) {
      await this.addPageToPdf(element.rect.top);
    }
    // Before we do anything we check if it fits on the current page
    await this.enoughSpaceOnPageForElement(element.el, element.rect);
    // TODO: Maybe add here the check if we need a new page
    if (element.styles.display !== 'inline-block' && element.styles.display !== 'inline') {
      // Only add borders to block elements, because inline elements the childNodes get the border
      this.addBordersToPdf(element.styles, element.rect);
      this.addBackgroundToPdf(element.styles, element.rect);
    }
    if (element.el.id) {
      this.elementsWithId.push({
        id: element.el.id,
        page: this.pdf.getCurrentPage(),
        pageId: this.pages.length - 1,
        position: {
          x: element.rect.left + this.scrollLeft - this.offsetX,
          y: element.rect.top + this.scrollTop - this.offsetY,
        },
      });
    }
    switch (element.el.tagName.toLowerCase()) {
      case 'img':
        // TODO: specialcase padding is included in the size of the image
        // If clause is only needed for linting, because we already checked the tagName
        await this.enoughSpaceOnPageForElement(element.el, element.rect);
        // Create a canvas and draw the image on it, so we can get the image as a jpeg anyway (also if it is a svg, etc.)
        const canvas = document.createElement('canvas');
        canvas.width = (element.el as HTMLImageElement).naturalWidth;
        canvas.height = (element.el as HTMLImageElement).naturalHeight;
        canvas.getContext('2d').drawImage(element.el as HTMLImageElement, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        const imgData = await fetch(imageData).then((res) => res.arrayBuffer());
        this.pdf.addImageToPage(
          {
            x: px.toPt(element.rect.x - this.offsetX),
            y:
              this.pageSize[1] -
              +px.toPt(element.rect.y + this.scrollTop - this.offsetY + (element.el as HTMLImageElement).height) +
              -this.margin[1] -
              this.currentHeaderHeight,
          },
          imgData as Buffer,
          (element.el as HTMLImageElement).naturalWidth,
          (element.el as HTMLImageElement).naturalHeight,
          px.toPt((element.el as HTMLImageElement).width),
          px.toPt((element.el as HTMLImageElement).height),
          ImageFormats.JPEG,
          hashCode((element.el as HTMLImageElement).src).toString(),
          page,
        );

        break;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        if (this.outlineForHeadings && element.el.dataset.htmlwebsite2pdfNoOutline === undefined) {
          await this.enoughSpaceOnPageForElement(element.el, element.rect);
          const positionResult = this.findBookmarkPosition(this.bookmarks, parseInt(element.el.tagName[1]));
          positionResult.positions.pop();
          this.bookmarks = positionResult.bookmarks;
          this.pdf.addBookmark(element.el.innerText!.trim().replace(/\s+/g, ' '), this.pdf.getCurrentPage(), positionResult.positions);
        }
        break;
      case 'a':
        const href = (element.el as HTMLAnchorElement).href;
        if (href === window.location.origin) {
          // Link with the same href as the current page, so we link external to the website
          this.addExternalLinkToPdf(element.el, element.rect, href, this.pdf.getCurrentPage());
        } else if (href.startsWith(window.location.origin)) {
          // Link to the same website
          const targetId = element.el.getAttribute('href')!.replace(`${window.location.origin}`, '');
          const targetElement = this.inputEl!.querySelector(targetId);
          if (targetElement) {
            // TODO: This should be after the element is placed on the page, cause sometimes it doesn't fit on the current page
            this.internalLinkingElements.push({
              id: targetId,
              page: this.pdf.getCurrentPage(),
              borderColor: element.el.dataset.htmlWebsite2pdfBorderColor,
              borderStroke: element.el.dataset.htmlWebsite2pdfBorderStroke ? parseInt(element.el.dataset.htmlWebsite2pdfBorderStroke) : undefined,
              position: {
                x: px.toPt(element.rect.left + this.scrollLeft - this.offsetX),
                y: this.pageSize[1] - px.toPt(element.rect.bottom + this.scrollTop - this.offsetY) + -this.margin[1] - this.currentHeaderHeight,
              },
              width: px.toPt(element.rect.width),
              height: px.toPt(element.rect.height),
              el: element.el,
            });
          } else {
            // didn't find the target element on the inputElement, so we link external
            this.addExternalLinkToPdf(element.el, element.rect, href, this.pdf.getCurrentPage());
          }
        } else {
          this.addExternalLinkToPdf(element.el, element.rect, href, this.pdf.getCurrentPage());
        }

        break;
      default:
        // There are no special cases for the element or they are not implemented yet
        break;
    }
    await this.goTroughElements(element, page);
    if (this.pageBreakAfterElements.includes(element.el.tagName.toLowerCase())) {
      await this.addPageToPdf(element.rect.bottom);
    }
  }

  /**
   * Add an external link to the PDF
   * @param {HTMLElement} element The anchor element which should be linked
   * @param {DOMRect} rect The bounding rect of the element
   * @param {Page|undefined} page The page on which the element should be placed, if undefined the current page is used
   * @param {string} href The href of the element
   */
  addExternalLinkToPdf(element: HTMLElement, rect: DOMRect, href: string, page?: Page) {
    let borderColor = this.linkBorderColor;
    let borderStroke = this.linkBorderStroke;
    if (element.dataset.htmlWebsite2pdfBorderColor) {
      borderColor = RGB.changeRange1(RGBHex.toRGB(element.dataset.htmlWebsite2pdfBorderColor));
    }
    if (element.dataset.htmlWebsite2pdfBorderStroke) {
      borderStroke = parseInt(element.dataset.htmlWebsite2pdfBorderStroke);
    }
    const linkOptions: TLinkOptions = {};
    if (borderColor) {
      linkOptions.border = {
        color: borderColor,
        width: borderStroke,
      };
    }
    this.pdf.addExternalLink(
      {
        x: px.toPt(rect.left + this.scrollLeft - this.offsetX),
        y: this.pageSize[1] - px.toPt(rect.bottom + this.scrollTop - this.offsetY) + -this.margin[1] - this.currentHeaderHeight,
      },
      px.toPt(rect.width),
      px.toPt(rect.height),
      page,
      href,
      linkOptions, // TODO: add Link Options
    );
  }

  /**
   * Adds a coloured rectangle to the PDF as a background for the element
   * @param {CSSStyleDeclaration} computedStyles The computed styles of the element
   * @param {DOMRect} rect  The bounding rect of the element
   */
  addBackgroundToPdf(computedStyles: CSSStyleDeclaration, rect: DOMRect) {
    // TODO: Change this to also use a given page
    // TODO: Check also for transparency
    // TODO: Check for gradients
    // TODO: Check for background images
    if (
      computedStyles.backgroundColor !== 'rgb(0, 0, 0)' &&
      !computedStyles.backgroundColor.includes('rgba(0, 0, 0, 0)') &&
      !computedStyles.backgroundColor.includes('rgb(255, 255, 255)')
    ) {
      this.pdf.drawRectangleToPage(
        {
          x: px.toPt(rect.x - this.offsetX),
          y: this.pageSize[1] - +px.toPt(rect.bottom + this.scrollTop - this.offsetY) + -this.margin[1] - this.currentHeaderHeight,
        },
        px.toPt(rect.width),
        px.toPt(rect.height),
        { fillColor: getColorFromCssRGBValue(computedStyles.backgroundColor) },
      );
    }
  }

  /**
   * Adds the borders of the element to the PDF as lines
   * @param {CSSStyleDeclaration} computedStyles the computed styles of the element
   * @param {DOMRect} rect the bounding rect of the element
   * @param {HTMLElement|undefined} element the element which should be added to the PDF
   */
  addBordersToPdf(computedStyles: CSSStyleDeclaration, rect: DOMRect, element?: HTMLElement) {
    if (computedStyles.borderTopWidth !== '0px' && computedStyles.borderTopStyle !== 'none') {
      // TODO: this can only straight lines in an 90degree angle, not curved or shifted and also not dashed or dotted
      this.pdf.drawLineToPage(
        {
          x: px.toPt(rect.x - this.offsetX),
          y: this.pageSize[1] - +px.toPt(rect.y + this.scrollTop - this.offsetY) + -this.margin[1] - this.currentHeaderHeight,
        },
        {
          x: px.toPt(rect.x - this.offsetX + rect.width),
          y: this.pageSize[1] - +px.toPt(rect.y + this.scrollTop - this.offsetY) + -this.margin[1] - this.currentHeaderHeight,
        },
        {
          strokeColor: getColorFromCssRGBValue(computedStyles.borderTopColor),
          strokeWidth: px.toPt(parseInt(computedStyles.borderTopWidth.replace('px', ''))),
        },
      );
    }
    if (computedStyles.borderBottomWidth !== '0px' && computedStyles.borderBottomStyle !== 'none') {
      // TODO: this can only straight lines in an 90degree angle, not curved or shifted and also not dashed or dotted
      this.pdf.drawLineToPage(
        {
          x: px.toPt(rect.x - this.offsetX),
          y: this.pageSize[1] - +px.toPt(rect.bottom + this.scrollTop - this.offsetY) + -this.margin[1] - this.currentHeaderHeight,
        },
        {
          x: px.toPt(rect.x - this.offsetX + rect.width),
          y: this.pageSize[1] - +px.toPt(rect.bottom + this.scrollTop - this.offsetY) + -this.margin[1] - this.currentHeaderHeight,
        },
        {
          strokeColor: getColorFromCssRGBValue(computedStyles.borderBottomColor),
          strokeWidth: px.toPt(parseInt(computedStyles.borderBottomWidth.replace('px', ''))),
        },
      );
    }
    if (computedStyles.borderLeftWidth !== '0px' && computedStyles.borderLeftStyle !== 'none') {
      // TODO: this can only straight lines in an 90degree angle, not curved or shifted and also not dashed or dotted
      this.pdf.drawLineToPage(
        {
          x: px.toPt(rect.x - this.offsetX),
          y: this.pageSize[1] - +px.toPt(rect.top + this.scrollTop - this.offsetY) + -this.margin[1] - this.currentHeaderHeight,
        },
        {
          x: px.toPt(rect.x - this.offsetX),
          y: this.pageSize[1] - +px.toPt(rect.bottom + this.scrollTop - this.offsetY) + -this.margin[1] - this.currentHeaderHeight,
        },
        {
          strokeColor: getColorFromCssRGBValue(computedStyles.borderLeftColor),
          strokeWidth: px.toPt(parseInt(computedStyles.borderLeftWidth.replace('px', ''))),
        },
      );
    }
    if (computedStyles.borderRightWidth !== '0px' && computedStyles.borderRightStyle !== 'none') {
      // TODO: this can only straight lines in an 90degree angle, not curved or shifted and also not dashed or dotted
      this.pdf.drawLineToPage(
        {
          x: px.toPt(rect.x - this.offsetX + rect.width),
          y: this.pageSize[1] - +px.toPt(rect.top + this.scrollTop - this.offsetY) + -this.margin[1] - this.currentHeaderHeight,
        },
        {
          x: px.toPt(rect.x - this.offsetX + rect.width),
          y: this.pageSize[1] - +px.toPt(rect.bottom + this.scrollTop - this.offsetY) + -this.margin[1] - this.currentHeaderHeight,
        },
        {
          strokeColor: getColorFromCssRGBValue(computedStyles.borderRightColor),
          strokeWidth: px.toPt(parseInt(computedStyles.borderRightWidth.replace('px', ''))),
        },
      );
    }
  }

  /**
   * Finds the Position of the new Bookmark relative to the current bookmarks and the Heading Level
   * @param {Array<TBookmarkObject>} bookmarks Array of current bookmarks
   * @param {number} level The level of the heading
   * @param {Array<number>} positionArray The current position in the bookmarks
   * @returns { {bookmarks: Array<TBookmarkObject>; positions: Array<number>} } The new bookmarks with the added bookmark
   */
  findBookmarkPosition(
    bookmarks: Array<TBookmarkObject>,
    level: number,
    positionArray: Array<number> = [],
  ): { bookmarks: Array<TBookmarkObject>; positions: Array<number> } {
    if (!bookmarks.length || bookmarks[bookmarks.length - 1].level === level) {
      bookmarks.push({ level, children: [] });
      return { bookmarks, positions: [...positionArray, bookmarks.length] };
    } else {
      let result = this.findBookmarkPosition(bookmarks[bookmarks.length - 1].children, level, [...positionArray, bookmarks.length]);
      bookmarks[bookmarks.length - 1].children = result.bookmarks;
      return { bookmarks, positions: result.positions };
    }
  }

  /**
   * Check if there is enough space on the page for the element, if not add a new page
   * @param {HTMLElement|Node} element The element which should be checked
   * @param {number} bottom The bottom position of the element
   * @param {number} top The top position of the element
   * @returns
   */
  async enoughSpaceOnPageForElement(element: HTMLElement | Node, rect: DOMRect) {
    if (element instanceof HTMLElement && this.iframeWin.getComputedStyle(element).display === 'none') {
      return;
    }
    const yPos = this.currentAvailableHeight - +px.toPt(rect.bottom + this.scrollTop - this.offsetY);
    if (yPos >= 0) {
      return;
    }
    if (element instanceof HTMLElement && this.currentAvailableHeight < px.toPt(rect.height)) {
      // TODO: Element is larger than the page, we ignore it for now and hope its only a wrapper
      console.warn('Element is larger than the page:', element);
    } else if (yPos < 0 && ((element.childNodes.length === 1 && element.childNodes[0].nodeType !== 3) || element.childNodes.length < 1)) {
      // TODO: We ignore elements which have children so that text breaks in lines instead of the parent
      console.log('Not enough space on the page for the element:', element);
      // TODO: check if it would be on the next page, if not push it into placeLater-Array
      await this.addPageToPdf(rect.top);
    }
  }

  /**
   * Gets all text lines  of a textNode and returns them as an array which contains the text, the styles and the position of the textline
   * @param {Text} element The textNode which should be used to get the text lines
   * @returns {Array<TTextNodeData>} The array of the text lines
   */

  getTextLinesOfNode(element: Text): Array<TTextNodeData> {
    // If the textNode is empty we return an empty array
    if (element.data.replace(/[\n\t\r\s]/g, '').replace(/  /g, '').length === 0) {
      return [];
    }
    const textWithStyles: Array<TTextNodeData> = [];
    let textOfNode = '';
    if (!['CODE', 'PRE'].includes(element.parentElement?.nodeName!)) {
      element.data = element.data.replace(/[\n\t\r]/g, '').replace(/  /g, '');
      textOfNode = element.data!;
    } else {
      element.data = element.data.replace(/[\r]/g, '').replace(/\t/g, ' ').replace(/  /g, '');
      textOfNode = element.data!;
    }
    const range = this.iframeDoc.createRange();
    range.selectNodeContents(element);
    const rects = range.getClientRects();

    const computedStyle = this.iframeWin.getComputedStyle(element.parentElement!);
    // If the textNode is only one line and the textAlign is not justify we can return the textNode as one line
    if (rects.length === 1 && computedStyle.textAlign !== 'justify') {
      return [
        {
          text: textOfNode.replace('\n', ' '),
          position: rects[0],
          styles: computedStyle,
          wordSpacing: 0,
          wordWidths: [],
        },
      ];
    }
    Array.from(rects).forEach((rect) => {
      let text = '';
      // Split text content to get only the text in the current rect
      let tempEl = this.iframeDoc.createElement('span');
      tempEl.style.setProperty('font-style', computedStyle.fontStyle);
      tempEl.style.setProperty('font-weight', computedStyle.fontWeight);
      tempEl.style.setProperty('font-size', computedStyle.fontSize);
      tempEl.style.setProperty('font-family', computedStyle.fontFamily);
      this.iframeDoc.body.appendChild(tempEl);
      for (let i = 1; i <= textOfNode.length; i++) {
        tempEl.textContent = textOfNode.slice(0, i);
        text = textOfNode.slice(0, i);
        const tempElWidth = tempEl.getBoundingClientRect().width;
        if (tempElWidth > rect.width) {
          // If we are getting bigger than the rect, we have text justify so we need to cut at the last space or hyphen
          const lastSpace = text.lastIndexOf(' ');
          const lastHyphen = text.lastIndexOf('-');
          if (lastSpace > 0 || lastHyphen > 0) {
            text = text.slice(0, lastSpace > lastHyphen ? lastSpace + 1 : lastHyphen + 1);
          }
          break;
        } else if (tempElWidth === rect.width) {
          if (textOfNode.slice(i, i + 1) == ' ') {
            text = textOfNode.slice(0, i + 1);
          }
          break;
        }
      }

      const wordWidths = [];
      let wordSpacing = 0;

      if (computedStyle.textAlign === 'justify') {
        let words = text.split(' ');
        words.forEach((word, idx) => {
          if (word === '') {
            if (idx - 1 < 0) {
              words[idx + 1] = ` ${words[idx + 1]} `;
            } else {
              words[idx - 1] = `${words[idx - 1]} `;
            }
            words.splice(idx, 1);
          } else {
            words[idx] = `${words[idx]} `;
          }
        });
        if (words.length > 1) {
          words.forEach((word) => {
            tempEl.textContent = word;
            wordWidths.push(tempEl.getBoundingClientRect().width);
          });
          tempEl.textContent = text;
          let spaceCount = (text.match(/ /g) || []).length;
          wordSpacing = (rect.width - wordWidths.reduce((a, b) => a + b, 0)) / spaceCount;
        }
      }
      this.iframeDoc.body.removeChild(tempEl);

      textOfNode = textOfNode.slice(text.length);

      textWithStyles.push({
        text: text.replace('\n', ' '),
        position: rect,
        styles: computedStyle,
        wordSpacing,
        wordWidths,
      });
    });
    return textWithStyles;
  }

  /**
   * Adds a new page to the PDF
   * @param {number} yPos The starting position of the new page+
   * @returns {Promise<void>}
   */
  async addPageToPdf(yPos: number) {
    this.offsetY = yPos + this.scrollTop;
    this.pdf.addPage(this.pageSize);
    this.currentAvailableHeight = this.availableDefaultPageHeight;
    this.currentHeaderHeight = 0;
    this.currentFooterHeight = 0;
    if (this.usePageHeaders && this.currentHeader.length) {
      let tempOffsetY = this.offsetY;
      let tempOffsetX = this.offsetX;
      const currentHeaderRect = this.currentHeader[this.currentHeader.length - 1].getBoundingClientRect();
      this.offsetY = currentHeaderRect.top + this.scrollTop;
      this.offsetX = currentHeaderRect.left + this.scrollLeft;
      await this.goTroughElements(this.createTElement(this.currentHeader[this.currentHeader.length - 1]));
      this.offsetY = tempOffsetY;
      this.offsetX = tempOffsetX;
      this.currentHeaderHeight = px.toPt(currentHeaderRect.height);
    }
    if (this.usePageFooters && this.currentFooter.length) {
      let tempOffsetY = this.offsetY;
      let tempOffsetX = this.offsetX;
      let tempHeight = this.pageSize[1];
      const currentFooterRect = this.currentFooter[this.currentFooter.length - 1].getBoundingClientRect();
      this.offsetY = currentFooterRect.top + this.scrollTop;
      this.offsetX = currentFooterRect.left + this.scrollLeft;
      this.pageSize[1] = px.toPt(currentFooterRect.height) + this.margin[1] + this.margin[3] + this.currentHeaderHeight;
      await this.goTroughElements(this.createTElement(this.currentFooter[this.currentFooter.length - 1]));
      this.offsetY = tempOffsetY;
      this.offsetX = tempOffsetX;
      this.pageSize[1] = tempHeight;
      this.currentFooterHeight = px.toPt(currentFooterRect.height);
    }
    this.currentAvailableHeight -= this.currentHeaderHeight + this.currentFooterHeight;
    if (this.pages.length) {
      this.pages[this.pages.length - 1].yEnd = this.offsetY;
    }
    this.pages.push({
      pdfPage: this.pdf.getCurrentPage(),
      pageNumber: this.pages.length + 1,
      yStart: this.offsetY,
      yEnd: this.offsetY + pt.toPx(this.currentAvailableHeight),
      headerOffset: this.currentHeaderHeight,
      footerOffset: this.currentFooterHeight,
    });
  }

  /**
   * Get the fonts which are used in the document from their font-face rules
   * @returns {void}
   */
  getFontsOfWebsite(): void {
    // FEATURE: Here we could also add support for local fonts which are not loaded from a stylesheet, via local font api
    // Iterate through all stylesheets
    const filteredStylesheets = Array.from(document.styleSheets).filter((styleSheet) => styleSheet.href && styleSheet.cssRules);
    for (const styleSheet of filteredStylesheets) {
      // Check if the stylesheet is loaded
      // Iterate through all rules of the stylesheet
      const filteredRules = Array.from(styleSheet.cssRules).filter((rule) => rule instanceof CSSFontFaceRule) as Array<CSSFontFaceRule>;
      for (const rule of filteredRules) {
        const font = {
          src: [],
          weight: 400,
          inPDF: false,
          family: undefined,
          stretch: undefined,
          style: undefined,
          name: undefined,
        };
        rule.style
          .getPropertyValue('src')
          .split(',')
          .forEach((src) => {
            const urlMatch = src.match(/url\(["']?([^"']+)["']?\)/);
            let url = urlMatch ? urlMatch[1] : '';
            if (url && url.startsWith('.')) {
              url = styleSheet.href!.replace(/\/[^\/]+$/, '') + '/' + url;
            }

            const formatMatch = src.match(/format\(["']?([^"']+)["']?\)/);
            const format = formatMatch ? formatMatch[1] : '';
            font.src.push({
              url,
              format,
            });
          });
        switch (rule.style.getPropertyValue('font-weight')) {
          case 'normal':
            font.weight = 400;
            break;
          case 'bold':
            font.weight = 700;
            break;
          default:
            font.weight = parseInt(rule.style.getPropertyValue('font-weight'));
            break;
        }
        font.family = rule.style.getPropertyValue('font-family').replace(/['"]+/g, '');
        font.style = rule.style.getPropertyValue('font-style');
        font.stretch = rule.style.getPropertyValue('font-stretch');
        font.name = `${font.family}-${font.weight}-${font.style}`.replace(/ /g, '');
        // Add the font to the fontsOfWebsite array
        this.fontsOfWebsite.push(font);
      }
    }
  }

  /**
   * Hide all elements which should be ignored
   * @returns {void}
   * @private
   */
  hideIgnoredElements(): void {
    // Hide by tag name
    let selectors = `[data-htmlWebsite2pdf-ignore],${[
      ...this.ignoreElements,
      this.ignoreElementsByClass.map((el) => (el.startsWith('.') ? el : `.${el}`)),
    ].join(',')}`;
    // if we have a comma at the end, we remove it
    selectors.lastIndexOf(',') === selectors.length - 1 ? (selectors = selectors.slice(0, -1)) : selectors;
    this.inputEl.querySelectorAll(selectors).forEach((el) => {
      el.classList.add('htmlWebsite2pdf-ignore');
    });

    // Add styles to hide the elements
    const ignoreElementsStyle = this.iframeDoc.createElement('style');
    ignoreElementsStyle.id = 'htmlWebsite2pdf-generation-styles';
    ignoreElementsStyle.innerHTML = '.htmlWebsite2pdf-ignore { display: none !important; }';
    this.iframeDoc.body.appendChild(ignoreElementsStyle);
  }

  /**
   * Show again all elements which where ignored
   * @returns {void}
   * @private
   */
  showIgnoredElements(): void {
    // remove the hiding class from all elements
    this.iframeDoc.querySelectorAll('.htmlWebsite2pdf-ignore').forEach((el) => {
      el.classList.remove('htmlWebsite2pdf-ignore');
    });
    // remove the style tag which added the styles for the hiding class
    const ignoreElementsStyle = this.iframeDoc.getElementById('htmlWebsite2pdf-generation-styles');
    if (ignoreElementsStyle) {
      ignoreElementsStyle.remove();
    }
  }

  /**
   * Add the internal links to the PDF
   * @returns {void}
   */
  addInternalLinks() {
    for (const link of this.internalLinkingElements) {
      let result = this.elementsWithId.find((el) => el.id === link.id.replace('#', ''));
      if (result) {
        // for now we use the first result, but we should throw an error if there are more than one
        let linkOptions: TLinkOptions = {};
        if (this.linkBorderColor) {
          linkOptions.border = {
            color: this.linkBorderColor,
            width: this.linkBorderStroke,
          };
        }
        if (link.borderColor !== undefined) {
          linkOptions.border = {
            color: RGB.changeRange1(RGBHex.toRGB(link.borderColor)),
            width: link.borderStroke || this.linkBorderStroke || 0,
          };
        }

        const pageResult = this.getPageByPosition(
          link.el.getBoundingClientRect().top + this.scrollTop,
          link.el.getBoundingClientRect().bottom + this.scrollTop,
        );
        if (pageResult === undefined) {
          console.error("Skipped placing - Couldn't find the Page for the following element:", link.el);
          continue;
        }
        let position = {
          x: link.position.x,
          y:
            this.pageSize[1] -
            +px.toPt(link.el.getBoundingClientRect().bottom + this.scrollTop - pageResult.yStart) -
            this.margin[1] -
            pageResult.headerOffset,
        };

        this.pdf.addInternalLink(position, link.width, link.height, pageResult.pdfPage, result.page, linkOptions);
      }
    }
  }

  /**
   * Get the page object by the position of the top and bottom of an element
   * @param {number} top The top position of the element
   * @param {number} bottom The bottom position of the element
   * @returns {TPageObject|undefined} The page object of the element or undefined if it couldn't be found
   */
  getPageByPosition(top: number, bottom: number): TPageObject | undefined {
    let pageObj = this.pages.find((element) => element.yStart <= top && element.yStart <= bottom && element.yEnd >= top && element.yEnd >= bottom);
    if (!pageObj) {
      const index = this.pages.findIndex((element) => element.yEnd >= top);
      if (index) {
        pageObj = this.pages[index + 1];
      }
    }
    return pageObj;
  }

  /**
   * Adds all elements which we skipped because they didn't fit on the current page
   * @returns {void}
   */
  async addElementsForEnd(): Promise<void> {
    for (const element of this.elementsForEnd) {
      const pageResult = this.getPageByPosition(element.rect.top + this.scrollTop, element.rect.bottom + this.scrollTop);
      if (pageResult === undefined) {
        console.error("Skipped placing - Couldn't find the Page for the following element:", element);
        continue;
      }
      this.offsetY = pageResult.yStart;
      this.currentHeaderHeight = pageResult.headerOffset;
      // set Our values if needed
      if (element.el.dataset?.htmlwebsite2pdfPagenumberbyid) {
        const id = element.el.dataset?.htmlwebsite2pdfPagenumberbyid.replace('#', '');
        const target = this.elementsWithId.find((el) => el.id === id);

        if (target) {
          element.el.innerText = `${this.pages[target.pageId].pageNumber}`;
        }
      }

      // Go trough the element and place it thereby
      await this.goTroughElements(element, pageResult.pdfPage);
    }
  }

  /**
   * Search for a font which is used in the website by its font-family, weight and style and add it if it is not already added to the pdf
   * @param {string} fontFamily The font-family of the font
   * @param {number} fontWeight The font-weight of the font
   * @param {string} fontStyle The font-style of the font
   * @returns {Promise<TFontInfo>} The fontobject of the used font
   * @private
   */
  async getUsedFont(fontFamily: string, fontWeight: number, fontStyle: string): Promise<TFontInfo> {
    return new Promise(async (resolve, reject) => {
      // Find the used font in the fontsOfWebsite array
      const foundFontOfWebsite = this.fontsOfWebsite
        .filter((font) => font.family === fontFamily && font.style === fontStyle)
        .sort((a, b) => a.weight - b.weight)
        .find((font) => font.weight >= fontWeight);
      if (!foundFontOfWebsite) {
        // TODO: Add fallback if we don't find a font, maybe caused by a higher font weight than available
        reject(new Error(`Font ${fontFamily} with weight ${fontWeight} and style ${fontStyle} not found`));
      }
      // Check if the font is already added to the pdf
      if (!foundFontOfWebsite.inPDF) {
        // TODO: Check if we have a true type font
        let fontSrc = foundFontOfWebsite.src.find((el) => el.format == 'truetype')?.url;
        // Load the font from the url
        await fetch(fontSrc!)
          .then((res) => res.arrayBuffer())
          .then((font) => {
            foundFontOfWebsite.inPDF = true;
            // Add the font to the pdf
            this.pdf.addFont(font as Buffer, foundFontOfWebsite.name);
          });
      }
      resolve(foundFontOfWebsite);
    });
  }
}
export default { Generator };
