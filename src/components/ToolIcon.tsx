import React, { useMemo } from "react";
import { Canvas, Rect } from "@shopify/react-native-skia";
import { THEME } from "../constants/theme";

/**
 * Hand-drawn 12×12 pixel-art icons rendered via Skia, matching the Hex
 * retro aesthetic. Each icon is a string grid: '#' = foreground, '.' =
 * transparent.
 */

export type IconName =
  | "pencil"
  | "eraser"
  | "fill"
  | "eyedropper"
  | "undo"
  | "clear";

const GRID = 12;

// 12 rows × 12 cols
const ICONS: Record<IconName, string[]> = {
  pencil: [
    "..........##",
    ".........##.",
    "........###.",
    ".......###..",
    "......###...",
    ".....###....",
    "....###.....",
    "...###......",
    "..###.......",
    ".####.......",
    "####........",
    ".##.........",
  ],
  eraser: [
    "............",
    "....######..",
    "...#.....#..",
    "..#......#..",
    ".#.......#..",
    "#........#..",
    "#........#..",
    "#.......##..",
    "#......#...",
    "#.....#.....",
    "######......",
    "............",
  ],
  fill: [
    "............",
    "....##......",
    "....#.#.....",
    "...#..#.....",
    "..#####.....",
    ".#.....#....",
    "#.......#...",
    ".#.....#....",
    "..#####.....",
    "...#........",
    "..###.......",
    "............",
  ],
  eyedropper: [
    "..........##",
    ".........##.",
    "........###.",
    ".......###..",
    "......##....",
    ".....##.....",
    "....##......",
    "...##.......",
    "..##........",
    ".##.........",
    "##..........",
    ".#..........",
  ],
  undo: [
    "............",
    "...######...",
    "..#......#..",
    ".#........#.",
    ".#........#.",
    "............",
    "............",
    "....#.......",
    "...##.......",
    "..###.......",
    "...##.......",
    "....#.......",
  ],
  clear: [
    "............",
    "....####....",
    "...#....#...",
    "..########..",
    "............",
    "..#......#..",
    "..#.#.#..#..",
    "..#.#.#..#..",
    "..#.#.#..#..",
    "..#.#.#..#..",
    "..#......#..",
    "..########..",
  ],
};

interface ToolIconProps {
  name: IconName;
  size: number;
  color?: string;
}

export const ToolIcon: React.FC<ToolIconProps> = React.memo(
  ({ name, size, color }) => {
    const fill = color ?? THEME.text;
    const cellSize = size / GRID;
    const cells = useMemo(() => {
      const grid = ICONS[name];
      const out: { x: number; y: number }[] = [];
      for (let y = 0; y < GRID; y++) {
        const row = grid[y] ?? "";
        for (let x = 0; x < GRID; x++) {
          if (row[x] === "#") out.push({ x, y });
        }
      }
      return out;
    }, [name]);

    return (
      <Canvas style={{ width: size, height: size }}>
        {cells.map((c, i) => (
          <Rect
            key={i}
            x={c.x * cellSize}
            y={c.y * cellSize}
            width={cellSize}
            height={cellSize}
            color={fill}
          />
        ))}
      </Canvas>
    );
  }
);

ToolIcon.displayName = "ToolIcon";
