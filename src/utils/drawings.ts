import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "hex_drawings";

export type PixelSize = 16 | 32 | 64;

export interface Drawing {
  id: string;
  width: PixelSize;
  height: PixelSize;
  pixels: (string | null)[];
  createdAt: number;
  updatedAt: number;
}

function generateId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

function makeBlank(width: PixelSize, height: PixelSize): (string | null)[] {
  return new Array(width * height).fill(null);
}

export async function getDrawings(): Promise<Drawing[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  if (!json) return [];
  try {
    return JSON.parse(json) as Drawing[];
  } catch {
    return [];
  }
}

async function persist(drawings: Drawing[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(drawings));
}

export async function createDrawing(
  width: PixelSize,
  height: PixelSize
): Promise<{ drawings: Drawing[]; drawing: Drawing }> {
  const drawings = await getDrawings();
  const now = Date.now();
  const drawing: Drawing = {
    id: generateId(),
    width,
    height,
    pixels: makeBlank(width, height),
    createdAt: now,
    updatedAt: now,
  };
  const updated = [drawing, ...drawings];
  await persist(updated);
  return { drawings: updated, drawing };
}

export async function updateDrawing(
  id: string,
  pixels: (string | null)[]
): Promise<Drawing[]> {
  const drawings = await getDrawings();
  const updated = drawings.map((d) =>
    d.id === id ? { ...d, pixels, updatedAt: Date.now() } : d
  );
  await persist(updated);
  return updated;
}

export async function duplicateDrawing(
  id: string
): Promise<{ drawings: Drawing[]; drawing: Drawing | null }> {
  const drawings = await getDrawings();
  const src = drawings.find((d) => d.id === id);
  if (!src) return { drawings, drawing: null };
  const now = Date.now();
  const copy: Drawing = {
    ...src,
    id: generateId(),
    pixels: [...src.pixels],
    createdAt: now,
    updatedAt: now,
  };
  const updated = [copy, ...drawings];
  await persist(updated);
  return { drawings: updated, drawing: copy };
}

export async function deleteDrawing(id: string): Promise<Drawing[]> {
  const drawings = await getDrawings();
  const updated = drawings.filter((d) => d.id !== id);
  await persist(updated);
  return updated;
}
