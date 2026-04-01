import { CSS_COLORS } from "../data/cssColors";
import { PAINT_COLORS } from "../data/paintColors";

// Paint colors first, then CSS overwrites — CSS names always win collisions
const ALL_COLORS: Record<string, string> = {
  ...PAINT_COLORS,
  ...CSS_COLORS,
};

export function colorNameToHex(name: string): string | null {
  const normalized = name.toLowerCase().trim();
  return ALL_COLORS[normalized] ?? null;
}
