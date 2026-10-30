import React, { createContext, useContext, useLayoutEffect, useState } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { THEME } from "../constants/theme";
import { applyDesktopStage, desktopStage } from "../utils/enterLayout";

/** Wide web viewports get the desktop workstation. Phones and native stay stacked. */
export const DESKTOP_MIN_WIDTH = 1024;

type Viewport = { width: number; height: number; scale: number };

const ViewportContext = createContext<Viewport>({ width: 0, height: 0, scale: 1 });

export function useAppViewport(): Viewport {
  const measured = useContext(ViewportContext);
  const windowSize = useWindowDimensions();
  if (measured.width > 0 && measured.height > 0) return measured;
  return { width: windowSize.width, height: windowSize.height, scale: 1 };
}

/**
 * Width and height the layout is authored in. Below the stage floor this is
 * the pre-zoom stage, so type and rails track the locked layout rather than
 * the visual window (which would shrink them a second time).
 */
export function useLayoutBox(): { width: number; height: number; scale: number } {
  const viewport = useAppViewport();
  const windowSize = useWindowDimensions();
  if (viewport.scale < 1) return viewport;
  return { width: windowSize.width, height: windowSize.height, scale: 1 };
}

export function useIsDesktop(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === "web" && width >= DESKTOP_MIN_WIDTH;
}

/**
 * Full-bleed shell. Desktop layout lives in the screens, not in a phone frame.
 * `lockStage` turns on Math Racer's stage zoom for web ENTER below 900×720.
 */
export function AppShell({
  children,
  lockStage = false,
}: {
  children: React.ReactNode;
  lockStage?: boolean;
}) {
  const windowSize = useWindowDimensions();
  const stage = desktopStage(windowSize.width, windowSize.height);
  const locked = lockStage && stage.scale < 1 && stage.scale > 0;
  const [size, setSize] = useState<Viewport>({
    width: windowSize.width,
    height: windowSize.height,
    scale: 1,
  });

  useLayoutEffect(() => {
    if (Platform.OS !== "web") return;
    if (!lockStage) {
      applyDesktopStage(null);
      return;
    }
    applyDesktopStage(desktopStage(windowSize.width, windowSize.height));
    return () => {
      applyDesktopStage(null);
    };
  }, [lockStage, windowSize.width, windowSize.height]);

  const value: Viewport = locked
    ? { width: stage.width, height: stage.height, scale: stage.scale }
    : { width: size.width, height: size.height, scale: 1 };

  return (
    <View
      style={styles.fill}
      onLayout={(event) => {
        // While #root is zoomed, measurement is the visual size and would
        // shrink the layout a second time. Keep the pre-lock window size.
        if (locked) return;
        const { width, height } = event.nativeEvent.layout;
        if (width <= 0 || height <= 0) return;
        setSize((prev) =>
          prev.width === width && prev.height === height ? prev : { width, height, scale: 1 }
        );
      }}
    >
      <ViewportContext.Provider value={value}>{children}</ViewportContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
});
