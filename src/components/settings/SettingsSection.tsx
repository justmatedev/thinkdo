import { type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { font, fontSize, radius, spacing } from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";

type Props = {
  title: string;
  children: ReactNode;
  /** `inline` = título + conteúdo no fundo da tela (sem card surface). */
  variant?: "card" | "inline";
};

export function SettingsSection({
  title,
  children,
  variant = "card",
}: Props) {
  const { colors } = useTheme();
  const titleStyle = {
    fontFamily: font.medium,
    fontSize: fontSize.meta,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  };

  if (variant === "inline") {
    return (
      <View style={styles.wrap}>
        <Text style={titleStyle}>{title}</Text>
        {children}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={titleStyle}>{title}</Text>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 0 },
});
