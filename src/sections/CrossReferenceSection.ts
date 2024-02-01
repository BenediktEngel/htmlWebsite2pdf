import { ArrayObject, BooleanObject, DictionaryObject, NameObject, NullObject, NumericObject, StreamObject, StringObject } from 'objects';

export interface ICrossReferenceSection {
  firstObjectId: number;
  objectCount: number;
  entries: Array<ArrayObject | BooleanObject | DictionaryObject | NameObject | NullObject | NumericObject | StreamObject | StringObject>;

  outputSection(): string;
}

export class CrossReferenceSection implements ICrossReferenceSection {
  firstObjectId: number;

  objectCount: number;

  entries: Array<ArrayObject | BooleanObject | DictionaryObject | NameObject | NullObject | NumericObject | StreamObject | StringObject>;

  constructor(
    firstObjectId: number,
    objectCount: number,
    entries: Array<ArrayObject | BooleanObject | DictionaryObject | NameObject | NullObject | NumericObject | StreamObject | StringObject>,
  ) {
    this.firstObjectId = firstObjectId;
    this.objectCount = objectCount;
    this.entries = entries;
  }

  outputSection(): string {
    let section = `${this.firstObjectId} ${this.objectCount}\n`;
    this.entries.forEach((entry) => {
      section += `${entry.ouputCrossReferenceData()}`;
    });
    return section;
  }
}
