import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { font, fontSize, radius, spacing, touchTarget } from "@/lib/theme";
import type { AuthPalette } from "@/features/auth/authPalette";

type PrimaryButtonProps = {
  label: string;
  busyLabel: string;
  busy: boolean;
  onPress: () => void;
  palette: AuthPalette;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  label,
  busyLabel,
  busy,
  onPress,
  palette,
  disabled = false,
  style,
}: PrimaryButtonProps) {
  const inactive = busy || disabled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={busy ? busyLabel : label}
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed
            ? palette.primaryPressed
            : palette.primaryBackground,
          opacity: inactive ? 0.65 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.label, { color: palette.primaryText }]}>
        {busy ? busyLabel : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "stretch",
    minHeight: touchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  label: {
    fontFamily: font.medium,
    fontSize: fontSize.body,
  },
});
