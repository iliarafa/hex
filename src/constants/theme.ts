export const THEME = {
  bg: "#0a0a0a",
  stage: "#000000",
  bgSecondary: "#1a1a1a",
  accent: "#00e5ff",
  accentDim: "#007a8a",
  text: "#c0ffc0",
  textBright: "#00ff41",
  textDim: "#4a6a4a",
  railIdle: "#8FA88F",
  border: "#2a3a2a",
  danger: "#FF6347",
  // Translucent bar so phosphor readouts stay legible on any swatch.
  overlay: "rgba(0, 0, 0, 0.72)",
  // Rail wordmark starts 28px down and is 22px tall. Right panels begin 24px under that line.
  desktopPanelTop: 28 + 22 + 24,
  fontFamily: "PressStart2P_400Regular",
  fontSizeSmall: 8,
  fontSizeMedium: 12,
  fontSizeLarge: 16,
  fontSizeXL: 20,
} as const;

export const SPECTRUM = {
  pixelSize: 6,
  crosshairColor: "#ffffff",
  crosshairGap: 6,
  crosshairLength: 16,
  crosshairWidth: 2,
} as const;
