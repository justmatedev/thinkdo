import { View } from "react-native";
import { IconText } from "@/components/ui/IconText";
import { radius, spacing } from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";

export function OfflineBanner() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.dangerSubtle,
        borderRadius: radius.sm,
        padding: spacing.sm,
        alignItems: "center",
      }}
    >
      <IconText icon="wifiOff" label="Sem conexão" color={colors.danger} />
    </View>
  );
}
