import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  applyReminderRepetition,
  tryCommitReminder,
  withReminderDate,
  withReminderTime,
} from "@/features/reminders/reminderDraft";
import {
  formatReminderDateValue,
  formatReminderTimeValue,
  repetitionLabel,
} from "@/features/reminders/reminderFormatting";
import { toggleReminderWeekday } from "@/features/reminders/reminderModel";
import { font, fontSize, radius, spacing, touchTarget } from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";
import type { ItemReminder } from "@/features/reminders/types";
import { ModalActionRow } from "@/components/ui/ModalActionRow";
import {
  ReminderDateTimePicker,
} from "@/features/reminders/components/ReminderDateTimePicker";
import { ReminderFieldRow } from "@/features/reminders/components/ReminderFieldRow";
import { ReminderWeekdayPicker } from "@/features/reminders/components/ReminderWeekdayPicker";
import {
  shouldDismissReminderEditor,
} from "@/features/reminders/components/reminderEditorInteractions";

export type ReminderEditorSheetProps = {
  visible: boolean;
  initialReminder: ItemReminder;
  /** When false (new reminder), hide Remover — discard via Cancelar. */
  canRemove: boolean;
  onConfirm: (next: ItemReminder) => void;
  onRemove: () => void;
  onClose: () => void;
};

type ActivePicker = "date" | "time" | null;

const REMINDER_KINDS = ["once", "daily", "weekly"] as const;
const REPETITION_OPTIONS = REMINDER_KINDS.map((kind) => ({
  value: kind,
  label: repetitionLabel(kind),
}));

export function ReminderEditorSheet(props: ReminderEditorSheetProps) {
  return props.visible ? <ReminderEditorSession {...props} /> : null;
}

function ReminderEditorSession({
  visible,
  initialReminder,
  canRemove,
  onConfirm,
  onRemove,
  onClose,
}: ReminderEditorSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<ItemReminder>(initialReminder);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const translateY = useSharedValue(0);

  const hour = draft.kind === "once" ? draft.at.getHours() : draft.hour;
  const minute = draft.kind === "once" ? draft.at.getMinutes() : draft.minute;
  const timeValue = new Date();
  timeValue.setHours(hour, minute, 0, 0);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const applyDraft = (next: ItemReminder): boolean => {
    const accepted = tryCommitReminder(next);
    if (!accepted) return false;
    setDraft(accepted);
    return true;
  };

  const handleConfirm = () => {
    const accepted = tryCommitReminder(draft);
    if (!accepted) return;
    onConfirm(accepted);
    onClose();
  };

  const togglePicker = (which: "date" | "time") => {
    setActivePicker((current) => (current === which ? null : which));
  };

  const dismissPan = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .onUpdate((event) => {
      "worklet";
      translateY.set(Math.max(0, event.translationY));
    })
    .onEnd((event) => {
      "worklet";
      if (shouldDismissReminderEditor(event.translationY)) {
        runOnJS(onClose)();
      }
    })
    .onFinalize(() => {
      "worklet";
      translateY.set(withTiming(0, { duration: 180 }));
    });
  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar lembrete"
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              animatedSheetStyle,
              {
                backgroundColor: colors.surface,
                paddingBottom: spacing.md + insets.bottom,
              },
            ]}
          >
            <GestureDetector gesture={dismissPan}>
              <View style={styles.dragHeader}>
                <View style={[styles.handle, { backgroundColor: colors.border }]} />
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  Lembrete
                </Text>
              </View>
            </GestureDetector>

            <View style={styles.repetitionRow}>
              {REPETITION_OPTIONS.map((option) => {
                const active = option.value === draft.kind;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityLabel={`Repetição: ${option.label}`}
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      if (active) return;
                      const next = applyReminderRepetition(draft, option.value);
                      if (option.value !== "once") {
                        setActivePicker((p) => (p === "date" ? null : p));
                      }
                      applyDraft(next);
                    }}
                    style={({ pressed }) => [
                      styles.repetitionPill,
                      {
                        backgroundColor:
                          active || pressed
                            ? colors.accentSubtle
                            : colors.surfaceMuted,
                        borderColor: active
                          ? colors.accentBorder
                          : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.repetitionText,
                        {
                          color: active ? colors.action : colors.textSecondary,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {draft.kind === "once" ? (
              <ReminderFieldRow
                label="Data"
                value={formatReminderDateValue(draft.at)}
                selected={activePicker === "date"}
                onPress={() => togglePicker("date")}
              />
            ) : null}

            {activePicker === "date" && draft.kind === "once" ? (
              <ReminderDateTimePicker
                mode="date"
                value={draft.at}
                visible
                minimumDate={startOfToday}
                onDismiss={() => setActivePicker(null)}
                onChange={(selected) => {
                  applyDraft(withReminderDate(draft, selected));
                }}
              />
            ) : null}

            {draft.kind === "weekly" ? (
              <ReminderWeekdayPicker
                selected={draft.weekdays}
                onToggle={(weekday) =>
                  applyDraft({
                    kind: "weekly",
                    weekdays: toggleReminderWeekday(draft.weekdays, weekday),
                    hour,
                    minute,
                  })
                }
              />
            ) : null}

            <ReminderFieldRow
              label="Hora"
              value={formatReminderTimeValue(hour, minute)}
              selected={activePicker === "time"}
              onPress={() => togglePicker("time")}
            />

            {activePicker === "time" ? (
              <ReminderDateTimePicker
                mode="time"
                value={timeValue}
                visible
                onDismiss={() => setActivePicker(null)}
                onChange={(selected) => {
                  applyDraft(
                    withReminderTime(
                      draft,
                      selected.getHours(),
                      selected.getMinutes()
                    )
                  );
                }}
              />
            ) : null}

            <ModalActionRow
              cancelLabel={canRemove ? "Remover lembrete" : "Cancelar"}
              cancelVariant={canRemove ? "danger" : "default"}
              confirmLabel="Confirmar"
              onCancel={() => {
                if (canRemove) onRemove();
                onClose();
              }}
              onConfirm={handleConfirm}
            />
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  dragHeader: {
    gap: spacing.md,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontFamily: font.semibold,
    fontSize: fontSize.title,
    textAlign: "center",
  },
  repetitionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  repetitionPill: {
    flex: 1,
    minHeight: touchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
  },
  repetitionText: {
    fontFamily: font.medium,
    fontSize: fontSize.body,
  },
});
