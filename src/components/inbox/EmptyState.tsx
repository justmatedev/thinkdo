import { Text, View } from "react-native";
import { font, fontSize, spacing } from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";
import {
  emptyStateMessage,
  type EmptyStateVariant,
} from "@/components/inbox/emptyStateCopy";

type Props = { variant?: EmptyStateVariant };

export function EmptyState({ variant = "inbox" }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: "center", padding: spacing.xl }}>
      <Text
        style={{
          fontFamily: font.regular,
          fontSize: fontSize.meta,
          color: colors.textSecondary,
        }}
      >
        {emptyStateMessage(variant)}
      </Text>
    </View>
  );
}
