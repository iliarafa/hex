/**
 * Convert HSL values to a hex color string.
 * h: 0-360, s: 0-100, l: 0-100
 */
export function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) {
    r = c; g = x; b = 0;
  } else if (h < 120) {
    r = x; g = c; b = 0;
  } else if (h < 180) {
    r = 0; g = c; b = x;
  } else if (h < 240) {
    r = 0; g = x; b = c;
  } else if (h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Convert hex to RGB object.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

/**
 * Euclidean distance between two hex colors in RGB space (0-441).
 */
export function colorDistance(hex1: string, hex2: string): number {
  const a = hexToRgb(hex1);
  const b = hexToRgb(hex2);
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

/**
 * Generate a random vibrant hex color (saturation=100%, lightness 25-75%).
 */
export function randomHex(): string {
  const h = Math.floor(Math.random() * 360);
  const l = 25 + Math.floor(Math.random() * 50);
  return hslToHex(h, 100, l);
}

/**
 * Given a position on the spectrum canvas, return the corresponding HSL values.
 * x/canvasWidth maps to hue (0-360), y/canvasHeight maps to lightness (100-0, top=bright).
 */
export function positionToHsl(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number
): { h: number; s: number; l: number } {
  const h = Math.round((x / canvasWidth) * 360);
  const l = Math.round((1 - y / canvasHeight) * 100);
  return {
    h: Math.max(0, Math.min(360, h)),
    s: 100,
    l: Math.max(0, Math.min(100, l)),
  };
}
