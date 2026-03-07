import React, { useState, useCallback } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import * as Haptics from "expo-haptics";
import { DraggableTile } from "./DraggableTile";
import { Tile, isSolved } from "../utils/puzzle";
import { playSound } from "../utils/sounds";

interface PuzzleGridProps {
  tiles: Tile[];
  onTilesChange: (tiles: Tile[]) => void;
  onSolved: () => void;
}

export const PuzzleGrid: React.FC<PuzzleGridProps> = ({
  tiles,
  onTilesChange,
  onSolved,
}) => {
  const { width } = useWindowDimensions();
  const gridWidth = width - 40; // 20px padding each side
  const tileWidth = gridWidth / 4;
  const tileHeight = tileWidth / 2;
  const gridHeight = tileHeight * 8;
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragEnd = useCallback(
    (index: number, translationX: number, translationY: number) => {
      const colOffset = Math.round(translationX / tileWidth);
      const rowOffset = Math.round(translationY / tileHeight);

      const fromRow = Math.floor(index / 4);
      const fromCol = index % 4;
      const toRow = Math.max(0, Math.min(7, fromRow + rowOffset));
      const toCol = Math.max(0, Math.min(3, fromCol + colOffset));
      const toIndex = toRow * 4 + toCol;

      if (toIndex !== index && toIndex >= 0 && toIndex < 32) {
        const newTiles = [...tiles];
        [newTiles[index], newTiles[toIndex]] = [newTiles[toIndex], newTiles[index]];
        onTilesChange(newTiles);

        if (isSolved(newTiles)) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          playSound("solved");
          onSolved();
        } else {
          // Check if any affected row just became complete
          const affectedRows = new Set([Math.floor(index / 4), Math.floor(toIndex / 4)]);
          for (const row of affectedRows) {
            const rowTiles = newTiles.slice(row * 4, row * 4 + 4);
            if (rowTiles.every((t) => t.targetRow === rowTiles[0].targetRow)) {
              playSound("rowComplete");
              break;
            }
          }
        }
      }

      setDragIndex(null);
    },
    [tiles, tileWidth, tileHeight, onTilesChange, onSolved]
  );

  return (
    <View style={[styles.grid, { width: gridWidth, height: gridHeight }]}>
      {tiles.map((tile, index) => (
        <DraggableTile
          key={tile.id}
          color={tile.color}
          width={tileWidth}
          height={tileHeight}
          onDragStart={() => handleDragStart(index)}
          onDragEnd={(tx, ty) => handleDragEnd(index, tx, ty)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
