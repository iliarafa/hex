# Hex Color Picker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a CRT-styled React Native (Expo) color picker app where the user drags a crosshair over a pixelated spectrum to reveal and copy hex codes.

**Architecture:** Single-screen Expo app. A Skia canvas renders a pixelated HSL grid + crosshair controlled by pan gestures. A result panel below shows the selected color swatch, hex code, and copy button. CRT scanlines rendered via Skia shader overlay. All state managed with React hooks + Reanimated shared values.

**Tech Stack:** Expo SDK, @shopify/react-native-skia, react-native-gesture-handler, react-native-reanimated, expo-clipboard, expo-haptics, @expo-google-fonts/press-start-2p

---

### Task 1: Project Scaffolding

**Files:**
- Create: `app.json` (auto-generated)
- Create: `package.json` (auto-generated)
- Create: `App.tsx` (auto-generated, will replace later)
- Create: `src/constants/theme.ts`

**Step 1: Create the Expo project**

Run:
```bash
npx create-expo-app@latest hex-app --template blank-typescript
```

Then move all contents from `hex-app/` into the current `hex/` directory (or create in-place).

**Step 2: Install all dependencies**

Run:
```bash
npx expo install @shopify/react-native-skia react-native-reanimated react-native-gesture-handler expo-clipboard expo-haptics @expo-google-fonts/press-start-2p expo-font expo-status-bar
```

**Step 3: Create the theme constants file**

Create `src/constants/theme.ts`:

```ts
export const THEME = {
  bg: "#0a0a0a",
  bgSecondary: "#1a1a1a",
  accent: "#00e5ff",
  accentDim: "#007a8a",
  text: "#c0ffc0",
  textBright: "#00ff41",
  textDim: "#4a6a4a",
  border: "#2a3a2a",
  fontFamily: "PressStart2P_400Regular",
  fontSizeSmall: 8,
  fontSizeMedium: 12,
  fontSizeLarge: 16,
  fontSizeXL: 20,
} as const;

export const SPECTRUM = {
  pixelSize: 8,
  crosshairColor: "#ffffff",
  crosshairGap: 6,
  crosshairLength: 16,
  crosshairWidth: 2,
} as const;
```

**Step 4: Verify the project runs**

Run:
```bash
npx expo start
```

Expected: Metro bundler starts, app loads on simulator or Expo Go with default blank screen.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold Expo project with all dependencies and theme constants"
```

---

### Task 2: Color Utility Functions

**Files:**
- Create: `src/utils/color.ts`

**Step 1: Create the color conversion utilities**

Create `src/utils/color.ts`:

```ts
/**
 * Convert HSL values to a hex color string.
 * h: 0-360, s: 0-100, l: 0-100
 */
