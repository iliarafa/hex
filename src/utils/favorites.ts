import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "hex_favorites";

export interface FavoriteColor {
  hex: string;
  name?: string;
  savedAt: number;
}

function normalize(hex: string): string {
  const h = hex.startsWith("#") ? hex : `#${hex}`;
  return h.toUpperCase();
}

export async function getFavorites(): Promise<FavoriteColor[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  if (!json) return [];
  return JSON.parse(json);
}

export async function addFavorite(
  hex: string,
  name?: string
): Promise<FavoriteColor[]> {
  const favorites = await getFavorites();
  const normalized = normalize(hex);
  if (favorites.some((f) => f.hex === normalized)) return favorites;
  const updated = [{ hex: normalized, name, savedAt: Date.now() }, ...favorites];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function removeFavorite(hex: string): Promise<FavoriteColor[]> {
  const favorites = await getFavorites();
  const normalized = normalize(hex);
  const updated = favorites.filter((f) => f.hex !== normalized);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
