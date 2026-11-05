import { StyleSheet, View } from "react-native";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";
import { INBOX_SKELETON_WIDTHS } from "@/components/inbox/inboxSkeletonPresentation";
import { lineHeight, spacing, touchTarget } from "@/lib/theme";

export function InboxLoadingSkeleton() {
  return (
    <View style={styles.list} accessibilityLabel="Carregando">
      {INBOX_SKELETON_WIDTHS.map((width) => (
        <View key={width} style={styles.row}>
          <SkeletonBlock width={width} height={lineHeight.title} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: { minHeight: touchTarget, justifyContent: "center" },
});
