import { Pressable, StyleSheet, View } from "react-native";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { UserAvatar } from "@/components/brand/UserAvatar";
import { AppIcon } from "@/components/ui/AppIcon";
import type { AvatarPresentation } from "@/features/auth/avatarPresentation";
import { iconSize, spacing, touchTarget } from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";

type Props = {
  avatar: AvatarPresentation;
  searchMode: boolean;
  onToggleSearch: () => void;
  onSettings: () => void;
};

export function InboxHeader({
  avatar,
  searchMode,
  onToggleSearch,
  onSettings,
}: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      <BrandLogo height={28} />
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={searchMode ? "Fechar busca" : "Buscar"}
          onPress={onToggleSearch}
          hitSlop={spacing.sm}
          style={styles.button}
        >
          <AppIcon name="search" size={iconSize.md} color={colors.brand} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Configurações"
          onPress={onSettings}
          hitSlop={spacing.sm}
          style={styles.button}
        >
          <UserAvatar uri={avatar.uri} initial={avatar.initial} size={32} accessible={false} />
        </Pressable>
      </View>
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
  actions: { flexDirection: "row", alignItems: "center" },
  button: {
    minWidth: touchTarget,
    minHeight: touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
});