export function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) {
    r = c; g = x; b = 0;
  } else if (h < 120) {
    r = x; g = c; b = 0;
  } else if (h < 180) {
    r = 0; g = c; b = x;
  } else if (h < 240) {
    r = 0; g = x; b = c;
  } else if (h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Convert hex to RGB object.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

/**
 * Given a position on the spectrum canvas, return the corresponding HSL values.
 * x/canvasWidth maps to hue (0-360), y/canvasHeight maps to lightness (100-0, top=bright).
 */
export function positionToHsl(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number
): { h: number; s: number; l: number } {
  const h = Math.round((x / canvasWidth) * 360);
  const l = Math.round((1 - y / canvasHeight) * 100);
  return {
    h: Math.max(0, Math.min(360, h)),
    s: 100,
    l: Math.max(0, Math.min(100, l)),
  };
}
```

**Step 2: Verify imports work**

No runtime test needed yet — TypeScript compilation will catch errors on next build.

**Step 3: Commit**

```bash
git add src/utils/color.ts
git commit -m "feat: add HSL/HEX color conversion utilities"
```

---

### Task 3: Color Spectrum Canvas

**Files:**
- Create: `src/components/ColorSpectrum.tsx`

**Step 1: Build the pixelated spectrum with crosshair**

Create `src/components/ColorSpectrum.tsx`:

```tsx
import React, { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import {
  Canvas,
  Rect,
  Group,
  Line,
  vec,
  Skia,
  Fill,
  Shader,
} from "@shopify/react-native-skia";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { useSharedValue, useDerivedValue, runOnJS } from "react-native-reanimated";
import { SPECTRUM } from "../constants/theme";
import { hslToHex, positionToHsl } from "../utils/color";

const SCANLINE_SHADER = Skia.RuntimeEffect.Make(`
  uniform float2 resolution;
  half4 main(float2 pos) {
    float line = mod(pos.y, 3.0);
    if (line < 1.0) {
      return half4(0.0, 0.0, 0.0, 0.15);
    }
    return half4(0.0, 0.0, 0.0, 0.0);
  }
`)!;

interface ColorSpectrumProps {
  height: number;
  onColorChange: (hex: string, h: number, s: number, l: number) => void;
}

export const ColorSpectrum: React.FC<ColorSpectrumProps> = ({
  height,
  onColorChange,
}) => {
  const { width } = useWindowDimensions();
  const canvasWidth = width;
  const canvasHeight = height;
  const pixelSize = SPECTRUM.pixelSize;

  const cols = Math.ceil(canvasWidth / pixelSize);
  const rows = Math.ceil(canvasHeight / pixelSize);

  const crosshairX = useSharedValue(canvasWidth / 2);
  const crosshairY = useSharedValue(canvasHeight / 2);

  // Pre-compute the pixel grid colors
  const pixels = useMemo(() => {
    const result: { x: number; y: number; color: string }[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const { h, s, l } = positionToHsl(
          col * pixelSize + pixelSize / 2,
          row * pixelSize + pixelSize / 2,
          canvasWidth,
          canvasHeight
        );
        result.push({
          x: col * pixelSize,
          y: row * pixelSize,
          color: hslToHex(h, s, l),
        });
      }
    }
    return result;
  }, [cols, rows, pixelSize, canvasWidth, canvasHeight]);

  const updateColor = (x: number, y: number) => {
    const clampedX = Math.max(0, Math.min(x, canvasWidth));
    const clampedY = Math.max(0, Math.min(y, canvasHeight));
    const { h, s, l } = positionToHsl(clampedX, clampedY, canvasWidth, canvasHeight);
    const hex = hslToHex(h, s, l);
    onColorChange(hex, h, s, l);
  };

  const gesture = Gesture.Pan()
    .onBegin((e) => {
      crosshairX.value = e.x;
      crosshairY.value = e.y;
      runOnJS(updateColor)(e.x, e.y);
    })
    .onChange((e) => {
      crosshairX.value = Math.max(0, Math.min(e.x, canvasWidth));
      crosshairY.value = Math.max(0, Math.min(e.y, canvasHeight));
      runOnJS(updateColor)(e.x, e.y);
    });

  const gap = SPECTRUM.crosshairGap;
  const len = SPECTRUM.crosshairLength;
  const sw = SPECTRUM.crosshairWidth;

  return (
    <GestureDetector gesture={gesture}>
      <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
        {/* Pixel grid */}
        {pixels.map((p, i) => (
          <Rect
            key={i}
            x={p.x}
            y={p.y}
            width={pixelSize}
            height={pixelSize}
            color={p.color}
          />
        ))}

        {/* Scanline overlay */}
        <Fill>
          <Shader
            source={SCANLINE_SHADER}
            uniforms={{ resolution: [canvasWidth, canvasHeight] }}
          />
        </Fill>

        {/* Crosshair - four lines with gap in center */}
        {/* Top */}
        <Line
          p1={vec(crosshairX, useDerivedValue(() => crosshairY.value - gap - len))}
          p2={vec(crosshairX, useDerivedValue(() => crosshairY.value - gap))}
          color={SPECTRUM.crosshairColor}
          strokeWidth={sw}
        />
        {/* Bottom */}
        <Line
          p1={vec(crosshairX, useDerivedValue(() => crosshairY.value + gap))}
          p2={vec(crosshairX, useDerivedValue(() => crosshairY.value + gap + len))}
          color={SPECTRUM.crosshairColor}
          strokeWidth={sw}
        />
        {/* Left */}
        <Line
          p1={vec(useDerivedValue(() => crosshairX.value - gap - len), crosshairY)}
          p2={vec(useDerivedValue(() => crosshairX.value - gap), crosshairY)}
          color={SPECTRUM.crosshairColor}
          strokeWidth={sw}
        />
        {/* Right */}
        <Line
          p1={vec(useDerivedValue(() => crosshairX.value + gap), crosshairY)}
          p2={vec(useDerivedValue(() => crosshairX.value + gap + len), crosshairY)}
          color={SPECTRUM.crosshairColor}
          strokeWidth={sw}
        />
      </Canvas>
    </GestureDetector>
  );
};
```

**Step 2: Verify it compiles**

Run: `npx expo start` — check for TypeScript errors in terminal output.

**Step 3: Commit**

```bash
git add src/components/ColorSpectrum.tsx
git commit -m "feat: add pixelated color spectrum canvas with crosshair and scanlines"
```

---

### Task 4: Hex Display and Copy Component

**Files:**
- Create: `src/components/HexDisplay.tsx`

**Step 1: Build the hex display with copy functionality**

Create `src/components/HexDisplay.tsx`:

```tsx
import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { THEME } from "../constants/theme";
import { hexToRgb } from "../utils/color";

interface HexDisplayProps {
  hex: string;
}

export const HexDisplay: React.FC<HexDisplayProps> = ({ hex }) => {
  const [copied, setCopied] = useState(false);
  const rgb = hexToRgb(hex);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(hex);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [hex]);

  return (
    <View style={styles.container}>
      {/* Color swatch */}
      <View style={styles.swatchRow}>
        <View style={[styles.swatch, { backgroundColor: hex }]} />
        <View style={styles.hexContainer}>
          <Text style={styles.label}>HEX</Text>
          <TouchableOpacity onPress={handleCopy} activeOpacity={0.7}>
            <Text style={styles.hexText}>{hex}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* RGB values */}
      <View style={styles.rgbRow}>
        <Text style={styles.rgbText}>R:{rgb.r}</Text>
        <Text style={styles.rgbText}>G:{rgb.g}</Text>
        <Text style={styles.rgbText}>B:{rgb.b}</Text>
      </View>

      {/* Copy button */}
      <TouchableOpacity
        style={[styles.copyButton, copied && styles.copyButtonActive]}
        onPress={handleCopy}
        activeOpacity={0.7}
      >
        <Text style={[styles.copyText, copied && styles.copyTextActive]}>
          {copied ? "COPIED!" : "COPY"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: THEME.bg,
  },
  swatchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  swatch: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderColor: THEME.border,
  },
  hexContainer: {
    marginLeft: 16,
    flex: 1,
  },
  label: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    marginBottom: 4,
  },
  hexText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeXL,
    color: THEME.textBright,
    textShadowColor: THEME.textBright,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  rgbRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 16,
  },
  rgbText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
  },
  copyButton: {
    borderWidth: 2,
    borderColor: THEME.accent,
    paddingVertical: 12,
    alignItems: "center",
  },
  copyButtonActive: {
    backgroundColor: THEME.accent,
  },
  copyText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.accent,
  },
  copyTextActive: {
    color: THEME.bg,
  },
});
```

**Step 2: Commit**

```bash
git add src/components/HexDisplay.tsx
git commit -m "feat: add hex display component with copy-to-clipboard and haptics"
```

---

### Task 5: App Entry Point — Wire Everything Together

**Files:**
- Modify: `App.tsx`

**Step 1: Replace App.tsx with the main screen**

Replace the contents of `App.tsx`:

```tsx
import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "@expo-google-fonts/press-start-2p/useFonts";
import { PressStart2P_400Regular } from "@expo-google-fonts/press-start-2p/400Regular";
import { ColorSpectrum } from "./src/components/ColorSpectrum";
import { HexDisplay } from "./src/components/HexDisplay";
import { THEME } from "./src/constants/theme";

