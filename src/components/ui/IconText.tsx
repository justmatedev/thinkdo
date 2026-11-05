import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import {
  font,
  fontSize,
  iconSize as iconSizes,
  lineHeight,
  spacing,
} from "@/lib/theme";
import { AppIcon, type AppIconName } from "@/components/ui/AppIcon";

type TextVariant = "meta" | "body" | "title";

const VARIANT_METRICS: Record<
  TextVariant,
  { fontSize: number; lineHeight: number; iconSize: number }
> = {
  meta: { fontSize: fontSize.meta, lineHeight: lineHeight.meta, iconSize: iconSizes.sm },
  body: { fontSize: fontSize.body, lineHeight: lineHeight.body, iconSize: iconSizes.sm },
  title: { fontSize: fontSize.title, lineHeight: lineHeight.title, iconSize: iconSizes.md },
};

type Props = {
  icon: AppIconName;
  label: string;
  color: string;
  variant?: TextVariant;
  iconSize?: number;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
};

export function IconText({
  icon,
  label,
  color,
  variant = "meta",
  iconSize: iconSizeOverride,
  textStyle,
  style,
}: Props) {
  const metrics = VARIANT_METRICS[variant];
  const resolvedIconSize = iconSizeOverride ?? metrics.iconSize;
  const textLineHeight = metrics.lineHeight;

  return (
    <View style={[styles.row, style]}>
      <View
        style={[
          styles.iconSlot,
          { height: textLineHeight, width: resolvedIconSize },
        ]}
      >
        <AppIcon name={icon} color={color} size={resolvedIconSize} />
      </View>
      <Text
        style={[
          styles.label,
          {
            color,
            fontSize: metrics.fontSize,
            lineHeight: textLineHeight,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  iconSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: font.medium,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});
