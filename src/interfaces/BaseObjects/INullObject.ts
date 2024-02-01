import { IBaseObject } from 'interfaces';

export interface INullObject extends IBaseObject {
  value: null;
  outputObject(): string;
}
