import { Pressable, StyleSheet, Text } from "react-native";
import { font, fontSize, radius, spacing, touchTarget } from "../../lib/theme";
import { useTheme } from "../../lib/themeContext";

export type ReminderFieldRowProps = {
  label: string;
  value: string;
  selected?: boolean;
  onPress: () => void;
};

export function ReminderFieldRow({
  label,
  value,
  selected = false,
  onPress,
}: ReminderFieldRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor:
            selected || pressed ? colors.accentSubtle : colors.surfaceMuted,
          borderColor: selected ? colors.accentBorder : colors.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  label: {
    fontFamily: font.medium,
    fontSize: fontSize.meta,
  },
  value: {
    fontFamily: font.medium,
    fontSize: fontSize.body,
  },
});
