import PDFDocument from './pdfDocument';
import { TFilledGenerateOptions, TFontInfo, TFontSrc, TGenerateOptions, TTextNodeData } from './types';
import { ImageFormats, PdfPageLayout, PdfPageMode, PdfVersion } from './enums';
import { PageDimensions } from './constants';
import { px, pt } from './utils';

export function fromBody(options?: TGenerateOptions): void {}

export async function fromElement(inputEl: HTMLElement, options: TGenerateOptions = {}): Promise<void> {
  const newOptions = fillOptions(options);
  const pdf = new PDFDocument({
    title: newOptions.title,
    version: newOptions.version,
    author: newOptions.author,
    subject: newOptions.subject,
    keywords: newOptions.keywords,
    pageMode: newOptions.pdfOptions!.pageMode,
    pageLayout: newOptions.pdfOptions!.pageLayout,
    viewerPreferences: newOptions.pdfOptions!.viewerPreferences,
  });
  const showIgnoredElements = hideIgnoredElements(newOptions.ignoreElements, newOptions.ignoreElementsByClass, inputEl, pdf);

  const fontsOfPage = getFontInfo();
  const fonts: Array<{ fontFamily: string; weight: number; style: string; name: string }> = [];

  const sections = document.querySelectorAll('section');
  const wrapper = inputEl;
  if (!wrapper) {
    throw new Error('No main element found');
  }
  const availableDefaultPageHeight = newOptions.pageSize[1] - 2 * px.toPt(newOptions.margin[0] + newOptions.margin[2]);
  // Calculate the offset on the x-axis (scrollLeft is needed if window is smaller than the page and it is scrolled)
  const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
  const offsetX = wrapper.getBoundingClientRect().x + scrollLeft;
  // Scroll-Offset if the page is scrolled, needed to calculate the position of the elements
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  let i = 0;
  for (const section of sections) {
    pdf.addPage(PageDimensions.A4);

    let offsetY = (i == 0 ? wrapper.getBoundingClientRect().y : sections[i - 1].getBoundingClientRect().bottom) + scrollTop;
    const textNodes = getTextNodes(section);
    // computeNode(firstSec, pdf, offsetX);
    let elementIndex = 0;
    for (const element of textNodes) {
      let fontOfNode = element.styles.fontFamily.split(',')[0].replace(/['"]+/g, '');
      let fontWeightOfNode = element.styles.fontWeight;
      let fontStyleOfNode = element.styles.fontStyle;

      // Find the used font in the fontsOfPage array
      let foundFontOfPage = fontsOfPage
        .filter((font) => font.fontFamily === fontOfNode && font.fontStyle === fontStyleOfNode)
        .sort((a, b) => a.fontWeight - b.fontWeight)
        .filter((font) => font.fontWeight >= fontWeightOfNode)[0];
      // TODO: Add fallback if we don't find a font, maybe caused by a higher font weight than available
      let found = fonts.find(
        (font) =>
          font.fontFamily === foundFontOfPage.fontFamily && font.weight === foundFontOfPage.fontWeight && font.style === foundFontOfPage.fontStyle,
      );
      if (!found) {
        // TODO: Check if we have a true type font
        let fontSrc = foundFontOfPage.src.find((el) => el.format == 'truetype')?.url;
        // get the font
        await fetch(fontSrc!)
          .then((res) => res.arrayBuffer())
          .then((font) => {
            const name = `${foundFontOfPage.fontFamily}-${foundFontOfPage.fontWeight}-${foundFontOfPage.fontStyle}`.replace(/ /g, '');

            // add the font to the pdf
            pdf.addFont(font as Buffer, name);
            // add the font to the fonts array
            found = {
              fontFamily: foundFontOfPage.fontFamily,
              weight: foundFontOfPage.fontWeight,
              style: foundFontOfPage.fontStyle,
              name: name,
            };
            fonts.push(found);
          });
      }
      let align = 'left';
      if (element.styles.textAlign === 'center') {
        align = 'center';
      } else if (element.styles.textAlign === 'right') {
        align = 'right';
      }
      element.lines.forEach((line: string, j: number) => {
        // const yPos =
        //   PageDimensions.A4[1] - +px.toPt(element.position.y + scrollTop - offsetY + (element.position.height / element.lines.length) * (j + 1));
        // if (yPos < 0) {
        //   console.log('elementPos', element.position.y);
        //   console.log('lastElementPos', textNodes[elementIndex - 1].position.bottom);
        //   pdf.addPage(PageDimensions.A4);
        //   console.log('offsetYBefor', offsetY);

        //   offsetY += textNodes[elementIndex - 1].position.bottom - offsetY;
        //   console.log('offsetY', offsetY);
        // }
        pdf.addTextToCurrentPage(
          {
            x: px.toPt(element.position.x - offsetX),
            y: PageDimensions.A4[1] - +px.toPt(element.position.y + scrollTop - offsetY + (element.position.height / element.lines.length) * (j + 1)),
          },
          line,
          found!.name,
          px.toPt(parseInt(element.styles.fontSize.replace('px', ''))),
          { maxWidth: px.toPt(element.position.width), alignment: align },
        );
      });
      elementIndex++;
    }
    i += 1;
  }

  // TODO: this adds only the first image
  // let img = document.querySelector('img');
  // if (img) {
  //   let imgData = await fetch(img.src).then((res) => res.arrayBuffer());
  //   pdf.addImageToCurrentPage(
  //     {
  //       x: px.toPt(img.getBoundingClientRect().x - offsetX),
  //       y: PageDimensions.A4[1] - +px.toPt(img.getBoundingClientRect().y - offsetY + img.height),
  //     },
  //     imgData,
  //     500,
  //     505,
  //     px.toPt(img.width),
  //     px.toPt(img.height),
  //     ImageFormats.JPEG,
  //     'testimg',
  //   );
  // }
  // showIgnoredElements();

  let pdfString = pdf.outputFileAsBuffer();
  let blob = new Blob([pdfString], { type: 'application/pdf' });
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = newOptions.filename!;
  a.click();
}

function getTextNodes(node: Node): Array<any> {
  const nodes: Array<TTextNodeData> = [];
  if (window.getComputedStyle(node.parentNode as Element).display !== 'none') {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.nodeValue && node.nodeValue.trim() === '') {
        return nodes;
      } else {
        let range = document.createRange();
        range.selectNodeContents(node);
        console.log(range);
        let rects = range.getClientRects();
        console.log(rects);
        nodes.push({
          text: node.nodeValue!.trim(),
          styles: window.getComputedStyle(node.parentNode as Element),
          position: node.parentNode!.getBoundingClientRect(),
          lines: splitTextFromElement(node.parentNode!),
        });
      }
    } else {
      for (let child of Array.from(node.childNodes)) {
        nodes.push(...getTextNodes(child));
      }
    }
  }
  return nodes;
}

