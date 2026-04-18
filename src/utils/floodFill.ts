/**
 * Iterative 4-connected flood fill.
 * Replaces all pixels reachable from startIdx that match the target value
 * with newColor. Returns a new array (does not mutate the input).
 * newColor === null clears cells (eraser-style fill).
 */
export function floodFill(
  pixels: (string | null)[],
  width: number,
  height: number,
  startIdx: number,
  newColor: string | null
): (string | null)[] {
  if (startIdx < 0 || startIdx >= pixels.length) return pixels;
  const target = pixels[startIdx];
  if (target === newColor) return pixels;

  const result = pixels.slice();
  const stack: number[] = [startIdx];

  while (stack.length > 0) {
    const idx = stack.pop()!;
    if (result[idx] !== target) continue;
    result[idx] = newColor;

    const x = idx % width;
    const y = Math.floor(idx / width);

    if (x > 0) stack.push(idx - 1);
    if (x < width - 1) stack.push(idx + 1);
    if (y > 0) stack.push(idx - width);
    if (y < height - 1) stack.push(idx + width);
  }

  return result;
}
