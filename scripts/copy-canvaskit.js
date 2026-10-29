/**
 * Copies CanvasKit's wasm into public/ so Expo's web export can serve it.
 * LoadSkiaWeb fetches this file at runtime (see index.web.ts).
 */
const fs = require("fs");
const path = require("path");

const source = require.resolve("canvaskit-wasm/bin/full/canvaskit.wasm");
const destDir = path.join(__dirname, "..", "public");
const dest = path.join(destDir, "canvaskit.wasm");

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(source, dest);
