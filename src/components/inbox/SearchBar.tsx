import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import {
  elevation,
  font,
  fontSize,
  iconSize,
  lineHeight,
  radius,
  spacing,
} from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";
import { AppIcon } from "@/components/ui/AppIcon";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
};

export function SearchBar({ value, onChangeText, onClose }: Props) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <View
      style={[
        styles.bar,
        elevation.capture,
        {
          backgroundColor: colors.surface,
          borderColor: focused ? colors.accentBorder : colors.border,
        },
      ]}
    >
      <View style={styles.leading} accessible={false}>
        <AppIcon name="search" size={iconSize.sm} color={colors.brand} />
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={() => Keyboard.dismiss()}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Buscar…"
        placeholderTextColor={colors.textSecondary}
        returnKeyType="search"
        autoFocus
        accessibilityLabel="Buscar"
        style={[
          styles.input,
          {
            color: colors.textPrimary,
            fontFamily: font.medium,
            fontSize: fontSize.title,
            lineHeight: lineHeight.title,
          },
        ]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar busca"
        onPress={onClose}
        hitSlop={2}
        style={styles.close}
      >
        <AppIcon name="x" size={iconSize.md} color={colors.brand} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  leading: {
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
  },
  input: {
    flex: 1,
    alignSelf: "center",
    paddingVertical: 0,
    margin: 0,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
