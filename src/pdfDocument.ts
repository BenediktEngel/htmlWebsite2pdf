import * as fontkit from 'fontkit';
import { ImageFormats, PdfPageLayout, PdfPageMode, PdfVersion, StringType } from './enums';
import { PageDimensions } from './constants';
import { CrossReferenceSection } from './pdfSections/CrossReferenceSection';
import { BaseObject } from './pdfObjects/BasicObjects/BaseObject';
import { NameObject } from './pdfObjects/BasicObjects/NameObject';
import { ArrayObject } from './pdfObjects/BasicObjects/ArrayObject';
import { BooleanObject } from './pdfObjects/BasicObjects/BooleanObject';
import { DictionaryObject } from './pdfObjects/BasicObjects/DictionaryObject';
import { NullObject } from './pdfObjects/BasicObjects/NullObject';
import { NumericObject } from './pdfObjects/BasicObjects/NumericObject';
import { StreamObject } from './pdfObjects/BasicObjects/StreamObject';
import { StringObject } from './pdfObjects/BasicObjects/StringObject';
import { CatalagDictionary } from './pdfObjects/IntermediateObjects/CatalogDictionary';
import { Page } from './pdfObjects/IntermediateObjects/Page';
import { PageTree } from './pdfObjects/IntermediateObjects/PageTree';
import { Rectangle } from './pdfObjects/IntermediateObjects/Rectangle';
import { IIndirectObject, IPDFDocument } from './interfaces';
import { TDocumentOptions, TRectangleOptions, TLineOptions, TPosition, TBookmark, TLinkOptions, TTextOptions } from './types';
import { RGB, dateToASN1, toHex } from './utils';
import * as fontHelper from './Font';
import { FontDictionary } from './pdfObjects/IntermediateObjects/FontDictionary';

export class PDFDocument implements IPDFDocument {
  /**
   * The version of the PDF document.
   * @readonly
   * @type {PdfVersion}
   */
  readonly version: PdfVersion;

  /**
   * The title of the PDF document.
   * @type {string}
   */
  title: string;

  /**
   * The subject of the PDF document.
   * @type {string}
   */
  subject: string;

  /**
   * The keywords of the PDF document.
   * @type {string}
   */
  keywords: string;

  /**
   * The author of the PDF document.
   * @type {string}
   */
  author: string;

  /**
   * The list of all indirect objects.
   * @type {Map<number, IIndirectObject>}
   */
  readonly indirectObjects: Map<number, IIndirectObject> = new Map();

  /**
   * The cross reference table of the PDF document.
   * @type {CrossReferenceSection}
   */
  crossReferenceTable: CrossReferenceSection = new CrossReferenceSection(this);

  /**
   * The Catalog of the PDF document.
   * @type {CatalagDictionary}
   */
  catalog: CatalagDictionary | undefined;

  /**
   * The pageTree object of the PDF document.
   * @type {PageTree}
   */
  pageTree: PageTree | undefined;

  /**
   * The trailer of the PDF document.
   * @type {DictionaryObject}
   */
  trailer: DictionaryObject = new DictionaryObject(this);

  /**
   * The Info Dictionary of the PDF document.
   * @type {DictionaryObject}
   */
  info: DictionaryObject = new DictionaryObject(this, new Map(), true);

  /**
   * The Map of all fontNames which are included to the PDF document, which chars are used and the font itself.
   * @type {Map<string, {FontDictionary, Set<string>, Buffer, any}>}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  includedFonts: Map<string, { fontDictionary: FontDictionary; usedChars: Set<string>; file: Buffer; fontObj: any }> = new Map();

  bookmarkStructure: Array<TBookmark> = [];

  /**
   * Create a new PDF document.
   * @param {TDocumentOptions} [options= { version: PdfVersion.V1_7, title: '', subject: '', keywords: '', author: '' }] The options for the PDF document.
   */
  constructor(options: TDocumentOptions = { version: PdfVersion.V1_7, title: '', subject: '', keywords: '', author: '' }) {
    if (!options.version) console.warn('No version, using 1.7');
    this.version = options.version || PdfVersion.V1_7;
    this.title = options.title || '';
    this.subject = options.subject || '';
    this.keywords = options.keywords || '';
    this.author = options.author || '';
    this.createCatalog();
    this.createPageTree();
    this.createInfo();
    if (options.pageLayout && options.pageLayout !== PdfPageLayout.SINGLE_PAGE)
      this.catalog?.setValueByKey('PageLayout', NameObject.getName(this, options.pageLayout));
    if (options.pageMode && options.pageMode !== PdfPageMode.USE_NONE)
      this.catalog?.setValueByKey('PageMode', NameObject.getName(this, options.pageMode));
    if (options.viewerPreferences && this.versionGreaterOrEqual(PdfVersion.V1_2)) {
      const viewerPreferences = new DictionaryObject(this);
      this.catalog?.setValueByKey('ViewerPreferences', viewerPreferences);
      viewerPreferences?.setValueByKey('DisplayDocTitle', new BooleanObject(this, options.viewerPreferences.displayDocTitle!));
    }
    this.trailer.setValueByKey('Root', this.catalog as DictionaryObject);
    this.trailer.setValueByKey('Info', this.info);
  }

