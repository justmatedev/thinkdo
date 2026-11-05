import { ScrollView, StyleSheet, View } from "react-native";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";
import { lineHeight, spacing } from "@/lib/theme";

type Props = {
  titleHeight: number;
  contentBottomInset: number;
  sheetHeight: number;
  skeletonColor?: string;
  sheetColor: string;
  handleColor: string;
};

export function EditorLoadingSkeleton({
  titleHeight,
  contentBottomInset,
  sheetHeight,
  skeletonColor,
  sheetColor,
  handleColor,
}: Props) {
  return (
    <>
      <View style={styles.body}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: contentBottomInset }]}
          scrollEnabled={false}
        >
          <SkeletonBlock width="55%" height={titleHeight} color={skeletonColor} />
          <SkeletonBlock width="100%" height={lineHeight.body * 3} color={skeletonColor} />
        </ScrollView>
      </View>
      <View
        pointerEvents="none"
        style={[styles.sheet, { backgroundColor: sheetColor, height: sheetHeight }]}
      >
        <View style={[styles.handle, { backgroundColor: handleColor }]} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { flex: 1, paddingHorizontal: spacing.md },
  content: { flexGrow: 1, gap: spacing.md, paddingTop: spacing.sm },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: "center",
    paddingTop: spacing.sm,
  },
  handle: { width: 36, height: 4, borderRadius: 2 },
});
