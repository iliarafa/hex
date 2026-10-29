import { Platform } from "react-native";
import * as Clipboard from "expo-clipboard";

/** Copy text. Web uses the async Clipboard API from the user gesture that triggered it. */
export async function copyText(text: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    throw new Error("clipboard-unavailable");
  }
  await Clipboard.setStringAsync(text);
}
