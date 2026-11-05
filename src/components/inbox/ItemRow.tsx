import { StyleSheet, Text, View } from "react-native";
import Sortable from "react-native-sortables";
import { getItemPreview } from "@/lib/itemContent";
import { itemColorSwatch, itemColorTint } from "@/lib/itemColors";
import { isReminderSchedulable } from "@/features/reminders/reminderModel";
import {
  font,
  fontSize,
  iconSize,
  lineHeight,
  radius,
  spacing,
  touchTarget,
} from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";
import type { Item } from "@/types/item";
import { AppIcon } from "@/components/ui/AppIcon";

const LEAD_SIZE = 24;
const LEAD_BORDER = 2;
const REMINDER_ICON_OPACITY = 0.45;

type Props = {
  item: Item;
  onPress: () => void;
  onToggleDone: (done: boolean) => void;
  selectionMode?: boolean;
  selected?: boolean;
};

export function ItemRow({
  item,
  onPress,
  onToggleDone,
  selectionMode = false,
  selected = false,
}: Props) {
  const { colors, themeName } = useTheme();
  const preview = item.done ? null : getItemPreview(item);
  const isDone = item.type === "task" && item.done;
  const titleColor = isDone ? colors.textSecondary : colors.textPrimary;
  const tint = itemColorTint(item.color, themeName);
  const checkAccent = item.color
    ? itemColorSwatch(item.color, themeName)
    : colors.brand;
  const checkEmpty = item.color ? "transparent" : colors.accentSubtle;
  const hasActiveReminder =
    item.reminder != null && isReminderSchedulable(item.reminder);

  return (
    <View
      style={[
        styles.lift,
        { backgroundColor: tint ?? colors.surface },
        selectionMode && selected
          ? { borderWidth: 2, borderColor: colors.brand }
          : null,
      ]}
    >
      <Sortable.Touchable
        accessibilityRole="button"
        accessibilityLabel={
          hasActiveReminder ? `${item.title}, lembrete ativo` : item.title
        }
        accessibilityHint={
          selectionMode
            ? "Toque para selecionar"
            : "Mantenha pressionado para reordenar"
        }
        onTap={onPress}
        style={[
          styles.row,
          {
            minHeight: preview ? touchTarget + 8 : touchTarget,
          },
        ]}
      >
        {selectionMode ? (
          <View
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            style={[
              styles.lead,
              styles.leadFrame,
              {
                borderColor: colors.brand,
                backgroundColor: selected ? colors.brand : "transparent",
              },
            ]}
          >
            {selected ? (
              <AppIcon
                name="check"
                size={iconSize.xs}
                color={colors.textInverse}
              />
            ) : null}
          </View>
        ) : item.type === "task" ? (
          <Sortable.Touchable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.done }}
            onTap={() => onToggleDone(!item.done)}
            hitSlop={spacing.sm}
            style={[
              styles.lead,
              styles.leadFrame,
              {
                borderColor: checkAccent,
                backgroundColor: item.done ? checkAccent : checkEmpty,
              },
            ]}
          >
            {item.done ? (
              <AppIcon name="check" size={iconSize.xs} color={colors.textInverse} />
            ) : null}
          </Sortable.Touchable>
        ) : null}
        <View style={styles.texts} pointerEvents="none">
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              fontFamily: font.medium,
              fontSize: fontSize.title,
              lineHeight: lineHeight.title,
              color: titleColor,
              textDecorationLine: isDone ? "line-through" : "none",
            }}
          >
            {item.title}
          </Text>
          {preview ? (
            <Text
              numberOfLines={item.type === "note" ? 2 : 1}
              ellipsizeMode="tail"
              style={{
                fontFamily: font.regular,
                fontSize: fontSize.meta,
                lineHeight: lineHeight.meta,
                color: colors.textSecondary,
              }}
            >
              {preview}
            </Text>
          ) : null}
        </View>
        {hasActiveReminder ? (
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.reminderIcon}
          >
            <AppIcon
              name="bell"
              size={iconSize.xs}
              color={colors.textSecondary}
            />
          </View>
        ) : null}
      </Sortable.Touchable>
    </View>
  );
}

const styles = StyleSheet.create({
  lift: {
    borderRadius: radius.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  lead: {
    width: LEAD_SIZE,
    height: LEAD_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  leadFrame: {
    borderRadius: 6,
    borderWidth: LEAD_BORDER,
  },
  texts: { flex: 1, gap: spacing.xs },
  reminderIcon: {
    opacity: REMINDER_ICON_OPACITY,
  },
});
