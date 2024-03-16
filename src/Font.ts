import { FontFlagTypes } from './enums';
import { NameObject } from './pdfObjects/BasicObjects/NameObject';
import { ArrayObject } from './pdfObjects/BasicObjects/ArrayObject';
import { DictionaryObject } from './pdfObjects/BasicObjects/DictionaryObject';
import { IntegerObject } from './pdfObjects/BasicObjects/IntegerObject';
import { NumericObject } from './pdfObjects/BasicObjects/NumericObject';
import { StreamObject } from './pdfObjects/BasicObjects/StreamObject';
import { StringObject } from './pdfObjects/BasicObjects/StringObject';
import { Rectangle } from './pdfObjects/IntermediateObjects/Rectangle';
import { fontFlagsAsInt, toHex } from './utils';
import { FontDictionary } from './pdfObjects/IntermediateObjects/FontDictionary';
import { FontDescriptorDictionary } from './pdfObjects/IntermediateObjects/FontDescriptorDictionary';
import type { PDFDocument } from './pdfDocument';

/**
 * Create all necessary objects for a font and add them to the pdf
 * @param {PDFDocument} pdf The pdf document
 * @param  { {fontDictionary: FontDictionary; usedChars: Set<string>; file: Buffer; fontObj: any} } font Object containing all necessary font information
 * Inspired by the font implementation from https://github.com/Hopding/pdf-lib, so thanks to the authors
 */