  /**
   * Output the header and body of the PDF document as a Buffer.
   * @returns {Buffer} The header and body of the PDF document.
   */
  private  outputHeaderAndBody(): Buffer {
    let outputBuffer = Buffer.from(`%PDF-${this.version}\r\n%âãÏÒ\r\n`);
    this.indirectObjects.forEach((indirectObject, id) => {
      const temp = indirectObject;
      const objectOutput = indirectObject.obj.toBuffer();
      temp.byteOffset = outputBuffer.byteLength;
      this.indirectObjects.set(id, temp);
      outputBuffer = Buffer.concat([outputBuffer, objectOutput, Buffer.from('\r\n')]);
    });
    return outputBuffer;
  }

  /**
   * Create a new object id which is not already in use.
   * @returns {number} The new object id.
   */
  private createObjectId(): number {
    let id = 1;
    while (this.indirectObjects.has(id)) {
      id += 1;
    }
    return id;
  }

  /**
   * Output the complete PDF document as a Buffer.
   * @returns {Buffer} The PDF document as a Buffer.
   */
  outputFileAsBuffer(): Buffer {
    this.createDocumentOutline();
    this.includedFonts.forEach((font, name) => {
      if (font.usedChars.size === 0) {
        let item = this.indirectObjects.get(font.fontDictionary.id!);
        this.indirectObjects.set(font.fontDictionary.id!, { obj: item!.obj, generation: item!.generation, byteOffset: undefined, inUse: false});
      } else {
        fontHelper.addFontToDocument(this, font);
      }
    });
    const body = this.outputHeaderAndBody();
    const bytesToStartxref = body.byteLength;
    return Buffer.concat([
      body,
      Buffer.from(`${this.createCrossReferenceTable()}trailer\r\n${this.trailer.toBuffer()}\r\nstartxref\r\n${bytesToStartxref}\r\n%%EOF`),
    ]);
  }

  /**
   * Add a new page to the PDF document.
   * @param {[number, number]} [pageDimensions=PageDimensions.A4] The dimensions of the new page, default is A4.
   * @returns {void}
   */
  addPage(pageDimensions: [number, number] = PageDimensions.A4): void {
    if (!this.pageTree) this.createPageTree();

    const newPage = new Page(
      this,
      new Map<NameObject, NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject>([
        [NameObject.getName(this, 'MediaBox'), new Rectangle(this, 0, 0, pageDimensions[0], pageDimensions[1])],
      ]),
      true,
    );
    const pageTreeKids = this.pageTree?.getValueByKey('Kids');
    if (pageTreeKids && pageTreeKids instanceof ArrayObject) {
      pageTreeKids.push(newPage);
    } else {
      this.pageTree?.setValueByKey('Kids', new ArrayObject(this, [newPage]));
    }
    const count = this.pageTree?.getValueByKey('Count');
    if (count && count instanceof NumericObject) {
      count.value += 1;
    } else {
      this.pageTree?.setValueByKey('Count', new NumericObject(this, 1));
    }
  }

  /**
   * Output the cross reference table as a string.
   * @returns {string} The cross reference table as a string.
   */
  private createCrossReferenceTable(): string {
    // Build the cross reference table
    this.indirectObjects.forEach((object, id) => {
      if (!object.byteOffset) throw new Error(`Byte offset for indirect object with id ${id} is not set! Couldn't build cross reference table.`);
      this.crossReferenceTable.addEntry(id, object.byteOffset, object.generation, object.inUse);
    });
    this.trailer.setValueByKey('Size', this.crossReferenceTable.size);
    return this.crossReferenceTable.outputTable();
  }

  /**
   * Add an object to the list of indirect objects.
   * @param {BaseObject} obj The object which should be indirect.
   * @param {number} [generation=0] The generation of the object.
   * @returns {number} The id of the indirect object.
   */
  addIndirectObject(obj: BaseObject, generation = 0): number {
    const newObjectId = this.createObjectId();
    this.indirectObjects.set(newObjectId, { obj, generation, inUse: true});
    return newObjectId;
  }

  /**
   * Get an indirect object by its id.
   * @param id {number} The id of the indirect object.
   * @returns {IIndirectObject | undefined} The indirect object with the given id or undefined if no such object exists.
   */
  getIndirectObject(id: number): IIndirectObject | undefined {
    return this.indirectObjects.get(id);
  }

