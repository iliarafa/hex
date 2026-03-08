import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { Canvas, Fill, Shader, Skia } from "@shopify/react-native-skia";
import { THEME, SPECTRUM } from "../constants/theme";

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

interface LandingScreenProps {
  onStart: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStart }) => {
  const { width, height } = useWindowDimensions();

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.9}
      onPress={onStart}
    >
      <Canvas style={{ width, height, position: "absolute" }}>
        <Fill>
          <Shader
            source={SPECTRUM_SHADER}
            uniforms={{ resolution: [width, height], pixelSize: SPECTRUM.pixelSize }}
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
