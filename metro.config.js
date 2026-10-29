const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Skia 2.14's web entry still imports the pre-0.87 asset registry path.
// RN 0.88 exposes the same API from react-native/src/asset-registry.js.
const assetRegistryPath = path.join(
  path.dirname(require.resolve("react-native/package.json")),
  "src/asset-registry.js"
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === "web" &&
    (moduleName === "react-native/Libraries/Image/AssetRegistry" ||
      moduleName === "react-native/Libraries/Image/AssetRegistry.js")
  ) {
    return { type: "sourceFile", filePath: assetRegistryPath };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
