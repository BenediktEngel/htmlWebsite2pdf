import { IBaseObject } from 'interfaces';

export interface IBooleanObject extends IBaseObject {
  value: boolean;

  outputObject(): string;
}
