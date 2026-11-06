/* eslint-disable react-hooks/immutability -- Reanimated shared values are written via `.value` */
import { useCallback, useEffect, useMemo, useState, type MutableRefObject } from "react";
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { font, fontSize, radius, spacing, touchTarget } from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";
import type { ItemColor } from "@/types/item";
import type { ItemReminder } from "@/features/reminders/types";
import { IconText } from "@/components/ui/IconText";
import { ColorSwatchRow } from "@/components/editor/ColorSwatchRow";
import { ReminderSection } from "@/features/reminders/components/ReminderSection";
import { EDITOR_SHEET_COLLAPSED_CONTENT, clampEditorSheetOpenHeight, editorSheetCollapsedHeight } from "@/components/editor/editorSheetSnaps";
import { createSheetTransitionCoordinator } from "@/components/editor/sheetTransitionCoordinator";
import { itemColorMuted, itemColorSheet, itemColorSwatch } from "@/lib/itemColors";

const HANDLE_WIDTH = 36;
const HANDLE_HEIGHT = 4;
const SHEET_DURATION = 380;

type Props = {
  online: boolean;
  isTask: boolean;
  color: ItemColor | null;
  reminder: ItemReminder | null;
  permissionDeniedHint?: boolean;
  reminderPaused?: boolean;
  onConvert: () => void;
  onColorChange: (color: ItemColor | null) => void;
  onReminderChange: (reminder: ItemReminder | null) => void;
  collapseRef?: MutableRefObject<(() => void) | null>;
  onCollapsedHeightChange?: (height: number) => void;
};