  /**
   * Create the catalog of the PDF document.
   * @returns {void}
   * @throws {Error} If the catalog already exists.
   */
  createCatalog(): void {
    if (this.catalog) {
      throw new Error('Catalog already exists');
    }
    this.catalog = new CatalagDictionary(
      this,
      new Map([
        [NameObject.getName(this, 'Version'), NameObject.getName(this, this.version)],
        // TODO: Maybe add more values based on Options
      ]),
      true,
    );
  }

  /**
   * Create the info dictionary of the PDF document.
   * @returns {void}
   */
  createInfo(): void {
    if (this.title !== '') this.info.setValueByKey('Title', new StringObject(this, this.title));
    if (this.subject !== '') this.info.setValueByKey('Subject', new StringObject(this, this.subject));
    if (this.keywords !== '') this.info.setValueByKey('Keywords', new StringObject(this, this.keywords));
    if (this.author !== '') this.info.setValueByKey('Author', new StringObject(this, this.author));
    this.info.setValueByKey('Creator', new StringObject(this, 'htmlWebsite2pdf'));
    this.info.setValueByKey('Producer', new StringObject(this, 'htmlWebsite2pdf'));
    const date = dateToASN1(new Date());
    this.info.setValueByKey('CreationDate', new StringObject(this, `D:${date}`));
    this.info.setValueByKey('ModDate', new StringObject(this, `D:${date}`));
  }

  /**
   * Create the pageTree object of the PDF document.
   * @returns {void}
   * @throws {Error} If the pageTree object already exists.
   */
  createPageTree(): void {
    if (this.pageTree) {
      throw new Error('pageTree already exists');
    }
    this.pageTree = new PageTree(this, new Map([]), true);
    if (!this.catalog) {
      this.createCatalog();
    }
    this.catalog?.setValueByKey('Pages', this.pageTree);
  }

  /**
   * Add a font to the PDF document. The font will be embedded in the document if it is used, otherwise it will be removed.
   * @param {Buffer} font The font as a Buffer.
   * @param {string} fontName A string which will be used to reference the font when adding text.
   */
  addFont(font: Buffer, fontName: string): void {
    const fontDictionary = new FontDictionary(this, new Map(), true);
    const fontObj = fontkit.create(Buffer.from(font));
    this.includedFonts.set(fontName, { fontDictionary, usedChars: new Set(), file: Buffer.from(font), fontObj });
  }

