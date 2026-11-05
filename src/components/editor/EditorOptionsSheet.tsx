/* eslint-disable react-hooks/immutability -- Reanimated shared values are written via `.value` */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  font,
  fontSize,
  radius,
  spacing,
  touchTarget,
} from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";
import type { ItemColor } from "@/types/item";
import type { ItemReminder } from "@/features/reminders/types";
import { IconText } from "@/components/ui/IconText";
import { ColorSwatchRow } from "@/components/editor/ColorSwatchRow";
import { ReminderSection } from "@/features/reminders/components/ReminderSection";
import {
  clampEditorSheetOpenHeight,
  editorSheetCollapsedHeight,
  resolveContentLayoutHeight,
  shouldDeferSheetOpenForKeyboard,
} from "@/components/editor/editorSheetSnaps";
import { itemColorMuted, itemColorSheet, itemColorSwatch } from "@/lib/itemColors";

const HANDLE_WIDTH = 36;
const HANDLE_HEIGHT = 4;
const SHEET_DURATION = 380;
const KEYBOARD_OPEN_FALLBACK_MS = 400;

function dismissKeyboard() {
  Keyboard.dismiss();
}

function sheetTiming() {
  "worklet";
  return {
    duration: SHEET_DURATION,
    easing: Easing.inOut(Easing.cubic),
  };
}

type Props = {
  online: boolean;
  isTask: boolean;
  color: ItemColor | null;
  reminder: ItemReminder | null;
  permissionDeniedHint?: boolean;
  onConvert: () => void;
  onColorChange: (color: ItemColor | null) => void;
  onReminderChange: (reminder: ItemReminder | null) => void;
  collapseRef?: MutableRefObject<(() => void) | null>;
};

