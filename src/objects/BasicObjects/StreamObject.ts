import { ObjectType } from 'enums';
import { IStreamObject } from 'interfaces';
import { BaseObject, DictionaryObject } from 'objects';

export class StreamObject extends BaseObject implements IStreamObject {
private  _value: string;

  readonly streamDictionary: DictionaryObject;

  constructor(value: string, streamDictionary: DictionaryObject, type: ObjectType = ObjectType.DIRECT, id?: number, generation?: number) {
    super(type, id, generation);
    this._value = value;
    this.streamDictionary = streamDictionary;
    // TODO: Probably call method to calculate length of stream
    // TODO: And set this value in the stream dictionary
  }

  outputObject(): string {
    return super.outputObject(
      `${this.streamDictionary.isIndirect() ? this.streamDictionary.getReference() : this.streamDictionary.outputObject()}\nstream\n${
        this._value
      }\nendstream`,
    );
  }

  get value(): string {
    return this._value;
  }

  set value(value: string) {
    this._value = value;
  }
}

export default StreamObject;
