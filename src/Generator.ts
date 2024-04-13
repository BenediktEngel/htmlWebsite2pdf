import PDFDocument from './pdfDocument';
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
import { px, pt, RGBHex, RGB, hashCode } from './utils';
import Page from 'pdfObjects/IntermediateObjects/Page';

export class Generator {
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
  elementsForEnd: Array<HTMLElement> = [];
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

    // Calculate the available height of the page for placing the content
    this.availableDefaultPageHeight = this.pageSize[1] - 2 * px.toPt(this.margin[0] + this.margin[2]);
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
    // Hide all elements which should be ignored
    this.hideIgnoredElements(inputEl);

    // Get all fonts which are used in the stylesheets
    this.getFontsOfWebsite();
    // Calculate the offset on the x-axis (scrollLeft is needed if window is smaller than the page and it is scrolled)
    this.scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
    this.offsetX = inputEl.getBoundingClientRect().x + this.scrollLeft;
    // Scroll-Offset if the page is scrolled, needed to calculate the position of the elements
    this.scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    this.offsetY = inputEl.getBoundingClientRect().y + this.scrollTop;
    await this.goTroughElements(this.createTElement(inputEl));

    this.internalLinkingElements.forEach((link) => {
      let result = this.elementsWithId.filter((el) => el.id === link.id.replace('#', ''));
      if (result.length) {
        // for now we use the first result, but we should throw an error if there are more than one
        let linkOptions: TLinkOptions = { };
        if (this.linkBorderColor) {
          linkOptions.border = {};
          linkOptions.border.color = this.linkBorderColor;
          linkOptions.border.width = this.linkBorderStroke;
        }
        if (link.borderColor !== undefined) {
          linkOptions.border = {};
          linkOptions.border.color = RGB.changeRange1(RGBHex.toRGB(link.borderColor));
          linkOptions.border.width = link.borderStroke || this.linkBorderStroke || 0;
        } else if (link.borderStroke !== undefined) {
          if(!linkOptions.border) linkOptions.border = {};
          linkOptions.border.width = link.borderStroke;
        }
        console.log("linkOptions", linkOptions)
        this.pdf.addInternalLink(link.position, link.width, link.height, link.page, result[0].page, linkOptions);
      }
    });

    // Now we add all Elements where the position in the Markup didn't fit the current Pages and all Elements with content which comes from us.
    for (const element of this.elementsForEnd) {
      // Find the correct Page by the position
      const y1 = element.getBoundingClientRect().top + this.scrollTop;
      const y2 = element.getBoundingClientRect().bottom + this.scrollTop;
      let pageObj = this.pages.find((element) => element.yStart <= y1 && element.yStart <= y2 && element.yEnd >= y1 && element.yEnd >= y2);
      if (!pageObj) {
        let index = this.pages.findIndex((element) => element.yEnd >= y1);
        if (index) {
          pageObj = this.pages[index + 1];
        } else {
          console.error("Skipped placing - Couldn't find the Page for the following element:", element);
          continue;
        }
      }
      this.offsetY = pageObj.yStart;
      this.currentHeaderHeight = pageObj.headerOffset;
      // set Our values if needed
      if (element.dataset?.htmlwebsite2pdfPagenumberbyid) {
        const id = element.dataset?.htmlwebsite2pdfPagenumberbyid.replace('#', '');
        const target = this.elementsWithId.filter((el) => el.id === id);

        if (target.length) {
          element.innerText = `${this.pages[target[0].pageId].pageNumber}`;
        }
      }

      // Go trough the element and place it thereby
      await this.goTroughElements(this.createTElement(element), pageObj.pdfPage);
    }
    // remove values set by us from the Element
    this.showIgnoredElements();

