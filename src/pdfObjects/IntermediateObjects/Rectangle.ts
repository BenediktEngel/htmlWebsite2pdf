import { ArrayObject } from '../BasicObjects/ArrayObject';
import type { PDFDocument } from '../../pdfDocument';
import { NumericObject } from '../BasicObjects/NumericObject';

/**
 * Represents a rectangle in a PDF document. Mainly to create easy an array object with 4 integer objects.
 * @class Rectangle
 * @extends {ArrayObject}
 */
export class Rectangle extends ArrayObject {
  /**
   * Creates an instance of Rectangle.
   * @param {PDFDocument} pdf The PDF document this rectangle is associated with.
   * @param {number} lowerLeftX The lower left x coordinate.
   * @param {number} lowerLeftY The lower left y coordinate.
   * @param {number} upperLeftX The upper right x coordinate.
   * @param {number} upperLeftY The upper right y coordinate.
   * @param {boolean} [shouldBeIndirect=false] Should the object be indirect?
   * @memberof Rectangle
   */
  constructor(pdf: PDFDocument, lowerLeftX: number, lowerLeftY: number, upperLeftX: number, upperLeftY: number, shouldBeIndirect = false) {
    const value = [
      new NumericObject(pdf, lowerLeftX),
      new NumericObject(pdf, lowerLeftY),
      new NumericObject(pdf, upperLeftX),
      new NumericObject(pdf, upperLeftY),
    ];
    super(pdf, value, shouldBeIndirect);
  }
}

export default Rectangle;
