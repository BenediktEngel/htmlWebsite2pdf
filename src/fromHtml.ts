import { TGenerateOptions } from './types';
import { Generator } from './Generator';

export function fromBody(options: TGenerateOptions = {}): void {
  const generator = new Generator(options);
  generator.generate(document.body);
}

export async function fromElement(inputEl: HTMLElement, options: TGenerateOptions = {}): Promise<void> {
  const generator = new Generator(options);
  await generator.generate(inputEl);
}

export default { fromBody, fromElement };
