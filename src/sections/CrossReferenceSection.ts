import type { PDFDocument } from '../pdfDocument';
import { NameObject } from '../objects/BasicObjects/NameObject';
import { ArrayObject } from '../objects/BasicObjects/ArrayObject';
import { BooleanObject } from '../objects/BasicObjects/BooleanObject';
import { DictionaryObject } from '../objects/BasicObjects/DictionaryObject';
import { NullObject } from '../objects/BasicObjects/NullObject';
import { NumericObject } from '../objects/BasicObjects/NumericObject';
import { StreamObject } from '../objects/BasicObjects/StreamObject';
import { StringObject } from '../objects/BasicObjects/StringObject';
import { ICrossReferenceSection } from '../interfaces';

export class CrossReferenceSection implements ICrossReferenceSection {
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
    let section = `${this.firstId} ${this.objectCount}\r`;
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
    // IDEA: when we save only the id we could look in the pdf document for the object and get the byte offset and generation from there and also check if the object is indirect or not
    const generationLength = entry.generation.toString().length;
    const byteOffsetLength = entry.byteOffset.toString().length;
    return `${'0'.repeat(10 - byteOffsetLength)}${entry.byteOffset} ${'0'.repeat(5 - generationLength)}${entry.generation} ${
      entry.inUse ? 'n' : 'f'
    }\r`;
  }
}

export default CrossReferenceSection;
