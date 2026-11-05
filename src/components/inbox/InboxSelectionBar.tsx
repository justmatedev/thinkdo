import { Pressable, StyleSheet, Text, View } from "react-native";
import { selectionCountLabel } from "@/lib/inboxSelection";
import { font, fontSize, spacing, touchTarget } from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";

type Props = {
  count: number;
  online: boolean;
  deleting: boolean;
  onCancel: () => void;
  onDelete: () => void;
};

export function InboxSelectionBar({
  count,
  online,
  deleting,
  onCancel,
  onDelete,
}: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cancelar"
        onPress={onCancel}
        hitSlop={spacing.sm}
        style={styles.textButton}
      >
        <Text style={[styles.action, { color: colors.brand }]}>Cancelar</Text>
      </Pressable>
      <Text style={[styles.count, { color: colors.textPrimary }]} numberOfLines={1}>
        {selectionCountLabel(count)}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Excluir"
        disabled={!online || count === 0 || deleting}
        onPress={onDelete}
        hitSlop={spacing.sm}
        style={styles.textButton}
      >
        <Text
          style={[
            styles.action,
            {
              color:
                !online || count === 0 ? colors.textSecondary : colors.danger,
            },
          ]}
        >
          Excluir
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 44,
  },
  textButton: { minHeight: touchTarget, justifyContent: "center" },
  action: { fontFamily: font.medium, fontSize: fontSize.body },
  count: {
    fontFamily: font.medium,
    fontSize: fontSize.meta,
    flex: 1,
    textAlign: "center",
    paddingHorizontal: spacing.sm,
  },
});
