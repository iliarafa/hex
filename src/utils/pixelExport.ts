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

/**
 * Renders a drawing to an offscreen Skia surface at `scale`× nearest-neighbor,
 * encodes it as PNG (transparent background for null pixels), writes to the
 * cache directory, and saves to the Photos library. Requests permission first.
 *
 * Throws:
 *   - "permission-denied" if the user denies Photos write access.
 *   - "encode-failed" if Skia surface/encoding fails.
 */
export async function exportDrawingAsPng(
  drawing: Drawing,
  scale: ExportScale
): Promise<ExportResult> {
  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (!permission.granted) {
    throw new Error("permission-denied");
  }

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
  const base64 = image.encodeToBase64(ImageFormat.PNG, 100);
  if (!base64) throw new Error("encode-failed");

  const filename = `hex-pixel-${drawing.id}-${Date.now()}.png`;
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(base64, { encoding: "base64" });

  await MediaLibrary.saveToLibraryAsync(file.uri);

  return { uri: file.uri, width: outWidth, height: outHeight };
}