  /**
   * Add text to a page of the PDF document.
   * @overload
   * @param {TPosition} pos The position of the text in pt.
   * @param {string} text The text to add
   * @param {string} fontName The name of the font to use, must be added before with addFont
   * @param {number} fontSize The size of the font
   * @param {number | Page | undefined} [page=undefined] The page number (starting at 0) to add the text to, if no page is provided, the text will be added to the current (last) page.
   * @returns {void}
   * @overload
   * @param {TPosition} pos The position of the text in pt.
   * @param {string} text The text to add
   * @param {string} fontName The name of the font to use, must be added before with addFont
   * @param {number} fontSize The size of the font
   * @param {TTextOptions} [options=undefined] A page number to add the text to or additional options for the text, like the fill-color, stroke-color and stroke-width. If no options are provided, the text will be filled with a black color and have no stroke. If no stroke-color is provided, there will be no stroke.
   * @param {number | Page | undefined} [page=undefined] The page number (starting at 0) to add the text to, if no page is provided, the text will be added to the current (last) page.
   * @returns {void}
   * @overload
   * @param {TPosition} pos The position of the text in pt.
   * @param {string} text The text to add
   * @param {string} fontName The name of the font to use, must be added before with addFont
   * @param {number} fontSize The size of the font
   * @param {TTextOptions | number | Page | undefined} [pageOrOptions=undefined] A page number to add the text to or additional options for the text, like the fill-color, stroke-color and stroke-width. If no options are provided, the text will be filled with a black color and have no stroke. If no stroke-color is provided, there will be no stroke.
   * @param {number | Page | undefined} [page=undefined] The page number (starting at 0) to add the text to, if no page is provided, the text will be added to the current (last) page.
   * @returns {void}
   */
  addTextToPage(pos: TPosition, text: string, fontName: string, fontSize: number, page?: number | Page): void;
  addTextToPage(pos: TPosition, text: string, fontName: string, fontSize: number, options: TTextOptions, page?: number | Page): void;
  addTextToPage(
    pos: TPosition,
    text: string,
    fontName: string,
    fontSize: number,
    optionsOrPage?: TTextOptions | number | Page | undefined,
    page?: number | Page | undefined,
  ): void {
    let pageId;
    let options;
    if (typeof optionsOrPage === 'number' || optionsOrPage === undefined) {
      pageId = optionsOrPage;
      options = {};
    } else {
      options = optionsOrPage;
      pageId = page;
    }
    let newX = pos.x;
    const font = this.includedFonts.get(fontName);
    if (!font) {
      throw new Error(`Font with name ${fontName} not found`);
    }
    const fontId = font.fontDictionary.id;
    if (!fontId) {
      throw new Error(`Font with name ${fontName} has no id`);
    }
    // Add used chars to object in includedFonts
    text.split('').forEach((char) => {
      font.usedChars.add(char);
    });
    this.includedFonts.set(fontName, font);
    if (options.alignment && options.alignment !== 'left' && !options.maxWidth) {
      throw new Error('maxWidth is required for text alignment other than left');
    }
    if (options.maxWidth && options.alignment && options.alignment !== 'left') {
      const glyphsForString = font.fontObj.layout(text).glyphs;
      let fullWidth = 0;
      let fontScaling = 1000 / font.fontObj.unitsPerEm;
      glyphsForString.forEach((glyph: any) => {
        fullWidth += glyph.advanceWidth * fontScaling * (fontSize / 1000);
      });
      if (options.alignment === 'center') {
        newX += (options.maxWidth - fullWidth) / 2;
      } else if (options.alignment === 'right') {
        newX += options.maxWidth - fullWidth;
      }
    }
    // get current (last) PageObject
    let currentPage: Page | undefined = undefined;
    if (typeof pageId === 'number' || pageId === undefined) {
      currentPage = this.getPageAt(pageId);
    } else {
      currentPage = pageId;
    }

    // If resources dont include the font add it
    const currentPageResources = this.getPageRessources(currentPage!);
    const fontResource = currentPageResources.getValueByKey('Font');
    if (!fontResource) {
      // We dont have a font resource, create a new one
      currentPageResources.setValueByKey(
        'Font',
        new DictionaryObject(
          this,
          new Map<NameObject, NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject>(
            [[NameObject.getName(this, fontName), this.indirectObjects.get(fontId)?.obj as DictionaryObject]],
          ),
        ),
      );
    } else if (fontResource instanceof DictionaryObject) {
      fontResource.setValueByKey(NameObject.getName(this, fontName), this.indirectObjects.get(fontId)?.obj as DictionaryObject);
    }

    // Create hex representation of text
    let hexString = '';
    font.fontObj.layout(text).glyphs.forEach((glyph: any) => {
      hexString += toHex(glyph.id);
    });
    let colorString = '';
    if (options.color) {
      colorString = `${options.color.r} ${options.color.g} ${options.color.b} rg`;
    }
    let wordspaceString = '';
    if (options.wordspace) {
      wordspaceString = `${options.wordspace} Tw`;
    }
    // Add content to contents
    this.appendToPageContents(
      currentPage!,
      Buffer.from(`BT /${fontName} ${fontSize} Tf ${colorString} ${wordspaceString} ${newX} ${pos.y} Td <${hexString}> Tj ET`),
    );
  }

  /**
   * Add an image to a page of the PDF document.
   * @param {TPosition} pos - The position where the image should be placed on the page in pt.
   * @param {Buffer} image - The image as a Buffer.
   * @param {number} width - The width of the image in pt.
   * @param {number} height - The height of the image in pt.
   * @param {number} embedWidth - The width of the image on the page in pt.
   * @param {number} embedHeight - The height of the image on the page in pt.
   * @param {ImageFormats} format - The format of the image.
   * @param {string} imageName - The name of the image, which will be used to reference the image when adding it to the page.
   * @param {number} [page=undefined] - The page number (starting at 0) to add the image to, if no page is provided, the image will be added to the current (last) page.
   * @returns {void}
   */
  addImageToPage(
    pos: TPosition,
    image: Buffer,
    width: number,
    height: number,
    embedWidth: number,
    embedHeight: number,
    format: ImageFormats,
    imageName: string,
    page?: number | Page,
  ): void {
    let imageStream;
    if (format === ImageFormats.JPEG) {
      imageStream = new StreamObject(
        this,
        Buffer.from(image),
        new DictionaryObject(
          this,
          new Map<NameObject, NameObject | NumericObject>([
            [NameObject.getName(this, 'Type'), NameObject.getName(this, 'XObject')],
            [NameObject.getName(this, 'Subtype'), NameObject.getName(this, 'Image')],
            [NameObject.getName(this, 'Width'), new NumericObject(this, width)],
            [NameObject.getName(this, 'Height'), new NumericObject(this, height)],
            [NameObject.getName(this, 'ColorSpace'), NameObject.getName(this, 'DeviceRGB')],
            [NameObject.getName(this, 'BitsPerComponent'), new NumericObject(this, 8)],
            [NameObject.getName(this, 'Filter'), NameObject.getName(this, 'DCTDecode')],
          ]),
        ),
        true,
      );
    } else {
      throw new Error('Image format is currently not supported');
    }
    let currentPage;
    if (page instanceof Page) {
      currentPage = page;
    } else {
      currentPage = this.getPageAt(page);
    }
    const currentPageResources = this.getPageRessources(currentPage);
    const imageResource = currentPageResources.getValueByKey('XObject');
    if (!imageResource) {
      // We dont have a font resource, create a new one
      currentPageResources.setValueByKey(
        'XObject',
        new DictionaryObject(
          this,
          new Map<NameObject, NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject>(
            [[NameObject.getName(this, imageName), imageStream]],
          ),
        ),
      );
    } else if (imageResource instanceof DictionaryObject) {
      imageResource.setValueByKey(NameObject.getName(this, imageName), imageStream);
    }
    this.appendToPageContents(currentPage, Buffer.from(`q 1 0 0 1 ${pos.x} ${pos.y} cm ${embedWidth} 0 0 ${embedHeight} 0 0 cm /${imageName} Do Q`));
  }

