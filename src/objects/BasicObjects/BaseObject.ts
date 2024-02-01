import { ObjectType } from 'enums';
import { IBaseObject } from 'interfaces';

export abstract class BaseObject implements IBaseObject {
  readonly objectId: number | undefined = undefined;

  readonly generation: number | undefined = 0;

  readonly type: ObjectType;

  readonly isFree: boolean = false;

  private _byteOffset: number | undefined = undefined;

  constructor(type: ObjectType = ObjectType.DIRECT, id?: number, generation?: number) {
    this.type = type;
    if (this.isIndirect() && id === undefined) throw new Error('ID is required for indirect objects');
    if (!this.isIndirect()) {
      this.generation = undefined;
    } else {
      this.objectId = id;
      if (generation !== undefined) this.generation = generation;
    }
  }

  outputObject(value: string): string {
    return this.isIndirect() ? `${this.objectId} ${this.generation} obj\n${value}\nendobj` : value;
  }

  getReference(): string | undefined {
    return this.isIndirect() ? `${this.objectId} ${this.generation} R` : undefined;
  }

  isIndirect(): boolean {
    return this.type === ObjectType.INDIRECT;
  }

  ouputCrossReferenceData(): string | undefined {
    if (this.isIndirect()) {
      // TODO: We need to make sure that the byte offset is set!
      const generationLength = this.generation!.toString().length;
      const byteOffsetLength = this._byteOffset!.toString().length;
      return `${'0'.repeat(10 - byteOffsetLength)}${this._byteOffset} ${'0'.repeat(5 - generationLength)}${this.generation} ${
        this.isFree ? 'f' : 'n'
      }\n`;
    }
    return undefined;
  }

  public set byteOffset(value: number | undefined) {
    this._byteOffset = value;
  }

  public get byteOffset(): number | undefined {
    return this._byteOffset;
  }
}

export default BaseObject;
