import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  font,
  fontSize,
  iconSize,
  lineHeight,
  spacing,
  touchTarget,
} from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";
import { AppIcon } from "@/components/ui/AppIcon";

type Props = {
  title: string;
  onBack: () => void;
  backLabel?: string;
};

export function ScreenHeader({ title, onBack, backLabel = "Voltar" }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        onPress={onBack}
        hitSlop={spacing.sm}
        style={styles.back}
      >
        <AppIcon name="chevronLeft" size={iconSize.md} color={colors.brand} />
      </Pressable>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: touchTarget,
    justifyContent: "center",
    alignItems: "center",
  },
  back: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    minWidth: touchTarget,
    justifyContent: "center",
    zIndex: 1,
  },
  title: {
    fontFamily: font.medium,
    fontSize: fontSize.title,
    lineHeight: lineHeight.title,
    includeFontPadding: false,
    textAlign: "center",
    textAlignVertical: "center",
  },
});