export function addFontToDocument(pdf: PDFDocument, font: { fontDictionary: FontDictionary; usedChars: Set<string>; file: Buffer; fontObj: any }) {
  const fontScaling = 1000 / font.fontObj.unitsPerEm;

  // Sort all glyphs by their id
  const glyphs = new Array(font.fontObj.characterSet.length);
  font.fontObj.characterSet.forEach((codePoint: number) => {
    glyphs.push(font.fontObj.glyphForCodePoint(codePoint));
  });
  const glyphsSorted = glyphs.sort((a, b) => a.id - b.id);
  // Remove duplicates
  for (let i = 0; i < glyphsSorted.length; i++) {
    if (glyphsSorted[i] == glyphsSorted[i + 1]) {
      glyphsSorted.splice(i, 1);
    }
  }

  // Create the widths array
  const widths: Array<NumericObject | ArrayObject> = [];
  let lastId = -100; // Set last Id to a value that is not possible so the first glyph will be added to the widths array
  let subWidths: Array<NumericObject> = [];
  glyphsSorted.forEach((glyph) => {
    if (glyph.id !== lastId + 1) {
      if (subWidths.length > 0) {
        widths.push(new ArrayObject(pdf, subWidths));
        subWidths = new Array();
      }
      widths.push(new NumericObject(pdf, glyph.id));
    }
    lastId = glyph.id;
    subWidths.push(new NumericObject(pdf, Math.round(glyph.advanceWidth * fontScaling)));
  });
  if (subWidths.length > 0) {
    widths.push(new ArrayObject(pdf, subWidths));
  }

  // Create a font dictionary for the descendant font
  const descendantFont = new FontDictionary(pdf, new Map(), true);
  descendantFont.setValueByKey('Subtype', NameObject.getName(pdf, 'CIDFontType2'));
  descendantFont.setValueByKey('BaseFont', NameObject.getName(pdf, font.fontObj.postscriptName));
  descendantFont.setValueByKey('CIDToGIDMap', NameObject.getName(pdf, 'Identity'));
  descendantFont.setValueByKey(
    'CIDSystemInfo',
    new DictionaryObject(
      pdf,
      new Map<NameObject, NumericObject | StringObject>([
        [NameObject.getName(pdf, 'Registry'), new StringObject(pdf, 'Adobe')],
        [NameObject.getName(pdf, 'Ordering'), new StringObject(pdf, 'Identity')],
        [NameObject.getName(pdf, 'Supplement'), new NumericObject(pdf, 0)],
      ]),
    ),
  );
  descendantFont.setValueByKey('W', new ArrayObject(pdf, widths));

  // Create a font descriptor
  const fontDescriptor = new FontDescriptorDictionary(pdf, new Map(), true);
  fontDescriptor.setValueByKey('Type', NameObject.getName(pdf, 'FontDescriptor'));
  fontDescriptor.setValueByKey('FontName', NameObject.getName(pdf, font.fontObj.postscriptName));
  fontDescriptor.setValueByKey('Flags', new IntegerObject(pdf, fontFlagsAsInt([FontFlagTypes.Symbolic, FontFlagTypes.Italic]))); // TODO get pdf values from font
  fontDescriptor.setValueByKey(
    'FontBBox',
    new Rectangle(
      pdf,
      font.fontObj.bbox.minX * fontScaling,
      font.fontObj.bbox.minY * fontScaling,
      font.fontObj.bbox.maxX * fontScaling,
      font.fontObj.bbox.maxY * fontScaling,
    ),
  );
  fontDescriptor.setValueByKey('ItalicAngle', new NumericObject(pdf, font.fontObj.italicAngle));
  fontDescriptor.setValueByKey('Ascent', new NumericObject(pdf, font.fontObj.ascent * fontScaling));
  fontDescriptor.setValueByKey('Descent', new NumericObject(pdf, font.fontObj.descent * fontScaling));
  fontDescriptor.setValueByKey(
    'CapHeight',
    new NumericObject(pdf, (font.fontObj.capHeight ? font.fontObj.capHeight : font.fontObj.ascent) * fontScaling),
  );
  fontDescriptor.setValueByKey('StemV', new NumericObject(pdf, 0));
  fontDescriptor.setValueByKey('MissingWidth', new NumericObject(pdf, 250));
  fontDescriptor.setValueByKey('FontFile2', new StreamObject(pdf, font.file, new DictionaryObject(pdf, new Map([])), true));
  // Add the font descriptor to the descendant font
  descendantFont.setValueByKey('FontDescriptor', fontDescriptor);

  // Add all necessary objects to the font dictionary
  font.fontDictionary.setValueByKey('Subtype', NameObject.getName(pdf, 'Type0'));
  font.fontDictionary.setValueByKey('BaseFont', NameObject.getName(pdf, font.fontObj.postscriptName));
  font.fontDictionary.setValueByKey('Encoding', NameObject.getName(pdf, 'Identity-H'));
  font.fontDictionary.setValueByKey('DescendantFonts', new ArrayObject(pdf, [descendantFont], true));

  // Create the cmap for the toUnicode entry
  const cmapValues: Array<[string, string]> = new Array(glyphsSorted.length);
  glyphsSorted.forEach((glyph) => {
    const id = `<${toHex(glyph.id)}>`;
    const unicode = `<${glyph.codePoints
      .map((codePoint: number) => {
        if (codePoint >= 0 && codePoint <= 0xffff) {
          return toHex(codePoint);
        }
        if (codePoint >= 0x010000 && codePoint <= 0x10ffff) {
          const hs = Math.floor((codePoint - 0x10000) / 0x400) + 0xd800;
          const ls = ((codePoint - 0x10000) % 0x400) + 0xdc00;
          return `${toHex(hs)}${toHex(ls)}`;
        }
        throw new Error('Invalid code point');
      })
      .join(' ')}>`;
    cmapValues.push([id, unicode]);
  });
  const cmapArray = cmapValues.map(([id, unicode]) => `${id} ${unicode}`).filter((v) => v !== undefined);
  const cmapLength = cmapArray.length;
  const cmapAsString = cmapArray.join('\n');
  const cmap = `\
  /CIDInit /ProcSet findresource begin
  12 dict begin
  begincmap
  /CIDSystemInfo <<
    /Registry (Adobe)
    /Ordering (UCS)
    /Supplement 0
  >> def
  /CMapName /Adobe-Identity-UCS def
  /CMapType 2 def
  1 begincodespacerange
  <0000><ffff>
  endcodespacerange
  ${cmapLength} beginbfchar
  ${cmapAsString}
  endbfchar
  endcmap
  CMapName currentdict /CMap defineresource pop
  end
  end\
  `;
  font.fontDictionary.setValueByKey('ToUnicode', new StreamObject(pdf, cmap, new DictionaryObject(pdf, new Map([])), true));
}

export default { addFontToDocument };
