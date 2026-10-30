import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  type TextInputInstance,
  type ViewStyle,
} from "react-native";
import * as Haptics from "../utils/haptics";
import { THEME } from "../constants/theme";
import { colorNameToHex } from "../utils/colorNames";
import { hexToHsl, hexToRgb } from "../utils/color";
import { useFavorites } from "../context/FavoritesContext";
import { useIsDesktop, useLayoutBox } from "./AppShell";
import {
  enterChrome,
  enterColumnWidth,
  enterFluid,
  enterPaneWidth,
} from "../utils/enterLayout";

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
  const layout = useLayoutBox();
  const windowSize = useWindowDimensions();
  const chrome = enterChrome(Platform.OS, windowSize.width, windowSize.height);
  const previewHex = revealed ? resolvedHex : "";
  const previewRgb = previewHex ? hexToRgb(previewHex) : null;
  const previewHsl = previewHex ? hexToHsl(previewHex) : null;

  if (chrome !== "phone") {
    const wide = chrome === "wide";
    const fluid = enterFluid(layout.width);
    const pane = enterPaneWidth(layout.width, desktop);
    const columnWidth = wide ? enterColumnWidth(pane) : pane;
    const webPointer = (Platform.OS === "web" ? { cursor: "pointer" } : null) as ViewStyle | null;
    const inputFont = mode === "hex" ? fluid.digit : fluid.name;

    return (
      <View testID="enter-web" style={[styles.webRoot, wide && styles.webRootWide]}>
        <View
          testID="enter-form"
          style={[
            styles.webForm,
            {
              width: wide ? columnWidth : "100%",
              paddingHorizontal: fluid.pad,
              paddingTop: desktop ? THEME.desktopPanelTop : fluid.pad,
              paddingBottom: fluid.pad,
              gap: fluid.gap,
            },
          ]}
        >
          <View style={styles.webKickerRow}>
            {!desktop ? (
              <TouchableOpacity onPress={onBack} style={webPointer} accessibilityRole="button">
                <Text style={[styles.webBack, { fontSize: fluid.control }]}>{"<"}</Text>
              </TouchableOpacity>
            ) : null}
            <Text style={[styles.webKicker, { fontSize: fluid.kicker }]}>
              {mode === "hex" ? "ENTER HEX" : "ENTER NAME"}
            </Text>
          </View>

          <View style={styles.webToggleRow}>
            <TouchableOpacity
              style={[styles.webTab, mode === "hex" && styles.webTabActive, webPointer]}
              onPress={() => switchMode("hex")}
              accessibilityRole="button"
            >
              <Text style={[styles.webTabText, { fontSize: fluid.control }, mode === "hex" && styles.webTabTextActive]}>
                HEX
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.webTab, mode === "name" && styles.webTabActive, webPointer]}
              onPress={() => switchMode("name")}
              accessibilityRole="button"
            >
              <Text style={[styles.webTabText, { fontSize: fluid.control }, mode === "name" && styles.webTabTextActive]}>
                NAME
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.webInputRow}>
            <View style={[styles.webField, mode === "name" && styles.webFieldWide]}>
              {mode === "hex" ? (
                <Text style={[styles.webHash, { fontSize: fluid.digit, lineHeight: fluid.digit * 1.5 }]}>#</Text>
              ) : null}
              <TextInput
                ref={inputRef}
                style={[
                  styles.webInput,
                  {
                    fontSize: inputFont,
                    lineHeight: inputFont * 1.5,
                    width: mode === "hex" ? fluid.digit * 6 : "100%",
                    textAlign: mode === "name" ? "center" : "left",
                  },
                ]}
                value={input}
                onChangeText={handleChange}
                maxLength={mode === "hex" ? 6 : 40}
                autoFocus={!desktop}
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
          </View>

          {error ? (
            <Text style={[styles.webError, { fontSize: fluid.meta }]}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.webGo,
              { paddingVertical: fluid.buttonPadV },
              !isValid && styles.webGoDisabled,
              webPointer,
            ]}
            onPress={handleSubmit}
            disabled={!isValid}
            accessibilityRole="button"
          >
            <Text style={[styles.webGoText, { fontSize: fluid.control }, !isValid && styles.webGoTextDisabled]}>
              GO
            </Text>
          </TouchableOpacity>
        </View>

        <View testID="enter-swatch" style={[styles.swatch, { backgroundColor: previewHex || THEME.stage }]}>
          {Platform.OS === "web" ? <View pointerEvents="none" style={styles.scan} /> : null}
          {previewHex ? (
            <View style={[styles.readout, { padding: fluid.pad, gap: fluid.gap }]}>
              <View style={styles.readoutCopy}>
                <Text style={[styles.readoutHex, { fontSize: fluid.readout, lineHeight: fluid.readout * 1.4 }]}>
                  {previewHex}
                </Text>
                {resolvedName ? (
                  <Text style={[styles.readoutName, { fontSize: fluid.meta }]}>{resolvedName}</Text>
                ) : null}
                {previewRgb && previewHsl ? (
                  <Text style={[styles.readoutMeta, { fontSize: fluid.meta, lineHeight: fluid.meta * 1.8 }]}>
                    {`RGB  ${previewRgb.r}  ${previewRgb.g}  ${previewRgb.b}\nHSL  ${previewHsl.h}  ${previewHsl.s}  ${previewHsl.l}`}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={[styles.webSave, { paddingVertical: fluid.buttonPadV * 0.6 }, webPointer]}
                onPress={handleSave}
                accessibilityRole="button"
              >
                <Text style={[styles.webSaveText, { fontSize: fluid.meta }]}>{saved ? "SAVED" : "SAVE"}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View pointerEvents="none" style={styles.standbyWrap}>
              <Text style={[styles.standbyLabel, { fontSize: fluid.standby }]}>STANDBY</Text>
            </View>
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
  webRoot: {
    flex: 1,
    minHeight: 0,
    backgroundColor: THEME.bg,
  },
  webRootWide: {
    flexDirection: "row",
  },
  webForm: {
    flexShrink: 0,
    justifyContent: "flex-start",
  },
  webKickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  webBack: {
    fontFamily: THEME.fontFamily,
    color: THEME.textDim,
  },
  webKicker: {
    fontFamily: THEME.fontFamily,
    color: THEME.textDim,
  },
  webToggleRow: {
    flexDirection: "row",
    gap: 8,
  },
  webTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: THEME.border,
  },
  webTabActive: {
    borderColor: THEME.text,
  },
  webTabText: {
    fontFamily: THEME.fontFamily,
    color: THEME.textDim,
  },
  webTabTextActive: {
    color: THEME.text,
  },
  webInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  webField: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.text,
    borderRadius: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  webFieldWide: {
    width: "100%",
  },
  webHash: {
    fontFamily: THEME.fontFamily,
    color: THEME.textDim,
  },
  webInput: {
    fontFamily: THEME.fontFamily,
    color: THEME.text,
    padding: 0,
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: "transparent",
  },
  webError: {
    fontFamily: THEME.fontFamily,
    color: THEME.danger,
    textAlign: "center",
  },
  webGo: {
    borderWidth: 2,
    borderColor: THEME.text,
    alignItems: "center",
  },
  webGoDisabled: {
    borderColor: THEME.border,
  },
  webGoText: {
    fontFamily: THEME.fontFamily,
    color: THEME.text,
  },
  webGoTextDisabled: {
    color: THEME.border,
  },
  swatch: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    borderWidth: 2,
    borderColor: THEME.textDim,
    position: "relative",
    overflow: "hidden",
  },
  scan: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage:
      "repeating-linear-gradient(to bottom, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 4px)",
  } as ViewStyle,
  standbyWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  standbyLabel: {
    fontFamily: THEME.fontFamily,
    color: THEME.textDim,
  },
  readout: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: THEME.overlay,
  },
  readoutCopy: {
    flex: 1,
    gap: 8,
  },
  readoutHex: {
    fontFamily: THEME.fontFamily,
    color: THEME.textBright,
    textShadowColor: THEME.textBright,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  readoutName: {
    fontFamily: THEME.fontFamily,
    color: THEME.text,
  },
  readoutMeta: {
    fontFamily: THEME.fontFamily,
    color: THEME.textDim,
  },
  webSave: {
    borderWidth: 2,
    borderColor: THEME.text,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  webSaveText: {
    fontFamily: THEME.fontFamily,
    color: THEME.text,
  },
});
