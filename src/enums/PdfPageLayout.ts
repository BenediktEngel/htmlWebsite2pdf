/**
 * PageLayout enum (see: https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf - page 73)
 * @property {string} SINGLE_PAGE - Display one page at a time
 * @property {string} ONE_COLUMN - Display the pages in one column
 * @property {string} TWO_COLUMN_LEFT - Display the pages in two columns, with odd-numbered pages on the left
 * @property {string} TWO_COLUMN_RIGHT - Display the pages in two columns, with odd-numbered pages on the right
 * @property {string} TWO_PAGE_LEFT - Display the pages two at a time, with odd-numbered pages on the left (PDF 1.5)
 * @property {string} TWO_PAGE_RIGHT - Display the pages two at a time, with odd-numbered pages on the right (PDF 1.5)
 */
export enum PdfPageLayout {
  SINGLE_PAGE = 'SinglePage',
  ONE_COLUMN = 'OneColumn',
  TWO_COLUMN_LEFT = 'TwoColumnLeft',
  TWO_COLUMN_RIGHT = 'TwoColumnRight',
  TWO_PAGE_LEFT = 'TwoPageLeft',
  TWO_PAGE_RIGHT = 'TwoPageRight',
}
