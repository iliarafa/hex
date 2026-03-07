import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { THEME } from "../constants/theme";

interface EnterHexScreenProps {
  onBack: () => void;
}

const HEX_REGEX = /^[0-9A-F]*$/;

export const EnterHexScreen: React.FC<EnterHexScreenProps> = ({ onBack }) => {
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const isValid = input.length === 6 && HEX_REGEX.test(input);
  const hexColor = `#${input}`;

  const handleChange = (text: string) => {
    const upper = text.toUpperCase();
    if (HEX_REGEX.test(upper)) {
      setInput(upper);
    }
  };

  const handleSubmit = () => {
    if (isValid) setRevealed(true);
  };

  const handleReset = () => {
    setInput("");
    setRevealed(false);
    setTimeout(() => inputRef.current?.focus(), 100);
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
        <Text style={styles.subtitle}>ENTER HEX</Text>
      </View>

      <View style={styles.content}>
        {revealed ? (
          <View style={styles.revealContainer}>
            <View style={[styles.colorSwatch, { backgroundColor: hexColor }]} />
            <Text style={styles.hexLabel}>{hexColor}</Text>
            <TouchableOpacity style={styles.actionButton} onPress={handleReset}>
              <Text style={styles.actionButtonText}>TRY ANOTHER</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <Text style={styles.hashPrefix}>#</Text>
              <TextInput
                ref={inputRef}
                style={styles.hexInput}
                value={input}
                onChangeText={handleChange}
                maxLength={6}
                autoFocus
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="000000"
                placeholderTextColor={THEME.border}
                selectionColor={THEME.text}
              />
            </View>
            <TouchableOpacity
              style={[styles.actionButton, !isValid && styles.actionButtonDisabled]}
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
});