export default function App() {
  const [fontsLoaded] = useFonts({ PressStart2P_400Regular });
  const [hex, setHex] = useState("#00FF41");

  const handleColorChange = useCallback(
    (newHex: string, _h: number, _s: number, _l: number) => {
      setHex(newHex);
    },
    []
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: THEME.textBright }}>LOADING...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>HEX</Text>
          <Text style={styles.subtitle}>COLOR PICKER</Text>
        </View>

        {/* Spectrum */}
        <View style={styles.spectrumContainer}>
          <ColorSpectrum height={380} onColorChange={handleColorChange} />
        </View>

        {/* Result */}
        <HexDisplay hex={hex} />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  loading: {
    flex: 1,
    backgroundColor: THEME.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeXL,
    color: THEME.textBright,
    textShadowColor: THEME.textBright,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    marginTop: 4,
  },
  spectrumContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
});
```

**Step 2: Configure babel for reanimated**

Check if `babel.config.js` exists. If so, ensure it includes the reanimated plugin:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["react-native-reanimated/plugin"],
  };
};
```

**Step 3: Run the app and verify**

Run: `npx expo start --clear`

Expected: App loads with:
- Dark background
- "HEX" title in pixel font with green glow
- Pixelated color spectrum
- Crosshair draggable across spectrum
- Hex code updates live below
- Copy button works with haptic feedback

**Step 4: Commit**

```bash
git add App.tsx babel.config.js
git commit -m "feat: wire up main app screen with header, spectrum, and hex display"
```

---

### Task 6: Polish and Final Adjustments

**Files:**
- Modify: `App.tsx` (if layout tweaks needed)
- Modify: `src/components/ColorSpectrum.tsx` (if performance tuning needed)
- Modify: `app.json` (app name and metadata)

**Step 1: Update app.json metadata**

Update `app.json` — set the app name, slug, icon background:

```json
{
  "expo": {
    "name": "HEX",
    "slug": "hex-color-picker",
    "version": "1.0.0",
    "orientation": "portrait",
    "backgroundColor": "#0a0a0a",
    "userInterfaceStyle": "dark"
  }
}
```

**Step 2: Test full flow on device**

Run on physical iPhone via Expo Go:
1. Open app → see header + spectrum
2. Drag across spectrum → hex updates in real-time
3. Tap hex code → copies, shows "COPIED!", haptic buzz
4. Tap COPY button → same behavior
5. Verify scanlines visible over spectrum

**Step 3: Commit**

```bash
git add app.json
git commit -m "feat: finalize app metadata and configuration"
```
