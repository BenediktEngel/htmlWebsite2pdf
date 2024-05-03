export type TTextNodeData = {
  text: string;
  styles: CSSStyleDeclaration;
  position: DOMRect;
  wordWidths: Array<number>;
  wordSpacing: number;
  // lines: Array<string>;
};
