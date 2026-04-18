import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  useWindowDimensions,
  Alert,
  SafeAreaView,
} from "react-native";
import * as Haptics from "expo-haptics";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { THEME } from "../constants/theme";
import { useDrawings } from "../context/DrawingsContext";
import { useFavorites } from "../context/FavoritesContext";
import { PixelCanvas } from "./PixelCanvas";
import { ColorSpectrum } from "./ColorSpectrum";
import { ToolIcon, IconName } from "./ToolIcon";
import { floodFill } from "../utils/floodFill";
import { exportDrawingAsPng, ExportScale } from "../utils/pixelExport";

interface DrawHexEditorScreenProps {
  drawingId: string;
  onBack: () => void;
}

type Tool = "pencil" | "eraser" | "fill" | "eyedropper";

const TOOLS: { key: Tool; icon: IconName }[] = [
  { key: "pencil", icon: "pencil" },
  { key: "eraser", icon: "eraser" },
  { key: "fill", icon: "fill" },
  { key: "eyedropper", icon: "eyedropper" },
];

const TOOL_ICON_SIZE = 24;

const UNDO_LIMIT = 20;
const AUTOSAVE_MS = 500;
const HEX_REGEX = /^[0-9A-F]{6}$/;
const EXPORT_SCALES: ExportScale[] = [1, 10, 20, 40];

