import React from "react";
import { useWindowDimensions } from "react-native";
import {
  Canvas,
  Line,
  Fill,
  Shader,
  Skia,
} from "@shopify/react-native-skia";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import {
  useSharedValue,
  useDerivedValue,
  runOnJS,
} from "react-native-reanimated";
import { SPECTRUM } from "../constants/theme";
import { hslToHex, positionToHsl } from "../utils/color";

const SPECTRUM_SHADER = Skia.RuntimeEffect.Make(`
  uniform float2 resolution;
  uniform float pixelSize;

  half4 main(float2 pos) {
    // Quantize to pixel grid
    float2 qpos = floor(pos / pixelSize) * pixelSize + pixelSize * 0.5;

    // Map to hue (0-6) and lightness (0-1)
    float hue = (qpos.x / resolution.x) * 6.0;
    float l = 1.0 - qpos.y / resolution.y;

    // HSL to RGB with s=1
    float c = 1.0 - abs(2.0 * l - 1.0);
    float x = c * (1.0 - abs(mod(hue, 2.0) - 1.0));
    float m = l - c * 0.5;

    float3 rgb;
    if (hue < 1.0) { rgb = float3(c, x, 0.0); }
    else if (hue < 2.0) { rgb = float3(x, c, 0.0); }
    else if (hue < 3.0) { rgb = float3(0.0, c, x); }
    else if (hue < 4.0) { rgb = float3(0.0, x, c); }
    else if (hue < 5.0) { rgb = float3(x, 0.0, c); }
    else { rgb = float3(c, 0.0, x); }

    rgb += m;

    // Scanline overlay
    float line = mod(pos.y, 3.0);
    if (line < 1.0) {
      rgb *= 0.85;
    }

    return half4(rgb, 1.0);
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

  const crosshairX = useSharedValue(canvasWidth / 2);
  const crosshairY = useSharedValue(canvasHeight / 2);

  const updateColor = (x: number, y: number) => {
    const clampedX = Math.max(0, Math.min(x, canvasWidth));
    const clampedY = Math.max(0, Math.min(y, canvasHeight));
    const { h, s, l } = positionToHsl(
      clampedX,
      clampedY,
      canvasWidth,
      canvasHeight
    );
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

  const topP1 = useDerivedValue(() => ({
    x: crosshairX.value,
    y: crosshairY.value - gap - len,
  }));
  const topP2 = useDerivedValue(() => ({
    x: crosshairX.value,
    y: crosshairY.value - gap,
  }));

  const bottomP1 = useDerivedValue(() => ({
    x: crosshairX.value,
    y: crosshairY.value + gap,
  }));
  const bottomP2 = useDerivedValue(() => ({
    x: crosshairX.value,
    y: crosshairY.value + gap + len,
  }));

  const leftP1 = useDerivedValue(() => ({
    x: crosshairX.value - gap - len,
    y: crosshairY.value,
  }));
  const leftP2 = useDerivedValue(() => ({
    x: crosshairX.value - gap,
    y: crosshairY.value,
  }));

  const rightP1 = useDerivedValue(() => ({
    x: crosshairX.value + gap,
    y: crosshairY.value,
  }));
  const rightP2 = useDerivedValue(() => ({
    x: crosshairX.value + gap + len,
    y: crosshairY.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
        <Fill>
          <Shader
            source={SPECTRUM_SHADER}
            uniforms={{ resolution: [canvasWidth, canvasHeight], pixelSize: SPECTRUM.pixelSize }}
          />
        </Fill>

        <Line p1={topP1} p2={topP2} color={SPECTRUM.crosshairColor} strokeWidth={sw} />
        <Line p1={bottomP1} p2={bottomP2} color={SPECTRUM.crosshairColor} strokeWidth={sw} />
        <Line p1={leftP1} p2={leftP2} color={SPECTRUM.crosshairColor} strokeWidth={sw} />
        <Line p1={rightP1} p2={rightP2} color={SPECTRUM.crosshairColor} strokeWidth={sw} />
      </Canvas>
    </GestureDetector>
  );
};
