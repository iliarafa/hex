import React, { useState, useCallback } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import * as Haptics from "expo-haptics";
import { DraggableTile } from "./DraggableTile";
import { Tile, isSolved } from "../utils/puzzle";

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
  const gridSize = width - 40; // 20px padding each side
  const tileSize = gridSize / 8;
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragEnd = useCallback(
    (index: number, translationX: number, translationY: number) => {
      // Calculate which tile position the drag ended on
      const colOffset = Math.round(translationX / tileSize);
      const rowOffset = Math.round(translationY / tileSize);

      const fromRow = Math.floor(index / 8);
      const fromCol = index % 8;
      const toRow = Math.max(0, Math.min(7, fromRow + rowOffset));
      const toCol = Math.max(0, Math.min(7, fromCol + colOffset));
      const toIndex = toRow * 8 + toCol;

      if (toIndex !== index && toIndex >= 0 && toIndex < 64) {
        const newTiles = [...tiles];
        [newTiles[index], newTiles[toIndex]] = [newTiles[toIndex], newTiles[index]];
        onTilesChange(newTiles);

        if (isSolved(newTiles)) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onSolved();
        }
      }

      setDragIndex(null);
    },
    [tiles, tileSize, onTilesChange, onSolved]
  );

  return (
    <View style={[styles.grid, { width: gridSize, height: gridSize }]}>
      {tiles.map((tile, index) => (
        <DraggableTile
          key={tile.id}
          color={tile.color}
          size={tileSize}
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