  /**
   * Draw a rectangle to a page of the PDF document.
   * @overload
   * @param {TPosition} pos - The lower left corner of the rectangle in pt.
   * @param {number} width - The width of the rectangle in pt.
   * @param {number} height - The height of the rectangle in pt.
   * @param {number | undefined} [page=undefined] - The page number (starting at 0) to draw the rectangle on, if no page is provided, the rectangle will be drawn on the current (last) page.
   * @returns {void}
   *
   * @overload
   * @param {TPosition} pos - The lower left corner of the rectangle in pt.
   * @param {number} width - The width of the rectangle in pt.
   * @param {number} height - The height of the rectangle in pt.
   * @param {TRectangleOptions} [options={}] - Additional options for the rectangle, like the fill-color, stroke-color and stroke-width. If no options are provided, the rectangle will be filled with a black color and have no stroke. If no stroke-color is provided, there will be no stroke.
   * @param {number | undefined} [page=undefined] - The page number (starting at 0) to draw the rectangle on, if no page is provided, the rectangle will be drawn on the current (last) page.
   * @returns {void}
   *
   * @overload
   * @param {TPosition} pos - The lower left corner of the rectangle in pt.
   * @param {number} width - The width of the rectangle in pt.
   * @param {number} height - The height of the rectangle in pt.
   * @param {TRectangleOptions | number | undefined} [pageOrOptions=undefined] - A page number to draw the rectangle on or additional options for the rectangle, like the fill-color, stroke-color and stroke-width. If no options are provided, the rectangle will be filled with a black color and have no stroke. If no stroke-color is provided, there will be no stroke.
   * @param {number | undefined} [page=undefined] - The page number (starting at 0) to draw the rectangle on, if no page is provided, the rectangle will be drawn on the current (last) page.
   * @returns {void}
   */
  drawRectangleToPage(pos: TPosition, width: number, height: number, page?: number): void;
  drawRectangleToPage(pos: TPosition, width: number, height: number, options: TRectangleOptions, page?: number): void;
  drawRectangleToPage(pos: TPosition, width: number, height: number, pageOrOptions: TRectangleOptions | number | undefined, page?: number): void {
    let pageId;
    let options;
    if (typeof pageOrOptions === 'number' || pageOrOptions === undefined) {
      pageId = pageOrOptions;
      options = {};
    } else {
      options = pageOrOptions;
      pageId = page;
    }
    const fillColor = options.fillColor || { r: 0, g: 0, b: 0 };
    const strokeColor = options.strokeColor || { r: 0, g: 0, b: 0 };
    const strokeWidth = options.strokeWidth || 0;
    const currentPage = this.getPageAt(pageId);
    this.appendToPageContents(
      currentPage,
      Buffer.from(
        `${strokeWidth} w q ${strokeColor.r} ${strokeColor.g} ${strokeColor.b} RG ${fillColor.r} ${fillColor.g} ${fillColor.b} rg ${pos.x} ${
          pos.y
        } ${width} ${height} re ${options.strokeColor ? 'B' : 'f'} Q`,
      ),
    );
  }

