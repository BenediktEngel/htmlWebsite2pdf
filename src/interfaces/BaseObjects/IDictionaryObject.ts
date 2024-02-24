import type { IBaseObject } from './IBaseObject';
import type { INameObject } from './INameObject';
import type { IArrayObject } from './IArrayObject';
import type { IBooleanObject } from './IBooleanObject';
import type { INullObject } from './INullObject';
import type { INumericObject } from './INumericObject';
import type { IStreamObject } from './IStreamObject';
import type { IStringObject } from './IStringObject';

export interface IDictionaryObject extends IBaseObject {
  value: Map<
    INameObject,
    IArrayObject | IBooleanObject | IDictionaryObject | INameObject | INullObject | INumericObject | IStreamObject | IStringObject
  >;

  toBuffer(): Buffer;
  getValueByKey(key: INameObject | string): IBaseObject | undefined;
  setValueByKey(key: INameObject | string, value: IBaseObject): void;
}
