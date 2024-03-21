import PDFDocument from './pdfDocument';
import { TBookmarkObject, TFilledGenerateOptions, TFontInfo, TFontSrc, TGenerateOptions, TPosition, TRGB, TTextNodeData } from './types';
import { ImageFormats, PdfPageLayout, PdfPageMode, PdfVersion } from './enums';
import { PageDimensions } from './constants';
import { px, pt } from './utils';
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
  usePageFooters = false;
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
   * @type {Array<TFontInfo>}
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
   * @type {Array<{ pdfPage: Page; yStart: number; yEnd: number }>}
   */
  pages: Array<{ pdfPage: Page; yStart: number; yEnd: number; headerOffset: number; footerOffset: number }> = [];

  /**
   * Array of all bookmarks (part of the outline) which are added to the PDF
   * @type {Array<TBookmarkObject>}
   */
  bookmarks: Array<TBookmarkObject> = [];

  /**
   * The current header which should be added to each page of the PDF
   */
  currentHeader: Array<HTMLElement> = [];
  currentHeaderHeight = 0;
  /**
   * The current footer which should be added to each page of the PDF
   */
  currentFooter: Array<HTMLElement> = [];
  currentFooterHeight = 0;

  currentAvailableHeight = 0;

  /**
   * Array of elements which have an id and are maybe needed for internal linking
   * @type {Array<{ id: string; pageId: number; position: TPosition }>}
   */
  elementsWithId: Array<{ id: string; page: Page; position: TPosition }> = [];

  /**
   *
   */
  internalLinkingElements: Array<{ id: string; page: Page; position: TPosition; width: number; height: number }> = [];

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
    await this.goTroughElements(inputEl);
    this.showIgnoredElements();

    this.internalLinkingElements.forEach((link) => {
      let result = this.elementsWithId.filter((el) => el.id === link.id.replace('#', ''));
      if (result.length) {
        // for now we use the first result, but we should throw an error if there are more than one
        console.log(link.position);
        this.pdf.addInternalLink(link.position, link.width, link.height, link.page, result[0].page, {
          border: { color: { r: 0, g: 0, b: 1 }, width: 1 },
        });
      }
    });
    // Save the pdf to a file
    // TODO: add fallback for ios
    let pdfString = this.pdf.outputFileAsBuffer();
    let blob = new Blob([pdfString], { type: 'application/pdf' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = this.filename;
    a.click();
  }

  /**
   * Goes through all children of the given element and places them in the PDF
   * @param {HTMLElement} element The element which should be used as the baseelement to check the children
   * @returns {Promise<void>}
   */
  async goTroughElements(element: HTMLElement): Promise<void> {
    let i = 0;
    for (const child of element.childNodes as any) {
      // check if one child is Header or footer and safe it
      let pageHeader = null;
      if (child instanceof HTMLElement && this.usePageHeaders) {
        pageHeader = child.querySelector(':scope >[data-htmlWebsite2pdf-header]');
        if (pageHeader !== null) {
          // TODO this should be a separate function
          let header = document.createElement('div');
          header.innerHTML = pageHeader.innerHTML;
          document.body.appendChild(header);
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
          document.body.appendChild(footer);
          this.currentFooter.push(footer);
        }
      }

      switch (child.nodeType) {
        case 1: // Element
          await this.handleElementNode(child);
          break;
        case 3: // Text
          await this.handleTextNode(child);
          break;
        default:
          // All other nodeTypes are not supported (and not needed), so we ignore them
          break;
      }

      if (pageHeader) {
        let lastHeader = this.currentHeader.pop();
        if (lastHeader) document.body.removeChild(lastHeader);
      }
      if (pageFooter) {
        let lastFooter = this.currentFooter.pop();
        if (lastFooter) document.body.removeChild(lastFooter);
      }
      i++;
    }
  }

  /**
   * Handles a text node and places it in the PDF
   * @param {Text} node The text node which should be placed in the PDF
   * @returns {Promise<void>}
   */
  async handleTextNode(node: Text): Promise<void> {
    const textNodes = this.getTextLinesOfNode(node);
    let elementIndex = 0;
    for (const element of textNodes) {
      // Get the font of the node, and add it to the pdf if it is not already added
      const fontOfNode = element.styles.fontFamily.split(',')[0].replace(/['"]+/g, '');
      const fontWeightOfNode = element.styles.fontWeight;
      const fontStyleOfNode = element.styles.fontStyle;
      const usedFont = await this.getUsedFont(fontOfNode, fontWeightOfNode, fontStyleOfNode);
      // Get the alignment of the text
      let align = 'left';
      if (element.styles.textAlign === 'center') {
        align = 'center';
      } else if (element.styles.textAlign === 'right') {
        align = 'right';
      }
      // Check if the element fits on the current page, if not add a new page
      await this.enoughSpaceOnPageForElement(node, element.position.bottom, element.position.top);
      // TODO: This is a workaround to place the text more correct (Problem are the descender and ascender of the font, which is not included in the font-size but in the element height)
      const textOffset = element.position.height - parseInt(element.styles.fontSize.replace('px', ''));
      console.error(this.currentHeaderHeight);

      this.pdf.addTextToCurrentPage(
        {
          x: px.toPt(element.position.x - this.offsetX) + this.margin[3],
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
        { maxWidth: px.toPt(element.position.width), alignment: align },
      );
      elementIndex++;
    }
  }

  /**
   * Handles an element node, checks for parts with should be placed in the PDF and places them in the PDF
   * @param {HTMLElement} element The element which should be placed in the PDF
   * @returns {Promise<void>}
   */
  async handleElementNode(element: HTMLElement): Promise<void> {
    // TODO: Check if we have styling which is needed to be added to the pdf
    // TODO: Check other things like pageBreakBeforeElements and pageBreakAfterElements etc.
    if (this.pageBreakBeforeElements.includes(element.tagName.toLowerCase())) {
      await this.addPageToPdf(element.getBoundingClientRect().top);
    }
    // Before we do anything we check if it fits on the current page
    await this.enoughSpaceOnPageForElement(element, element.getBoundingClientRect().bottom, element.getBoundingClientRect().top);
    // TODO: Maybe add here the check if we need a new page
    if (window.getComputedStyle(element).display === 'block') {
      // Only add borders to block elements, because inline elements the childNodes get the border
      this.addBordersToPdf(element);
    }
    if (element.id) {
      this.elementsWithId.push({
        id: element.id,
        page: this.pdf.getCurrentPage(),
        position: {
          x: element.getBoundingClientRect().left + this.scrollLeft - this.offsetX,
          y: element.getBoundingClientRect().top + this.scrollTop - this.offsetY,
        },
      });
    }
    switch (element.tagName.toLowerCase()) {
      case 'img':
        // TODO: specialcase padding is included in the size of the image
        // If clause is only needed for linting, because we already checked the tagName
        if (element instanceof HTMLImageElement) {
          await this.enoughSpaceOnPageForElement(element, element.getBoundingClientRect().bottom, element.getBoundingClientRect().top);
          let imgData = await fetch(element.src).then((res) => res.arrayBuffer());
          this.pdf.addImageToCurrentPage(
            {
              x: px.toPt(element.getBoundingClientRect().x - this.offsetX),
              y:
                this.pageSize[1] -
                +px.toPt(element.getBoundingClientRect().y + this.scrollTop - this.offsetY + element.height) +
                -this.margin[1] -
                this.currentHeaderHeight,
            },
            imgData as Buffer,
            element.naturalWidth,
            element.naturalHeight,
            px.toPt(element.width),
            px.toPt(element.height),
            ImageFormats.JPEG,
            'testimg',
          );
        }
        break;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        if (this.outlineForHeadings && element.dataset.htmlwebsite2pdfNoOutline === undefined) {
          // TODO: We should check the position and add a new page if the heading is not on the current page
          await this.enoughSpaceOnPageForElement(element, element.getBoundingClientRect().bottom, element.getBoundingClientRect().top);
          const positionResult = this.findBookmarkPosition(this.bookmarks, parseInt(element.tagName[1]));
          positionResult.positions.pop();
          this.bookmarks = positionResult.bookmarks;
          this.pdf.addBookmark(element.textContent!.trim().replace(/\s+/g, ' '), this.pdf.getCurrentPage(), positionResult.positions);
        }
        break;
      case 'a':
        if (element instanceof HTMLAnchorElement) {
          const href = element.href;
          if (href === window.location.origin) {
            // Link with the same href as the current page, so we maybe link external to the website
          } else if (href.startsWith(window.location.origin)) {
            // Link to the same website
            const targetId = element.getAttribute('href')!.replace(`${window.location.origin}`, '');
            const targetElement = this.inputEl!.querySelector(targetId);
            if (targetElement) {
              this.internalLinkingElements.push({
                id: targetId,
                page: this.pdf.getCurrentPage(),
                position: {
                  x: px.toPt(element.getBoundingClientRect().left + this.scrollLeft - this.offsetX),
                  y:
                    this.pageSize[1] -
                    px.toPt(element.getBoundingClientRect().bottom + this.scrollTop - this.offsetY) +
                    -this.margin[1] -
                    this.currentHeaderHeight,
                },
                width: px.toPt(element.getBoundingClientRect().width),
                height: px.toPt(element.getBoundingClientRect().height),
              });
            } else {
              // not found on the inputElement so we set it as an external link
            }
          } else {
            // TODO: external link
          }
        }
        break;
      default:
        // There are no special cases for the element or they are not implemented yet
        break;
    }
    await this.goTroughElements(element);
    if (this.pageBreakAfterElements.includes(element.tagName.toLowerCase())) {
      await this.addPageToPdf(element.getBoundingClientRect().bottom);
    }
  }

  addBordersToPdf(element: HTMLElement) {
    const computedStyles = window.getComputedStyle(element);
    if (computedStyles.borderTopWidth !== '0px' && computedStyles.borderTopStyle !== 'none') {
      // TODO: this can only straight lines in an 90degree angle, not curved or shifted and also not dashed or dotted
      this.pdf.drawLineToCurrentPage(
        {
          x: px.toPt(element.getBoundingClientRect().x - this.offsetX),
          y:
            this.pageSize[1] -
            +px.toPt(element.getBoundingClientRect().y + this.scrollTop - this.offsetY) +
            -this.margin[1] -
            this.currentHeaderHeight,
        },
        {
          x: px.toPt(element.getBoundingClientRect().x - this.offsetX + element.getBoundingClientRect().width),
          y:
            this.pageSize[1] -
            +px.toPt(element.getBoundingClientRect().y + this.scrollTop - this.offsetY) +
            -this.margin[1] -
            this.currentHeaderHeight,
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
          x: px.toPt(element.getBoundingClientRect().x - this.offsetX),
          y:
            this.pageSize[1] -
            +px.toPt(element.getBoundingClientRect().bottom + this.scrollTop - this.offsetY) +
            -this.margin[1] -
            this.currentHeaderHeight,
        },
        {
          x: px.toPt(element.getBoundingClientRect().x - this.offsetX + element.getBoundingClientRect().width),
          y:
            this.pageSize[1] -
            +px.toPt(element.getBoundingClientRect().bottom + this.scrollTop - this.offsetY) +
            -this.margin[1] -
            this.currentHeaderHeight,
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
          x: px.toPt(element.getBoundingClientRect().x - this.offsetX),
          y:
            this.pageSize[1] -
            +px.toPt(element.getBoundingClientRect().top + this.scrollTop - this.offsetY) +
            -this.margin[1] -
            this.currentHeaderHeight,
        },
        {
          x: px.toPt(element.getBoundingClientRect().x - this.offsetX),
          y:
            this.pageSize[1] -
            +px.toPt(element.getBoundingClientRect().bottom + this.scrollTop - this.offsetY) +
            -this.margin[1] -
            this.currentHeaderHeight,
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
          x: px.toPt(element.getBoundingClientRect().x - this.offsetX + element.getBoundingClientRect().width),
          y:
            this.pageSize[1] -
            +px.toPt(element.getBoundingClientRect().top + this.scrollTop - this.offsetY) +
            -this.margin[1] -
            this.currentHeaderHeight,
        },
        {
          x: px.toPt(element.getBoundingClientRect().x - this.offsetX + element.getBoundingClientRect().width),
          y:
            this.pageSize[1] -
            +px.toPt(element.getBoundingClientRect().bottom + this.scrollTop - this.offsetY) +
            -this.margin[1] -
            this.currentHeaderHeight,
        },
        {
          strokeColor: this.getColorFromCssRGBValue(computedStyles.borderRightColor),
          strokeWidth: px.toPt(parseInt(computedStyles.borderRightWidth.replace('px', ''))),
        },
      );
    }
  }

  getColorFromCssRGBValue(rgb: string) {
    let color = rgb.replace('rgb(', '').replace(')', '').replace(' ', '').split(',');
    return { r: parseInt(color![0]), g: parseInt(color![1]), b: parseInt(color![2]) } as TRGB;
  }

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

  async enoughSpaceOnPageForElement(element: HTMLElement | Node, bottom: number, top: number) {
    const yPos = this.currentAvailableHeight - +px.toPt(bottom + this.scrollTop - this.offsetY);
    if (element instanceof HTMLElement && window.getComputedStyle(element).display === 'none') {
      return;
    }
    if (element instanceof HTMLElement && this.currentAvailableHeight < px.toPt(element.getBoundingClientRect().height)) {
      // TODO: Element is larger than the page, we ignore it for now and hope its only a wrapper
      console.warn('Element is larger than the page:', element);
    } else if (yPos < 0) {
      console.log('Not enough space on the page for the element:', element);
      // TODO: check if it would be on the next page, if not push it into placeLater-Array
      await this.addPageToPdf(top);
    }
  }

  /**
   * Gets all text lines  of a textNode and returns them as an array which contains the text, the styles and the position of the textline
   * @param {Node} node The textNode which should be used to get the text lines
   * @returns {Array<TTextNodeData>} The array of the text lines
   */
  getTextLinesOfNode(node: Node): Array<TTextNodeData> {
    const nodes: Array<TTextNodeData> = [];
    if (window.getComputedStyle(node.parentNode as Element).display !== 'none') {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.nodeValue && node.nodeValue.trim() === '') {
          return nodes;
        } else {
          let range = document.createRange();
          range.selectNodeContents(node);
          let rects = Array.from(range.getClientRects());
          const styles = window.getComputedStyle(node.parentNode as Element);
          let lines = this.splitTextFromElement(node.parentNode as HTMLElement);
          rects.forEach((rect, index) => {
            nodes.push({
              text: lines[index].trim(),
              styles,
              position: rect,
            });
          });
        }
      } else {
        for (let child of Array.from(node.childNodes)) {
          nodes.push(...this.getTextLinesOfNode(child));
        }
      }
    }
    return nodes;
  }

  /**
   * Splits the text of an element into multiple lines if the text is longer than the elements width
   * @param {HTMLElement} el The element which should be split
   * @returns {Array<string>} The array of the splitted text
   */
  splitTextFromElement(el: HTMLElement): Array<string> {
    let lines = [];
    // Get all words of the textContent
    const words = el.innerText.split(' ');
    // Check if the words contain a hyphen, if yes split the word at the hyphen into two words
    words.forEach((word, idx) => {
      if (word.includes('-')) {
        let splittedWord = word.split('-');
        words.splice(idx, 1, `${splittedWord[0]}-`, splittedWord[1]);
      }
    });
    el.innerText = words[0];
    let currentLine = words[0];
    let height = el.offsetHeight;

    words.slice(1).forEach((word) => {
      el.innerText += ` ${word}`;
      if (el.offsetHeight > height) {
        // we have a line break
        height = el.offsetHeight;
        lines.push(currentLine);
        currentLine = word;
      } else if (currentLine.charAt(currentLine.length - 1) === '-') {
        // we have a hyphen so we need to add the next word to the line without a space
        currentLine += word;
      } else {
        currentLine += ` ${word}`;
      }
    });
    lines.push(currentLine);
    return lines;
  }

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
      await this.goTroughElements(this.currentHeader[this.currentHeader.length - 1]);
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
      await this.goTroughElements(this.currentFooter[this.currentFooter.length - 1]);
      this.offsetY = tempOffsetY;
      this.offsetX = tempOffsetX;
      this.pageSize[1] = tempHeight;
      this.currentFooterHeight = px.toPt(this.currentFooter[this.currentFooter.length - 1].getBoundingClientRect().height);
    }
    this.currentAvailableHeight -= this.currentHeaderHeight + this.currentFooterHeight;
    this.pages.push({
      pdfPage: this.pdf.getCurrentPage(),
      yStart: this.offsetY,
      yEnd: this.offsetY + this.currentAvailableHeight,
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
    // TODO: add also support for local fonts which are not loaded from a stylesheet, via local font api
    // if ('queryLocalFonts' in window) {
    //   // The Local Font Access API is supported
    //   console.log('Local Font Access API is supported');
    //   const availableFonts = await window.queryLocalFonts({
    //   });
    //   for (const fontData of availableFonts) {
    //     try {
    //     // `blob()` returns a Blob containing valid and complete
    //       // SFNT-wrapped font data.
    //       const sfnt = await fontData.blob();
    //       // Slice out only the bytes we need: the first 4 bytes are the SFNT
    //       // version info.
    //       // Spec: https://docs.microsoft.com/en-us/typography/opentype/spec/otff#organization-of-an-opentype-font
    //       const sfntVersion = await sfnt.slice(0, 4).text();

    //       let outlineFormat = "UNKNOWN";
    //       switch (sfntVersion) {
    //         case "\x00\x01\x00\x00":
    //         case "true":
    //         case "typ1":
    //           outlineFormat = "truetype";
    //           break;
    //         case "OTTO":
    //           outlineFormat = "cff";
    //           break;
    //       }
    //       console.log("Outline format:", outlineFormat);
    //     } catch (err) {
    //       console.error(err.name, err.message);
    //     }
    //     }
    // }
    // Iterate through all stylesheets
    for (const styleSheet of Array.from(document.styleSheets)) {
      // Check if the stylesheet is loaded
      if (styleSheet.href) {
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
    inputEl.appendChild(ignoreElementsStyle);
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
    fontWeight: number,
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
