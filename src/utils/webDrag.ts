import { Platform, type ViewStyle } from "react-native";

/** Stops the browser from scrolling or selecting text while a pointer drags. */
export const webDragStyle: ViewStyle | undefined =
  Platform.OS === "web"
    ? ({ touchAction: "none", userSelect: "none" } as ViewStyle)
    : undefined;
