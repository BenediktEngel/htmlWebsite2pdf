import { ArrayObject, IntegerObject } from '../BasicObjects';
import PDFDocument from '../../pdfDocument';

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
      new IntegerObject(pdf, lowerLeftX),
      new IntegerObject(pdf, lowerLeftY),
      new IntegerObject(pdf, upperLeftX),
      new IntegerObject(pdf, upperLeftY),
    ];
    super(pdf, value, shouldBeIndirect);
  }
}

export default Rectangle;
