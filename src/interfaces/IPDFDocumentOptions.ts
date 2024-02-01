export interface IPDFDocumentOptions {
  version?: string;
  pageLayout?: PageLayout;
}


enum PageLayout {
  SinglePage = new NameObject('SinglePage'),
  OneColumn = 'OneColumn',
  TwoColumnLeft = 'TwoColumnLeft',
  TwoColumnRight = 'TwoColumnRight',
  TwoPageLeft = 'TwoPageLeft',
  TwoPageRight = 'TwoPageRight',
}

console.log(PageLayout.SinglePage)
