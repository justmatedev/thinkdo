import { Pressable, StyleSheet, Text, View } from "react-native";
import { weekdayFullLabelPt } from "../../lib/reminderHelpers";
import { font, fontSize, radius, spacing, touchTarget } from "../../lib/theme";
import { useTheme } from "../../lib/themeContext";
import type { ReminderWeekday } from "../../types/item";

const WEEKDAYS: ReminderWeekday[] = [1, 2, 3, 4, 5, 6, 7];

type Props = {
  selected: ReminderWeekday[];
  onToggle: (weekday: ReminderWeekday) => void;
};

function capitalizePt(label: string): string {
  if (!label) return label;
  return label.charAt(0).toLocaleUpperCase("pt-BR") + label.slice(1);
}

export function ReminderWeekdayPicker({ selected, onToggle }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.root}>
      {WEEKDAYS.map((weekday) => {
        const active = selected.includes(weekday);
        const label = capitalizePt(weekdayFullLabelPt(weekday));
        return (
          <Pressable
            key={weekday}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
            onPress={() => onToggle(weekday)}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor:
                  active || pressed
                    ? colors.accentSubtle
                    : colors.surfaceMuted,
                borderColor: active ? colors.accentBorder : colors.border,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: font.medium,
                fontSize: fontSize.body,
                color: active ? colors.action : colors.textPrimary,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  row: {
    minHeight: touchTarget,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
});
