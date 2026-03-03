import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { Canvas, Rect, Fill, Shader, Skia } from "@shopify/react-native-skia";
import { THEME, SPECTRUM } from "../constants/theme";
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

interface LandingScreenProps {
  onStart: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStart }) => {
  const { width, height } = useWindowDimensions();
  const pixelSize = SPECTRUM.pixelSize;

  const cols = Math.ceil(width / pixelSize);
  const rows = Math.ceil(height / pixelSize);

  const pixels = useMemo(() => {
    const result: { x: number; y: number; color: string }[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const { h, s, l } = positionToHsl(
          col * pixelSize + pixelSize / 2,
          row * pixelSize + pixelSize / 2,
          width,
          height
        );
        result.push({
          x: col * pixelSize,
          y: row * pixelSize,
          color: hslToHex(h, s, l),
        });
      }
    }
    return result;
  }, [cols, rows, pixelSize, width, height]);

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.9}
      onPress={onStart}
    >
      <Canvas style={{ width, height, position: "absolute" }}>
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
        <Fill>
          <Shader
            source={SCANLINE_SHADER}
            uniforms={{ resolution: [width, height] }}
          />
        </Fill>
      </Canvas>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>HEX</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontFamily: THEME.fontFamily,
    fontSize: 48,
    color: "#ffffff",
    textShadowColor: "rgba(255, 255, 255, 0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
});
