import { useRef, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { iconSize, radius, spacing } from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";
import { AppIcon } from "@/components/ui/AppIcon";

type Props = {
  enabled: boolean;
  onRequestDelete: () => void;
  children: ReactNode;
};

export function SwipeDeleteRow({ enabled, onRequestDelete, children }: Props) {
  const { colors } = useTheme();
  const ref = useRef<Swipeable>(null);
  if (!enabled) return <>{children}</>;

  return (
    <Swipeable
      ref={ref}
      overshootRight={false}
      friction={2}
      activeOffsetX={[-10, 10]}
      failOffsetY={[-15, 15]}
      renderRightActions={() => (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Excluir"
            onPress={() => {
              ref.current?.close();
              onRequestDelete();
            }}
            style={[styles.delete, { backgroundColor: colors.danger }]}
          >
            <AppIcon name="trash" size={iconSize.md} color={colors.textInverse} />
          </Pressable>
        </View>
      )}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row" },
  delete: {
    justifyContent: "center",
    alignItems: "center",
    width: 72,
    borderRadius: radius.md,
    marginLeft: spacing.sm,
  },
});
