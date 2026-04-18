# HEX

A retro color game and utility app for iOS and Android. Explore colors, solve puzzles, create pixel art, and test your perception — all wrapped in a CRT-inspired pixel-art aesthetic.

Built with React Native, Expo, and TypeScript.

## Modes

### Browse
Interactive full-screen color spectrum picker. Drag to explore hues and lightness, tap to copy the hex code to your clipboard. Displays hex and RGB values with haptic feedback.

### Enter
Type a 6-character hex code — or a color name drawn from a built-in catalogue of 8,000+ CSS, Benjamin Moore, and BEHR paint names — to see the color rendered full-screen.

### Draw
A pixel-art studio. Pick a **16×16**, **32×32**, or **64×64** canvas and paint with pencil, eraser, fill, or eyedropper. Pinch to zoom, two-finger drag to pan — cells stay crisp at every zoom level thanks to vector re-rasterization inside the Skia canvas. Tap the color swatch to open the full spectrum picker, or tap a color from your Library. Undo (20 steps) and clear are available. Export any drawing as a transparent PNG at **1×, 10×, 20×, or 40×** directly to Photos. Drawings auto-save locally — duplicate, delete, or re-open any time.

### Shades
Color sort puzzle. 32 tiles arranged in an 8×4 grid — drag and swap to sort 8 shades of a random hue into the correct lightness order. Timed for competitive play.

### Color Match
A 45-second flexibility-training swipe challenge. Words denoting colors appear in deceptive shades — swipe right when the word's meaning aligns with its actual color, left when they clash. Glowing green/red signals confirm every decision.

### Library
Your saved colors across all modes. Tap Save on any color preview to add it; tap again to remove.

## Features

- Retro CRT aesthetic with scanline shader, pixel font, and glow effects
- Pinch-to-zoom / two-finger-pan on the Draw canvas with GPU-accelerated vector rendering (no blur)
- Transparent PNG export to Photos (expo-media-library)
- 8,000+ color names (CSS + Benjamin Moore + BEHR)
- AsyncStorage persistence for Library and Draw gallery
- Sound effects with mute toggle in settings
- Haptic feedback on interactions
- Themed confirmation dialogs throughout (no default-iOS alerts)

## Tech Stack

- **Framework:** React Native 0.83 + Expo 55
- **Language:** TypeScript
- **Graphics:** @shopify/react-native-skia (GLSL shader for the spectrum, Skia Canvas for the pixel grid)
- **Animations & gestures:** react-native-reanimated + react-native-gesture-handler
- **Storage:** @react-native-async-storage/async-storage
- **Native deps:** expo-media-library, expo-sharing, expo-file-system, expo-audio, expo-haptics
- **Font:** Press Start 2P

## Getting Started

```bash
npm install
npx expo start
```

For a native iOS build:

```bash
npx expo prebuild         # first time, or after adding native deps
cd ios && pod install     # if prebuild didn't already run it
npx expo run:ios
```

## License

All rights reserved.
