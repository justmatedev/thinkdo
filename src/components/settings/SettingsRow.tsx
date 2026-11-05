import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { font, fontSize, spacing, touchTarget } from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";

type Props = {
  label: string;
  trailing?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
  accessibilityLabel?: string;
};

export function SettingsRow({
  label,
  trailing,
  onPress,
  danger,
  accessibilityLabel,
}: Props) {
  const { colors } = useTheme();
  const labelColor = danger ? colors.danger : colors.textPrimary;
  const content = (
    <View style={styles.row}>
      <Text
        style={{
          fontFamily: font.regular,
          fontSize: fontSize.body,
          color: labelColor,
          flex: 1,
        }}
      >
        {label}
      </Text>
      {trailing}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          pressed && { opacity: 0.7 },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.pressable}>{content}</View>;
}

const styles = StyleSheet.create({
  pressable: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: touchTarget,
  },
});
