import React, { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import {
  Canvas,
  Rect,
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

  // Derive animated SkPoint values for each crosshair line endpoint
  // Top line
  const topP1 = useDerivedValue(() => ({
    x: crosshairX.value,
    y: crosshairY.value - gap - len,
  }));
  const topP2 = useDerivedValue(() => ({
    x: crosshairX.value,
    y: crosshairY.value - gap,
  }));

  // Bottom line
  const bottomP1 = useDerivedValue(() => ({
    x: crosshairX.value,
    y: crosshairY.value + gap,
  }));
  const bottomP2 = useDerivedValue(() => ({
    x: crosshairX.value,
    y: crosshairY.value + gap + len,
  }));

  // Left line
  const leftP1 = useDerivedValue(() => ({
    x: crosshairX.value - gap - len,
    y: crosshairY.value,
  }));
  const leftP2 = useDerivedValue(() => ({
    x: crosshairX.value - gap,
    y: crosshairY.value,
  }));

  // Right line
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
          p1={topP1}
          p2={topP2}
          color={SPECTRUM.crosshairColor}
          strokeWidth={sw}
        />
        {/* Bottom */}
        <Line
          p1={bottomP1}
          p2={bottomP2}
          color={SPECTRUM.crosshairColor}
          strokeWidth={sw}
        />
        {/* Left */}
        <Line
          p1={leftP1}
          p2={leftP2}
          color={SPECTRUM.crosshairColor}
          strokeWidth={sw}
        />
        {/* Right */}
        <Line
          p1={rightP1}
          p2={rightP2}
          color={SPECTRUM.crosshairColor}
          strokeWidth={sw}
        />
      </Canvas>
    </GestureDetector>
  );
};
