import { Platform } from "react-native";
import { Skia, PaintStyle, ImageFormat } from "@shopify/react-native-skia";
import * as MediaLibrary from "expo-media-library";
import { File, Paths } from "expo-file-system";
import { Drawing } from "./drawings";

export type ExportScale = 1 | 10 | 20 | 40;

export interface ExportResult {
  uri: string;
  width: number;
  height: number;
}

function renderDrawing(drawing: Drawing, scale: ExportScale) {
  const outWidth = drawing.width * scale;
  const outHeight = drawing.height * scale;

  const surface = Skia.Surface.Make(outWidth, outHeight);
  if (!surface) throw new Error("encode-failed");

  const canvas = surface.getCanvas();
  const paint = Skia.Paint();
  paint.setAntiAlias(false);
  paint.setStyle(PaintStyle.Fill);

  for (let y = 0; y < drawing.height; y++) {
    for (let x = 0; x < drawing.width; x++) {
      const hex = drawing.pixels[y * drawing.width + x];
      if (!hex) continue;
      paint.setColor(Skia.Color(hex));
      canvas.drawRect(
        Skia.XYWHRect(x * scale, y * scale, scale, scale),
        paint
      );
    }
  }

  surface.flush();
  const image = surface.makeImageSnapshot();
  return { image, outWidth, outHeight };
}

function downloadPng(bytes: Uint8Array, filename: string): string {
  const blob = new Blob([new Uint8Array(bytes)], { type: "image/png" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return url;
}

/**
 * Renders a drawing to an offscreen Skia surface at `scale`× nearest-neighbor
 * and encodes it as PNG (transparent background for null pixels).
 *
 * Native: writes the cache file and saves it to the Photos library.
 * Web: starts a browser download of the PNG.
 *
 * Throws:
 *   - "permission-denied" if the user denies Photos write access (native).
 *   - "encode-failed" if Skia surface/encoding fails.
 */
export async function exportDrawingAsPng(
  drawing: Drawing,
  scale: ExportScale
): Promise<ExportResult> {
  if (Platform.OS !== "web") {
    const permission = await MediaLibrary.requestPermissionsAsync(true);
    if (!permission.granted) {
      throw new Error("permission-denied");
    }
  }

  const { image, outWidth, outHeight } = renderDrawing(drawing, scale);
  const filename = `hex-pixel-${drawing.id}-${Date.now()}.png`;

  if (Platform.OS === "web") {
    const bytes = image.encodeToBytes(ImageFormat.PNG, 100);
    if (!bytes) throw new Error("encode-failed");
    const uri = downloadPng(bytes, filename);
    return { uri, width: outWidth, height: outHeight };
  }

  const base64 = image.encodeToBase64(ImageFormat.PNG, 100);
  if (!base64) throw new Error("encode-failed");

  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(base64, { encoding: "base64" });

  // Re-exported from expo-media-library's legacy entry; the import plugin misses it.
  // eslint-disable-next-line import/namespace
  await MediaLibrary.saveToLibraryAsync(file.uri);

  return { uri: file.uri, width: outWidth, height: outHeight };
}
