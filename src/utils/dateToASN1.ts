export function dateToASN1(date: Date): string {
  return `${date.toISOString().replace(/[-:T]/g, '').split('.')[0]}+00\`00`;
}

export default dateToASN1;
