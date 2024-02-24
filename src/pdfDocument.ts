import { PdfVersion } from './enums';
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
import { dateToASN1 } from './utils';

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
   * Output the body of the PDF document as a buffer.
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
   * Output the complete PDF document as a buffer.
   * @returns {Buffer} The PDF document as a buffer.
   */
  outputFileAsBuffer(): Buffer {
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
        [new NameObject(this, 'MediaBox'), new Rectangle(this, 0, 0, pageDimensions[0], pageDimensions[1])],
        [new NameObject(this, 'Parent'), this.root as DictionaryObject],
        [new NameObject(this, 'Type'), new NameObject(this, 'Page')],
        [new NameObject(this, 'Resources'), new DictionaryObject(this)],
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
        [new NameObject(this, 'Type'), new NameObject(this, 'Catalog')],
        [new NameObject(this, 'Version'), new NameObject(this, this.version)],
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
        [new NameObject(this, 'Type'), new NameObject(this, 'Pages')],
        [new NameObject(this, 'Kids'), new ArrayObject(this)],
        [new NameObject(this, 'Count'), new NumericObject(this, 0)],
      ]),
      true,
    );
    if (!this.catalog) {
      this.createCatalog();
    }
    this.catalog?.setValueByKey('Pages', this.root);
  }
}

export default PDFDocument;