    // Save the pdf to a file
    this.downloadPdf();
    console.warn('Time needed for Generation:', (new Date().getTime() - this.startTime.getTime())* 0.001, 's');
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
  async goTroughElements(element: TElement, page: Page | undefined = undefined): Promise<void> {
    let i = 0;
    for (const child of element.element.childNodes as any) {
      // check if one child is Header or footer and safe it
      let pageHeader = null;
      if (child instanceof HTMLElement && this.usePageHeaders) {
        pageHeader = child.querySelector(':scope >[data-htmlWebsite2pdf-header]');
        if (pageHeader !== null) {
          // TODO this should be a separate function
          let header = document.createElement('div');
          header.innerHTML = pageHeader.innerHTML;
          this.addElementToDOM(header);
          this.currentHeader.push(header);
        }
      }
      let pageFooter = null;
      if (child instanceof HTMLElement && this.usePageFooters) {
        pageFooter = child.querySelector(':scope >[data-htmlWebsite2pdf-footer]');
        if (pageFooter !== null) {
          // TODO this should be a separate function
          let footer = document.createElement('div');
          footer.innerHTML = pageFooter.innerHTML;
          this.addElementToDOM(footer);
          this.currentFooter.push(footer);
        }
      }

      if (child.dataset?.htmlwebsite2pdfPagenumberbyid) {
        // Should get filled and placed at the end
        this.elementsForEnd.push(child);
        continue;
      }
      if (child.dataset?.htmlwebsite2pdfCurrentpagenumber !== undefined) {
        // TODO: Issue here is that the page is not already set into the pages array
        child.innerText = this.pages[this.pages.length - 1].pageNumber + 1;
      }

      switch (child.nodeType) {
        case 1: // Element
          await this.handleElementNode(this.createTElement(child), page);
          break;
        case 3: // Text
          await this.handleTextNode(child, page);
          break;
        default:
          // All other nodeTypes are not supported (and not needed), so we ignore them
          break;
      }

      if (pageHeader) {
        let lastHeader = this.currentHeader.pop();
        if (lastHeader) this.removeElementFromDOM(lastHeader); //document.body.removeChild(lastHeader);
      }
      if (pageFooter) {
        let lastFooter = this.currentFooter.pop();
        if (lastFooter) this.removeElementFromDOM(lastFooter); //document.body.removeChild(lastFooter);
      }
      i++;
    }
  }

  createTElement(element: HTMLElement): TElement {
    const isTextNode = element.nodeType === 3;
    const rect = isTextNode ? element.parentElement.getBoundingClientRect() : element.getBoundingClientRect();
    const styles = isTextNode ? window.getComputedStyle(element.parentElement) : window.getComputedStyle(element);
    return {element, rect, styles, isTextNode};
  }

