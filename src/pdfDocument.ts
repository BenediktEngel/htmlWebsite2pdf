import * as fontkit from 'fontkit';
import { ImageFormats, PdfVersion } from './enums';
import { PageDimensions } from './constants';
import { CrossReferenceTable } from './sections/CrossReferenceTable';
import { BaseObject } from './objects/BasicObjects/BaseObject';
import { NameObject } from './objects/BasicObjects/NameObject';
import { ArrayObject } from './objects/BasicObjects/ArrayObject';
import { BooleanObject } from './objects/BasicObjects/BooleanObject';
import { DictionaryObject } from './objects/BasicObjects/DictionaryObject';
import { IntegerObject } from './objects/BasicObjects/IntegerObject';
import { NullObject } from './objects/BasicObjects/NullObject';
import { NumericObject } from './objects/BasicObjects/NumericObject';
import { StreamObject } from './objects/BasicObjects/StreamObject';
import { StringObject } from './objects/BasicObjects/StringObject';
import { CatalagDictionary } from './objects/IntermediateObjects/CatalogDictionary';
import { Page } from './objects/IntermediateObjects/Page';
import { PageTree } from './objects/IntermediateObjects/PageTree';
import { Rectangle } from './objects/IntermediateObjects/Rectangle';
import { IIndirectObject, IPDFDocument } from './interfaces';
import { TDocumentOptions } from './types';
import { dateToASN1, toHex } from './utils';
import * as fontHelper from './Font';
import { FontDictionary } from './objects/IntermediateObjects/FontDictionary';

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
   * @type {CrossReferenceTable}
   */
  crossReferenceTable: CrossReferenceTable = new CrossReferenceTable(this);

  /**
   * The Catalog of the PDF document.
   * @type {CatalagDictionary}
   */
  catalog: CatalagDictionary | undefined;

  /**
   * The root object of the PDF document.
   * @type {PageTree}
   */
  root: PageTree | undefined;

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
    this.createRoot();
    this.createInfo();
    this.trailer.setValueByKey('Root', this.catalog as DictionaryObject);
    this.trailer.setValueByKey('Info', this.info);
  }

  /**
   * Output the header of the PDF document as a string.
   * @returns {string} The header of the PDF document.
   */
  private outputHeader(): string {
    return `%PDF-${this.version}\r\n%âãÏÒ\r\n`;
  }

  /**
   * Output the body of the PDF document as a Buffer.
   * @returns {Buffer} The body of the PDF document.
   */
  private outputBody(): Buffer {
    let outputBuffer = Buffer.from(this.outputHeader());
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
    this.includedFonts.forEach((font, name) => {
      if (font.usedChars.size === 0) {
        this.indirectObjects.delete(font.fontDictionary.id!);
      } else {
        fontHelper.addFontToDocument(this, font);
      }
    });
    const body = this.outputBody();
    const bytesToStartxref = body.byteLength;
    return Buffer.concat([
      body,
      Buffer.from(`${this.crossReferenceTableAsString()}trailer\r\n${this.trailer.toBuffer()}\r\nstartxref\r\n${bytesToStartxref}\r\n%%EOF`),
    ]);
  }

  /**
   * Add a new page to the PDF document.
   * @param {[number, number]} [pageDimensions=PageDimensions.A4] The dimensions of the new page, default is A4.
   * @returns {void}
   */
  addPage(pageDimensions: [number, number] = PageDimensions.A4): void {
    if (!this.root) this.createRoot();

    const newPage = new Page(
      this,
      new Map<NameObject, NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject>([
        [NameObject.getName(this, 'MediaBox'), new Rectangle(this, 0, 0, pageDimensions[0], pageDimensions[1])],
        [NameObject.getName(this, 'Parent'), this.root as DictionaryObject],
        [NameObject.getName(this, 'Type'), NameObject.getName(this, 'Page')],
        [NameObject.getName(this, 'Resources'), new DictionaryObject(this)],
      ]),
      true,
    );
    const rootKids = this.root?.getValueByKey('Kids');
    if (rootKids && rootKids instanceof ArrayObject) {
      rootKids.push(newPage);
    } else {
      this.root?.setValueByKey('Kids', new ArrayObject(this, [newPage]));
    }
    const count = this.root?.getValueByKey('Count');
    if (count && count instanceof NumericObject) {
      count.value += 1;
    } else {
      this.root?.setValueByKey('Count', new NumericObject(this, 1));
    }
  }

  /**
   * Output the cross reference table as a string.
   * @returns {string} The cross reference table as a string.
   */
  private crossReferenceTableAsString(): string {
    // Build the cross reference table
    this.indirectObjects.forEach((object, id) => {
      if (!object.byteOffset) throw new Error(`Byte offset for indirect object with id ${id} is not set! Couldn't build cross reference table.`);
      this.crossReferenceTable.addEntry(id, object.byteOffset, object.generation);
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
    this.indirectObjects.set(newObjectId, { obj, generation });
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
        [NameObject.getName(this, 'Type'), NameObject.getName(this, 'Catalog')],
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
    this.info.setValueByKey('Title', new StringObject(this, this.title));
    this.info.setValueByKey('Subject', new StringObject(this, this.subject));
    this.info.setValueByKey('Keywords', new StringObject(this, this.keywords));
    this.info.setValueByKey('Author', new StringObject(this, this.author));
    this.info.setValueByKey('Creator', new StringObject(this, 'htmlWebsite2pdf'));
    this.info.setValueByKey('Producer', new StringObject(this, 'htmlWebsite2pdf'));
    const date = dateToASN1(new Date());
    this.info.setValueByKey('CreationDate', new StringObject(this, `D:${date}`));
    this.info.setValueByKey('ModDate', new StringObject(this, `D:${date}`));
  }

  /**
   * Create the root object of the PDF document.
   * @returns {void}
   * @throws {Error} If the root object already exists.
   */
  createRoot(): void {
    if (this.root) {
      throw new Error('Root already exists');
    }
    this.root = new PageTree(
      this,
      new Map<
        NameObject,
        ArrayObject | BooleanObject | DictionaryObject | IntegerObject | NameObject | NullObject | NumericObject | StreamObject | StringObject
      >([
        [NameObject.getName(this, 'Type'), NameObject.getName(this, 'Pages')],
        [NameObject.getName(this, 'Kids'), new ArrayObject(this)],
        [NameObject.getName(this, 'Count'), new NumericObject(this, 0)],
      ]),
      true,
    );
    if (!this.catalog) {
      this.createCatalog();
    }
    this.catalog?.setValueByKey('Pages', this.root);
  }

  /**
   * Add a font to the PDF document. The font will be embedded in the document if it is used, otherwise it will be removed.
   * @param {Buffer} font The font as a Buffer.
   * @param {string} fontName A string which will be used to reference the font when adding text.
   */
  addFont(font: Buffer, fontName: string): void {
    const fontDictionary = new FontDictionary(this, new Map(), true);
    const fontObj = fontkit.create(font);
    this.includedFonts.set(fontName, { fontDictionary, usedChars: new Set(), file: font, fontObj });
  }

  /**
   * Add text to the current page of the PDF document.
   * @param {string} text The text to add
   * @param {string} fontName The name of the font to use, must be added before with addFont
   * @param {string} fontSize The size of the font
   * @param {number} x The x position of the text (0 is the lower left corner of the page)
   * @param {number} y The y position of the text (0 is the lower left corner of the page)
   */
  addTextToCurrentPage(text: string, fontName: string, fontSize: number, x: number, y: number): void {
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
    // get current (last) PageObject
    const currentPage = this.getCurrentPage();
    // If resources dont include the font add it
    const currentPageResources = this.getPageRessources(currentPage);
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
    // create the textstream
    const textContent = new StreamObject(this, `BT /${fontName} ${fontSize} Tf ${x} ${y} Td <${hexString}> Tj ET`, new DictionaryObject(this), true);

    // Add content to contents
    const currentPageContents = currentPage.getValueByKey('Contents');
    if (!currentPageContents) {
      currentPage.setValueByKey('Contents', new ArrayObject(this, [textContent], true));
    } else if (currentPageContents instanceof ArrayObject) {
      currentPageContents.push(textContent);
    }
  }

  addImageToCurrentPage(
    image: Buffer,
    x: number,
    y: number,
    width: number,
    height: number,
    embedWidth: number,
    embedHeight: number,
    format: ImageFormats,
    imageName: string,
  ): void {
    const currentPage = this.getCurrentPage();
    let imageStream;
    if (format === ImageFormats.JPEG) {
      imageStream = new StreamObject(
        this,
        image,
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

    const imageContent = new StreamObject(
      this,
      `q ${embedWidth} 0 0 ${embedHeight} ${x} ${y} cm /${imageName} Do Q`,
      new DictionaryObject(this),
      true,
    );

    const currentPageContents = currentPage.getValueByKey('Contents');
    if (!currentPageContents) {
      currentPage.setValueByKey('Contents', new ArrayObject(this, [imageContent as StreamObject], true));
    } else if (currentPageContents instanceof ArrayObject) {
      currentPageContents.push(imageContent as StreamObject);
    }
  }

  /**
   * Get the current page of the PDF document.
   * @returns {Page} The current page of the PDF document.
   * @throws {Error} If the current page doesn't exist or is not a Page.
   * @throws {Error} If the root object doesn't exist or is not a PageTree.
   */
  private getCurrentPage(): Page {
    return this.getPageAt();
  }

  /**
   * Get a page of the PDF document by its index.
   * @param {number | undefined} index The index of the page, starting at 0, if no index is provided, the current (last) page will be returned.
   * @returns {Page} The page of the PDF document.
   * @throws {Error} If the page doesn't exist or is not a Page.
   * @throws {Error} If the root object doesn't exist or is not a PageTree.
   */
  getPageAt(index: number | undefined = undefined): Page {
    const rootKids = this.root?.getValueByKey('Kids');
    if (!rootKids || !(rootKids instanceof ArrayObject)) {
      throw new Error('No pages in root or root is not a PageTree');
    }
    const page = rootKids.getAt(index === undefined ? rootKids.length - 1 : index);
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
}

export default PDFDocument;
