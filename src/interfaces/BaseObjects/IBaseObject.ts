import type { IPDFDocument } from '../IPDFDocument';

export interface IBaseObject {
  id: number | undefined;
  generation: number | undefined;
  pdfDocument: IPDFDocument;

  toIndirect(generation?: number): void;
  toString(value?: string): string;
  getReference(): string;
}
