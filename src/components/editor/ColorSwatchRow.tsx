import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  ITEM_COLORS,
  itemColorLabel,
  itemColorCheck,
  itemColorSwatch,
} from "@/lib/itemColors";
import { touchTarget } from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";
import type { ItemColor } from "@/types/item";
import { AppIcon } from "@/components/ui/AppIcon";

const SWATCH_SIZE = 22;
const RING = 2;

type Props = {
  value: ItemColor | null;
  disabled?: boolean;
  onChange: (color: ItemColor | null) => void;
  /** Ring around the selected swatch (avoid brand purple on tinted sheets) */
  selectionColor?: string;
};

export function ColorSwatchRow({
  value,
  disabled,
  onChange,
  selectionColor,
}: Props) {
  const { colors, themeName } = useTheme();
  const ring = selectionColor ?? colors.textPrimary;
  const noneSelected = value === null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      style={{ height: touchTarget, flexGrow: 0, opacity: disabled ? 0.4 : 1 }}
      contentContainerStyle={styles.row} keyboardShouldPersistTaps="handled">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sem cor"
        accessibilityState={{ selected: noneSelected, disabled: !!disabled }}
        disabled={disabled}
        onPress={() => onChange(null)}
        style={styles.hit}
      >
        <View
          style={[
            styles.swatch,
            styles.noneSwatch,
            {
              borderColor: noneSelected ? ring : colors.border,
              backgroundColor: colors.surfaceMuted,
            },
          ]}
        >
          <AppIcon
            name="circleOff"
            size={14}
            color={noneSelected ? ring : colors.textSecondary}
          />
        </View>
      </Pressable>
      {ITEM_COLORS.map((key) => {
        const selected = value === key;
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={itemColorLabel(key)}
            accessibilityState={{ selected, disabled: !!disabled }}
            disabled={disabled}
            onPress={() => onChange(key)}
            style={styles.hit}
          >
            <View
              style={[
                styles.swatch,
                {
                  backgroundColor: itemColorSwatch(key, themeName),
                  borderWidth: RING,
                  borderColor: selected ? ring : "transparent",
                },
              ]}
            >
              {selected ? <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <AppIcon name="check" size={12} color={itemColorCheck(key, themeName)} />
              </View> : null}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    minHeight: touchTarget,
  },
  hit: {
    width: touchTarget,
    height: touchTarget,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  noneSwatch: {
    borderWidth: RING,
    alignItems: "center",
    justifyContent: "center",
  },
});
