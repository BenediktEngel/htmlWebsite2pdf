/**
 * Enum for page mode (see: https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf - page 74)
 * @property {string} USE_NONE - Neither document outline nor thumbnail images visible
 * @property {string} USE_OUTLINES - Document outline visible
 * @property {string} USE_THUMBS - Thumbnail images visible
 * @property {string} FULLSCREEN - Full-screen mode, with no menu bar, window controls, or any other window visible
 * @property {string} USE_OC - Optional content group panel visible
 * @property {string} USE_ATTACHMENTS - Attachments panel visible
 */
export enum PdfPageMode {
  USE_NONE = 'UseNone',
  USE_OUTLINES = 'UseOutlines',
  USE_THUMBS = 'UseThumbs',
  FULLSCREEN = 'FullScreen',
  USE_OC = 'UseOC',
  USE_ATTACHMENTS = 'UseAttachments',
}
