# HEX — notes for Claude

Orientation for agents working in this repo. Read this before making non-trivial changes.

## What it is

An Expo React Native app (iOS + Android) with a retro CRT / pixel-art aesthetic. Six modes surfaced from a Mode Select screen:

- **Browse** — full-screen color spectrum picker (`ColorSpectrum.tsx`, GLSL shader)
- **Enter** — type a hex code or a color name (catalogue in `src/data/`)
- **Draw** — pixel art editor with pinch-zoom, PNG export, gallery of saved drawings
- **Shades** — sort-8-tones puzzle (`ChallengeScreen.tsx` + `PuzzleGrid.tsx`)
- **Color Match** — 45s Stroop-style swipe game
- **Library** — saved colors (AsyncStorage)

## Layout

```
App.tsx                          # screen state machine (string union)
src/
├── components/                  # one file per screen + a handful of shared ones
│   ├── LandingScreen.tsx
│   ├── ModeSelectScreen.tsx     # the ASCII-tree menu
│   ├── ColorSpectrum.tsx        # Skia shader-based gradient picker
│   ├── HexDisplay.tsx
│   ├── EnterHexScreen.tsx
│   ├── ChallengeScreen.tsx      # "Shades"
│   ├── ColorMatchScreen.tsx
│   ├── FavoritesScreen.tsx      # "Library"
│   ├── SettingsScreen.tsx
│   ├── DrawHexGalleryScreen.tsx # Draw mode: list
│   ├── DrawHexEditorScreen.tsx  # Draw mode: editor
│   ├── PixelCanvas.tsx          # Skia renderer for the pixel grid
│   └── PuzzleGrid.tsx
├── constants/theme.ts           # THEME and SPECTRUM constants — single source of truth for colors, font, sizes
├── context/
│   ├── FavoritesContext.tsx     # saved colors
│   └── DrawingsContext.tsx      # saved drawings
├── data/                        # cssColors, paintColors (8k+ names)
└── utils/                       # color, colorNames, favorites, drawings, floodFill, pixelExport, puzzle, sounds
```

## Navigation

No router. `App.tsx` holds a `screen` state string-union; `renderScreen()` switches on it. To add a new screen:

1. Add the key to the `screen` union.
2. Add a branch in `renderScreen()`.
3. Add an entry to `MODES` in `ModeSelectScreen.tsx` if it's a user-visible mode.
4. Wire the back callback with `onBack={() => setScreen("mode")}`.

## Styling conventions

- All colors, fonts, and sizes come from `src/constants/theme.ts`. Don't hardcode hex values in components — add a theme entry.
- Font is **Press Start 2P** everywhere (fixed-width pixel font). It has a limited glyph set — emoji and most Unicode symbols render as tofu. Stick to ASCII.
- Screen-title bar pattern: `titleRow` with back button + `HEX` title + spacer, then a `subtitle` with the mode name. Copy the pattern from any existing screen (e.g. `DrawHexGalleryScreen.tsx`).
- Confirmation dialogs use a custom themed `<Modal>` (see `DrawHexGalleryScreen.tsx` delete-drawing modal). **Don't use `Alert.alert`** — it's iOS-default and clashes with the aesthetic.

## Skia

Two Skia surfaces in the app:

1. **`ColorSpectrum.tsx`** uses a GLSL `RuntimeEffect` shader to render the HSL gradient with a scanline overlay. Touches update a crosshair shared value.
2. **`PixelCanvas.tsx`** draws each cell of the pixel grid as a filled `<Rect>`. For the Draw editor it accepts `scale` / `translateX` / `translateY` shared values; the transform is applied **inside** the Skia Canvas via `<Group transform={…}>` so Rects re-rasterize crisply at any zoom — do not wrap the canvas in an RN `Animated.View` transform (that rasters-first-then-scales and blurs).

## Gestures on the Draw canvas

Composed via `Gesture.Simultaneous`:

