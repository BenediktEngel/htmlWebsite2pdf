import { TGenerateOptions } from './types';
import { Generator } from './Generator';

export async function fromBody(options: TGenerateOptions = {}): Promise<void> {
  const generator = new Generator(options);
  await generator.generate(document.body);
}

export async function fromElement(inputEl: HTMLElement, options: TGenerateOptions = {}): Promise<void> {
  const generator = new Generator(options);
  await generator.generate(inputEl);
}

export default { fromBody, fromElement };
