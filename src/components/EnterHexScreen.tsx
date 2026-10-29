import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  type TextInputInstance,
} from "react-native";
import * as Haptics from "../utils/haptics";
import { THEME } from "../constants/theme";
import { colorNameToHex } from "../utils/colorNames";
import { hexToHsl, hexToRgb } from "../utils/color";
import { useFavorites } from "../context/FavoritesContext";
import { useIsDesktop } from "./AppShell";

interface EnterHexScreenProps {
  onBack: () => void;
}

const HEX_REGEX = /^[0-9A-F]*$/;
const NAME_REGEX = /^[A-Za-z][A-Za-z0-9 '\-.]*$|^$/;

export const EnterHexScreen: React.FC<EnterHexScreenProps> = ({ onBack }) => {
  const [mode, setMode] = useState<"hex" | "name">("hex");
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [resolvedHex, setResolvedHex] = useState("");
  const [resolvedName, setResolvedName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<TextInputInstance>(null);
  const { toggleFavorite, isFav } = useFavorites();

  const isValid =
    mode === "hex"
      ? input.length === 6 && HEX_REGEX.test(input)
      : input.length > 0;

  const handleChange = (text: string) => {
    setError("");
    if (mode === "hex") {
      const upper = text.toUpperCase();
      if (HEX_REGEX.test(upper)) setInput(upper);
    } else {
      const cleaned = text.replace(/  +/g, " ");
      if (NAME_REGEX.test(cleaned)) setInput(cleaned);
    }
  };

  const handleSubmit = () => {
    if (!isValid) return;
    if (mode === "hex") {
      setResolvedHex(`#${input}`);
      setResolvedName("");
      setRevealed(true);
    } else {
      const hex = colorNameToHex(input);
      if (hex) {
        setResolvedHex(hex);
        setResolvedName(input.trim());
        setRevealed(true);
      } else {
        setError("UNKNOWN COLOR");
      }
    }
  };

  const switchMode = (next: "hex" | "name") => {
    if (next === mode) return;
    setMode(next);
    setInput("");
    setRevealed(false);
    setError("");
    focusTimerRef.current = setTimeout(() => inputRef.current?.focus(), 100);
  };

  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    };
  }, []);

  const handleReset = () => {
    setInput("");
    setRevealed(false);
    setError("");
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    focusTimerRef.current = setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSave = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleFavorite(resolvedHex, resolvedName || undefined);
  };

  const saved = isFav(resolvedHex);
  const desktop = useIsDesktop();
  const previewHex = revealed ? resolvedHex : "";
  const previewRgb = previewHex ? hexToRgb(previewHex) : null;
  const previewHsl = previewHex ? hexToHsl(previewHex) : null;

  const form = (
    <>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleTab, mode === "hex" && styles.toggleTabActive]}
          onPress={() => switchMode("hex")}
        >
          <Text style={[styles.toggleText, mode === "hex" && styles.toggleTextActive]}>HEX</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleTab, mode === "name" && styles.toggleTabActive]}
          onPress={() => switchMode("name")}
        >
          <Text style={[styles.toggleText, mode === "name" && styles.toggleTextActive]}>NAME</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          {mode === "hex" && <Text style={styles.hashPrefix}>#</Text>}
          <TextInput
            ref={inputRef}
            style={[styles.hexInput, mode === "name" && styles.nameInput]}
            value={input}
            onChangeText={handleChange}
            maxLength={mode === "hex" ? 6 : 40}
            autoFocus={false}
            autoCapitalize={mode === "hex" ? "characters" : "none"}
            autoCorrect={false}
            placeholder={mode === "hex" ? "000000" : "enter color name"}
            placeholderTextColor={THEME.border}
            selectionColor={THEME.text}
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
            enterKeyHint="go"
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity
          style={[styles.actionButton, styles.neutralButton, !isValid && styles.actionButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isValid}
        >
          <Text style={[styles.actionButtonText, styles.neutralButtonText, !isValid && styles.actionButtonTextDisabled]}>
            GO
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  if (desktop) {
    return (
      <View style={styles.desktopRoot}>
        <View style={styles.desktopForm}>
          <Text style={styles.desktopKicker}>{mode === "hex" ? "ENTER HEX" : "ENTER NAME"}</Text>
          {form}
        </View>
        <View style={styles.desktopPreview}>
          <View
            style={[
              styles.desktopSwatch,
              { backgroundColor: previewHex || THEME.bgSecondary },
            ]}
          />
          {previewHex ? (
            <>
              <Text style={styles.desktopHex}>{previewHex}</Text>
              {resolvedName ? <Text style={styles.nameLabel}>{resolvedName}</Text> : null}
              {previewRgb && previewHsl ? (
                <View style={styles.desktopReadouts}>
                  <Text style={styles.desktopReadLabel}>RGB</Text>
                  <Text style={styles.desktopReadValue}>
                    {previewRgb.r}  {previewRgb.g}  {previewRgb.b}
                  </Text>
                  <Text style={styles.desktopReadLabel}>HSL</Text>
                  <Text style={styles.desktopReadValue}>
                    {previewHsl.h}  {previewHsl.s}  {previewHsl.l}
                  </Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={[styles.saveButton, styles.neutralButton]}
                onPress={handleSave}
              >
                <Text style={[styles.saveButtonText, styles.neutralButtonText]}>
                  {saved ? "SAVED" : "SAVE"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.standby}>STANDBY</Text>
          )}
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
          {mode === "hex" ? "ENTER HEX" : "ENTER NAME"}
        </Text>
      </View>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleTab, mode === "hex" && styles.toggleTabActive]}
          onPress={() => switchMode("hex")}
        >
          <Text style={[styles.toggleText, mode === "hex" && styles.toggleTextActive]}>HEX</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleTab, mode === "name" && styles.toggleTabActive]}
          onPress={() => switchMode("name")}
        >
          <Text style={[styles.toggleText, mode === "name" && styles.toggleTextActive]}>NAME</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {revealed ? (
          <View style={styles.revealContainer}>
            <View
              style={[styles.colorSwatch, { backgroundColor: resolvedHex }]}
            />
            <Text style={styles.hexLabel}>{resolvedHex}</Text>
            {resolvedName ? (
              <Text style={styles.nameLabel}>{resolvedName}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.saveButton, saved && styles.saveButtonActive]}
              onPress={handleSave}
            >
              <Text
                style={[
                  styles.saveButtonText,
                  saved && styles.saveButtonTextActive,
                ]}
              >
                {saved ? "SAVED" : "SAVE"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleReset}>
              <Text style={styles.actionButtonText}>TRY ANOTHER</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              {mode === "hex" && <Text style={styles.hashPrefix}>#</Text>}
              <TextInput
                ref={inputRef}
                style={[styles.hexInput, mode === "name" && styles.nameInput]}
                value={input}
                onChangeText={handleChange}
                maxLength={mode === "hex" ? 6 : 40}
                autoFocus
                autoCapitalize={mode === "hex" ? "characters" : "none"}
                autoCorrect={false}
                placeholder={mode === "hex" ? "000000" : "enter color name"}
                placeholderTextColor={THEME.border}
                selectionColor={THEME.text}
                onSubmitEditing={handleSubmit}
                returnKeyType="go"
                enterKeyHint="go"
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity
              style={[
                styles.actionButton,
                !isValid && styles.actionButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isValid}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  !isValid && styles.actionButtonTextDisabled,
                ]}
              >
                GO
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
  toggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  toggleTab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: THEME.border,
  },
  toggleTabActive: {
    borderColor: THEME.text,
  },
  toggleText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.textDim,
  },
  toggleTextActive: {
    color: THEME.text,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  inputContainer: {
    alignItems: "center",
    gap: 32,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  hashPrefix: {
    fontFamily: THEME.fontFamily,
    fontSize: 32,
    color: THEME.textDim,
  },
  hexInput: {
    fontFamily: THEME.fontFamily,
    fontSize: 32,
    color: THEME.text,
    minWidth: 200,
    padding: 0,
  },
  nameInput: {
    fontSize: 22,
    minWidth: 0,
    width: "100%",
    textAlign: "center",
  },
  errorText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: "#FF6347",
    marginTop: -16,
  },
  actionButton: {
    borderWidth: 2,
    borderColor: THEME.text,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: "center",
  },
  actionButtonDisabled: {
    borderColor: THEME.border,
  },
  actionButtonText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.text,
  },
  actionButtonTextDisabled: {
    color: THEME.border,
  },
  revealContainer: {
    alignItems: "center",
    gap: 24,
  },
  colorSwatch: {
    width: 180,
    height: 180,
    borderWidth: 2,
    borderColor: THEME.border,
  },
  hexLabel: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeXL,
    color: THEME.text,
  },
  nameLabel: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.textDim,
    marginTop: -12,
  },
  saveButton: {
    borderWidth: 2,
    borderColor: THEME.text,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  saveButtonActive: {
    borderColor: THEME.textBright,
  },
  saveButtonText: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.text,
  },
  saveButtonTextActive: {
    color: THEME.textBright,
  },
  desktopRoot: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: THEME.bg,
  },
  desktopForm: {
    width: 420,
    paddingHorizontal: 36,
    paddingTop: THEME.desktopPanelTop,
    paddingBottom: 32,
    justifyContent: "flex-start",
    borderRightWidth: 1,
    borderRightColor: THEME.border,
    gap: 8,
  },
  desktopKicker: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
    marginBottom: 20,
  },
  desktopPreview: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    paddingTop: THEME.desktopPanelTop,
    paddingHorizontal: 40,
    paddingBottom: 40,
    gap: 20,
  },
  desktopSwatch: {
    width: "100%",
    maxWidth: 420,
    height: 220,
    borderWidth: 2,
    borderColor: THEME.border,
  },
  desktopHex: {
    fontFamily: THEME.fontFamily,
    fontSize: 28,
    color: THEME.textBright,
    textShadowColor: THEME.textBright,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  desktopReadouts: {
    alignItems: "center",
    gap: 8,
  },
  desktopReadLabel: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeSmall,
    color: THEME.textDim,
  },
  desktopReadValue: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.text,
    marginBottom: 8,
  },
  standby: {
    fontFamily: THEME.fontFamily,
    fontSize: THEME.fontSizeMedium,
    color: THEME.textDim,
  },
  neutralButton: {
    borderColor: THEME.border,
  },
  neutralButtonText: {
    color: THEME.textDim,
  },
});
