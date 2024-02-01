import { ObjectType, PdfVersion } from 'enums';
import {
  ArrayObject,
  BaseObject,
  BooleanObject,
  CatalagDictionary,
  DictionaryObject,
  NameObject,
  NullObject,
  NumericObject,
  Page,
  Pages,
  Rectangle,
  StreamObject,
  StringObject,
} from 'objects';
import { Body, CrossReferenceTable } from 'sections';

export interface IPDFDocument {
  version: PdfVersion;
  crossReferenceTable: CrossReferenceTable;
  body: Array<BaseObject>;
  catalog: CatalagDictionary;
  trailer: DictionaryObject;
  usedObjectIds: Array<number>;
}

export class PDFDocument implements IPDFDocument {
  readonly version: PdfVersion;

  usedObjectIds: Array<number> = [];

  indirectObjects: Map<number, { obj: BaseObject; generation: number; byteOffset?: number }> = new Map();

  crossReferenceTable: CrossReferenceTable = new CrossReferenceTable();

  catalog: CatalagDictionary;

  root: Pages;

  body: Array<BaseObject> = [];

  trailer: DictionaryObject;

  constructor(version = PdfVersion.V1_7) {
    this.version = version;
    this.catalog = new CatalagDictionary(new Map(), ObjectType.INDIRECT, this.createObjectId());
    this.root = new Pages(new Map(), ObjectType.INDIRECT, this.createObjectId());
    this.catalog.setValue('Pages', this.root);
    // this.crossReferenceTable = crossReferenceTable;
    // this.body = body;
    // this.trailer = new DictionaryObject(
    //   [
    //     { key: new NameObject('Size', ObjectType.DIRECT), value: this.crossReferenceTable.size },
    //     { key: new NameObject('Root', ObjectType.DIRECT), value: this.body.root },
    //   ],
    //   ObjectType.DIRECT,
    // );
    this.outputFileAsString();
  }

  outputHeader(): string {
    return `%PDF-${this.version}\n%âãÏÒ\n`;
  }

  outputBody(): string {
    return 'TODO';
  }

  createObjectId(): number {
    let id = 0;
    while (this.usedObjectIds.includes(id)) {
      id += 1;
    }
    this.usedObjectIds.push(id);
    return id;
  }

  outputFileAsString(): string {
    return `${this.outputHeader()}${this.outputBody()}${this.crossReferenceTable.outputTable()}${this.trailer.outputObject()}%%EOF
    `;
  }

  addPage(): void {
    const rootKids = this.root.getValue('Kids');
    if (rootKids && rootKids.value instanceof ArrayObject) {
      rootKids.value = [
        ...(rootKids.value as Array<
          NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject
        >),
        // new Page(
        //   new Map<NameObject, NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject>(
        //     [
        //       [new NameObject('MediaBox'), new Rectangle(0, 0, 612, 792)! as ArrayObject],
        //       [new NameObject('Parent'), this.root! as DictionaryObject],
        //     ],
        //   ),
        // ),
      ];
      // const newBox =  new Rectangle(0,0,612,792);

      // this.root.setValue('Kids']
    } else {
      this.root.setValue('Kids', new Pages(new Map(), ObjectType.INDIRECT, this.createObjectId()));
    }
    this.root.setValue('Count', this.root.getValue('Count') + 1);
  }

  crossRefernceTableAsString(): void {
    this.indirectObjects.forEach((object, id) => {
      this.crossReferenceTable.addEntry(id, object.byteOffset!, object.generation);
    });
  }
}
