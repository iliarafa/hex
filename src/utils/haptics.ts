import { Platform } from "react-native";
import * as ExpoHaptics from "expo-haptics";

export const ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType;

const noop = () => Promise.resolve();

/** Phone haptics. Browsers get a no-op — vibration APIs are inconsistent and noisy. */
export function impactAsync(
  style: ExpoHaptics.ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle.Medium
) {
  if (Platform.OS === "web") return noop();
  return ExpoHaptics.impactAsync(style);
}

export function notificationAsync(
  type: ExpoHaptics.NotificationFeedbackType
) {
  if (Platform.OS === "web") return noop();
  return ExpoHaptics.notificationAsync(type);
}

export function selectionAsync() {
  if (Platform.OS === "web") return noop();
  return ExpoHaptics.selectionAsync();
}
