import Page from "pdfObjects/IntermediateObjects/Page";
import { TPosition } from "types/pdf";

export type TInternalLink = {
  id: string;
  page: Page;
  position: TPosition;
  width: number;
  height: number;
  borderColor: string | undefined;
  borderStroke: number | undefined;
  el: HTMLElement;
};