  /**
   * Draw a straight line to a page of the PDF document.
   * @overload
   * @param {TPosition} start - The start position of the line in pt.
   * @param {TPosition} end - The end position of the line in pt.
   * @param {number | undefined} [page=undefined] - The page number (starting at 0) to draw the line on, if no page is provided, the line will be drawn on the current (last) page.
   * @returns {void}
   *
   * @overload
   * @param {TPosition} start - The start position of the line in pt.
   * @param {TPosition} end - The end position of the line in pt.
   * @param {TLineOptions} [options={}] - Additional options for the line, like the stroke-color and stroke-width. If no options are provided, the line will be drawn with a black color and a width of 1pt.
   * @param {number | undefined} [page=undefined] - The page number (starting at 0) to draw the line on, if no page is provided, the line will be drawn on the current (last) page.
   * @returns {void}
   *
   * @overload
   * @param {TPosition} start - The start position of the line in pt.
   * @param {TPosition} end - The end position of the line in pt.
   * @param {TLineOptions} [options={}] - Additional options for the line, like the stroke-color and stroke-width. If no options are provided, the line will be drawn with a black color and a width of 1pt.
   * @param {number | undefined} [page=undefined] - The page number (starting at 0) to draw the line on, if no page is provided, the line will be drawn on the current (last) page.
   * @returns {void}
   */
  drawLineToPage(start: TPosition, end: TPosition, page?: number): void;
  drawLineToPage(start: TPosition, end: TPosition, options?: TLineOptions, page?: number): void;
  drawLineToPage(start: TPosition, end: TPosition, pageOrOptions?: TLineOptions | number, page?: number): void {
    let pageId;
    let options;
    if (typeof pageOrOptions === 'number' || pageOrOptions === undefined) {
      pageId = pageOrOptions;
      options = {};
    } else {
      options = pageOrOptions;
      pageId = page;
    }
    const strokeColor = options.strokeColor || { r: 0, g: 0, b: 0 };
    const strokeWidth = options.strokeWidth || 1;
    const currentPage = this.getPageAt(pageId);
    this.appendToPageContents(
      currentPage,
      Buffer.from(`${strokeWidth} w q ${strokeColor.r} ${strokeColor.g} ${strokeColor.b} RG ${start.x} ${start.y} m ${end.x} ${end.y} l S Q`),
    );
  }

  /**
   * Add a bookmark to the PDF document. Bookmarks are used to create the document outline in the PDF reader.
   * @param {string} title - The title of the bookmark. This will be displayed in the document outline.
   * @param {Page} page - The page to link the bookmark to.
   * @param {Array<number>} [position=[]] - The position of the bookmark in the document outline. Each value in the  position-array representates the position in a List. Example: [2,3], this would create a Subsubchapter in the 3. subchapter of the 2. chapter (so 2.3.1).  If no position is provided, the bookmark will be added to the end of the root of the document outline.
   */
  addBookmark(title: string, page: Page, position: Array<number> = []): void {
    const bookmark: TBookmark = {
      title,
      pageObjectId: page.id!,
      children: [],
    };
    if (!position.length) {
      this.bookmarkStructure.push(bookmark);
    } else {
      let currentBookmark = this.bookmarkStructure;
      position.forEach((index) => {
        if (!currentBookmark[index - 1]) {
          throw new Error('Position is out of range');
        }
        currentBookmark = currentBookmark[index - 1].children;
      });
      currentBookmark.push(bookmark);
    }
  }

  /**
   * Create the document outline object of the PDF document and add it to the catalog.
   * @returns {void}
   */
  private createDocumentOutline(): void {
    if (!this.bookmarkStructure.length) return;
    const outline = new DictionaryObject(this, new Map(), true);
    this.bookmarkStructure.forEach((bookmark) => {
      this.createOutlineItem(bookmark, outline);
    });
    outline.setValueByKey('First', this.indirectObjects.get(this.bookmarkStructure[0].objectId!)?.obj as DictionaryObject);
    outline.setValueByKey(
      'Last',
      this.indirectObjects.get(this.bookmarkStructure[this.bookmarkStructure.length - 1].objectId!)?.obj as DictionaryObject,
    );
    if (this.bookmarkStructure.length > 1) {
      this.bookmarkStructure.forEach((bookmark, index) => {
        if (index > 0) {
          const obj = this.indirectObjects.get(bookmark.objectId!)?.obj as DictionaryObject;
          const prevObj = this.indirectObjects.get(this.bookmarkStructure[index - 1].objectId!)?.obj as DictionaryObject;
          // Set Prev to the current object
          obj.setValueByKey('Prev', prevObj);
          // Set Next to the previous object
          prevObj.setValueByKey('Next', obj);
        }
      });
    }
    this.catalog?.setValueByKey('Outlines', outline);
  }