export const DrawHexEditorScreen: React.FC<DrawHexEditorScreenProps> = ({
  drawingId,
  onBack,
}) => {
  const { getDrawing, updateDrawing } = useDrawings();
  const { favorites } = useFavorites();
  const drawing = getDrawing(drawingId);
  const { width: windowWidth } = useWindowDimensions();

  const [pixels, setPixels] = useState<(string | null)[]>(
    drawing?.pixels ?? []
  );
  const [tool, setTool] = useState<Tool>("pencil");
  const [currentColor, setCurrentColor] = useState<string>(
    favorites[0]?.hex ?? "#00FF41"
  );
  const [hexModalOpen, setHexModalOpen] = useState(false);
  const [hexInput, setHexInput] = useState("");
  const [hexError, setHexError] = useState("");
  const [spectrumModalOpen, setSpectrumModalOpen] = useState(false);
  const [spectrumHex, setSpectrumHex] = useState<string>(currentColor);
  const [spectrumHeight, setSpectrumHeight] = useState(0);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>("");
  const undoStackRef = useRef<(string | null)[][]>([]);
  const lastCellRef = useRef<number>(-1);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPixelsRef = useRef<(string | null)[]>(pixels);
  latestPixelsRef.current = pixels;

  // Autosave when pixels change
  useEffect(() => {
    if (!drawing) return;
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => {
      updateDrawing(drawing.id, pixels);
    }, AUTOSAVE_MS);
    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
    };
  }, [pixels, drawing, updateDrawing]);

  // Flush on unmount
  useEffect(() => {
    const id = drawing?.id;
    return () => {
      if (id) updateDrawing(id, latestPixelsRef.current);
    };
  }, [drawing?.id, updateDrawing]);

  const canvasSize = Math.min(windowWidth - 32, 360);

  const pushUndo = useCallback((snapshot: (string | null)[]) => {
    undoStackRef.current.push(snapshot);
    if (undoStackRef.current.length > UNDO_LIMIT) {
      undoStackRef.current.shift();
    }
  }, []);

  const applyAtCell = useCallback(
    (idx: number) => {
      if (!drawing) return;
      if (idx < 0 || idx >= pixels.length) return;
      if (tool === "eyedropper") {
        const picked = pixels[idx];
        if (picked) {
          setCurrentColor(picked);
          Haptics.selectionAsync();
        }
        setTool("pencil");
        return;
      }

      if (tool === "fill") {
        pushUndo(pixels);
        const filled = floodFill(
          pixels,
          drawing.width,
          drawing.height,
          idx,
          currentColor
        );
        setPixels(filled);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      }

      // pencil / eraser: during drag, only push undo once at start
      const nextColor = tool === "eraser" ? null : currentColor;
      if (pixels[idx] === nextColor) return;

      if (lastCellRef.current === -1) pushUndo(pixels);
      lastCellRef.current = idx;

      setPixels((prev) => {
        if (prev[idx] === nextColor) return prev;
        const copy = prev.slice();
        copy[idx] = nextColor;
        return copy;
      });
    },
    [drawing, pixels, tool, currentColor, pushUndo]
  );

  const idxFromPoint = useCallback(
    (x: number, y: number) => {
      if (!drawing) return -1;
      const cell = canvasSize / drawing.width;
      const cx = Math.floor(x / cell);
      const cy = Math.floor(y / cell);
      if (cx < 0 || cx >= drawing.width || cy < 0 || cy >= drawing.height)
        return -1;
      return cy * drawing.width + cx;
    },
    [drawing, canvasSize]
  );

  const handleGesturePoint = useCallback(
    (x: number, y: number) => {
      const idx = idxFromPoint(x, y);
      if (idx === -1) return;
      applyAtCell(idx);
    },
    [applyAtCell, idxFromPoint]
  );

  const handleGestureEnd = useCallback(() => {
    lastCellRef.current = -1;
  }, []);

  const gesture = useMemo(() => {
    const tap = Gesture.Tap().onStart((e) => {
      runOnJS(handleGesturePoint)(e.x, e.y);
      runOnJS(handleGestureEnd)();
    });
    const pan = Gesture.Pan()
      .minDistance(0)
      .onStart((e) => {
        runOnJS(handleGesturePoint)(e.x, e.y);
      })
      .onUpdate((e) => {
        runOnJS(handleGesturePoint)(e.x, e.y);
      })
      .onEnd(() => {
        runOnJS(handleGestureEnd)();
      })
      .onFinalize(() => {
        runOnJS(handleGestureEnd)();
      });
    return Gesture.Exclusive(pan, tap);
  }, [handleGesturePoint, handleGestureEnd]);

  const handleUndo = useCallback(() => {
    const prev = undoStackRef.current.pop();
    if (prev) {
      setPixels(prev);
      Haptics.selectionAsync();
    }
  }, []);

  const handleClear = useCallback(() => {
    if (!drawing) return;
    Alert.alert(
      "CLEAR CANVAS?",
      "This erases all pixels. You can undo.",
      [
        { text: "CANCEL", style: "cancel" },
        {
          text: "CLEAR",
          style: "destructive",
          onPress: () => {
            pushUndo(pixels);
            setPixels(new Array(drawing.width * drawing.height).fill(null));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]
    );
  }, [drawing, pixels, pushUndo]);

  const openHexModal = useCallback(() => {
    setHexInput(currentColor.replace("#", ""));
    setHexError("");
    setHexModalOpen(true);
  }, [currentColor]);

  const submitHex = useCallback(() => {
    const up = hexInput.toUpperCase();
    if (HEX_REGEX.test(up)) {
      setCurrentColor(`#${up}`);
      setHexModalOpen(false);
    } else {
      setHexError("INVALID HEX");
    }
  }, [hexInput]);

  const handleExport = useCallback(
    async (scale: ExportScale) => {
      if (!drawing) return;
      setExportBusy(true);
      setExportStatus("SAVING...");
      try {
        const result = await exportDrawingAsPng(
          { ...drawing, pixels },
          scale
        );
        setExportStatus(
          `SAVED ${result.width}x${result.height} TO PHOTOS`
        );
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "permission-denied") {
          setExportStatus("PHOTOS ACCESS DENIED");
        } else {
          setExportStatus("EXPORT FAILED");
        }
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setExportBusy(false);
      }
    },
    [drawing, pixels]
  );

  if (!drawing) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={onBack} style={styles.backButtonContainer}>
              <Text style={styles.backButton}>{"<"}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>HEX</Text>
            <View style={styles.backButtonSpacer} />
          </View>
          <Text style={styles.subtitle}>DRAW HEX</Text>
        </View>
        <View style={styles.missingContainer}>
          <Text style={styles.missingText}>DRAWING NOT FOUND</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={onBack} style={styles.backButtonContainer}>
            <Text style={styles.backButton}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>HEX</Text>
          <View style={styles.backButtonSpacer} />
        </View>
        <Text style={styles.subtitle}>
          DRAW HEX · {drawing.width}x{drawing.height}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Canvas */}
        <View style={[styles.canvasWrapper, { width: canvasSize, height: canvasSize }]}>
          <GestureDetector gesture={gesture}>
            <View style={{ width: canvasSize, height: canvasSize }}>
              <PixelCanvas
                pixels={pixels}
                width={drawing.width}
                height={drawing.height}
                canvasSize={canvasSize}
                showCheckerboard
                showGrid
              />
            </View>
          </GestureDetector>
        </View>

        {/* Tools */}
        <View style={styles.toolRow}>
          {TOOLS.map((t) => {
            const active = tool === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setTool(t.key)}
                style={[styles.toolButton, active && styles.toolButtonActive]}
              >
                <ToolIcon
                  name={t.icon}
                  size={TOOL_ICON_SIZE}
                  color={active ? THEME.text : THEME.textDim}
                />
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity onPress={handleUndo} style={styles.toolButton}>
            <ToolIcon name="undo" size={TOOL_ICON_SIZE} color={THEME.textDim} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClear} style={styles.toolButton}>
            <ToolIcon name="clear" size={TOOL_ICON_SIZE} color={THEME.textDim} />
          </TouchableOpacity>
        </View>

        {/* Current color + hex input */}
        <View style={styles.colorRow}>
          <TouchableOpacity
            style={[styles.currentSwatch, { backgroundColor: currentColor }]}
            onPress={() => {
              setSpectrumHex(currentColor);
              setSpectrumModalOpen(true);
            }}
          />
          <TouchableOpacity onPress={openHexModal} style={styles.currentHexButton}>
            <Text style={styles.currentHexText}>{currentColor}</Text>
          </TouchableOpacity>
        </View>

        {/* Favorites palette */}
        <View style={styles.paletteSection}>
          <Text style={styles.paletteLabel}>MY HEX</Text>
          {favorites.length === 0 ? (
            <Text style={styles.paletteEmpty}>NO SAVED COLORS YET</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.paletteRow}
            >
              {favorites.map((fav) => {
                const selected =
                  fav.hex.toUpperCase() === currentColor.toUpperCase();
                return (
                  <TouchableOpacity
                    key={fav.hex}
                    onPress={() => {
                      setCurrentColor(fav.hex);
                      Haptics.selectionAsync();
                    }}
                    style={[
                      styles.paletteSwatch,
                      { backgroundColor: fav.hex },
                      selected && styles.paletteSwatchSelected,
                    ]}
                  />
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Export */}
        <TouchableOpacity
          onPress={() => {
            setExportStatus("");
            setExportModalOpen(true);
          }}
          style={styles.exportButton}
        >
          <Text style={styles.exportButtonText}>EXPORT PNG</Text>
        </TouchableOpacity>
        {exportStatus ? (
          <Text style={styles.exportStatus}>{exportStatus}</Text>
        ) : null}
      </ScrollView>

      {/* Hex input modal */}
      <Modal
        visible={hexModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setHexModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>ENTER HEX</Text>
            <View style={styles.hexInputRow}>
              <Text style={styles.hexHash}>#</Text>
              <TextInput
                autoFocus
                value={hexInput}
                onChangeText={(t) => {
                  setHexError("");
                  setHexInput(t.toUpperCase().replace(/[^0-9A-F]/g, "").slice(0, 6));
                }}
                style={styles.hexInput}
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
                onSubmitEditing={submitHex}
                selectionColor={THEME.text}
                placeholder="000000"
                placeholderTextColor={THEME.border}
              />
            </View>
            {hexError ? <Text style={styles.modalError}>{hexError}</Text> : null}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                onPress={() => setHexModalOpen(false)}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitHex} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Export scale modal */}
      <Modal
        visible={exportModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !exportBusy && setExportModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>EXPORT SCALE</Text>
            <Text style={styles.modalHint}>
              {drawing.width}x{drawing.height} PIXELS
            </Text>
            {EXPORT_SCALES.map((s) => (
              <TouchableOpacity
                key={s}
                disabled={exportBusy}
                onPress={async () => {
                  await handleExport(s);
                  setExportModalOpen(false);
                }}
                style={[styles.scaleButton, exportBusy && styles.scaleButtonDisabled]}
              >
                <Text style={styles.scaleButtonText}>
                  {s}x · {drawing.width * s}x{drawing.height * s}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              disabled={exportBusy}
              onPress={() => setExportModalOpen(false)}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>
                {exportBusy ? "..." : "CANCEL"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Spectrum picker modal */}
      <Modal
        visible={spectrumModalOpen}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setSpectrumModalOpen(false)}
      >
        <SafeAreaView style={styles.spectrumModalRoot}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <TouchableOpacity
                onPress={() => setSpectrumModalOpen(false)}
                style={styles.backButtonContainer}
              >
                <Text style={styles.backButton}>{"<"}</Text>
              </TouchableOpacity>
              <Text style={styles.title}>HEX</Text>
              <View style={styles.backButtonSpacer} />
            </View>
            <Text style={styles.subtitle}>PICK A COLOR</Text>
          </View>

          <View
            style={styles.spectrumContainer}
            onLayout={(e) => setSpectrumHeight(e.nativeEvent.layout.height)}
          >
            {spectrumModalOpen && spectrumHeight > 0 && (
              <ColorSpectrum
                height={spectrumHeight}
                onColorChange={(hex) => setSpectrumHex(hex)}
              />
            )}
          </View>

          <View style={styles.spectrumFooter}>
            <View style={styles.spectrumPreviewRow}>
              <View
                style={[
                  styles.spectrumPreviewSwatch,
                  { backgroundColor: spectrumHex },
                ]}
              />
              <Text style={styles.spectrumPreviewHex}>{spectrumHex}</Text>
            </View>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                onPress={() => setSpectrumModalOpen(false)}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setCurrentColor(spectrumHex);
                  setSpectrumModalOpen(false);
                  Haptics.selectionAsync();
                }}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>DONE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonContainer: {
    width: 40,
  },
  backButtonSpacer: {
    width: 40,
  },
  backButton: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeXL,
    color: THEME.textDim,
  },
  title: {
    flex: 1,
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeXL,
    color: "#ffffff",
    textShadowColor: "#ffffff",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    marginTop: 4,
    textAlign: "center",
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  canvasWrapper: {
    borderWidth: 2,
    borderColor: THEME.border,
    marginTop: 8,
    marginBottom: 16,
    overflow: "hidden",
  },
  toolRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginBottom: 16,
  },
  toolButton: {
    borderWidth: 2,
    borderColor: THEME.border,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  toolButtonActive: {
    borderColor: THEME.text,
  },
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  currentSwatch: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: THEME.border,
  },
  currentHexButton: {
    borderWidth: 2,
    borderColor: THEME.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  currentHexText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.text,
  },
  paletteSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  paletteLabel: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    marginBottom: 6,
  },
  paletteEmpty: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.border,
  },
  paletteRow: {
    gap: 8,
    paddingHorizontal: 8,
  },
  paletteSwatch: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderColor: THEME.border,
  },
  paletteSwatchSelected: {
    borderColor: THEME.text,
  },
  exportButton: {
    borderWidth: 2,
    borderColor: THEME.text,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 4,
  },
  exportButtonText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.text,
  },
  exportStatus: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    marginTop: 10,
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalBox: {
    backgroundColor: THEME.bg,
    borderWidth: 2,
    borderColor: THEME.border,
    padding: 20,
    width: "100%",
    maxWidth: 340,
    gap: 16,
  },
  modalTitle: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.text,
    textAlign: "center",
  },
  modalHint: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    textAlign: "center",
    marginTop: -8,
  },
  hexInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  hexHash: {
    fontFamily: THEME.fontFamily,
    fontSize: 24,
    color: THEME.textDim,
    marginRight: 4,
  },
  hexInput: {
    fontFamily: THEME.fontFamily,
    fontSize: 24,
    color: THEME.text,
    minWidth: 140,
    padding: 0,
  },
  modalError: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: "#FF6347",
    textAlign: "center",
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: THEME.border,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalButtonText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.text,
  },
  scaleButton: {
    borderWidth: 2,
    borderColor: THEME.border,
    paddingVertical: 12,
    alignItems: "center",
  },
  scaleButtonDisabled: {
    opacity: 0.5,
  },
  scaleButtonText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.text,
  },
  missingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  missingText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.textDim,
  },
  spectrumModalRoot: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  spectrumContainer: {
    flex: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  spectrumFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  spectrumPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  spectrumPreviewSwatch: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: THEME.border,
  },
  spectrumPreviewHex: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeLarge,
    color: THEME.text,
  },
});
