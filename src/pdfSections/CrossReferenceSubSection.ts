import type { PDFDocument } from '../pdfDocument';
import { ICrossReferenceSubSection } from '../interfaces';

export class CrossReferenceSubSection implements ICrossReferenceSubSection {
  firstId: number;

  pdf: PDFDocument;

  objectCount: number;

  entries: Array<{ id: number; byteOffset: number; generation: number; inUse: boolean }>;

  constructor(pdf: PDFDocument, firstId: number, firstObjectByteOffset: number, firstObjectGeneration: number, firstObjectInUse: boolean) {
    this.pdf = pdf;
    this.firstId = firstId;
    this.entries = [{ id: firstId, byteOffset: firstObjectByteOffset, generation: firstObjectGeneration, inUse: firstObjectInUse }];
    this.objectCount = 1;
  }

  outputSection(): string {
    let section = `${this.firstId} ${this.objectCount}\r\n`;
    this.entries.forEach((entry) => {
      section += `${this.ouputCrossReferenceData(entry)}`;
    });
    return section;
  }

  addEntry(id: number, byteOffset: number, generation: number, inUse = true): void {
    if (id < this.firstId) {
      this.firstId = id;
      this.entries = [{ id, byteOffset, generation, inUse }, ...this.entries];
    } else {
      this.entries = [...this.entries, { id, byteOffset, generation, inUse }];
    }
    this.objectCount += 1;
  }

  // eslint-disable-next-line class-methods-use-this
  ouputCrossReferenceData(entry: { id: number; byteOffset: number; generation: number; inUse: boolean }): string {
    if (entry.byteOffset === undefined && !entry.inUse) {
      let unusedObjAfter = this.entries.filter((e) => !e.inUse && e.id > entry.id);
      if (unusedObjAfter.length) {
        unusedObjAfter.sort((a, b) => a.id - b.id);
        entry.byteOffset = unusedObjAfter[0].id;
      } else {
        entry.byteOffset = 0;
      }
      entry.generation = entry.generation + 1;
    }
    const generationLength = entry.generation.toString().length;
    const byteOffsetLength = entry.byteOffset.toString().length;
    return `${'0'.repeat(10 - byteOffsetLength)}${entry.byteOffset} ${'0'.repeat(5 - generationLength)}${entry.generation} ${
      entry.inUse ? 'n' : 'f'
    }\r\n`;
  }
}

export default CrossReferenceSubSection;
