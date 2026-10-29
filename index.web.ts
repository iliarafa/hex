import "react-native-gesture-handler";
import "@expo/metro-runtime";
import { registerRootComponent } from "expo";
import { LoadSkiaWeb } from "@shopify/react-native-skia/lib/module/web";
import appJson from "./app.json";
import { installWebShell } from "./src/utils/webShell";

installWebShell();

const baseUrl = (appJson.expo.experiments?.baseUrl ?? "").replace(/\/$/, "");

void LoadSkiaWeb({
  locateFile: (file: string) => `${baseUrl}/${file}`,
}).then(async () => {
  const { default: App } = await import("./App");
  registerRootComponent(App);
});
