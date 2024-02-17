import { PDFDocument } from '../../pdfDocument';

export interface IBaseObject {
  id: number | undefined;
  generation: number | undefined;
  pdfDocument: PDFDocument;

  toIndirect(generation?: number): void;
  toString(value?: string): string;
  getReference(): string;
}
