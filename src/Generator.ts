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
  TTextLine,
} from './types';
import { ImageFormats, PdfPageLayout, PdfPageMode, PdfVersion } from './enums';
import { PageDimensions } from './constants';
import { px, pt, RGBHex, RGB, hashCode, getColorFromCssRGBValue, mm } from './utils';
import Page from './pdfObjects/IntermediateObjects/Page';

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
  iframeWin: Window | null;
  /**
   * The pagesize minus the top-margin and the header-height
   */
  pageTopOffset = 0;
  /**
   * The elements which should not be split on page breaks
   */
  avoidBreakingElements: string[] = ['td', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  /**
   * Whether the layout of elements should be transferred as images or not
   * If false, the layout will be tried to be transferred as vector graphics this is only possible for rectangular one colored backgrounds and borders
   */
  imagesForLayout = true;

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
    if (options.usePageHeaders !== undefined) {
      if (typeof options.usePageHeaders === 'boolean') {
        this.usePageHeaders = options.usePageHeaders;
      } else {
        throw new Error('UsePageHeaders must be a boolean');
      }
    }
    if (options.usePageFooters !== undefined) {
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
    if (options.outlineForHeadings !== undefined) {
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
      this.iFrameWidth = pt.toPx(this.pageSize[0] - this.margin[1] - this.margin[3]);
    }
    if (options.addFirstPage !== undefined) {
      if (typeof options.addFirstPage === 'boolean') {
        this.addFirstPage = options.addFirstPage;
      } else {
        throw new Error('AddFirstPage must be a boolean');
      }
    }
    if (options.avoidBreakingElements) {
      if (typeof options.avoidBreakingElements === 'string') {
        this.avoidBreakingElements = [options.avoidBreakingElements];
      } else if (Array.isArray(options.avoidBreakingElements) && options.avoidBreakingElements.every((el) => typeof el === 'string')) {
        this.avoidBreakingElements = options.avoidBreakingElements;
      } else {
        throw new Error('AvoidBreakingElements must be a string or an array of strings');
      }
    }
    if (options.imagesForLayout !== undefined) {
      if (typeof options.imagesForLayout === 'boolean') {
        this.imagesForLayout = options.imagesForLayout;
      } else {
        throw new Error('imagesForLayout must be a boolean');
      }
    }

    // Calculate the available height of the page for placing the content
    this.availableDefaultPageHeight = this.pageSize[1] - this.margin[0] + this.margin[2];
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
    this.scrollLeft = this.iframeDoc!.documentElement.scrollLeft || this.iframeDoc!.body.scrollLeft;
    this.offsetX = this.inputEl.getBoundingClientRect().x + this.scrollLeft;
    // Scroll-Offset if the page is scrolled, needed to calculate the position of the elements
    this.scrollTop = this.iframeDoc!.documentElement.scrollTop || this.iframeDoc!.body.scrollTop;
    this.offsetY = this.inputEl.getBoundingClientRect().y + this.scrollTop;
    // Add the first page to the PDF
    if (this.addFirstPage) this.addPageToPdf(this.offsetY);
    // Go trough all elements and place them in the PDF, starting with the input element
    await this.goTroughElements(this.createTElement(this.inputEl));
    // Now we add all Elements where the position in the Markup didn't fit the current Pages and all Elements with content which comes from us.
    await this.addElementsForEnd();
    // Add all internal links to the PDF
    this.addInternalLinks();
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
    this.inputEl!.setAttribute('data-htmlWebsite2pdf-inputEl', 'true');

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
    this.iframeDoc = iframe.contentWindow!.document;
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
    let pageHeader: Element | null = null;
    let pageFooter: Element | null = null;
    if (
      element.el.nodeType === 1 &&
      (this.iframeWin!.getComputedStyle(element.el).display === 'none' || this.iframeWin!.getComputedStyle(element.el).visibility === 'hidden')
    ) {
      return;
    }
    if (element.el.dataset?.htmlwebsite2pdfPagenumberbyid) {
      // Should get filled and placed at the end
      this.elementsForEnd.push(this.createTElement(element.el));
      return;
    }
    if (element.el.dataset?.htmlwebsite2pdfCurrentpagenumber !== undefined) {
      // TODO: Issue here is that the page is not already set into the pages array
      element.el.innerText = this.pages.at(-1)!.pageNumber.toString();
    }
    switch (element.el.nodeType) {
      case 1: // Element
        if (['script', 'style'].includes(element.el.tagName.toLowerCase())) break;
        // check if one child is Header or footer and safe it
        const headerFooterResult = this.checkForPageHeaderFooter(element.el);
        pageHeader = headerFooterResult.pageHeader;
        pageFooter = headerFooterResult.pageFooter;
        await this.handleElementNode(this.createTElement(element.el), page);
        break;
      case 3: // Text
        await this.handleTextNode(element.el as unknown as Text, page);
        break;
      default:
        // All other nodeTypes are not supported (and not needed), so we ignore them
        break;
    }

    // Remove the header and footer cause they are not needed anymore
    if (pageHeader) {
      let lastHeader = this.currentHeader.pop();
      if (lastHeader) this.iframeDoc!.body.removeChild(lastHeader);
    }
    if (pageFooter) {
      let lastFooter = this.currentFooter.pop();
      if (lastFooter) this.iframeDoc!.body.removeChild(lastFooter);
    }
  }

  checkForPageHeaderFooter(child: Element): { pageHeader: Element | null; pageFooter: Element | null } {
    let pageHeader: Element | null = null;
    let pageFooter: Element | null = null;
    if (this.usePageHeaders) {
      pageHeader = child.querySelector(':scope >template[data-htmlWebsite2pdf-header]');
      if (pageHeader !== null) {
        let header = this.iframeDoc!.createElement('div');
        header.innerHTML = pageHeader.innerHTML;
        this.iframeDoc!.body.appendChild(header);
        this.currentHeader.push(header);
      }
    }
    if (this.usePageFooters) {
      pageFooter = child.querySelector(':scope >template[data-htmlWebsite2pdf-footer]');
      if (pageFooter !== null) {
        let footer = this.iframeDoc!.createElement('div');
        footer.innerHTML = pageFooter.innerHTML;
        this.iframeDoc!.body.appendChild(footer);
        this.currentFooter.push(footer);
      }
    }
    // TODO: maybe only return true or false to save memory
    return { pageHeader, pageFooter };
  }

  createTElement(el: HTMLElement): TElement {
    const isTextNode = el.nodeType === 3;
    const rect = isTextNode ? el.parentElement!.getBoundingClientRect() : el.getBoundingClientRect();
    const styles = this.iframeWin!.getComputedStyle(isTextNode ? el.parentElement! : el);
    return { el, rect, styles };
  }

  /**
   * Handles a text node and places it in the PDF
   * @param {Text} node The text node which should be placed in the PDF
   * @param {Page | undefined} page The page on which the text should be placed
   * @returns {Promise<void>}
   */
  async handleTextNode(node: Text, page?: Page): Promise<void> {
    const textLines: Array<TTextLine> = this.getTextLinesOfNode(node);
    for (const line of textLines) {
      // Check if the element fits on the current page, if not add a new page
      await this.enoughSpaceOnPageForElement(node, line.position);
      if (!this.imagesForLayout && (line.styles.display === 'inline' || line.styles.display === 'inline-block') && line.words.length > 0) {
        let inlinePosition: 'first' | 'last' | 'middle' | undefined = undefined;
        if (textLines.length > 1) {
          const lineIndex = textLines.indexOf(line);
          if (lineIndex === 0) {
            inlinePosition = 'first';
          } else if (lineIndex === textLines.length - 1) {
            inlinePosition = 'last';
          } else {
            inlinePosition = 'middle';
          }
        }
        this.addBackgroundToPdf(line.styles, line.position, true, inlinePosition);
        this.addBordersToPdf(line.styles, line.position, true, inlinePosition);
      }

      // Get the font of the node, and add it to the pdf if it is not already added
      const fontOfNode = line.styles.fontFamily.split(',')[0].replace(/['"]+/g, '');
      const usedFont = await this.getUsedFont(fontOfNode, parseInt(line.styles.fontWeight), line.styles.fontStyle);
      for (const word of line.words) {
        const options = { maxWidth: px.toPt(word.position.width), color: getColorFromCssRGBValue(line.styles.color) };

        // This is a workaround to place the text more correct (Problem are the descender and ascender of the font, which is not included in the font-size but in the element height)
        const textOffset = word.position.height - parseInt(line.styles.fontSize.replace('px', ''));
        this.pdf.addTextToPage(
          {
            x: px.toPt(word.position.x - this.offsetX) + this.margin[3],
            y: this.pageTopOffset - px.toPt(word.position.bottom + this.scrollTop - this.offsetY - textOffset),
          },
          word.text,
          usedFont.name!,
          px.toPt(parseInt(line.styles.fontSize.replace('px', ''))),
          options,
          page,
        );
      }
    }
  }
  /**
   * Handles an element node, checks for parts with should be placed in the PDF and places them in the PDF
   * @param {TElement} element The element which should be placed in the PDF
   * @returns {Promise<void>}
   */
  async handleElementNode(element: TElement, page?: Page): Promise<void> {
    if (this.pageBreakBeforeElements.includes(element.el.tagName.toLowerCase())) {
      await this.addPageToPdf(element.rect.top);
    }
    // Before we do anything we check if it fits on the current page
    await this.enoughSpaceOnPageForElement(element.el, element.rect);

    if (!this.imagesForLayout) {
      if (element.styles.display !== 'inline-block' && element.styles.display !== 'inline') {
        // Only add borders to block elements, because inline elements the childNodes get the border
        this.addBordersToPdf(element.styles, element.rect);
        this.addBackgroundToPdf(element.styles, element.rect);
      }
    } else {
      if (
        (element.styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && element.styles.backgroundColor !== 'rgb(255, 255, 255)') ||
        (element.styles.borderColor !== 'rgba(0, 0, 0, 0)' &&
          element.styles.borderColor !== 'rgb(255, 255, 255)' &&
          element.styles.borderWidth !== '0px' &&
          element.styles.borderStyle !== 'none')
      ) {
        let newEl = document.createElement('div');
        let scaling = 1.5;
        let createInlineStyles = (styles) => {
          let out = '';
          [...styles].forEach((style) => {
            if (style !== 'display' && style !== 'width' && style !== 'height' && !style.startsWith('-') && !style.startsWith('margin')) {
              out += `${style}:${styles[style]}; `;
            } else if (style === 'display') {
              out += `${style}:block; `;
            }
          });
          out += `width:${element.rect.width * scaling}px; `;
          out += `height:${element.rect.height * scaling}px; `;
          return out;
        };
        newEl.setAttribute('style', createInlineStyles(element.styles));

        const data = `<svg xmlns="http://www.w3.org/2000/svg" width="${element.rect.width * scaling}px" height="${
          element.rect.height * scaling
        }px"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">
                   ${newEl.outerHTML}
                 </div>
               </foreignObject>
             </svg>`;
        function toImage(svg): Promise<{ url: string; width: number; height: number }> {
          // TODO: This is realy slow, maybe we can optimize it
          return new Promise((resolve, reject) => {
            const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
            const img = new Image();
            img.onload = function () {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext('2d');
              ctx!.fillStyle = 'rgb(255, 255, 255)';
              ctx!.fillRect(0, 0, canvas.width, canvas.height);
              ctx!.drawImage(img, 0, 0);
              canvas.toBlob(
                function (blob) {
                  if (blob) {
                    const jpegUrl = URL.createObjectURL(blob);
                    resolve({ url: jpegUrl, width: img.naturalWidth, height: img.naturalHeight });
                  } else {
                    reject(new Error('Canvas toBlob failed'));
                  }
                },
                'image/jpeg',
                1.0,
              );
            };
            img.src = svgDataUrl;
          });
        }
        const newImgData = await toImage(data);

        const imgData = await fetch(newImgData.url).then((res) => res.arrayBuffer());
        this.pdf.addImageToPage(
          {
            x: px.toPt(element.rect.x - this.offsetX) + this.margin[3],
            y: this.pageTopOffset - px.toPt(element.rect.y + this.scrollTop - this.offsetY + element.rect.height),
          },
          imgData as Buffer,
          newImgData.width,
          newImgData.height,
          px.toPt(element.rect.width),
          px.toPt(element.rect.height),
          ImageFormats.JPEG,
          hashCode(newImgData.url.toString().slice(0, 100)).toString(),
          page,
        );
      }
    }
    if (element.el.id) {
      this.elementsWithId.push({
        id: element.el.id,
        page: this.pdf.getCurrentPage(),
        pageId: this.pages.length - 1,
        position: {
          x: element.rect.left + this.scrollLeft - this.offsetX + this.margin[3],
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
        const ctx = canvas.getContext('2d');
        // TODO: Set this to the correct background color
        ctx!.fillStyle = 'rgb(255, 255, 255)';
        ctx!.fillRect(0, 0, canvas.width, canvas.height);
        ctx!.drawImage(element.el as HTMLImageElement, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 1.0);
        const imgData = await fetch(imageData).then((res) => res.arrayBuffer());
        this.pdf.addImageToPage(
          {
            x: px.toPt(element.rect.x - this.offsetX) + this.margin[3],
            y: this.pageTopOffset - px.toPt(element.rect.y + this.scrollTop - this.offsetY + (element.el as HTMLImageElement).height),
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
        if (href === window.location.origin || href === `${window.location.origin}${window.location.pathname}`) {
          // Link with the same href as the current page, so we link external to the website
          this.addExternalLinkToPdf(element.el, element.rect, href, this.pdf.getCurrentPage());
        } else if (href.startsWith(window.location.origin)) {
          // Link to the same website
          let targetId = '';
          if (href.startsWith(window.location.origin + window.location.pathname)) {
            targetId = element.el.getAttribute('href')!.replace(`${window.location.origin + window.location.pathname}`, '');
          } else {
            targetId = element.el.getAttribute('href')!.replace(`${window.location.origin}`, '');
          }
          const targetElement = this.inputEl!.querySelector(targetId);
          if (targetElement) {
            // TODO: This should be after the element is placed on the page, cause sometimes it doesn't fit on the current page
            this.internalLinkingElements.push({
              id: targetId,
              page: this.pdf.getCurrentPage(),
              borderColor: element.el.dataset.htmlWebsite2pdfBorderColor,
              borderStroke: element.el.dataset.htmlWebsite2pdfBorderStroke ? parseInt(element.el.dataset.htmlWebsite2pdfBorderStroke) : undefined,
              position: {
                x: px.toPt(element.rect.left + this.scrollLeft - this.offsetX) + this.margin[3],
                y: this.pageTopOffset - px.toPt(element.rect.bottom + this.scrollTop - this.offsetY),
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
    for (const child of element.el.childNodes as any) {
      if (child.nodeType === 1 || child.nodeType === 3) await this.goTroughElements(this.createTElement(child), page);
    }
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
        x: px.toPt(rect.left + this.scrollLeft - this.offsetX) + this.margin[3],
        y: this.pageTopOffset - px.toPt(rect.bottom + this.scrollTop - this.offsetY),
      },
      px.toPt(rect.width),
      px.toPt(rect.height),
      page!,
      href,
      linkOptions, // TODO: add Link Options
    );
  }

  /**
   * Adds a coloured rectangle to the PDF as a background for the element
   * @param {CSSStyleDeclaration} computedStyles The computed styles of the element
   * @param {DOMRect} rect  The bounding rect of the element
   */
  addBackgroundToPdf(
    computedStyles: CSSStyleDeclaration,
    rect: DOMRect,
    isInline = false,
    inlinePosition: 'first' | 'middle' | 'last' | undefined = undefined,
  ) {
    // TODO: Change this to also use a given page
    // TODO: Check also for transparency
    // TODO: Check for gradients
    // TODO: Check for background images
    if (
      computedStyles.backgroundColor !== 'rgb(0, 0, 0)' &&
      !computedStyles.backgroundColor.includes('rgba(0, 0, 0, 0)') &&
      !computedStyles.backgroundColor.includes('rgb(255, 255, 255)')
    ) {
      let inlineOffset = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      };
      if (isInline) {
        inlineOffset.y = parseFloat(computedStyles.paddingBottom.replace('px', ''));
        inlineOffset.height = parseFloat(computedStyles.paddingTop.replace('px', '')) + parseFloat(computedStyles.paddingBottom.replace('px', ''));
        if (inlinePosition === 'first') {
          inlineOffset.x = -parseFloat(computedStyles.paddingLeft.replace('px', ''));
          inlineOffset.width = parseFloat(computedStyles.paddingLeft.replace('px', ''));
        } else if (inlinePosition === 'last') {
          inlineOffset.width = parseFloat(computedStyles.paddingRight.replace('px', ''));
        } else if (inlinePosition === undefined) {
          inlineOffset.x = -parseFloat(computedStyles.paddingLeft.replace('px', ''));
          inlineOffset.width = parseFloat(computedStyles.paddingRight.replace('px', '')) + parseFloat(computedStyles.paddingLeft.replace('px', ''));
        }
      }

      this.pdf.drawRectangleToPage(
        {
          x: px.toPt(rect.x - this.offsetX + inlineOffset.x) + this.margin[3],
          y: this.pageTopOffset - px.toPt(rect.bottom + this.scrollTop - this.offsetY + inlineOffset.y),
        },
        px.toPt(rect.width + inlineOffset.width),
        px.toPt(rect.height + inlineOffset.height),
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
  addBordersToPdf(
    computedStyles: CSSStyleDeclaration,
    rect: DOMRect,
    isInline = false,
    inlinePosition: 'first' | 'middle' | 'last' | undefined = undefined,
  ) {
    let inlineOffset = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    };
    if (isInline) {
      inlineOffset.top = parseFloat(computedStyles.paddingTop.replace('px', ''));
      inlineOffset.bottom = parseFloat(computedStyles.paddingBottom.replace('px', ''));
      if (inlinePosition === 'first') {
        inlineOffset.left = parseFloat(computedStyles.paddingLeft.replace('px', ''));
      } else if (inlinePosition === 'last') {
        inlineOffset.right = parseFloat(computedStyles.paddingRight.replace('px', ''));
      } else if (inlinePosition === undefined) {
        inlineOffset.left = parseFloat(computedStyles.paddingLeft.replace('px', ''));
        inlineOffset.right = parseFloat(computedStyles.paddingRight.replace('px', ''));
      }
    }
    if (computedStyles.borderTopWidth !== '0px' && computedStyles.borderTopStyle !== 'none') {
      // TODO: this can only straight lines in an 90degree angle, not curved or shifted and also not dashed or dotted
      this.pdf.drawLineToPage(
        {
          x: px.toPt(rect.x - this.offsetX - inlineOffset.left) + this.margin[3],
          y: this.pageTopOffset - px.toPt(rect.y + this.scrollTop - this.offsetY - inlineOffset.top),
        },
        {
          x: px.toPt(rect.x - this.offsetX + rect.width + inlineOffset.right) + this.margin[3],
          y: this.pageTopOffset - px.toPt(rect.y + this.scrollTop - this.offsetY - inlineOffset.top),
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
          x: px.toPt(rect.x - this.offsetX - inlineOffset.left) + this.margin[3],
          y: this.pageTopOffset - px.toPt(rect.bottom + this.scrollTop - this.offsetY + inlineOffset.bottom),
        },
        {
          x: px.toPt(rect.x - this.offsetX + rect.width + inlineOffset.right) + this.margin[3],
          y: this.pageTopOffset - px.toPt(rect.bottom + this.scrollTop - this.offsetY + inlineOffset.bottom),
        },
        {
          strokeColor: getColorFromCssRGBValue(computedStyles.borderBottomColor),
          strokeWidth: px.toPt(parseInt(computedStyles.borderBottomWidth.replace('px', ''))),
        },
      );
    }
    if (computedStyles.borderLeftWidth !== '0px' && computedStyles.borderLeftStyle !== 'none' && (!isInline || inlinePosition === 'first')) {
      // TODO: this can only straight lines in an 90degree angle, not curved or shifted and also not dashed or dotted
      this.pdf.drawLineToPage(
        {
          x: px.toPt(rect.x - this.offsetX - inlineOffset.left) + this.margin[3],
          y: this.pageTopOffset - px.toPt(rect.top + this.scrollTop - this.offsetY - inlineOffset.top),
        },
        {
          x: px.toPt(rect.x - this.offsetX - inlineOffset.left) + this.margin[3],
          y: this.pageTopOffset - px.toPt(rect.bottom + this.scrollTop - this.offsetY + inlineOffset.bottom),
        },
        {
          strokeColor: getColorFromCssRGBValue(computedStyles.borderLeftColor),
          strokeWidth: px.toPt(parseInt(computedStyles.borderLeftWidth.replace('px', ''))),
        },
      );
    }
    if (computedStyles.borderRightWidth !== '0px' && computedStyles.borderRightStyle !== 'none' && (!isInline || inlinePosition === 'last')) {
      // TODO: this can only straight lines in an 90degree angle, not curved or shifted and also not dashed or dotted
      this.pdf.drawLineToPage(
        {
          x: px.toPt(rect.x - this.offsetX + rect.width + inlineOffset.right) + this.margin[3],
          y: this.pageTopOffset - px.toPt(rect.top + this.scrollTop - this.offsetY - inlineOffset.top),
        },
        {
          x: px.toPt(rect.x - this.offsetX + rect.width + inlineOffset.right) + this.margin[3],
          y: this.pageTopOffset - px.toPt(rect.bottom + this.scrollTop - this.offsetY + inlineOffset.bottom),
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
    if (!bookmarks.length || bookmarks.at(-1)!.level === level) {
      bookmarks.push({ level, children: [] });
      return { bookmarks, positions: [...positionArray, bookmarks.length] };
    } else {
      let result = this.findBookmarkPosition(bookmarks.at(-1)!.children, level, [...positionArray, bookmarks.length]);
      bookmarks.at(-1)!.children = result.bookmarks;
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
    if (element instanceof HTMLElement && this.iframeWin!.getComputedStyle(element).display === 'none') {
      return;
    }
    const yPos = this.currentAvailableHeight - +px.toPt(rect.bottom + this.scrollTop - this.offsetY);
    if (yPos >= 0) {
      return;
    }
    // TODO this if-statment needs rework
    if (element instanceof HTMLElement && this.currentAvailableHeight < px.toPt(rect.height)) {
      // TODO: Element is larger than the page, we ignore it for now and hope its only a wrapper
      console.warn('Element is larger than the page:', element);
      if (this.avoidBreakingElements.includes(element.tagName.toLowerCase())) {
        await this.addPageToPdf(rect.top);
      }
    } else if (yPos < 0 && ((element.childNodes.length === 1 && element.childNodes[0].nodeType !== 3) || element.childNodes.length < 1)) {
      // TODO: We ignore elements which have children so that text breaks in lines instead of the parent
      console.warn('Not enough space on the page for the element:', element);
      // TODO: check if it would be on the next page, if not push it into placeLater-Array
      await this.addPageToPdf(rect.top);
    } else {
      if (this.avoidBreakingElements.includes((element as HTMLElement).tagName.toLowerCase())) {
        await this.addPageToPdf(rect.top);
      }
    }
  }

  /**
   * Gets all text lines  of a textNode and returns them as an array which contains the text, the styles and the position of the textline
   * @param {Text} element The textNode which should be used to get the text lines
   * @returns {Array<TTextNodeData>} The array of the text lines
   */

  getTextLinesOfNode(element: Text): Array<TTextLine> {
    // If the textNode is empty we return an empty array
    if (element.data.replace(/[\n\t\r\s]/g, '').replace(/  /g, '').length === 0) {
      return [];
    }
    const textWithStyles: Array<TTextNodeData> = [];

    const text = element.textContent;
    const parentStyle = window.getComputedStyle(element.parentElement!);
    const range = this.iframeDoc!.createRange();

    // Get the lines of the text
    const lineRange = this.iframeDoc!.createRange();
    lineRange.selectNodeContents(element);
    const lines = lineRange.getClientRects();

    let words = text!.split(/(\s+)/);
    // Also split words with hyphens into several parts to also split them at end of a line
    let replacements: Array<{ wordIndex: number; parts: Array<string> }> = [];
    words.forEach((word, wordIndex) => {
      if (word.includes('-') && word.length > 1) {
        let parts = word.split('-');
        parts.forEach((part, index) => {
          if (part != parts.at(-1)) {
            parts[index] = `${parts[index]}-`;
          }
        });
        replacements.push({ wordIndex, parts });
      }
    });
    if (replacements.length > 0) {
      replacements.reverse().forEach((replacement) => {
        words.splice(replacement.wordIndex, 1, ...replacement.parts);
      });
    }
    // remove empty words
    words = words.filter((word) => word.trim().length > 0);

    let startOffset = 0;
    words.forEach((word) => {
      const wordOffset = text!.indexOf(word, startOffset);
      range.setStart(element, wordOffset);
      range.setEnd(element, wordOffset + word.length);

      const rects = range.getClientRects();
      // If we have more than one rect we have a line break
      if (rects.length > 1) {
        // This schould be a separate function to make more then one linebreak possible
        let newParts: Array<{ rect: DOMRect; text: string }> = [];
        for (let i = 1; i <= word.length; i++) {
          range.setStart(element, wordOffset);
          range.setEnd(element, wordOffset + i);
          const newRects = range.getClientRects();
          const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
          if (newRects.length > 1) {
            if (parentStyle.hyphens === 'auto') {
              // Hyphanation is activated so we should split the word
              // Caused by the reason that the added hyphen gets its own rect we now that i chars are before.

              newParts = [
                { rect: rects[0], text: `${word.slice(0, i)}-` },
                { rect: rects[isSafari ? 1 : 2], text: `${word.slice(i)}` },
              ];
            } else {
              // No hyphanation so we split the word at the char which is at the end of the line
              newParts = [
                { rect: rects[0], text: `${word.slice(0, i - 1)}` },
                { rect: rects[1], text: `${word.slice(i - 1)}` },
              ];
            }
            break;
          }
        }
        Array.from(newParts).forEach((part) => {
          textWithStyles.push({
            text: part.text,
            position: part.rect,
          });
        });
      } else {
        textWithStyles.push({
          text: word,
          position: rects[0],
        });
      }

      startOffset = wordOffset + word.length;
    });

    // Add the Words to the lines
    const lineElements = Array.from(lines).map((line) => {
      return {
        position: line,
        words: [],
        styles: parentStyle,
      };
    });
    textWithStyles.forEach((element) => {
      // Check in which line the element is and add it to words
      if (element.position.top) {
        let line = lineElements.find((line) => line.position.top === element.position.top);
        line!.words.push(element);
      }
    });

    return lineElements;
  }

  /**
   * Adds a new page to the PDF
   * @param {number} yPos The starting position of the new page+
   * @returns {Promise<void>}
   */
  async addPageToPdf(yPos: number) {
    this.offsetY = yPos + this.scrollTop;
    // We add a new page so we set the end of the old page to the current y position
    if (this.pages.length) {
      this.pages.at(-1)!.yEnd = this.offsetY;
    }
    this.pdf.addPage(this.pageSize);
    this.currentAvailableHeight = this.availableDefaultPageHeight;
    this.currentHeaderHeight = 0;
    this.currentFooterHeight = 0;
    this.pages.push({
      pdfPage: this.pdf.getCurrentPage(),
      pageNumber: this.pages.length + 1,
      yStart: this.offsetY,
    });

    if (this.usePageHeaders && this.currentHeader.length) {
      const tempOffsetY = this.offsetY;
      const tempOffsetX = this.offsetX;
      const currentHeaderRect = this.currentHeader.at(-1)!.getBoundingClientRect();
      this.offsetY = currentHeaderRect.top + this.scrollTop;
      this.offsetX = currentHeaderRect.left + this.scrollLeft;
      this.pageTopOffset = this.pageSize[1] - this.margin[0];
      await this.goTroughElements(this.createTElement(this.currentHeader.at(-1)!));
      this.offsetY = tempOffsetY;
      this.offsetX = tempOffsetX;
      this.currentHeaderHeight = px.toPt(currentHeaderRect.height);
    }
    if (this.usePageFooters && this.currentFooter.length) {
      const tempOffsetY = this.offsetY;
      const tempOffsetX = this.offsetX;
      const currentFooterRect = this.currentFooter.at(-1)!.getBoundingClientRect();
      this.offsetY = currentFooterRect.top + this.scrollTop;
      this.offsetX = currentFooterRect.left + this.scrollLeft;
      this.pageTopOffset = px.toPt(currentFooterRect.height) + this.margin[2];
      await this.goTroughElements(this.createTElement(this.currentFooter.at(-1)!));
      this.offsetY = tempOffsetY;
      this.offsetX = tempOffsetX;
      this.currentFooterHeight = px.toPt(currentFooterRect.height);
    }
    this.currentAvailableHeight -= this.currentHeaderHeight + this.currentFooterHeight + this.margin[0] + this.margin[2];

    // Add the missing values to the last page
    this.pages[this.pages.length - 1] = {
      ...this.pages.at(-1),
      yEnd: this.offsetY + pt.toPx(this.currentAvailableHeight),
      headerOffset: this.currentHeaderHeight + this.margin[0],
      footerOffset: this.currentFooterHeight + this.margin[2],
    };
    this.pageTopOffset = this.pageSize[1] - this.margin[0] - this.currentHeaderHeight;
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
        const font: TFontInfo = {
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
    this.inputEl!.querySelectorAll(selectors).forEach((el) => {
      el.classList.add('htmlWebsite2pdf-ignore');
    });

    // Add styles to hide the elements
    const ignoreElementsStyle = this.iframeDoc!.createElement('style');
    ignoreElementsStyle.id = 'htmlWebsite2pdf-generation-styles';
    ignoreElementsStyle.innerHTML = '.htmlWebsite2pdf-ignore { display: none !important; }';
    this.iframeDoc!.body.appendChild(ignoreElementsStyle);
  }

  /**
   * Show again all elements which where ignored
   * @returns {void}
   * @private
   */
  showIgnoredElements(): void {
    // remove the hiding class from all elements
    this.iframeDoc!.querySelectorAll('.htmlWebsite2pdf-ignore').forEach((el) => {
      el.classList.remove('htmlWebsite2pdf-ignore');
    });
    // remove the style tag which added the styles for the hiding class
    const ignoreElementsStyle = this.iframeDoc!.getElementById('htmlWebsite2pdf-generation-styles');
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
            this.margin[0] -
            pageResult.headerOffset!,
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
    let pageObj = this.pages.find((element) => element.yStart <= top && element.yStart <= bottom && element.yEnd! >= top && element.yEnd! >= bottom);
    if (!pageObj) {
      const index = this.pages.findIndex((element) => element.yEnd! >= top);
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
      this.currentHeaderHeight = pageResult.headerOffset as number;
      this.pageTopOffset = this.pageSize[1] - this.margin[0] - pageResult.headerOffset!;
      // set Our values if needed
      if (element.el.dataset?.htmlwebsite2pdfPagenumberbyid) {
        const id = element.el.dataset?.htmlwebsite2pdfPagenumberbyid.replace('#', '');
        const target = this.elementsWithId.find((el) => el.id === id);

        if (target) {
          element.el.innerText = `${this.pages[target.pageId].pageNumber}`;
        }
      }

      delete element.el.dataset!.htmlwebsite2pdfPagenumberbyid;
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
      if (!foundFontOfWebsite!.inPDF) {
        // TODO: Check if we have a true type font
        let fontSrc = foundFontOfWebsite!.src.find((el) => el.format == 'truetype')?.url;
        // Load the font from the url
        await fetch(fontSrc!)
          .then((res) => res.arrayBuffer())
          .then((font) => {
            foundFontOfWebsite!.inPDF = true;
            // Add the font to the pdf
            this.pdf.addFont(font as Buffer, foundFontOfWebsite!.name as string);
          });
      }
      resolve(foundFontOfWebsite!);
    });
  }
}
export default { Generator };
