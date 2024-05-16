import type { PDFDocument } from '../pdfDocument';
import { NumericObject } from '../pdfObjects/BasicObjects/NumericObject';
import { CrossReferenceSubSection } from './CrossReferenceSubSection';
import { ICrossReferenceSection } from '../interfaces';

export class CrossReferenceSection implements ICrossReferenceSection {
  _size: NumericObject;

  pdf: PDFDocument;

  private _sections: Array<CrossReferenceSubSection> = [];

  constructor(pdf: PDFDocument, sections: Array<CrossReferenceSubSection> = []) {
    this.pdf = pdf;
    this._size = new NumericObject(pdf, 0);
    this._sections = sections;
    if (!this._sections.filter((sec) => sec.firstId === 0).length) {
      this.addSection(new CrossReferenceSubSection(this.pdf, 0, 0, 65535, false));
    }
  }

  outputTable(): string {
    let table = 'xref\r\n';
    this._sections.forEach((section) => {
      table += `${section.outputSection()}`;
    });
    return table;
  }

  get sections(): Array<CrossReferenceSubSection> {
    return this._sections;
  }

  private set sections(sections: Array<CrossReferenceSubSection>) {
    this._sections = sections;
  }

  addSection(section: CrossReferenceSubSection): void {
    this.sections = [...this.sections, section];
  }

  addEntry(id: number, byteOffset: number, generation: number, inUse = true): void {
    let section = this._sections.find((sec) => sec.firstId === id + 1 || sec.firstId + sec.entries.length === id);
    if (!section) {
      section = new CrossReferenceSubSection(this.pdf, id, byteOffset, generation, inUse);
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

export default CrossReferenceSection;
