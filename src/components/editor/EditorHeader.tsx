import { Pressable, StyleSheet, View } from "react-native";
import { AppIcon } from "@/components/ui/AppIcon";
import { SaveIndicator } from "@/components/editor/SaveIndicator";
import { iconSize, spacing, touchTarget } from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";
import type { SaveStatus } from "@/types/item";

type Props = {
  backColor: string;
  status?: SaveStatus;
  deleteDisabled: boolean;
  backDisabled?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  textHistoryDisabled?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onBack: () => void;
  onDelete?: () => void;
};

export function EditorHeader({
  backColor,
  status,
  deleteDisabled,
  backDisabled = false,
  canUndo = false,
  canRedo = false,
  textHistoryDisabled = false,
  onUndo,
  onRedo,
  onBack,
  onDelete,
}: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        onPress={onBack}
        disabled={backDisabled}
        hitSlop={spacing.sm}
        style={styles.action}
      >
        <AppIcon name="chevronLeft" size={iconSize.md} color={backColor} />
      </Pressable>
      <View style={styles.center} pointerEvents="none">
        {status ? <SaveIndicator status={status} /> : null}
      </View>
      {([
        { name: "undo", label: "Desfazer", available: canUndo, onPress: onUndo },
        { name: "redo", label: "Refazer", available: canRedo, onPress: onRedo },
      ] as const).map(({ name, label, available, onPress }) => {
        const disabled = textHistoryDisabled || !available || !onPress;
        return (
          <Pressable
            key={name}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPress}
            style={[styles.action, { opacity: disabled ? 0.4 : 1 }]}
          >
            <AppIcon name={name} size={iconSize.md} color={colors.textSecondary} />
          </Pressable>
        );
      })}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Excluir"
        onPress={onDelete}
        disabled={deleteDisabled}
        style={[styles.action, { opacity: deleteDisabled ? 0.4 : 1 }]}
      >
        <AppIcon name="trash" size={iconSize.md} color={colors.danger} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: touchTarget,
    marginBottom: spacing.sm,
  },
  action: {
    minWidth: touchTarget,
    minHeight: touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    minWidth: 0,
    minHeight: touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
});
