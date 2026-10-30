/**
 * React Native Web drops CSS clamp() strings, so the rail width is computed
 * here. 10.42vw is 200px at 1920; the floor stays at 220 so "> COLOR MATCH"
 * fits at 12px without clipping.
 */
export function railWidthFor(windowWidth: number): number {
  const scaled = windowWidth * (200 / 1920);
  return Math.round(Math.min(320, Math.max(220, scaled)));
}
