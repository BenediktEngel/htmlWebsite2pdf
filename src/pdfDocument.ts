import { PdfVersion } from './enums';
import { CrossReferenceTable } from './sections';
import {
  ArrayObject,
  BaseObject,
  BooleanObject,
  DictionaryObject,
  IntegerObject,
  NameObject,
  NullObject,
  NumericObject,
  StreamObject,
  StringObject,
} from './objects/BasicObjects';
import { CatalagDictionary, Page, PageTree, Rectangle } from './objects/IntermediateObjects';
import { Blob } from 'node:buffer';

export interface IPDFDocument {
  version: PdfVersion;
  crossReferenceTable: CrossReferenceTable;
  catalog: CatalagDictionary | undefined;
  root: PageTree | undefined;
  trailer: DictionaryObject;
  indirectObjects: Map<number, IndirectObject>;
}

export interface IndirectObject {
  obj: BaseObject;
  generation: number;
  byteOffset?: number;
}

export class PDFDocument implements IPDFDocument {
  /**
   * The version of the PDF document.
   * @readonly
   * @type {PdfVersion}
   */
  readonly version: PdfVersion;

  /**
   * The list of all indirect objects.
   * @type {Map<number, IndirectObject>}
   */
  readonly indirectObjects: Map<number, IndirectObject> = new Map();

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

  constructor(version = PdfVersion.V1_7) {
    this.version = version;
    this.createCatalog();
    this.createRoot();

    this.trailer.setValueByKey('Root', this.catalog!);
    // this.trailer = new DictionaryObject(
    //   [
    //     { key: new NameObject('Size', ObjectType.DIRECT), value: this.crossReferenceTable.size },
    //     { key: new NameObject('Root', ObjectType.DIRECT), value: this.body.root },
    //   ],
    //   ObjectType.DIRECT,
    // );
    // this.outputFileAsString();
  }

  outputHeader(): string {
    return `%PDF-${this.version}\r%âãÏÒ\r`;
  }

  outputBody(): string {
    let output = this.outputHeader();
    this.indirectObjects.forEach((indirectObject, id) => {
      const temp = indirectObject;
      const objectOutput = indirectObject.obj.toString();
      temp.byteOffset = new Blob([output]).size;
      this.indirectObjects.set(id, temp);
      output += `${objectOutput}\r`;
    });
    return output;
  }

  createObjectId(): number {
    let id = 1;
    while (this.indirectObjects.has(id)) {
      id += 1;
    }
    return id;
  }

  outputFileAsString(): string {
    const body = this.outputBody();
    let content = `${body}`;
    const bytesToStartxref = new Blob([content]).size;
    content += `${this.crossRefernceTableAsString()}trailer\r${this.trailer.toString()}\rstartxref\r${bytesToStartxref}\r%%EOF`;
    return content;
  }

  addPage(): void {
    if (!this.root) this.createRoot();
    const rootKids = this.root!.getValueByKey('Kids');
    if (rootKids) {
      // if (rootKids && rootKids instanceof ArrayObject) {
      rootKids.push(
        new Page(
          this,
          new Map<NameObject, NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject>(
            [
              [new NameObject(this, 'MediaBox'), new Rectangle(this, 0, 0, 612, 792)],
              [new NameObject(this, 'Parent'), this.root as DictionaryObject],
              [new NameObject(this, 'Type'), new NameObject(this, 'Page')],
              [new NameObject(this, 'Resources'), new DictionaryObject(this)],
            ],
          ),
          true,
        ),
      );
      const count = this.root!.getValueByKey('Count');
      if (count && count instanceof NumericObject) {
        count.value += 1;
      }
      //  else {
      //   this.root.setValueByKey('Count', new NumericObject(this, 1));
      // }
    }
    else {
      this.root.setValueByKey(
        'Kids',
        new ArrayObject(this, [
          new Page(
            this,
            new Map<
              NameObject,
              NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject
            >([
              [new NameObject(this, 'MediaBox'), new Rectangle(this, 0, 0, 612, 792)],
              [new NameObject(this, 'Parent'), this.root as DictionaryObject],
              [new NameObject(this, 'Type'), new NameObject(this, 'Page')],
              [new NameObject(this, 'Resources'), new DictionaryObject(this)],
            ]),
            true,
          ),
        ]),
      );
      this.root.setValueByKey('Count', new NumericObject(this, 1));
    }
  }

  private crossRefernceTableAsString(): string {
    // Build the cross reference table
    this.indirectObjects.forEach((object, id) => {
      if (!object.byteOffset) throw new Error(`Byte offset for indirect object with id ${id} is not set! Couldn't build cross reference table.`);
      this.crossReferenceTable.addEntry(id, object.byteOffset!, object.generation);
    });
    this.trailer.setValueByKey('Size', this.crossReferenceTable.size);
    return this.crossReferenceTable.outputTable();
  }

  // New:
  /**
   * Add an object to the list of indirect objects.
   * @param object {BaseObject} The object which should be indirect.
   * @returns {number} The id of the indirect object.
   */
  addIndirectObject(obj: BaseObject, generation = 0): number {
    const newObjectId = this.createObjectId();
    this.indirectObjects.set(newObjectId, { obj, generation });
    return newObjectId;
  }

  getIndirectObject(id: number): IndirectObject | undefined {
    return this.indirectObjects.get(id);
  }

  createCatalog(): void {
    if (this.catalog) {
      throw new Error('Catalog already exists');
    }
    this.catalog = new CatalagDictionary(
      this,
      new Map([
        [new NameObject(this, 'Type'), new NameObject(this, 'Catalog')],
        // [new NameObject(this, 'Version'), new NameObject(this, this.version)],
        // TODO: Maybe add more values based on Options
      ]),
      true,
    );
  }

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
    this.catalog!.setValueByKey('Pages', this.root);
    // [new NameObject(this, 'Pages'), new Pages(new Map(), ObjectType.INDIRECT, this.createObjectId())],
  }
}

export default PDFDocument;
