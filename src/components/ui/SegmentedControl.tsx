import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  font,
  fontSize,
  iconSize,
  radius,
  spacing,
  touchTarget,
} from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";
import { AppIcon, type AppIconName } from "@/components/ui/AppIcon";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: AppIconName;
};

type Props<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentOption<T>[];
  activeLabelColor?: "brand" | "action";
  accessibilityLabelPrefix?: string;
};

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  activeLabelColor = "brand",
  accessibilityLabelPrefix,
}: Props<T>) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.border,
        },
      ]}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const tone = active ? colors[activeLabelColor] : colors.textSecondary;
        const a11yLabel = accessibilityLabelPrefix
          ? `${accessibilityLabelPrefix} ${opt.label}`
          : opt.label;

        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={a11yLabel}
            onPress={() => onChange(opt.value)}
            style={[
              styles.segment,
              active && {
                backgroundColor: colors.surface,
                borderColor: colors.accentBorder,
              },
            ]}
          >
            {opt.icon ? (
              <AppIcon name={opt.icon} size={iconSize.sm} color={tone} />
            ) : null}
            <Text
              style={{
                fontFamily: active ? font.medium : font.regular,
                fontSize: fontSize.meta,
                color: tone,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: touchTarget - 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
});
