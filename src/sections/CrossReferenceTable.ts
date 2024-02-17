import PDFDocument from '../pdfDocument';
import { NumericObject } from '../objects/BasicObjects';
import { CrossReferenceSection } from './CrossReferenceSection';

export interface ICrossReferenceTable {
  size: NumericObject;
  sections: Array<CrossReferenceSection>;
}

export class CrossReferenceTable implements ICrossReferenceTable {
  _size: NumericObject;

  pdf: PDFDocument;

  private _sections: Array<CrossReferenceSection> = [];

  constructor(pdf: PDFDocument, sections: Array<CrossReferenceSection> = []) {
    this.pdf = pdf;
    this._size = new NumericObject(pdf, 0);
    this._sections = sections;
    if (!this._sections.filter((sec) => sec.firstId === 0).length) {
      this.addSection(new CrossReferenceSection(this.pdf, 0, 0, 65535, false));
    }
  }

  outputTable(): string {
    let table = 'xref\r';
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

  addEntry(id: number, byteOffset: number, generation: number, inUse = true): void {
    let section = this._sections.find((sec) => sec.firstId === id + 1 || sec.firstId + sec.entries.length === id);
    if (!section) {
      section = new CrossReferenceSection(this.pdf, id, byteOffset, generation, inUse);
      this.addSection(section);
    } else {
      section.addEntry(id, byteOffset, generation, inUse);
    }
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
