import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import * as Haptics from "../utils/haptics";
import { THEME } from "../constants/theme";
import { useFavorites } from "../context/FavoritesContext";
import { useIsDesktop } from "./AppShell";

interface FavoritesScreenProps {
  onBack: () => void;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ onBack }) => {
  const { favorites, toggleFavorite } = useFavorites();
  const desktop = useIsDesktop();

  const handleRemove = async (hex: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleFavorite(hex);
  };

  return (
    <View style={styles.root}>
      {!desktop && <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={onBack} style={styles.backButtonContainer}>
            <Text style={styles.backButton}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>HEX</Text>
          <View style={styles.backButtonSpacer} />
        </View>
        <Text style={styles.subtitle}>LIBRARY</Text>
      </View>}

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>NO SAVED COLORS</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={[styles.listContent, desktop && styles.grid]}
        >
          {favorites.map((fav) => (
            <View key={fav.hex} style={[styles.item, desktop && styles.card]}>
              <View
                style={[styles.swatch, desktop && styles.cardSwatch, { backgroundColor: fav.hex }]}
              />
              <View style={[styles.itemInfo, desktop && styles.cardInfo]}>
                <Text style={styles.itemHex}>{fav.hex}</Text>
                {fav.name ? (
                  <Text style={styles.itemName}>{fav.name}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemove(fav.hex)}
              >
                <Text style={styles.removeText}>[X]</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
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
    textAlign: "center",
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.textDim,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  swatch: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: THEME.border,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 16,
  },
  itemHex: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeLarge,
    color: THEME.text,
  },
  itemName: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
  },
  removeText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.textDim,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    padding: 28,
  },
  card: {
    width: 220,
    flexDirection: "column",
    alignItems: "flex-start",
    borderWidth: 1,
    borderBottomWidth: 1,
    borderColor: THEME.border,
    padding: 12,
    gap: 12,
  },
  cardSwatch: {
    width: "100%",
    height: 96,
    marginLeft: 0,
  },
  cardInfo: {
    marginLeft: 0,
    width: "100%",
  },
});