function splitTextFromElement(el: HTMLElement): Array<string> {
  let wordBreak = [];
  const words = el.innerText.split(' ');
  words.forEach((word, idx) => {
    if (word.includes('-')) {
      let splittedWord = word.split('-');
      words.splice(idx, 1, `${splittedWord[0]}-`, splittedWord[1]);
    }
  });
  el.innerText = words[0];
  let beforeBreak = words[0];
  let height = el.offsetHeight;

  for (let i = 1; i < words.length; i++) {
    el.innerText += ' ' + words[i];
    if (el.offsetHeight > height) {
      height = el.offsetHeight;
      wordBreak.push(beforeBreak);
      beforeBreak = words[i];
    } else {
      if (beforeBreak.charAt(beforeBreak.length - 1) === '-') {
        beforeBreak += words[i];
      } else {
        beforeBreak += ' ' + words[i];
      }
    }
  }

  wordBreak.push(beforeBreak);
  return wordBreak;
}

/**
 * Get the fonts which are used in the document from their font-face rules
 * @returns {Array<TFontInfo>} The font info array
 */
function getFontInfo(): Array<TFontInfo> {
  const fontInfoArray = [];
  // Iterate through all stylesheets
  for (const styleSheet of Array.from(document.styleSheets)) {
    // Check if the stylesheet is loaded
    if (styleSheet.href) {
      // Iterate through all rules of the stylesheet
      for (const rule of Array.from(styleSheet.cssRules)) {
        if (rule instanceof CSSFontFaceRule) {
          const srcs: Array<TFontSrc> = [];
          rule.style
            .getPropertyValue('src')
            .split(',')
            .forEach((src) => {
              const urlMatch = src.match(/url\(["']?([^"']+)["']?\)/);
              let url = urlMatch ? urlMatch[1] : '';
              if (url && url.startsWith('.')) {
                url = styleSheet.href!.replace(/\/[^\/]+$/, '') + '/' + url;
              }

              const formatMatch = src.match(/format\(["']?([^"']+)["']?\)/);
              const format = formatMatch ? formatMatch[1] : '';
              srcs.push({
                url,
                format,
              });
            });
          let fontWeight = 400;
          switch (rule.style.getPropertyValue('font-weight')) {
            case 'normal':
              fontWeight = 400;
              break;
            case 'bold':
              fontWeight = 700;
              break;
            default:
              fontWeight = parseInt(rule.style.getPropertyValue('font-weight'));
              break;
          }
          fontInfoArray.push({
            fontFamily: rule.style.getPropertyValue('font-family').replace(/['"]+/g, ''),
            fontStyle: rule.style.getPropertyValue('font-style'),
            fontWeight: fontWeight,
            fontStretch: rule.style.getPropertyValue('font-stretch'),
            src: srcs,
          });
        }
      }
    }
  }

  return fontInfoArray;
}

let fillOptions = (options: TGenerateOptions): TFilledGenerateOptions => {
  let tempMargin = options.margin ? options.margin : 0;
  let margin: [number, number, number, number] =
    typeof tempMargin === 'number'
      ? [tempMargin, tempMargin, tempMargin, tempMargin]
      : tempMargin.length === 2
      ? [tempMargin[0], tempMargin[1], tempMargin[0], tempMargin[1]]
      : [tempMargin[0], tempMargin[1], tempMargin[2], tempMargin[3]];
  return {
    margin,
    filename: (options.filename || 'output.pdf').endsWith('.pdf') ? options.filename || 'output.pdf' : `${options.filename}.pdf`,
    title: options.title || '',
    version: options.version || PdfVersion.V1_4,
    pageSize: options.pageSize || PageDimensions.A4,
    resizeScrollElements: options.resizeScrollElements !== undefined ? options.resizeScrollElements : true,
    splitElementsOnPageBreak: options.splitElementsOnPageBreak !== undefined ? options.splitElementsOnPageBreak : true,
    ignoreElementsByClass:
      typeof options.ignoreElementsByClass === 'string'
        ? [options.ignoreElementsByClass]
        : typeof options.ignoreElementsByClass === 'object'
        ? options.ignoreElementsByClass
        : [],
    ignoreElements:
      typeof options.ignoreElements === 'string'
        ? [options.ignoreElements]
        : typeof options.ignoreElements === 'object'
        ? options.ignoreElements
        : [],
    useCustomPageNumbering: options.useCustomPageNumbering !== undefined ? options.useCustomPageNumbering : false,
    usePageHeaders: options.usePageHeaders !== undefined ? options.usePageHeaders : false,
    usePageFooters: options.usePageFooters !== undefined ? options.usePageFooters : false,
    pageBreakBeforeElements:
      typeof options.pageBreakBeforeElements === 'string'
        ? [options.pageBreakBeforeElements]
        : typeof options.pageBreakBeforeElements === 'object'
        ? options.pageBreakBeforeElements
        : [],
    pageBreakAfterElements:
      typeof options.pageBreakAfterElements === 'string'
        ? [options.pageBreakAfterElements]
        : typeof options.pageBreakAfterElements === 'object'
        ? options.pageBreakAfterElements
        : [],
    outlineForHeadings: options.outlineForHeadings !== undefined ? options.outlineForHeadings : true,
    author: options.author || '',
    subject: options.subject || '',
    keywords: options.keywords || '',
    pdfOptions: {
      pageMode: options.pdfOptions?.pageMode || PdfPageMode.USE_NONE,
      pageLayout: options.pdfOptions?.pageLayout || PdfPageLayout.SINGLE_PAGE,
      viewerPreferences: {
        displayDocTitle: options.pdfOptions?.viewerPreferences?.displayDocTitle || true,
      },
    },
  };
};

function hideIgnoredElements(ignoreElements: string[], ignoreElementsByClass: string[], inputEl: HTMLElement, pdf: PDFDocument): Function {
  if (ignoreElements.length) {
    inputEl.querySelectorAll(ignoreElements.join(',')).forEach((el) => {
      el.classList.add('htmlWebsite2pdf-ignore');
    });
  }
  if (ignoreElementsByClass.length) {
    inputEl.querySelectorAll(ignoreElementsByClass.map((el) => `.${el}`).join(',')).forEach((el) => {
      el.classList.add('htmlWebsite2pdf-ignore');
    });
  }
  inputEl.querySelectorAll('[data-htmlWebsite2pdf-ignore]').forEach((el) => {
    el.classList.add('htmlWebsite2pdf-ignore');
  });
  const ignoreElementsStyle = document.createElement('style');
  ignoreElementsStyle.innerHTML = '.htmlWebsite2pdf-ignore { display: none !important; }';
  inputEl.appendChild(ignoreElementsStyle);
  return () => {
    inputEl.querySelectorAll('.htmlWebsite2pdf-ignore').forEach((el) => {
      el.classList.remove('htmlWebsite2pdf-ignore');
    });
    inputEl.removeChild(ignoreElementsStyle);
  };
}

function fromHtml(element: HTMLElement, options: TGenerateOptions): void {}

export default { fromBody, fromElement };