  /**
   * Handles a text node and places it in the PDF
   * @param {Text} node The text node which should be placed in the PDF
   * @param {Page | undefined} page The page on which the text should be placed
   * @returns {Promise<void>}
   */
  async handleTextNode(node: Text, page: Page | undefined): Promise<void> {
    const textNodes: Array<TTextNodeData> = this.getTextLinesOfNode(node);
    let elementIndex = 0;
    for (const element of textNodes) {
      // Get the font of the node, and add it to the pdf if it is not already added
      const fontOfNode = element.styles.fontFamily.split(',')[0].replace(/['"]+/g, '');
      const usedFont = await this.getUsedFont(fontOfNode, element.styles.fontWeight, element.styles.fontStyle);
      // Get the alignment of the text
      let align = 'left';
      if (element.styles.textAlign === 'center') {
        align = 'center';
      } else if (element.styles.textAlign === 'right') {
        align = 'right';
      }

      const options = { maxWidth: px.toPt(element.position.width), alignment: align, color: this.getColorFromCssRGBValue(element.styles.color) };

      // Check if the element fits on the current page, if not add a new page
      await this.enoughSpaceOnPageForElement(node, element.position.bottom, element.position.top);

      this.addBackgroundToPdf(element.styles, element.position);
      if (element.styles.display !== 'block') {
        this.addBordersToPdf(element.styles, element.position);
      }

      // TODO: This is a workaround to place the text more correct (Problem are the descender and ascender of the font, which is not included in the font-size but in the element height)
      if (element.styles.textAlign === 'justify' && element.wordWidths.length > 2) {
        let words = element.text.split(' ');
        words.forEach((word, idx) => {
          let wordOffset = 0;
          if (idx > 0) {
            wordOffset = element.wordWidths.slice(0, idx).reduce((a, b) => a + b, 0);
            wordOffset += element.wordSpacing * idx;
          }
          const textOffset = element.position.height - parseInt(element.styles.fontSize.replace('px', ''));
          this.pdf.addTextToCurrentPage(
            {
              x: px.toPt(element.position.x - this.offsetX + wordOffset) + this.margin[3], // TODO: shouldnt this be the second?
              y:
                this.pageSize[1] -
                +px.toPt(
                  element.position.bottom + this.scrollTop - this.offsetY - textOffset,
                  // + (element.position.height / element.lines.length) * (j + 1)
                ) -
                this.margin[1] -
                this.currentHeaderHeight,
            },
            word + ' ',
            usedFont.name,
            px.toPt(parseInt(element.styles.fontSize.replace('px', ''))),
            options,
            page,
          );
        });
      } else {
        const textOffset = element.position.height - parseInt(element.styles.fontSize.replace('px', ''));
        this.pdf.addTextToCurrentPage(
          {
            x: px.toPt(element.position.x - this.offsetX) + this.margin[3], // TODO: shouldnt this be the second?
            y:
              this.pageSize[1] -
              +px.toPt(
                element.position.bottom + this.scrollTop - this.offsetY - textOffset,
                // + (element.position.height / element.lines.length) * (j + 1)
              ) -
              this.margin[1] -
              this.currentHeaderHeight,
          },
          element.text,
          usedFont.name,
          px.toPt(parseInt(element.styles.fontSize.replace('px', ''))),
          options,
          page,
        );
      }

      elementIndex++;
    }
  }

  /**
   * Handles an element node, checks for parts with should be placed in the PDF and places them in the PDF
   * @param {TElement} element The element which should be placed in the PDF
   * @returns {Promise<void>}
   */
  async handleElementNode(element: TElement, page: Page | undefined = undefined): Promise<void> {
    // TODO: Check if we have styling which is needed to be added to the pdf
    // TODO: Check other things like pageBreakBeforeElements and pageBreakAfterElements etc.
    if (this.pageBreakBeforeElements.includes(element.element.tagName.toLowerCase())) {
      await this.addPageToPdf(element.rect.top);
    }
    // Before we do anything we check if it fits on the current page
    await this.enoughSpaceOnPageForElement(element.element, element.rect.bottom, element.rect.top);
    // TODO: Maybe add here the check if we need a new page
    if (element.styles.display === 'block') {
      // Only add borders to block elements, because inline elements the childNodes get the border
      this.addBordersToPdf(element.styles, element.rect);
      this.addBackgroundToPdf(element.styles, element.rect);
    }
    if (element.element.id) {
      this.elementsWithId.push({
        id: element.element.id,
        page: this.pdf.getCurrentPage(),
        pageId: this.pages.length - 1,
        position: {
          x: element.rect.left + this.scrollLeft - this.offsetX,
          y: element.rect.top + this.scrollTop - this.offsetY,
        },
      });
    }
    switch (element.element.tagName.toLowerCase()) {
      case 'img':
        // TODO: specialcase padding is included in the size of the image
        // If clause is only needed for linting, because we already checked the tagName
        if (element.element instanceof HTMLImageElement) {
          await this.enoughSpaceOnPageForElement(element.element, element.rect.bottom, element.rect.top);
          let imgData = await fetch(element.element.src).then((res) => res.arrayBuffer());
          this.pdf.addImageToCurrentPage(
            {
              x: px.toPt(element.rect.x - this.offsetX),
              y:
                this.pageSize[1] -
                +px.toPt(element.rect.y + this.scrollTop - this.offsetY + element.element.height) +
                -this.margin[1] -
                this.currentHeaderHeight,
            },
            imgData as Buffer,
            element.element.naturalWidth,
            element.element.naturalHeight,
            px.toPt(element.element.width),
            px.toPt(element.element.height),
            ImageFormats.JPEG,
            hashCode(element.element.src).toString(),
            page,
          );
        }
        break;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        if (this.outlineForHeadings && element.element.dataset.htmlwebsite2pdfNoOutline === undefined) {
          // TODO: We should check the position and add a new page if the heading is not on the current page
          await this.enoughSpaceOnPageForElement(element.element, element.rect.bottom, element.rect.top);
          const positionResult = this.findBookmarkPosition(this.bookmarks, parseInt(element.element.tagName[1]));
          positionResult.positions.pop();
          this.bookmarks = positionResult.bookmarks;
          this.pdf.addBookmark(element.element.innerText!.trim().replace(/\s+/g, ' '), this.pdf.getCurrentPage(), positionResult.positions);
        }
        break;
      case 'a':
        if (element.element instanceof HTMLAnchorElement) {
          const href = element.element.href;
          if (href === window.location.origin) {
            // Link with the same href as the current page, so we link external to the website
            this.addExternalLinkToPdf(element.element, element.rect, this.pdf.getCurrentPage(), href);
          } else if (href.startsWith(window.location.origin)) {
            // Link to the same website
            const targetId = element.element.getAttribute('href')!.replace(`${window.location.origin}`, '');
            const targetElement = this.inputEl!.querySelector(targetId);
            if (targetElement) {
              this.internalLinkingElements.push({
                id: targetId,
                page: this.pdf.getCurrentPage(),
                borderColor: element.element.dataset.htmlWebsite2pdfBorderColor,
                borderStroke: element.element.dataset.htmlWebsite2pdfBorderStroke ? parseInt(element.element.dataset.htmlWebsite2pdfBorderStroke) : undefined,
                position: {
                  x: px.toPt(element.rect.left + this.scrollLeft - this.offsetX),
                  y:
                    this.pageSize[1] -
                    px.toPt(element.rect.bottom + this.scrollTop - this.offsetY) +
                    -this.margin[1] -
                    this.currentHeaderHeight,
                },
                width: px.toPt(element.rect.width),
                height: px.toPt(element.rect.height),
              });
            } else {
              // didn't find the target element on the inputElement, so we link external
              this.addExternalLinkToPdf(element.element, element.rect, this.pdf.getCurrentPage(), href);
            }
          } else {
            this.addExternalLinkToPdf(element.element, element.rect, this.pdf.getCurrentPage(), href);
          }
        }
        break;
      default:
        // There are no special cases for the element or they are not implemented yet
        break;
    }
    await this.goTroughElements(element, page);
    if (this.pageBreakAfterElements.includes(element.element.tagName.toLowerCase())) {
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
  addExternalLinkToPdf(element: HTMLElement, rect: DOMRect, page: Page | undefined, href: string) {
    let borderColor = this.linkBorderColor;
    let borderStroke = this.linkBorderStroke;
    if(element.dataset.htmlWebsite2pdfBorderColor) {
      borderColor = RGB.changeRange1(RGBHex.toRGB(element.dataset.htmlWebsite2pdfBorderColor));
    }
    if(element.dataset.htmlWebsite2pdfBorderStroke) {
      borderStroke = parseInt(element.dataset.htmlWebsite2pdfBorderStroke);
    }
    const linkOptions: TLinkOptions = {};
    if (borderColor) {
      linkOptions.border = {};
      linkOptions.border.color = borderColor;
      linkOptions.border.width = borderStroke;
    }
    this.pdf.addExternalLink(
      {
        x: px.toPt(rect.left + this.scrollLeft - this.offsetX),
        y:
          this.pageSize[1] -
          px.toPt(rect.bottom + this.scrollTop - this.offsetY) +
          -this.margin[1] -
          this.currentHeaderHeight,
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
      this.pdf.drawRectangleToCurrentPage(
        {
          x: px.toPt(rect.x - this.offsetX),
          y: this.pageSize[1] - +px.toPt(rect.bottom + this.scrollTop - this.offsetY) + -this.margin[1] - this.currentHeaderHeight,
        },
        px.toPt(rect.width),
        px.toPt(rect.height),
        { fillColor: this.getColorFromCssRGBValue(computedStyles.backgroundColor) },
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
      this.pdf.drawLineToCurrentPage(
        {
          x: px.toPt(rect.x - this.offsetX),
          y: this.pageSize[1] - +px.toPt(rect.y + this.scrollTop - this.offsetY) + -this.margin[1] - this.currentHeaderHeight,
        },
        {
          x: px.toPt(rect.x - this.offsetX + rect.width),
          y: this.pageSize[1] - +px.toPt(rect.y + this.scrollTop - this.offsetY) + -this.margin[1] - this.currentHeaderHeight,
        },
        {
          strokeColor: this.getColorFromCssRGBValue(computedStyles.borderTopColor),
          strokeWidth: px.toPt(parseInt(computedStyles.borderTopWidth.replace('px', ''))),
        },
      );
    }
    if (computedStyles.borderBottomWidth !== '0px' && computedStyles.borderBottomStyle !== 'none') {
      // TODO: this can only straight lines in an 90degree angle, not curved or shifted and also not dashed or dotted
      this.pdf.drawLineToCurrentPage(
        {
          x: px.toPt(rect.x - this.offsetX),
          y: this.pageSize[1] - +px.toPt(rect.bottom + this.scrollTop - this.offsetY) + -this.margin[1] - this.currentHeaderHeight,
        },
        {
          x: px.toPt(rect.x - this.offsetX + rect.width),
          y: this.pageSize[1] - +px.toPt(rect.bottom + this.scrollTop - this.offsetY) + -this.margin[1] - this.currentHeaderHeight,
        },
        {
          strokeColor: this.getColorFromCssRGBValue(computedStyles.borderBottomColor),
          strokeWidth: px.toPt(parseInt(computedStyles.borderBottomWidth.replace('px', ''))),
        },
      );
    }
    if (computedStyles.borderLeftWidth !== '0px' && computedStyles.borderLeftStyle !== 'none') {
      // TODO: this can only straight lines in an 90degree angle, not curved or shifted and also not dashed or dotted
      this.pdf.drawLineToCurrentPage(
        {
          x: px.toPt(rect.x - this.offsetX),
          y: this.pageSize[1] - +px.toPt(rect.top + this.scrollTop - this.offsetY) + -this.margin[1] - this.currentHeaderHeight,
        },
        {
          x: px.toPt(rect.x - this.offsetX),
          y: this.pageSize[1] - +px.toPt(rect.bottom + this.scrollTop - this.offsetY) + -this.margin[1] - this.currentHeaderHeight,
        },
        {
          strokeColor: this.getColorFromCssRGBValue(computedStyles.borderLeftColor),
          strokeWidth: px.toPt(parseInt(computedStyles.borderLeftWidth.replace('px', ''))),
        },
      );
    }
    if (computedStyles.borderRightWidth !== '0px' && computedStyles.borderRightStyle !== 'none') {
      // TODO: this can only straight lines in an 90degree angle, not curved or shifted and also not dashed or dotted
      this.pdf.drawLineToCurrentPage(
        {
          x: px.toPt(rect.x - this.offsetX + rect.width),
          y: this.pageSize[1] - +px.toPt(rect.top + this.scrollTop - this.offsetY) + -this.margin[1] - this.currentHeaderHeight,
        },
        {
          x: px.toPt(rect.x - this.offsetX + rect.width),
          y: this.pageSize[1] - +px.toPt(rect.bottom + this.scrollTop - this.offsetY) + -this.margin[1] - this.currentHeaderHeight,
        },
        {
          strokeColor: this.getColorFromCssRGBValue(computedStyles.borderRightColor),
          strokeWidth: px.toPt(parseInt(computedStyles.borderRightWidth.replace('px', ''))),
        },
      );
    }
  }

  /**
   * Gets the RGB values from a CSS RGB or RGBA value
   * @param {string} rgb The CSS RGB or RGBA value
   * @returns {TRGB} The RGB values
   */
  getColorFromCssRGBValue(rgb: string) {
    let color = rgb.replace('rgb(', '').replace('rgba(', '').replace(')', '').replace(' ', '').split(',');
    return RGB.changeRange1({ r: parseInt(color![0]), g: parseInt(color![1]), b: parseInt(color![2]) } as TRGB);
  }

  /**
   * Finds the Position of the new Bookmark relative to the current bookmarks and the Heading Level
   * @param {Array<TBookmarkObject>} bookmarks Array of current bookmarks
   * @param {number} level The level of the heading 
   * @param {Array<number>} positionArray The current position in the bookmarks
   * @returns {Array<TBookmarkObject>} The new bookmarks with the added bookmark
   */
  findBookmarkPosition(
    bookmarks: Array<TBookmarkObject>,
    level: number,
    positionArray: Array<number> = [],
  ): { bookmarks: Array<any>; positions: Array<number> } {
    if (!bookmarks.length || bookmarks[bookmarks.length - 1].type === level) {
      bookmarks.push({ type: level, children: [] });
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
  async enoughSpaceOnPageForElement(element: HTMLElement | Node, bottom: number, top: number) {
    const yPos = this.currentAvailableHeight - +px.toPt(bottom + this.scrollTop - this.offsetY);
    if (element instanceof HTMLElement && window.getComputedStyle(element).display === 'none') {
      return;
    }
    if (element instanceof HTMLElement && this.currentAvailableHeight < px.toPt(element.getBoundingClientRect().height)) {
      // TODO: Element is larger than the page, we ignore it for now and hope its only a wrapper
      console.warn('Element is larger than the page:', element);
    } else if (
      yPos < 0 &&
      ((element.childNodes.length === 1 && element.childNodes[0].nodeType !== 3) || element.childNodes.length < 1)
    ) {
      // TODO: We ignore elements which have children so that text breaks in lines instead of the parent
      console.log('Not enough space on the page for the element:', element);
      // TODO: check if it would be on the next page, if not push it into placeLater-Array
      await this.addPageToPdf(top);
    }
  }

  /**
   * Gets all text lines  of a textNode and returns them as an array which contains the text, the styles and the position of the textline
   * @param {Node} element The textNode which should be used to get the text lines
   * @returns {Array<TTextNodeData>} The array of the text lines
   */

  getTextLinesOfNode(element: Node): Array<TTextNodeData> {
    const textNodes = this.getTextNodes(element);
    const textWithStyles: Array<TTextNodeData> = [];
    textNodes.forEach((node) => {
      let textOfNode = '';
      if (node.parentElement?.nodeName !== 'CODE' && node.parentElement?.nodeName !== 'PRE') {
        textOfNode = node.wholeText!.replace(/\s+/g, ' ');
      } else {
        textOfNode = node.wholeText!;
      }
      const range = document.createRange();
      range.selectNodeContents(node);
      const rects = range.getClientRects();

      const computedStyle = window.getComputedStyle(node.parentElement!);
      Array.from(rects).forEach((rect) => {
        let text = '';
        // Split text content to get only the text in the current rect
        let tempEl = document.createElement('span');
        tempEl.style.setProperty('font-style', computedStyle.fontStyle);
        tempEl.style.setProperty('font-weight', computedStyle.fontWeight);
        tempEl.style.setProperty('font-size', computedStyle.fontSize);
        tempEl.style.setProperty('font-family', computedStyle.fontFamily);
        this.addElementToDOM(tempEl);
        // document.body.appendChild(tempEl);
        if (textOfNode.charAt(0) === ' ' && node.parentElement?.nodeName !== 'CODE' && node.parentElement?.nodeName !== 'PRE') {
          textOfNode = textOfNode.slice(1);
        }
        for (let i = 1; i <= textOfNode.length; i++) {
          tempEl.textContent = textOfNode.slice(0, i);
          text = textOfNode.slice(0, i);
          if (tempEl.getBoundingClientRect().width > rect.width) {
            // If we are getting bigger than the rect, we have text justify so we need to cut at the last space or hyphen
            let lastSpace = text.lastIndexOf(' ');
            let lastHyphen = text.lastIndexOf('-');
            if (lastSpace > 0 || lastHyphen > 0) {
              text = text.slice(0, lastSpace > lastHyphen ? lastSpace : lastHyphen + 1);
            }
            break;
          } else if (tempEl.getBoundingClientRect().width === rect.width) {
            break;
          }
        }
        const words = text.split(' ');
        const wordWidths = [];
        let wordSpacing = 0;

        if (words.length > 1 && computedStyle.textAlign === 'justify') {
          words.forEach((word) => {
            tempEl.textContent = word;
            wordWidths.push(tempEl.getBoundingClientRect().width);
          });

          tempEl.textContent = text;
          const textWidth = tempEl.getBoundingClientRect().width;
          wordSpacing = (rect.width - wordWidths.reduce((a, b) => a + b, 0)) / (words.length - 1);
        }
        // document.body.removeChild(tempEl);
        this.removeElementFromDOM(tempEl);

        textOfNode = textOfNode.slice(text.length);

        textWithStyles.push({
          text: text.replace('\n', ' '),
          position: rect,
          styles: computedStyle,
          wordSpacing,
          wordWidths,
        });
      });
    });

    return textWithStyles;
  }

  /**
   * Gets all text nodes of an element
   * @param {Node} element The element which should be used to get the text nodes
   * @returns {Array<Node>} The array of text nodes
   */
  getTextNodes(element: Node) {
    const textNodes: Array<Node> = [];

    if (element.nodeType === Node.TEXT_NODE) {
      textNodes.push(element);
    } else {
      element.childNodes.forEach((child) => {
        textNodes.push(...this.getTextNodes(child));
      });
    }
    return textNodes;
  }

  /**
   * Adds an element to the DOM
   * @param {HTMLElement} element The element which should be added to the DOM
   * @param {HTMLElement|undefined} parent The parent element to which the element should be added
   * @returns {void}
   */
  addElementToDOM(element: HTMLElement, parent?: HTMLElement) {
    if (parent) {
      parent.appendChild(element);
    } else {
      document.body.appendChild(element);
    }
  }

  /**
   * Removes an element from the DOM 
   * @param {HTMLElement} element The element which should be removed from the DOM
   * @returns {void}
   */
  removeElementFromDOM(element: HTMLElement) {
    element.parentElement?.removeChild(element);
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
      this.offsetY = this.currentHeader[this.currentHeader.length - 1].getBoundingClientRect().top + this.scrollTop;
      this.offsetX = this.currentHeader[this.currentHeader.length - 1].getBoundingClientRect().left + this.scrollLeft;
      await this.goTroughElements(this.createTElement(this.currentHeader[this.currentHeader.length - 1]));
      this.offsetY = tempOffsetY;
      this.offsetX = tempOffsetX;
      this.currentHeaderHeight = px.toPt(this.currentHeader[this.currentHeader.length - 1].getBoundingClientRect().height);
    }
    if (this.usePageFooters && this.currentFooter.length) {
      let tempOffsetY = this.offsetY;
      let tempOffsetX = this.offsetX;
      let tempHeight = this.pageSize[1];
      this.offsetY = this.currentFooter[this.currentFooter.length - 1].getBoundingClientRect().top + this.scrollTop;
      this.offsetX = this.currentFooter[this.currentFooter.length - 1].getBoundingClientRect().left + this.scrollLeft;
      this.pageSize[1] =
        px.toPt(this.currentFooter[this.currentFooter.length - 1].getBoundingClientRect().height) +
        this.margin[1] +
        this.margin[3] +
        this.currentHeaderHeight;
      await this.goTroughElements(this.createTElement(this.currentFooter[this.currentFooter.length - 1]));
      this.offsetY = tempOffsetY;
      this.offsetX = tempOffsetX;
      this.pageSize[1] = tempHeight;
      this.currentFooterHeight = px.toPt(this.currentFooter[this.currentFooter.length - 1].getBoundingClientRect().height);
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
   * @private
   */
  private async getFontsOfWebsite(): Promise<void> {
    // FEATURE: Here we could also add support for local fonts which are not loaded from a stylesheet, via local font api
    // Iterate through all stylesheets
    for (const styleSheet of Array.from(document.styleSheets)) {
      // Check if the stylesheet is loaded
      if (styleSheet.href && styleSheet.cssRules) {
        // Iterate through all rules of the stylesheet
        for (const rule of Array.from(styleSheet.cssRules)) {
          if (rule instanceof CSSFontFaceRule) {
            const srcs: Array<TFontSrc> = [];
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
                srcs.push({
                  url,
                  format,
                });
              });
            let fontWeight = 400;
            switch (rule.style.getPropertyValue('font-weight')) {
              case 'normal':
                fontWeight = 400;
                break;
              case 'bold':
                fontWeight = 700;
                break;
              default:
                fontWeight = parseInt(rule.style.getPropertyValue('font-weight'));
                break;
            }
            // Add the font to the fontsOfWebsite array
            this.fontsOfWebsite.push({
              fontFamily: rule.style.getPropertyValue('font-family').replace(/['"]+/g, ''),
              fontStyle: rule.style.getPropertyValue('font-style'),
              fontWeight: fontWeight,
              fontStretch: rule.style.getPropertyValue('font-stretch'),
              src: srcs,
            });
          }
        }
      }
    }
  }

  /**
   * Hide all elements which should be ignored
   * @param {HTMLElement} inputEl The element to search for the elements which should be ignored
   * @returns {void}
   * @private
   */
  private hideIgnoredElements(inputEl: HTMLElement): void {
    // Hide by tag name
    if (this.ignoreElements.length) {
      inputEl.querySelectorAll(this.ignoreElements.join(',')).forEach((el) => {
        el.classList.add('htmlWebsite2pdf-ignore');
      });
    }
    // Hide by class name
    if (this.ignoreElementsByClass.length) {
      inputEl.querySelectorAll(this.ignoreElementsByClass.map((el) => `.${el}`).join(',')).forEach((el) => {
        el.classList.add('htmlWebsite2pdf-ignore');
      });
    }
    // Hide by default data attribute
    inputEl.querySelectorAll('[data-htmlWebsite2pdf-ignore]').forEach((el) => {
      el.classList.add('htmlWebsite2pdf-ignore');
    });
    const ignoreElementsStyle = document.createElement('style');
    ignoreElementsStyle.id = 'htmlWebsite2pdf-generation-styles';
    ignoreElementsStyle.innerHTML = '.htmlWebsite2pdf-ignore { display: none !important; }';
    this.addElementToDOM(ignoreElementsStyle);
  }

  /**
   * Show again all elements which where ignored
   * @returns {void}
   * @private
   */
  private showIgnoredElements(): void {
    // remove the hiding class from all elements
    document.querySelectorAll('.htmlWebsite2pdf-ignore').forEach((el) => {
      el.classList.remove('htmlWebsite2pdf-ignore');
    });
    // remove the style tag which added the styles for the hiding class
    const ignoreElementsStyle = document.getElementById('htmlWebsite2pdf-generation-styles');
    if (ignoreElementsStyle) {
      ignoreElementsStyle.remove();
    }
  }

  /**
   * Search for a font which is used in the website by its font-family, weight and style and add it if it is not already added to the pdf
   * @param {string} fontFamily The font-family of the font
   * @param {number} fontWeight The font-weight of the font
   * @param {string} fontStyle The font-style of the font
   * @returns {Promise<{ fontFamily: string; weight: number; style: string; name: string }>} The fontobject of the used font
   * @private
   */
  private async getUsedFont(
    fontFamily: string,
    fontWeight: number | string,
    fontStyle: string,
  ): Promise<{ fontFamily: string; weight: number; style: string; name: string }> {
    return new Promise(async (resolve, reject) => {
      // Find the used font in the fontsOfWebsite array
      const foundFontOfWebsite = this.fontsOfWebsite
        .filter((font) => font.fontFamily === fontFamily && font.fontStyle === fontStyle)
        .sort((a, b) => a.fontWeight - b.fontWeight)
        .filter((font) => font.fontWeight >= fontWeight)[0];
      if (!foundFontOfWebsite) {
        // TODO: Add fallback if we don't find a font, maybe caused by a higher font weight than available
        reject(new Error(`Font ${fontFamily} with weight ${fontWeight} and style ${fontStyle} not found`));
      }
      // Check if the font is already added to the pdf
      if (
        !this.fontsUsedInPDF.find(
          (font) =>
            font.fontFamily === foundFontOfWebsite.fontFamily &&
            font.weight === foundFontOfWebsite.fontWeight &&
            font.style === foundFontOfWebsite.fontStyle,
        )
      ) {
        // TODO: Check if we have a true type font
        let fontSrc = foundFontOfWebsite.src.find((el) => el.format == 'truetype')?.url;
        // Load the font from the url
        await fetch(fontSrc!)
          .then((res) => res.arrayBuffer())
          .then((font) => {
            // Create a name for the font
            const name = `${foundFontOfWebsite.fontFamily}-${foundFontOfWebsite.fontWeight}-${foundFontOfWebsite.fontStyle}`.replace(/ /g, '');
            // Add the font to the pdf
            this.pdf.addFont(font as Buffer, name);
            // Add the font to the fonts array
            this.fontsUsedInPDF.push({
              fontFamily: foundFontOfWebsite.fontFamily,
              weight: foundFontOfWebsite.fontWeight,
              style: foundFontOfWebsite.fontStyle,
              name,
            });
          });
      }
      resolve(
        this.fontsUsedInPDF.find(
          (font) => font.fontFamily === fontFamily && font.weight === foundFontOfWebsite.fontWeight && font.style === fontStyle,
        )!,
      );
    });
  }
}
export default { Generator };
