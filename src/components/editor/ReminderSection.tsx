import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import {
  defaultReminderDraft,
  formatReminderOptionsPrimary,
  repetitionLabel,
} from "../../lib/reminderHelpers";
import {
  font,
  fontSize,
  iconSize,
  radius,
  spacing,
  touchTarget,
} from "../../lib/theme";
import { useTheme } from "../../lib/themeContext";
import type { ItemReminder } from "../../types/item";
import { AppIcon } from "../ui/AppIcon";
import { ReminderEditorSheet } from "./ReminderEditorSheet";

type Props = {
  reminder: ItemReminder | null;
  online: boolean;
  permissionDeniedHint?: boolean;
  mutedColor: string;
  accentColor: string;
  onChange: (next: ItemReminder | null) => void;
};

type EditorSession = {
  initial: ItemReminder;
  canRemove: boolean;
};

export function ReminderSection({
  reminder,
  online,
  permissionDeniedHint = false,
  mutedColor,
  accentColor,
  onChange,
}: Props) {
  const { colors } = useTheme();
  const [editor, setEditor] = useState<EditorSession | null>(null);
  const disabled = !online;

  const addReminder = () => {
    setEditor({ initial: defaultReminderDraft(), canRemove: false });
  };

  const editReminder = () => {
    if (!reminder) return;
    setEditor({ initial: reminder, canRemove: true });
  };

  const closeEditor = () => setEditor(null);

  return (
    <View style={styles.section}>
      <Text
        style={{
          fontFamily: font.medium,
          fontSize: fontSize.meta,
          color: mutedColor,
        }}
      >
        Lembrete
      </Text>

      {!reminder ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adicionar lembrete"
          disabled={disabled}
          onPress={addReminder}
          style={({ pressed }) => [
            styles.row,
            {
              borderColor: mutedColor,
              backgroundColor: pressed ? colors.surfaceMuted : "transparent",
              opacity: disabled ? 0.4 : 1,
            },
          ]}
        >
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
            Adicionar lembrete
          </Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Editar lembrete"
          disabled={disabled}
          onPress={editReminder}
          style={({ pressed }) => [
            styles.summaryRow,
            {
              borderColor: mutedColor,
              backgroundColor: pressed ? colors.surfaceMuted : "transparent",
              opacity: disabled ? 0.4 : 1,
            },
          ]}
        >
          <View style={styles.iconBadge}>
            <AppIcon name="bell" color={accentColor} size={iconSize.sm} />
          </View>
          <View style={styles.summaryText}>
            <Text style={[styles.primary, { color: colors.textPrimary }]}>
              {formatReminderOptionsPrimary(reminder)}
            </Text>
            <Text style={[styles.sub, { color: mutedColor }]}>
              {repetitionLabel(reminder.kind)}
            </Text>
          </View>
          <AppIcon
            name="chevronRight"
            color={mutedColor}
            size={iconSize.md}
          />
        </Pressable>
      )}

      {permissionDeniedHint ? (
        <Pressable
          onPress={() => void Linking.openSettings()}
          accessibilityRole="link"
        >
          <Text style={{ color: mutedColor, fontSize: fontSize.meta }}>
            Notificações desativadas. Toque para abrir as configurações.
          </Text>
        </Pressable>
      ) : null}

      {editor ? (
        <ReminderEditorSheet
          visible
          initialReminder={editor.initial}
          canRemove={editor.canRemove}
          onConfirm={(next) => {
            onChange(next);
          }}
          onRemove={() => {
            onChange(null);
          }}
          onClose={closeEditor}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.xs,
  },
  row: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  rowLabel: {
    fontFamily: font.medium,
    fontSize: fontSize.body,
  },
  summaryRow: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryText: {
    flex: 1,
    gap: 2,
  },
  primary: {
    fontFamily: font.semibold,
    fontSize: fontSize.body,
  },
  sub: {
    fontFamily: font.medium,
    fontSize: fontSize.meta,
  },
});
