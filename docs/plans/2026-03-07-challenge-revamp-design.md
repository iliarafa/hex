# Challenge Revamp: Color Sort Puzzle

## Concept

An 8x8 grid of color tiles. Each row should be the same shade. Tiles are shuffled and the player drag-and-drops them back into the correct rows.

## Game Modes

Player chooses before starting:

- **SINGLE HEX** — 8 shades of one hue (e.g. blue), light to dark across rows. Each row has 8 tiles of the same shade.
- **MULTI HEX** — 8 rows of different hues (red, orange, yellow, green, cyan, blue, purple, pink). Each row has 8 tiles of the same hue.

## Interaction

- Drag and drop tiles to swap positions
- Haptic feedback on pickup and drop

## Completion

- Puzzle is solved when all 8 rows contain tiles of the same shade/hue
- Show completion time on success
- "NEW GAME" button to replay

## Layout (top to bottom)

1. Header: "CHALLENGE" + back button
2. Mode selector (SINGLE HEX / MULTI HEX)
3. 8x8 grid (square tiles, fills width)
4. Timer (running)
5. "NEW GAME" button (after solving)

## Color Generation

- **SINGLE HEX:** Random hue, 8 lightness levels evenly spaced (15% to 85%), saturation 100%
- **MULTI HEX:** 8 evenly spaced hues (0, 45, 90, 135, 180, 225, 270, 315), saturation 100%, lightness 50%

## Scoring

Binary: solved or not. Show completion time.
