import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  Drawing,
  PixelSize,
  getDrawings,
  createDrawing as createDrawingStorage,
  updateDrawing as updateDrawingStorage,
  duplicateDrawing as duplicateDrawingStorage,
  deleteDrawing as deleteDrawingStorage,
} from "../utils/drawings";

interface DrawingsContextValue {
  drawings: Drawing[];
  ready: boolean;
  createDrawing: (width: PixelSize, height: PixelSize) => Promise<Drawing>;
  updateDrawing: (id: string, pixels: (string | null)[]) => Promise<void>;
  duplicateDrawing: (id: string) => Promise<Drawing | null>;
  deleteDrawing: (id: string) => Promise<void>;
  getDrawing: (id: string) => Drawing | undefined;
}

const DrawingsContext = createContext<DrawingsContextValue>({
  drawings: [],
  ready: false,
  createDrawing: async () => {
    throw new Error("DrawingsContext not ready");
  },
  updateDrawing: async () => {},
  duplicateDrawing: async () => null,
  deleteDrawing: async () => {},
  getDrawing: () => undefined,
});

export const useDrawings = () => useContext(DrawingsContext);

export const DrawingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getDrawings().then((initial) => {
      setDrawings(initial);
      setReady(true);
    });
  }, []);

  const createDrawing = useCallback(
    async (width: PixelSize, height: PixelSize) => {
      const { drawings: updated, drawing } = await createDrawingStorage(
        width,
        height
      );
      setDrawings(updated);
      return drawing;
    },
    []
  );

  const updateDrawing = useCallback(
    async (id: string, pixels: (string | null)[]) => {
      const updated = await updateDrawingStorage(id, pixels);
      setDrawings(updated);
    },
    []
  );

  const duplicateDrawing = useCallback(async (id: string) => {
    const { drawings: updated, drawing } = await duplicateDrawingStorage(id);
    setDrawings(updated);
    return drawing;
  }, []);

  const deleteDrawing = useCallback(async (id: string) => {
    const updated = await deleteDrawingStorage(id);
    setDrawings(updated);
  }, []);

  const getDrawing = useCallback(
    (id: string) => drawings.find((d) => d.id === id),
    [drawings]
  );

  return (
    <DrawingsContext.Provider
      value={{
        drawings,
        ready,
        createDrawing,
        updateDrawing,
        duplicateDrawing,
        deleteDrawing,
        getDrawing,
      }}
    >
      {children}
    </DrawingsContext.Provider>
  );
};
