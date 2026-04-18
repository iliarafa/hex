import React, { useMemo } from "react";
import { Canvas, Rect, Group } from "@shopify/react-native-skia";
import { THEME } from "../constants/theme";

interface PixelCanvasProps {
  pixels: (string | null)[];
  width: number;        // grid columns
  height: number;       // grid rows
  canvasSize: number;   // display width/height in points (square)
  showGrid?: boolean;
  showCheckerboard?: boolean;
}

const CHECKER_LIGHT = "#222222";
const CHECKER_DARK = "#151515";

export const PixelCanvas: React.FC<PixelCanvasProps> = React.memo(
  ({ pixels, width, height, canvasSize, showGrid = false, showCheckerboard = false }) => {
    const cellSize = canvasSize / Math.max(width, height);

    const checker = useMemo(() => {
      if (!showCheckerboard) return null;
      const cells: { x: number; y: number; fill: string }[] = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          cells.push({
            x,
            y,
            fill: (x + y) % 2 === 0 ? CHECKER_LIGHT : CHECKER_DARK,
          });
        }
      }
      return cells;
    }, [width, height, showCheckerboard]);

    const paintedCells = useMemo(() => {
      const cells: { x: number; y: number; fill: string }[] = [];
      for (let i = 0; i < pixels.length; i++) {
        const hex = pixels[i];
        if (!hex) continue;
        cells.push({ x: i % width, y: Math.floor(i / width), fill: hex });
      }
      return cells;
    }, [pixels, width]);

    const gridLines = useMemo(() => {
      if (!showGrid) return null;
      const lines: { x: number; y: number; w: number; h: number }[] = [];
      // vertical
      for (let i = 1; i < width; i++) {
        lines.push({ x: i * cellSize - 0.5, y: 0, w: 1, h: height * cellSize });
      }
      // horizontal
      for (let i = 1; i < height; i++) {
        lines.push({ x: 0, y: i * cellSize - 0.5, w: width * cellSize, h: 1 });
      }
      return lines;
    }, [showGrid, width, height, cellSize]);

    return (
      <Canvas style={{ width: width * cellSize, height: height * cellSize }}>
        {checker && (
          <Group>
            {checker.map((c, i) => (
              <Rect
                key={`c-${i}`}
                x={c.x * cellSize}
                y={c.y * cellSize}
                width={cellSize}
                height={cellSize}
                color={c.fill}
              />
            ))}
          </Group>
        )}
        <Group>
          {paintedCells.map((c, i) => (
            <Rect
              key={`p-${c.x}-${c.y}-${i}`}
              x={c.x * cellSize}
              y={c.y * cellSize}
              width={cellSize}
              height={cellSize}
              color={c.fill}
            />
          ))}
        </Group>
        {gridLines && (
          <Group>
            {gridLines.map((l, i) => (
              <Rect
                key={`g-${i}`}
                x={l.x}
                y={l.y}
                width={l.w}
                height={l.h}
                color={THEME.border}
              />
            ))}
          </Group>
        )}
      </Canvas>
    );
  }
);

PixelCanvas.displayName = "PixelCanvas";
