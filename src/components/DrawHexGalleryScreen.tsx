import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import { THEME } from "../constants/theme";
import { useDrawings } from "../context/DrawingsContext";
import { PixelSize } from "../utils/drawings";
import { PixelCanvas } from "./PixelCanvas";

interface DrawHexGalleryScreenProps {
  onBack: () => void;
  onOpenDrawing: (id: string) => void;
}

const SIZE_OPTIONS: PixelSize[] = [16, 32, 64];
const THUMB_PX = 56;

function formatDate(ts: number): string {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export const DrawHexGalleryScreen: React.FC<DrawHexGalleryScreenProps> = ({
  onBack,
  onOpenDrawing,
}) => {
  const { drawings, createDrawing, duplicateDrawing, deleteDrawing } =
    useDrawings();
  const [sizeModalOpen, setSizeModalOpen] = useState(false);

  const handleNew = async (size: PixelSize) => {
    setSizeModalOpen(false);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const drawing = await createDrawing(size, size);
    onOpenDrawing(drawing.id);
  };

  const handleDelete = (id: string) => {
    Alert.alert("DELETE DRAWING?", "This cannot be undone.", [
      { text: "CANCEL", style: "cancel" },
      {
        text: "DELETE",
        style: "destructive",
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await deleteDrawing(id);
        },
      },
    ]);
  };

  const handleDuplicate = async (id: string) => {
    await Haptics.selectionAsync();
    await duplicateDrawing(id);
  };

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

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => setSizeModalOpen(true)}
        >
          <Text style={styles.newButtonText}>+ NEW DRAWING</Text>
        </TouchableOpacity>

        {drawings.length === 0 ? (
          <Text style={styles.emptyText}>NO DRAWINGS YET</Text>
        ) : (
          drawings.map((d, i) => (
            <View key={d.id} style={styles.item}>
              <TouchableOpacity
                style={styles.thumbWrap}
                onPress={() => onOpenDrawing(d.id)}
              >
                <View style={styles.thumbBorder}>
                  <PixelCanvas
                    pixels={d.pixels}
                    width={d.width}
                    height={d.height}
                    canvasSize={THUMB_PX}
                    showCheckerboard
                  />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.itemInfo}
                onPress={() => onOpenDrawing(d.id)}
              >
                <Text style={styles.itemTitle}>
                  DRAWING #{drawings.length - i}
                </Text>
                <Text style={styles.itemMeta}>
                  {d.width}x{d.height} · {formatDate(d.updatedAt)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleDuplicate(d.id)}
              >
                <Text style={styles.iconText}>[+]</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleDelete(d.id)}
              >
                <Text style={styles.iconText}>[X]</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={sizeModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSizeModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>CANVAS SIZE</Text>
            {SIZE_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => handleNew(s)}
                style={styles.sizeButton}
              >
                <Text style={styles.sizeButtonText}>
                  {s} x {s}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setSizeModalOpen(false)}
              style={styles.modalCancel}
            >
              <Text style={styles.modalCancelText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  newButton: {
    borderWidth: 2,
    borderColor: THEME.text,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  newButtonText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.text,
  },
  emptyText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.textDim,
    textAlign: "center",
    marginTop: 40,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    gap: 10,
  },
  thumbWrap: {
    width: THUMB_PX,
    height: THUMB_PX,
  },
  thumbBorder: {
    width: THUMB_PX,
    height: THUMB_PX,
    borderWidth: 1,
    borderColor: THEME.border,
    overflow: "hidden",
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.text,
  },
  itemMeta: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    marginTop: 4,
  },
  iconButton: {
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  iconText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.textDim,
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
    gap: 14,
  },
  modalTitle: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.text,
    textAlign: "center",
  },
  sizeButton: {
    borderWidth: 2,
    borderColor: THEME.border,
    paddingVertical: 14,
    alignItems: "center",
  },
  sizeButtonText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.text,
  },
  modalCancel: {
    paddingVertical: 10,
    alignItems: "center",
  },
  modalCancelText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.textDim,
  },
});