- 1-finger `Gesture.Pan` / `Gesture.Tap` → paint (restricted with `maxPointers(1)`)
- `Gesture.Pinch` → scale
- 2-finger `Gesture.Pan` → translate (restricted with `minPointers(2).maxPointers(2)`)

Paint math inverts the transform on the JS thread via mirror refs (`scaleRef`, `txRef`, `tyRef`) kept in sync through a `useDerivedValue` + `runOnJS` bridge. If you change the transform flow, keep that bridge intact or paint coordinates will drift when zoomed.

## Canvas sizing gotcha

React Native borders are **inside** the declared view dimensions. The outer canvas wrapper is sized at `canvasSize + CANVAS_BORDER * 2` so the inner content area (which holds the `PixelCanvas`) is exactly `canvasSize`. Also `canvasSize` is snapped to `floor(maxSize / gridWidth) * gridWidth` so every grid cell is an integer point size.

## Persistence

- **Library** (colors): `src/utils/favorites.ts` + `FavoritesContext.tsx` — AsyncStorage under `hex_favorites`.
- **Draw gallery**: `src/utils/drawings.ts` + `DrawingsContext.tsx` — AsyncStorage under `hex_drawings`. Drawings auto-save on edit (debounced 500ms) via a `useEffect` in `DrawHexEditorScreen.tsx`.

Follow the existing context shape if you add new persisted state: `getX / addX / removeX` utils + a Context that exposes both.

## PNG export

`src/utils/pixelExport.ts`: renders the drawing into an offscreen `Skia.Surface.Make`, encodes base64 PNG, writes to cache via `expo-file-system` `new File(Paths.cache, …).write(base64, { encoding: "base64" })`, then `MediaLibrary.saveToLibraryAsync`. Transparent cells stay untouched on the surface → PNG has alpha.

## Build & run

```bash
npm install
npx expo start               # Metro on port 8081 (default)
npx expo run:ios             # full native build + simulator launch
```

After adding a native module or plugin (e.g. `expo-media-library`), run `npx expo prebuild` and `cd ios && LANG=en_US.UTF-8 pod install` before the next native build. The CocoaPods tool ships with a broken default encoding on this machine — always set `LANG=en_US.UTF-8`.

There's also a `.claude/launch.json` with three preview configs: `expo-start` (port 8083, alt Metro), `expo-web` (needs `react-dom` + `react-native-web` installed), `expo-metro` (default port 8081 — use this when the native app is expecting Metro at localhost:8081).

To push the JS-built app to an already-running simulator without redoing `expo run:ios`:

```bash
bash .claude/skills/xcode-sim-sync/scripts/sync_and_launch.sh
# or from ~/Library/Application Support/Claude/.../skills/xcode-sim-sync/scripts/
```

## Things to keep in mind

- The app targets iPhone primarily; `supportsTablet: true` is set but nothing is tuned for iPad.
- **Deployment target is iOS 16.0** (see `app.json`). Don't reach for APIs newer than that.
- A custom config plugin `plugins/remove-swiftuicore.js` strips a SwiftUI linker flag — don't delete it; it fixes a real build error.
- Favorites/My-Hex was rebranded to **Library**, Find/Enter/Draw/Single/Match were rebranded to **BROWSE/ENTER/DRAW/SHADES/COLOR MATCH**. The file names still reference old keys (`FavoritesScreen`, `ChallengeScreen`, `ColorMatchScreen`) — the `screen` state union key is what to look at, not the filename.

## What not to do

- Don't introduce new gesture flows without checking how they compose with the existing paint / pinch / 2-finger-pan on Draw.
- Don't use `Alert.alert` — make a themed `<Modal>`.
- Don't apply RN-layer `transform` to the Draw canvas wrapper. Put the transform inside the Skia Canvas via `<Group transform>` so pixel art stays crisp.
- Don't hardcode theme values — add to `THEME` in `constants/theme.ts`.
- Don't add `react-native-svg` for pixel-art needs — Skia is already doing it faster.