  /**
   * Create an outline item for the document outline.
   * @param {TBookmark} bookmark - The bookmark to create the outline item for.
   * @param {DictionaryObject} parent - The parent of the outline item.
   * @returns {void}
   */
  private createOutlineItem(bookmark: TBookmark, parent: DictionaryObject): void {
    const outlineItem = new DictionaryObject(this, new Map(), true);
    bookmark.objectId = outlineItem.id;
    outlineItem.setValueByKey('Title', new StringObject(this, bookmark.title));
    outlineItem.setValueByKey('Parent', parent);
    outlineItem.setValueByKey(
      'Dest',
      // TODO: Add support for other zooms instead of /fit, maybe change to: /XYZ null y-pos null
      new ArrayObject(this, [this.indirectObjects.get(bookmark.pageObjectId!)?.obj as Page, NameObject.getName(this, 'Fit')]),
    );
    if (bookmark.children.length) {
      bookmark.children.forEach((child, index) => {
        this.createOutlineItem(child, outlineItem);
        if (index > 0) {
          // Set Prev to the current object
          const obj = this.indirectObjects.get(child.objectId!)?.obj as DictionaryObject;
          const prevObj = this.indirectObjects.get(bookmark.children[index - 1].objectId!)?.obj as DictionaryObject;
          obj.setValueByKey('Prev', prevObj);
          // Set Next to the previous object
          prevObj.setValueByKey('Next', obj);
        }
      });
      outlineItem.setValueByKey('First', this.indirectObjects.get(bookmark.children[0].objectId!)?.obj as DictionaryObject);
      outlineItem.setValueByKey('Last', this.indirectObjects.get(bookmark.children[bookmark.children.length - 1].objectId!)?.obj as DictionaryObject);
    }
  }

  /**
   * Add a link to the the PDF document.
   * @param {TPosition} pos - The position of the link in pt.
   * @param {number} width - The width of the link in pt.
   * @param {number} height - The height of the link in pt.
   * @param {Page} page - The page on which the link should be added.
   * @param {DictionaryObject | ArrayObject} dest - The destination of the link. This can be a DictionaryObject or an ArrayObject. If it is a DictionaryObject, it will be used as the 'A' value of the link. If it is an ArrayObject, it will be used as the 'Dest' value of the link.
   * @param {TLinkOptions} options - Additional options for the link, like the border-color, border-width and border-radius. If no options are provided, the link will have no border.
   */
  private addLink(pos: TPosition, width: number, height: number, page: Page, dest: DictionaryObject | ArrayObject, options: TLinkOptions): void {
    const link = new DictionaryObject(
      this,
      new Map<NameObject, NameObject | ArrayObject>([
        [NameObject.getName(this, 'Type'), NameObject.getName(this, 'Annot')],
        [NameObject.getName(this, 'Subtype'), NameObject.getName(this, 'Link')],
        [
          NameObject.getName(this, 'Rect'),
          new ArrayObject(this, [
            new NumericObject(this, pos.x),
            new NumericObject(this, pos.y),
            new NumericObject(this, pos.x + width),
            new NumericObject(this, pos.y + height),
          ]),
        ],
        [NameObject.getName(this, 'H'), NameObject.getName(this, 'N')],
      ]),
      true,
    );
    if (options && options.border) {
      let colorInFormat = RGB.changeRange1(options.border.color);
      link.setValueByKey(
        'C',
        new ArrayObject(this, [
          new NumericObject(this, colorInFormat.r),
          new NumericObject(this, colorInFormat.g),
          new NumericObject(this, colorInFormat.b),
        ]),
      );
      link.setValueByKey(
        'Border',
        new ArrayObject(this, [
          new NumericObject(this, options.border.cornerRadius || 0),
          new NumericObject(this, options.border.cornerRadius || 0),
          new NumericObject(this, options.border.width || 0),
        ]),
      );
    }
    if (dest instanceof DictionaryObject) {
      link.setValueByKey('A', dest);
    } else {
      link.setValueByKey('Dest', dest);
    }
    let pageAnnots = this.getPageAnnots(page);
    pageAnnots.push(link);
  }

  /**
   * Add an internal link to the PDF document.
   * @param {TPosition} pos - The position of the link in pt.
   * @param {number} width - The width of the link in pt.
   * @param {number} height - The height of the link in pt.
   * @param {Page} page - The page on which the link should be added.
   * @param {Page} dest - The destination of the link.
   * @param {TLinkOptions} options - Additional options for the link, like the border-color, border-width and border-radius. If no options are provided, the link will have no border.
   */
  addInternalLink(pos: TPosition, width: number, height: number, page: Page, dest: Page, options: TLinkOptions) {
    // TODO: Destination can also be a postion on a page, so maybe change that
    // TODO: Add support for other zooms instead of /fit, maybe change to: /XYZ null y-pos null
    this.addLink(pos, width, height, page, new ArrayObject(this, [dest, NameObject.getName(this, 'Fit')]), options);
  }

  /**
   * Add an external link to the PDF document.
   * @param {TPosition} pos - The position of the link in pt.
   * @param {number} width - The width of the link in pt.
   * @param {number} height - The height of the link in pt.
   * @param {Page} page - The page on which the link should be added.
   * @param {string} dest - The destination of the link.
   * @param {TLinkOptions} options - Additional options for the link, like the border-color, border-width and border-radius. If no options are provided, the link will have no border.
   */
  addExternalLink(pos: TPosition, width: number, height: number, page: Page, dest: string, options: TLinkOptions) {
    this.addLink(
      pos,
      width,
      height,
      page,
      new DictionaryObject(
        this,
        new Map<NameObject, NameObject | StringObject>([
          [NameObject.getName(this, 'Type'), NameObject.getName(this, 'Action')],
          [NameObject.getName(this, 'S'), NameObject.getName(this, 'URI')],
          [NameObject.getName(this, 'URI'), new StringObject(this, dest)],
        ]),
      ),
      options,
    );
  }

