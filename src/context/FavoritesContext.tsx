import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  FavoriteColor,
  getFavorites,
  addFavorite,
  removeFavorite,
} from "../utils/favorites";

interface FavoritesContextValue {
  favorites: FavoriteColor[];
  toggleFavorite: (hex: string, name?: string) => Promise<void>;
  isFav: (hex: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  favorites: [],
  toggleFavorite: async () => {},
  isFav: () => false,
});

export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [favorites, setFavorites] = useState<FavoriteColor[]>([]);

  useEffect(() => {
    getFavorites().then(setFavorites);
  }, []);

  const toggleFavorite = useCallback(
    async (hex: string, name?: string) => {
      const normalized = hex.startsWith("#")
        ? hex.toUpperCase()
        : `#${hex}`.toUpperCase();
      const exists = favorites.some((f) => f.hex === normalized);
      if (exists) {
        const updated = await removeFavorite(hex);
        setFavorites(updated);
      } else {
        const updated = await addFavorite(hex, name);
        setFavorites(updated);
      }
    },
    [favorites]
  );

  const isFav = useCallback(
    (hex: string) => {
      const normalized = hex.startsWith("#")
        ? hex.toUpperCase()
        : `#${hex}`.toUpperCase();
      return favorites.some((f) => f.hex === normalized);
    },
    [favorites]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFav }}>
      {children}
    </FavoritesContext.Provider>
  );
};
