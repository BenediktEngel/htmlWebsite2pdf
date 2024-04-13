/**
 * Calculate the hash code of a string
 * @param {string} s The string to calculate the hash code
 * @returns {number} The hash code of the string
 * @see https://gist.github.com/hyamamoto/fd435505d29ebfa3d9716fd2be8d42f0?permalink_comment_id=2775538#gistcomment-2775538
 */
export function hashCode(s: string): number {
  let h: number = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h!;
}

export default hashCode;