  /**
   * Get the current page of the PDF document.
   * @returns {Page} The current page of the PDF document.
   * @throws {Error} If the current page doesn't exist or is not a Page.
   * @throws {Error} If the pageTree object doesn't exist or is not a PageTree.
   */
  getCurrentPage(): Page {
    return this.getPageAt();
  }

  /**
   * Get a page of the PDF document by its index.
   * @param {number | undefined} index The index of the page, starting at 0, if no index is provided, the current (last) page will be returned.
   * @returns {Page} The page of the PDF document.
   * @throws {Error} If the page doesn't exist or is not a Page.
   * @throws {Error} If the pageTree object doesn't exist or is not a PageTree.
   */
  getPageAt(index: number | undefined = undefined): Page {
    const pageTreeKids = this.pageTree?.getValueByKey('Kids');
    if (!pageTreeKids || !(pageTreeKids instanceof ArrayObject)) {
      throw new Error('No pages in pageTree or pageTree is not a PageTree');
    }
    const page = pageTreeKids.getAt(index === undefined ? pageTreeKids.length - 1 : index);
    if (!page || !(page instanceof Page)) {
      throw new Error("Current page doesn't exist or is not a Page");
    }
    return page;
  }

  /**
   * Get the resource-dictionary of a page.
   * @param {Page} page The page to get the resources from.
   * @returns {DictionaryObject} The resources of the page, if they don't exist, they will be created as an empty dictionary.
   * @throws {Error} If the page resources are not a DictionaryObject.
   */
  private getPageRessources(page: Page): DictionaryObject {
    const resources = page.getValueByKey('Resources');
    if (!resources) {
      page.setValueByKey('Resources', new DictionaryObject(this, new Map(), true));
      return page.getValueByKey('Resources') as DictionaryObject;
    }
    if (!(resources instanceof DictionaryObject)) {
      throw new Error('No resources in page or resources is not a DictionaryObject');
    }
    return resources;
  }

  /**
   * Get the contents of a page.
   * @param {Page} page The page to get the contents from.
   * @returns {ArrayObject} The contents of the page, if they don't exist, they will be created as an empty array.
   * @throws {Error} If the page contents are not a ArrayObject.
   */
  private getPageContents(page: Page): ArrayObject {
    const contents = page.getValueByKey('Contents');
    if (!contents) {
      page.setValueByKey('Contents', new ArrayObject(this, [], true));
      return page.getValueByKey('Contents') as ArrayObject;
    }
    if (!(contents instanceof ArrayObject)) {
      throw new Error('No contents in page or contents is not a ArrayObject');
    }
    return contents;
  }

  /**
   * Append content to the contents of a page. If the last content is a StreamObject, the new content will be appended to the existing content, otherwise a new StreamObject will be created.
   * @param {Page} page The page to append the content to.
   * @param {Buffer} content The content to append.
   * @returns {void}
   */
  private appendToPageContents(page: Page, content: Buffer): void {
    const contents = this.getPageContents(page);
    const lastContent = contents.getAt(contents.length - 1);
    if (lastContent instanceof StreamObject) {
      lastContent.value = Buffer.concat([Buffer.from(lastContent.value), Buffer.from(' '), content]);
      return;
    } else {
      const stream = new StreamObject(this, content, new DictionaryObject(this), true);
      contents.push(stream);
    }
  }

  /**
   * Get the annotations of a page.
   * @param {Page} page The page to get the annotations from.
   * @returns {ArrayObject} The annotations of the page, if they don't exist, they will be created as an empty array.
   * @throws {Error} If the page annotations are not a ArrayObject.
   */
  private getPageAnnots(page: Page): ArrayObject {
    const annots = page.getValueByKey('Annots');
    if (!annots) {
      page.setValueByKey('Annots', new ArrayObject(this, [], true));
      return page.getValueByKey('Annots') as ArrayObject;
    }
    if (!(annots instanceof ArrayObject)) {
      throw new Error('No contents in page or contents is not a ArrayObject');
    }
    return annots;
  }

  /**
   * Check if the version of the PDF document is greater or equal to the given version.
   * @returns {number} The version to check against.
   */
  private versionGreaterOrEqual(version: PdfVersion): boolean {
    return parseFloat(this.version) >= parseFloat(version);
  }
}

export default PDFDocument;
