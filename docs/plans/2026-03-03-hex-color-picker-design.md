# Hex Color Picker App — Design Document

**Date:** 2026-03-03
**Status:** Approved

## Summary

A React Native (Expo) iPhone app for picking colors from a pixelated spectrum and copying their hex codes. Styled with a subtle CRT/80s retro aesthetic.

## Tech Stack

- **Expo SDK 52** (managed workflow)
- **@shopify/react-native-skia** — GPU-accelerated canvas for spectrum + CRT effects
- **react-native-gesture-handler** — smooth crosshair dragging
- **expo-clipboard** — copy hex code to clipboard
- **expo-haptics** — tactile feedback on copy
- **expo-font** — load retro pixel font

## Screen Layout

Single screen, three vertical zones:

1. **Header** — App title ("HEX") in pixel font, scanline overlay
2. **Color Spectrum Canvas** — Full-width pixelated HSL gradient with draggable crosshair
3. **Result Panel** — Color swatch, hex code, copy button, RGB secondary info

## Color Spectrum

- Skia canvas rendering a pixelated HSL color grid
- X-axis = Hue (0–360), Y-axis = Lightness (top bright, bottom dark), saturation fixed at 100%
- Discrete ~8x8px blocks for the pixelated look
- Crosshair cursor (thin lines with center gap) follows finger via pan gesture
- Hex value updates in real-time as crosshair moves

## CRT Styling (Subtle)

- **Font:** "Press Start 2P" (Google Fonts, loaded via expo-font)
- **Scanlines:** Semi-transparent horizontal lines overlaid on screen via Skia
- **Glow:** Subtle text-shadow/blur on hex code display (phosphor glow)
- **Palette:** Dark background (#0a0a0a), muted green/cyan accents
- **No curvature or heavy flicker** — clean and usable

## Result Panel

- Color swatch: square showing selected color with pixelated border
- Hex code: large retro font, e.g. `#FF5733`
- Copy: tap hex code or "COPY" button → clipboard + "COPIED!" confirmation + haptic
- RGB values below in smaller text

## File Structure

```
hex/
├── app.json
├── package.json
├── App.tsx
├── src/
│   ├── components/
│   │   ├── ColorSpectrum.tsx   # Skia canvas + gesture handler
│   │   ├── HexDisplay.tsx      # Hex code + copy button
│   │   ├── ColorSwatch.tsx     # Selected color preview
│   │   └── ScanlineOverlay.tsx # CRT scanline effect
│   ├── utils/
│   │   └── color.ts            # HSL→HEX conversion helpers
│   └── constants/
│       └── theme.ts            # CRT theme colors, fonts, sizes
├── assets/
│   └── fonts/                  # Press Start 2P font files
```

## Interaction Flow

1. User opens app → sees pixelated color spectrum filling most of the screen
2. User drags finger across spectrum → crosshair follows, hex code updates live
3. User taps hex code or COPY button → hex copied to clipboard, haptic buzz, "COPIED!" flash