export function EditorOptionsSheet({ online, isTask, color, reminder, permissionDeniedHint = false,
  reminderPaused = false, onConvert, onColorChange, onReminderChange, collapseRef, onCollapsedHeightChange }: Props) {
  const { colors, themeName } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [headerHeight, setHeaderHeight] = useState(EDITOR_SHEET_COLLAPSED_CONTENT);
  const [contentHeight, setContentHeight] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const collapsed = editorSheetCollapsedHeight(insets.bottom, headerHeight);
  const openHeight = clampEditorSheetOpenHeight(headerHeight + contentHeight + insets.bottom, collapsed, windowHeight, insets.top);
  const sheetBg = itemColorSheet(color, themeName) ?? colors.surface;
  const muted = itemColorMuted(color, themeName) ?? colors.textSecondary;
  const swatchColor = color ? itemColorSwatch(color, themeName) : colors.action;
  const handleColor = color ? swatchColor : colors.border;

  const height = useSharedValue(collapsed);
  const collapsedSV = useSharedValue(collapsed);
  const openSV = useSharedValue(openHeight);
  const expandedSV = useSharedValue(false);
  const dragStart = useSharedValue(collapsed);
  const dragKeyboard = useSharedValue(false);
  const dragging = useSharedValue(false);
  const keyboardVisible = useSharedValue(Keyboard.isVisible());

  const transition = useCallback((opening: boolean) => {
    expandedSV.value = opening;
    height.value = withTiming(opening ? openSV.value : collapsedSV.value, {
      duration: SHEET_DURATION, easing: Easing.inOut(Easing.cubic),
    });
    setExpanded(opening);
  }, [height, openSV, collapsedSV, expandedSV]);
  const coordinator = useMemo(() => createSheetTransitionCoordinator({
    isKeyboardVisible: () => Keyboard.isVisible(),
    subscribeHidden: (callback) => {
      const subscription = Keyboard.addListener("keyboardDidHide", callback);
      return () => subscription.remove();
    },
    dismiss: () => Keyboard.dismiss(),
    transition,
  }), [transition]);

  useEffect(() => {
    coordinator.activate();
    return () => coordinator.dispose();
  }, [coordinator]);
  useEffect(() => {
    keyboardVisible.value = Keyboard.isVisible();
    const shown = Keyboard.addListener("keyboardDidShow", () => { keyboardVisible.value = true; });
    const hidden = Keyboard.addListener("keyboardDidHide", () => { keyboardVisible.value = false; });
    return () => { shown.remove(); hidden.remove(); };
  }, [keyboardVisible]);
  useEffect(() => {
    collapsedSV.value = collapsed;
    openSV.value = openHeight;
    // Intrinsic content/viewport changes snap to the new size, without restarting animation.
    height.value = expandedSV.value ? openHeight : collapsed;
  }, [collapsed, openHeight, collapsedSV, openSV, height, expandedSV]);
  useEffect(() => { onCollapsedHeightChange?.(collapsed); }, [collapsed, onCollapsedHeightChange]);
  useEffect(() => {
    if (!collapseRef) return;
    collapseRef.current = () => coordinator.request(false);
    return () => { collapseRef.current = null; };
  }, [collapseRef, coordinator]);

  const requestTransition = coordinator.request;
  const pan = Gesture.Pan()
    .onStart(() => {
      "worklet";
      dragging.value = true;
      dragStart.value = height.value;
      dragKeyboard.value = keyboardVisible.value;
    })
    .onUpdate((event) => {
      "worklet";
      // A drag with the keyboard open only requests opening on release.
      if (dragKeyboard.value) return;
      height.value = Math.min(openSV.value, Math.max(collapsedSV.value, dragStart.value - event.translationY));
    })
    .onEnd((event) => {
      "worklet";
      const candidate = Math.min(openSV.value, Math.max(collapsedSV.value, dragStart.value - event.translationY));
      const opening = candidate >= (collapsedSV.value + openSV.value) / 2;
      dragging.value = false;
      runOnJS(requestTransition)(opening);
    })
    .onFinalize((_event, success) => {
      "worklet";
      if (!success && dragging.value) {
        dragging.value = false;
        runOnJS(requestTransition)(expandedSV.value);
      }
    });
  const sheetStyle = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <Animated.View testID="editor-options-sheet" style={[styles.sheet, sheetStyle, { backgroundColor: sheetBg, shadowColor: colors.textPrimary }]}>
      <GestureDetector gesture={pan}>
        <Animated.View style={{ flexShrink: 0 }}>
          <Pressable testID="editor-options-header" accessibilityRole="button"
            accessibilityLabel={expanded ? "Fechar opções" : "Abrir opções"}
            accessibilityState={{ expanded }}
            onLayout={(event) => setHeaderHeight(Math.max(EDITOR_SHEET_COLLAPSED_CONTENT, Math.ceil(event.nativeEvent.layout.height)))}
            onPress={() => coordinator.request(!(expanded || coordinator.isOpening()))}
            style={styles.header}>
            <View style={[styles.handle, { backgroundColor: handleColor }]} />
            <Text style={{ fontFamily: font.medium, fontSize: fontSize.meta, color: muted }}>Opções</Text>
          </Pressable>
        </Animated.View>
      </GestureDetector>
      <ScrollView style={[styles.scroll, { opacity: expanded ? 1 : 0 }]} contentContainerStyle={styles.body}
        onContentSizeChange={(_width, nextHeight) => setContentHeight(Math.ceil(nextHeight))}
        scrollEnabled={expanded} pointerEvents={expanded ? "auto" : "none"}
        accessibilityElementsHidden={!expanded} importantForAccessibility={expanded ? "auto" : "no-hide-descendants"}
        keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="never">
          <View style={styles.section}>
            <Text
              style={{
                fontFamily: font.medium,
                fontSize: fontSize.meta,
                color: muted,
              }}
            >
              Tipo
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isTask
                  ? "Converter tarefa em nota"
                  : "Converter nota em tarefa"
              }
              onPress={onConvert}
              disabled={!online}
              style={({ pressed }) => [
                styles.convertButton,
                {
                  borderColor: muted,
                  backgroundColor: pressed
                    ? colors.surfaceMuted
                    : "transparent",
                  opacity: online ? 1 : 0.4,
                },
              ]}
            >
              <IconText
                icon={isTask ? "note" : "task"}
                label={
                  isTask ? "Converter em nota" : "Converter em tarefa"
                }
                color={colors.textPrimary}
                variant="body"
              />
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text
              style={{
                fontFamily: font.medium,
                fontSize: fontSize.meta,
                color: muted,
              }}
            >
              Cor
            </Text>
            <ColorSwatchRow
              value={color}
              disabled={!online}
              onChange={onColorChange}
              selectionColor={colors.textPrimary}
            />
          </View>

          {Platform.OS !== "web" ? (
            <ReminderSection
              reminder={reminder}
              online={online}
              permissionDeniedHint={permissionDeniedHint}
              paused={reminderPaused}
              mutedColor={muted}
              accentColor={swatchColor}
              onChange={onReminderChange}
            />
          ) : null}
      </ScrollView>
      <View testID="editor-options-footer" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        pointerEvents="none" style={[styles.footer, { height: insets.bottom }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: "hidden",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    minHeight: EDITOR_SHEET_COLLAPSED_CONTENT,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  handle: {
    width: HANDLE_WIDTH,
    height: HANDLE_HEIGHT,
    borderRadius: HANDLE_HEIGHT / 2,
  },
  scroll: { flex: 1, minHeight: 0 },
  footer: { flexShrink: 0 },
  body: {
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  section: {
    gap: spacing.xs,
  },
  convertButton: {
    minHeight: touchTarget,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
  },
});
