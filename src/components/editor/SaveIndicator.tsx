import { StyleSheet, Text } from "react-native";
import { font, fontSize, lineHeight } from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";
import type { SaveStatus } from "@/types/item";

const LABELS: Record<SaveStatus, string> = {
  saved: "Salvo",
  saving: "Salvando…",
  error: "Não salvo",
};

export function SaveIndicator({ status }: { status: SaveStatus }) {
  const { colors } = useTheme();
  const color =
    status === "error"
      ? colors.warning
      : status === "saving"
        ? colors.textSecondary
        : colors.success;

  return (
    <Text style={[styles.label, { color }]}>{LABELS[status]}</Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: font.regular,
    fontSize: fontSize.meta,
    lineHeight: lineHeight.meta,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});
