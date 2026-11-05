import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { font, fontSize, radius, spacing } from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";

type Props = {
  visible: boolean;
  title: string;
  children?: ReactNode;
  actions: ReactNode;
  onClose: () => void;
};

export function AppModal({
  visible,
  title,
  children,
  actions,
  onClose,
}: Props) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {title}
          </Text>
          {children ? <View>{children}</View> : null}
          <View>{actions}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontFamily: font.semibold,
    fontSize: fontSize.title,
  },
});
