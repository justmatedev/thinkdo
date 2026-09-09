import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";
import { useTheme } from "../../lib/themeContext";

export type ReminderDateTimePickerProps = {
  mode: "date" | "time";
  value: Date;
  visible: boolean;
  minimumDate?: Date;
  onChange: (next: Date) => void;
  onDismiss: () => void;
};

export function ReminderDateTimePicker({
  mode,
  value,
  visible,
  minimumDate,
  onChange,
  onDismiss,
}: ReminderDateTimePickerProps) {
  const { colors, themeName } = useTheme();

  if (!visible) return null;

  return (
    <DateTimePicker
      value={value}
      mode={mode}
      display={Platform.OS === "ios" ? "spinner" : "default"}
      is24Hour
      locale="pt-BR"
      minimumDate={minimumDate}
      themeVariant={themeName}
      accentColor={colors.brand}
      positiveButton={{ textColor: colors.brand }}
      negativeButton={{ textColor: colors.brand }}
      onValueChange={(_event, selected) => {
        onChange(selected);
        if (Platform.OS === "android") onDismiss();
      }}
      onDismiss={onDismiss}
    />
  );
}
