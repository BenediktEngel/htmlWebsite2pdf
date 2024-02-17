import type { IBaseObject } from './IBaseObject';

export interface IArrayObject extends IBaseObject {
  value: Array<IBaseObject>;

  push(object: IBaseObject): void;
  pop(): IBaseObject | undefined;
  toString(): string;
}