export function EditorOptionsSheet({
  online,
  isTask,
  color,
  reminder,
  permissionDeniedHint = false,
  onConvert,
  onColorChange,
  onReminderChange,
  collapseRef,
}: Props) {
  const { colors, themeName } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const collapsed = editorSheetCollapsedHeight(insets.bottom);
  const sheetBg = itemColorSheet(color, themeName) ?? colors.surface;
  const muted = itemColorMuted(color, themeName) ?? colors.textSecondary;
  const swatchColor = color
    ? itemColorSwatch(color, themeName)
    : colors.action;
  const handleColor = color ? swatchColor : colors.border;

  const height = useSharedValue(collapsed);
  const dragStart = useSharedValue(collapsed);
  const collapsedSV = useSharedValue(collapsed);
  const openSV = useSharedValue(collapsed);
  const [expanded, setExpanded] = useState(false);
  const [openHeight, setOpenHeight] = useState(collapsed);
  const keyboardOpenWaitRef = useRef<{
    remove: () => void;
  } | null>(null);
  const keyboardFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const clearKeyboardOpenWait = useCallback(() => {
    keyboardOpenWaitRef.current?.remove();
    keyboardOpenWaitRef.current = null;
    if (keyboardFallbackRef.current != null) {
      clearTimeout(keyboardFallbackRef.current);
      keyboardFallbackRef.current = null;
    }
  }, []);

  useEffect(() => () => clearKeyboardOpenWait(), [clearKeyboardOpenWait]);

  useEffect(() => {
    collapsedSV.value = collapsed;
    if (!expanded) {
      height.value = collapsed;
    }
  }, [collapsed, collapsedSV, expanded, height]);

  const syncExpanded = useCallback(
    (nextHeight: number) => {
      setExpanded(nextHeight > collapsed + 8);
    },
    [collapsed]
  );

  const runOpenCloseTiming = useCallback(
    (target: number) => {
      height.value = withTiming(target, {
        duration: SHEET_DURATION,
        easing: Easing.inOut(Easing.cubic),
      });
      syncExpanded(target);
    },
    [height, syncExpanded]
  );

  const animateTo = (target: number) => {
    clearKeyboardOpenWait();
    const opening = target > collapsed + 8;

    if (
      shouldDeferSheetOpenForKeyboard(
        opening,
        typeof Keyboard.isVisible === "function" ? Keyboard.isVisible() : false
      )
    ) {
      dismissKeyboard();
      let finished = false;
      const finishOpen = () => {
        if (finished) return;
        finished = true;
        clearKeyboardOpenWait();
        const latest =
          openSV.value > collapsed + 8 ? openSV.value : target;
        runOpenCloseTiming(latest);
      };
      keyboardOpenWaitRef.current = Keyboard.addListener(
        "keyboardDidHide",
        finishOpen
      );
      keyboardFallbackRef.current = setTimeout(
        finishOpen,
        KEYBOARD_OPEN_FALLBACK_MS
      );
      return;
    }

    if (opening) {
      dismissKeyboard();
    }
    runOpenCloseTiming(target);
  };

  const onContentLayout = (e: LayoutChangeEvent) => {
    const measured = e.nativeEvent.layout.height;
    const next = clampEditorSheetOpenHeight(measured, collapsed, windowHeight);
    const resolved = resolveContentLayoutHeight({
      expanded,
      nextOpenHeight: next,
      currentOpenHeight: openHeight,
    });
    setOpenHeight(resolved.openHeight);
    openSV.value = resolved.openHeight;
    if (resolved.sheetHeight != null) {
      // Snap — never restart a full open timing on keyboard/content remeasure.
      height.value = resolved.sheetHeight;
    }
  };

  useEffect(() => {
    if (!collapseRef) return;
    collapseRef.current = () => {
      clearKeyboardOpenWait();
      height.value = withTiming(collapsedSV.value, {
        duration: SHEET_DURATION,
        easing: Easing.inOut(Easing.cubic),
      });
      setExpanded(false);
    };
    return () => {
      collapseRef.current = null;
    };
  }, [collapseRef, clearKeyboardOpenWait, height, collapsedSV]);

  const pan = Gesture.Pan()
    .onBegin(() => {
      "worklet";
      dragStart.value = height.value;
    })
    .onUpdate((e) => {
      "worklet";
      const next = dragStart.value - e.translationY;
      height.value = Math.min(
        openSV.value,
        Math.max(collapsedSV.value, next)
      );
    })
    .onEnd(() => {
      "worklet";
      const midPoint = (collapsedSV.value + openSV.value) / 2;
      const target =
        height.value >= midPoint ? openSV.value : collapsedSV.value;
      if (
        target > collapsedSV.value + 8 &&
        dragStart.value <= collapsedSV.value + 8
      ) {
        runOnJS(dismissKeyboard)();
      }
      height.value = withTiming(target, sheetTiming());
      runOnJS(syncExpanded)(target);
    });

  const sheetStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        styles.sheet,
        sheetStyle,
        {
          backgroundColor: sheetBg,
          shadowColor: colors.textPrimary,
        },
      ]}
    >
      <View onLayout={onContentLayout}>
        <GestureDetector gesture={pan}>
          <Animated.View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={expanded ? "Fechar opções" : "Opções"}
              accessibilityState={{ expanded }}
              onPress={() => {
                animateTo(expanded ? collapsed : openHeight);
              }}
              style={styles.header}
            >
              <View
                style={[styles.handle, { backgroundColor: handleColor }]}
              />
              <Text
                style={{
                  fontFamily: font.medium,
                  fontSize: fontSize.meta,
                color: muted,
              }}
            >
              Opções
            </Text>
          </Pressable>
        </Animated.View>
      </GestureDetector>

        <View
          style={[
            styles.body,
            {
              paddingBottom: spacing.sm + insets.bottom,
              opacity: expanded ? 1 : 0,
            },
          ]}
          pointerEvents={expanded ? "auto" : "none"}
        >
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
              mutedColor={muted}
              accentColor={swatchColor}
              onChange={onReminderChange}
            />
          ) : null}
        </View>
      </View>
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
    minHeight: touchTarget,
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
  body: {
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
