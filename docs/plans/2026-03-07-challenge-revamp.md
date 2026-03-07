# Color Sort Puzzle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current challenge mode with a color sort puzzle where players drag-and-drop shuffled tiles into rows of matching shades.

**Architecture:** New `ChallengeScreen` replaces the existing one. A puzzle generator creates an 8x8 grid of colored tiles, shuffles them, and the player uses drag-and-drop (react-native-gesture-handler + reanimated) to swap tiles back into correct rows. Two modes: SINGLE HEX (one hue, 8 lightness levels) and MULTI HEX (8 different hues).

**Tech Stack:** React Native, react-native-gesture-handler (Gesture.Pan), react-native-reanimated (shared values for animations), expo-haptics, existing `hslToHex` from `src/utils/color.ts`.

---

### Task 1: Add puzzle generation utilities

**Files:**
- Create: `src/utils/puzzle.ts`

**Step 1: Create puzzle generator**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/utils/puzzle.ts
git commit -m "feat: add puzzle generation utilities for challenge mode"
```

---

### Task 2: Create DraggableTile component

**Files:**
- Create: `src/components/DraggableTile.tsx`

**Step 1: Build the draggable tile**

This component renders a single colored square that can be picked up and dragged. It uses `Gesture.Pan` from gesture-handler and `useAnimatedStyle` from reanimated for smooth movement.

```typescript
import React from "react";
import { StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

interface DraggableTileProps {
  color: string;
  size: number;
  onDragStart: () => void;
  onDragEnd: (translationX: number, translationY: number) => void;
}

export const DraggableTile: React.FC<DraggableTileProps> = ({
  color,
  size,
  onDragStart,
  onDragEnd,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      scale.value = withSpring(1.15);
      zIndex.value = 100;
      runOnJS(onDragStart)();
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onChange((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      runOnJS(onDragEnd)(e.translationX, e.translationY);
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 0;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          { width: size, height: size, backgroundColor: color },
          styles.tile,
          animatedStyle,
        ]}
      />
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  tile: {
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.2)",
  },
});
```

**Step 2: Commit**

```bash
git add src/components/DraggableTile.tsx
git commit -m "feat: add DraggableTile component with drag-and-drop"
```

---

### Task 3: Create PuzzleGrid component

**Files:**
- Create: `src/components/PuzzleGrid.tsx`

**Step 1: Build the grid**

The grid renders 64 DraggableTile components in an 8x8 layout. When a tile is dragged and released, it calculates which tile it was dropped nearest to and swaps them.

```typescript
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
```

**Step 2: Commit**

```bash
git add src/components/PuzzleGrid.tsx
git commit -m "feat: add PuzzleGrid with drag-to-swap interaction"
```

---

### Task 4: Rewrite ChallengeScreen

**Files:**
- Modify: `src/components/ChallengeScreen.tsx` (full rewrite)

**Step 1: Replace ChallengeScreen with puzzle game**

Replace the entire file. The new screen has:
- Header with back button
- Mode selector (SINGLE HEX / MULTI HEX) shown before game starts
- PuzzleGrid
- Timer
- Solved state with completion time + NEW GAME button

```typescript
import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { THEME } from "../constants/theme";
import { PuzzleGrid } from "./PuzzleGrid";
import { generatePuzzle, Tile, PuzzleMode } from "../utils/puzzle";

interface ChallengeScreenProps {
  onBack: () => void;
}

