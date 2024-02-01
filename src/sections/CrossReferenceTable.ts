import { ObjectType } from 'enums';
import { IntegerObject, NumericObject } from 'objects';
import { CrossReferenceSection } from './CrossReferenceSection';

export interface ICrossReferenceTable {
  size: NumericObject;
  sections: Array<CrossReferenceSection>;
}

export class CrossReferenceTable implements ICrossReferenceTable {
  _size: NumericObject = new IntegerObject(0, ObjectType.DIRECT);

  private _sections: Array<CrossReferenceSection> = [];

  constructor(sections: Array<CrossReferenceSection> = []) {
    this.sections = sections;
  }

  outputTable(): string {
    let table = 'xref\n';
    this._sections.forEach((section) => {
      table += `${section.outputSection()}`;
    });
    return table;
  }

  get sections(): Array<CrossReferenceSection> {
    return this._sections;
  }

  private set sections(sections: Array<CrossReferenceSection>) {
    this._sections = sections;
  }

  addSection(section: CrossReferenceSection): void {
    this.sections = [...this.sections, section];
  }

  get size(): NumericObject {
    let size = 0;
    this._sections.forEach((section) => {
      size += section.entries.length;
    });
    this._size.value = size;
    return this._size;
  }
}
