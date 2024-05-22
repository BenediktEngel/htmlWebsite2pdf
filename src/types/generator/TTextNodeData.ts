export type TTextNodeData = {
  text: string;
  position: DOMRect;
};


export type TTextLine = {
  position: DOMRect;
  styles: CSSStyleDeclaration;
  words: Array<TTextNodeData>;
};
