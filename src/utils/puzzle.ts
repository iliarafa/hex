import { hslToHex } from "./color";

export type PuzzleMode = "single" | "multi";

export interface Tile {
  id: number;
  color: string;
  targetRow: number; // which row this tile belongs to when solved
}

/**
 * Generate an 8x8 grid of tiles for the puzzle.
 * Returns 64 tiles in shuffled order.
 */
export function generatePuzzle(mode: PuzzleMode): Tile[] {
  const tiles: Tile[] = [];
  let id = 0;

  if (mode === "single") {
    // Random hue, 8 lightness levels
    const hue = Math.floor(Math.random() * 360);
    for (let row = 0; row < 8; row++) {
      const lightness = 15 + row * 10; // 15, 25, 35, 45, 55, 65, 75, 85
      const color = hslToHex(hue, 100, lightness);
      for (let col = 0; col < 8; col++) {
        tiles.push({ id: id++, color, targetRow: row });
      }
    }
  } else {
    // 8 evenly spaced hues
    for (let row = 0; row < 8; row++) {
      const hue = row * 45; // 0, 45, 90, 135, 180, 225, 270, 315
      const color = hslToHex(hue, 100, 50);
      for (let col = 0; col < 8; col++) {
        tiles.push({ id: id++, color, targetRow: row });
      }
    }
  }

  return shuffleTiles(tiles);
}

/** Fisher-Yates shuffle */
function shuffleTiles(tiles: Tile[]): Tile[] {
  const arr = [...tiles];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Check if puzzle is solved: every row has tiles with the same targetRow */
export function isSolved(tiles: Tile[]): boolean {
  for (let row = 0; row < 8; row++) {
    const rowTiles = tiles.slice(row * 8, row * 8 + 8);
    const firstTarget = rowTiles[0].targetRow;
    if (!rowTiles.every((t) => t.targetRow === firstTarget)) {
      return false;
    }
  }
  return true;
}
