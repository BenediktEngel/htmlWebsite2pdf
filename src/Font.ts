import { FontFlagTypes } from './enums';
import { NameObject } from './objects/BasicObjects/NameObject';
import { ArrayObject } from './objects/BasicObjects/ArrayObject';
import { DictionaryObject } from './objects/BasicObjects/DictionaryObject';
import { IntegerObject } from './objects/BasicObjects/IntegerObject';
import { NumericObject } from './objects/BasicObjects/NumericObject';
import { StreamObject } from './objects/BasicObjects/StreamObject';
import { StringObject } from './objects/BasicObjects/StringObject';
import { Rectangle } from './objects/IntermediateObjects/Rectangle';
import { fontFlagsAsInt, toHex } from './utils';
import { FontDictionary } from './objects/IntermediateObjects/FontDictionary';
import { FontDescriptorDictionary } from './objects/IntermediateObjects/FontDescriptorDictionary';
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

  // Create the widths array
  const widths = [];
  let lastId = -100;
  const subWidths: Array<NumericObject> = [];
  glyphsSorted.forEach((glyph) => {
    if (glyph.id !== lastId + 1) {
      if (subWidths.length > 0) {
        widths.push(new ArrayObject(pdf, subWidths));
        subWidths.length = 0;
      }
      widths.push(new NumericObject(pdf, glyph.id));
    }
    lastId = glyph.id;
    subWidths.push(new NumericObject(pdf, glyph.advanceWidth * fontScaling));
  });
  if (subWidths.length > 0) {
    widths.push(new ArrayObject(pdf, subWidths));
  }

  // Create a font dictionary for the descendant font
  const descendantFont = new FontDictionary(pdf, new Map(), true);
  descendantFont.setValueByKey('Subtype', new NameObject(pdf, 'CIDFontType2'));
  descendantFont.setValueByKey('BaseFont', new NameObject(pdf, font.fontObj.postscriptName));
  descendantFont.setValueByKey('CIDToGIDMap', new NameObject(pdf, 'Identity'));
  descendantFont.setValueByKey(
    'CIDSystemInfo',
    new DictionaryObject(
      pdf,
      new Map<NameObject, NumericObject | StringObject>([
        [new NameObject(pdf, 'Registry'), new StringObject(pdf, 'Adobe')],
        [new NameObject(pdf, 'Ordering'), new StringObject(pdf, 'Identity')],
        [new NameObject(pdf, 'Supplement'), new NumericObject(pdf, 0)],
      ]),
    ),
  );
  descendantFont.setValueByKey('W', new ArrayObject(pdf, widths));

  // Create a font descriptor
  const fontDescriptor = new FontDescriptorDictionary(pdf, new Map(), true);
  fontDescriptor.setValueByKey('Type', new NameObject(pdf, 'FontDescriptor'));
  fontDescriptor.setValueByKey('FontName', new NameObject(pdf, font.fontObj.postscriptName));
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
  font.fontDictionary.setValueByKey('Subtype', new NameObject(pdf, 'Type0'));
  font.fontDictionary.setValueByKey('BaseFont', new NameObject(pdf, font.fontObj.postscriptName));
  font.fontDictionary.setValueByKey('Encoding', new NameObject(pdf, 'Identity-H'));
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
  ${cmapValues.length} beginbfchar
  ${cmapValues.map(([id, codePoint]) => `${id} ${codePoint}`).join('\n')}
  endbfchar
  endcmap
  CMapName currentdict /CMap defineresource pop
  end
  end\
  `;
  font.fontDictionary.setValueByKey('ToUnicode', new StreamObject(pdf, cmap, new DictionaryObject(pdf, new Map([])), true));
}

export default { addFontToDocument };
