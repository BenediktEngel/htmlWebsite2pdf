/**
 * Viewer preferences for the PDF document (see: https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf - page 362) Available from PDF 1.2
 * @typedef {Object} TViewerPreferences
 * @property {boolean} [hideToolbar] Hide the toolbar
 * @property {boolean} [hideMenubar] Hide the menubar
 * @property {boolean} [hideWindowUI] Hide the window UI
 * @property {boolean} [fitToWindow] Fit the document to the window
 * @property {boolean} [centerWindow] Center the document in the window
 * @property {boolean} [displayDocTitle] Display the document title
 * @property {string} [nonFullScreenPageMode] The page mode when not in full screen
 * @property {string} [direction] The predominant reading order for text
 * @property {string} [viewArea] The page boundary to which the contents of the page are to be clipped
 * @property {string} [viewClip] The page boundary to which the contents of the page are to be scaled
 * @property {string} [printArea] The page boundary to which the contents of the page are to be clipped when printed
 * @property {string} [printClip] The page boundary to which the contents of the page are to be scaled when printed
 * @property {string} [printScaling] The scaling to be used when printing the page
 * @property {string} [duplex] The paper handling option to use when printing the file
 * @property {boolean} [pickTrayByPDFSize] Pick the paper tray by PDF size
 * @property {string} [printPageRange] The page range to be printed
 * @property {number} [numCopies] The number of copies to be printed
 */
// TODO: implement them
export type TViewerPreferences = {
  hideToolbar?: boolean;
  hideMenubar?: boolean;
  hideWindowUI?: boolean;
  // fitToWindow?: boolean;
  // centerWindow?: boolean;
  displayDocTitle?: boolean;
  // nonFullScreenPageMode?: string;
  // direction?: string; 
  // viewArea?: string;
  // viewClip?: string;
  // printArea?: string;
  // printClip?: string;
  // printScaling?: string;
  // duplex?: string;
  // pickTrayByPDFSize?: boolean;
  // printPageRange?: string;
  // numCopies?: number;
};
