# HEX

A retro color game and utility app for iOS and Android. Explore colors, solve puzzles, and test your perception — all wrapped in a CRT-inspired pixel art aesthetic.

Built with React Native, Expo, and TypeScript.

## Game Modes

### Find Hex
Interactive full-screen color spectrum picker. Drag to explore hues and lightness, tap to copy the hex code to your clipboard. Displays hex and RGB values with haptic feedback.

### Single Hex
Color sort puzzle. 32 tiles arranged in an 8x4 grid — drag and swap to sort 8 shades of a random hue into the correct lightness order. Timed for competitive play.

### Match Hex
A 45-second color match swipe challenge. Words denoting colors appear in deceptive shades — swipe right when the word's meaning aligns with its actual color, left when they clash. Glowing green/red signals confirm every decision.

### Enter Hex
Type any 6-character hex code to see the color rendered as a full-screen swatch.

## Features

- Retro CRT aesthetic with scanline shader, pixel font, and glow effects
- Sound effects with mute toggle in settings
- Haptic feedback on interactions
- Drag-and-drop with spring animations (React Native Reanimated)
- Skia-powered color spectrum rendering

## Tech Stack

- **Framework:** React Native 0.83 + Expo 55
- **Language:** TypeScript
- **Graphics:** @shopify/react-native-skia
- **Animations:** react-native-reanimated
- **Font:** Press Start 2P

## Getting Started

```bash
npm install
npx expo start
```

## License

All rights reserved.
