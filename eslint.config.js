const globals = require("globals");
const expo = require("eslint-config-expo/flat");

module.exports = [
  { ignores: ["dist/**", "node_modules/**", ".expo/**", "ios/**", "android/**", "public/**"] },
  ...expo,
  {
    files: ["**/*.{js,cjs,mjs}"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    rules: {
      // Shared-value writes and the latest-ref pattern are normal here.
      // The React Compiler rules flag both, and this app does not use the compiler.
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      // React Native text is not HTML.
      "react/no-unescaped-entities": "off",
    },
  },
];
