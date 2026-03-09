import { hslToHex } from "./color";

export interface Tile {
  id: number;
  color: string;
  targetRow: number; // which row this tile belongs to when solved
}

/**
 * Generate an 8x4 grid of tiles for the puzzle.
 * Returns 32 tiles in shuffled order — 8 lightness levels of a random hue.
 */
export function generatePuzzle(): { tiles: Tile[]; hue: number } {
  const tiles: Tile[] = [];
  let id = 0;

  const hue = Math.floor(Math.random() * 360);
  for (let row = 0; row < 8; row++) {
    const lightness = 85 - row * 10; // 85, 75, 65, 55, 45, 35, 25, 15 (lighter on top)
    const color = hslToHex(hue, 60, lightness);
    for (let col = 0; col < 4; col++) {
      tiles.push({ id: id++, color, targetRow: row });
    }
  }

  return { tiles: shuffleTiles(tiles), hue };
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

/** Check if puzzle is solved: every row has tiles with the correct targetRow matching its position */
export function isSolved(tiles: Tile[]): boolean {
  for (let row = 0; row < 8; row++) {
    const rowTiles = tiles.slice(row * 4, row * 4 + 4);
    if (!rowTiles.every((t) => t.targetRow === row)) {
      return false;
    }
  }
  return true;
}