export const ChallengeScreen: React.FC<ChallengeScreenProps> = ({ onBack }) => {
  const [mode, setMode] = useState<PuzzleMode | null>(null);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [solved, setSolved] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const startGame = useCallback((selectedMode: PuzzleMode) => {
    setMode(selectedMode);
    setTiles(generatePuzzle(selectedMode));
    setSolved(false);
    setElapsed(0);
    startTimeRef.current = Date.now();
  }, []);

  // Timer
  useEffect(() => {
    if (mode && !solved) {
      timerRef.current = setInterval(() => {
        setElapsed((Date.now() - startTimeRef.current) / 1000);
      }, 100);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [mode, solved]);

  const handleSolved = useCallback(() => {
    setSolved(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsed((Date.now() - startTimeRef.current) / 1000);
  }, []);

  const handleNewGame = () => {
    setMode(null);
    setTiles([]);
    setSolved(false);
    setElapsed(0);
  };

  // Mode selection screen
  if (!mode) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={onBack} style={styles.backButtonContainer}>
              <Text style={styles.backButton}>{"<"}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>CHALLENGE</Text>
            <View style={styles.backButtonSpacer} />
          </View>
          <Text style={styles.subtitle}>CHOOSE MODE</Text>
        </View>

        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => startGame("single")}
          >
            <Text style={styles.modeTitle}>SINGLE HEX</Text>
            <Text style={styles.modeDesc}>SORT 8 SHADES{"\n"}OF ONE COLOR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => startGame("multi")}
          >
            <Text style={styles.modeTitle}>MULTI HEX</Text>
            <Text style={styles.modeDesc}>SORT 8 DIFFERENT{"\n"}COLORS</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Game screen
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={handleNewGame} style={styles.backButtonContainer}>
            <Text style={styles.backButton}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>CHALLENGE</Text>
          <View style={styles.backButtonSpacer} />
        </View>
        <Text style={styles.subtitle}>
          {mode === "single" ? "SINGLE HEX" : "MULTI HEX"}
        </Text>
      </View>

      <View style={styles.gridContainer}>
        <PuzzleGrid
          tiles={tiles}
          onTilesChange={setTiles}
          onSolved={handleSolved}
        />
      </View>

      <View style={styles.footer}>
        {solved ? (
          <View style={styles.solvedContainer}>
            <Text style={styles.solvedText}>SOLVED!</Text>
            <Text style={styles.timeText}>{elapsed.toFixed(1)}s</Text>
            <TouchableOpacity style={styles.newGameButton} onPress={handleNewGame}>
              <Text style={styles.newGameText}>NEW GAME</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.timerText}>{elapsed.toFixed(1)}s</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonContainer: {
    width: 40,
  },
  backButtonSpacer: {
    width: 40,
  },
  backButton: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeXL,
    color: THEME.textDim,
  },
  title: {
    flex: 1,
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeXL,
    color: THEME.textDim,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    textAlign: "center",
    marginTop: 4,
  },
  modeContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 20,
  },
  modeButton: {
    borderWidth: 2,
    borderColor: THEME.border,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  modeTitle: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeLarge,
    color: THEME.text,
    marginBottom: 8,
  },
  modeDesc: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    textAlign: "center",
    lineHeight: 16,
  },
  gridContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  timerText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.textDim,
  },
  solvedContainer: {
    alignItems: "center",
  },
  solvedText: {
    fontFamily: THEME.fontFamily,
    fontSize: 24,
    color: THEME.text,
    marginBottom: 4,
  },
  timeText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.textDim,
    marginBottom: 16,
  },
  newGameButton: {
    borderWidth: 2,
    borderColor: THEME.text,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  newGameText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.text,
  },
});
```

**Step 2: Commit**

```bash
git add src/components/ChallengeScreen.tsx
git commit -m "feat: rewrite challenge mode as color sort puzzle"
```

---

### Task 5: Clean up unused imports in App.tsx

**Files:**
- Modify: `App.tsx`

**Step 1: Remove old challenge-related imports if any are unused**

The `ChallengeScreen` import stays (same name, new implementation). No changes expected but verify.

**Step 2: Test the app**

Run `npx expo start` and verify:
1. Picker screen works as before
2. CHALLENGE MODE link navigates to mode selection
3. Both SINGLE HEX and MULTI HEX generate correct grids
4. Drag-and-drop swaps tiles
5. Solving triggers SOLVED! state with time
6. NEW GAME returns to mode selection
7. Back button returns to mode selection (from game) or picker (from mode selection)

**Step 3: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: complete challenge mode revamp with color sort puzzle"
```
