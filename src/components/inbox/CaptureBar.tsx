import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { normalizeTitle } from "@/lib/itemContent";
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
import type { ItemType } from "@/types/item";
import { AppIcon } from "@/components/ui/AppIcon";

type Props = {
  onSubmit: (type: ItemType, title: string) => Promise<boolean>;
  disabled: boolean;
  autoFocus?: boolean;
  /** Bumps on each widget open so focus runs even when autoFocus stays true. */
  focusEpoch?: number;
};

export function CaptureBar({ onSubmit, disabled: externalDisabled, autoFocus, focusEpoch }: Props) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const disabled = externalDisabled || busy;
  const [text, setText] = useState("");
  const [type, setType] = useState<ItemType>("note");
  const [focused, setFocused] = useState(false);

  // RN autoFocus only runs on mount; widget re-opens need focusEpoch or autoFocus flips.
  useEffect(() => {
    if (disabled) return;
    const fromEpoch = focusEpoch !== undefined && focusEpoch > 0;
    if (!autoFocus && !fromEpoch) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [autoFocus, disabled, focusEpoch]);

  const submit = async () => {
    const title = normalizeTitle(text);
    if (!title || disabled || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    try {
      if (await onSubmit(type, title)) setText("");
    } catch {
      // Preserve the draft even if a caller unexpectedly rejects.
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={type === "note" ? "Mudar para tarefa" : "Mudar para nota"}
        onPress={() => setType(type === "note" ? "task" : "note")}
        disabled={disabled}
        hitSlop={spacing.sm}
        style={styles.typeToggle}
      >
        <AppIcon
          name={type === "note" ? "note" : "task"}
          size={iconSize.sm}
          color={colors.brand}
        />
      </Pressable>
      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        onSubmitEditing={submit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={type === "note" ? "Anote algo…" : "Adicione uma tarefa…"}
        placeholderTextColor={colors.textSecondary}
        editable={!disabled}
        returnKeyType="done"
        autoFocus={autoFocus}
        style={[
          styles.input,
          {
            color: colors.textPrimary,
            fontFamily: font.medium,
            fontSize: fontSize.title,
            lineHeight: lineHeight.title,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Adicionar"
        onPress={submit}
        disabled={disabled}
        hitSlop={2}
        style={({ pressed }) => [
          styles.submit,
          {
            backgroundColor: pressed ? colors.actionPressed : colors.action,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <AppIcon name="plus" size={iconSize.md} color={colors.textInverse} />
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
  typeToggle: {
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
  submit: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
