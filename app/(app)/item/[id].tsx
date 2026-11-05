import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { EditorLoadingSkeleton } from "@/components/editor/EditorLoadingSkeleton";
import { DeleteItemsDialog } from "@/components/items/DeleteItemsDialog";
import { OfflineBanner } from "@/components/inbox/OfflineBanner";
import { EditorOptionsSheet } from "@/components/editor/EditorOptionsSheet";
import { EDITOR_SHEET_COLLAPSED_CONTENT } from "@/components/editor/editorSheetSnaps";
import { AppIcon } from "@/components/ui/AppIcon";
import { useItemEditor } from "@/hooks/useItemEditor";
import { useOnline } from "@/hooks/useOnline";
import {
  itemColorMuted,
  itemColorSheet,
  itemColorSwatch,
  itemColorTint,
  parseItemColor,
} from "@/lib/itemColors";
import {
  font,
  fontSize,
  iconSize,
  lineHeight,
  spacing,
  touchTarget,
} from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";

const TITLE_CHECK_SIZE = 24;
const EDITOR_TITLE_LINE = 30;

export default function EditorScreen() {
  const { id, color: colorParam } = useLocalSearchParams<{
    id: string;
    color?: string | string[];
  }>();
  const { colors, themeName } = useTheme();
  const insets = useSafeAreaInsets();
  const online = useOnline();
  const router = useRouter();
  const {
    item,
    notFound,
    status,
    permissionDenied,
    loadError,
    retryLoad,
    retrySave,
    update,
    convert,
    remove,
  } = useItemEditor(
    id ?? ""
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const collapseSheetRef = useRef<(() => void) | null>(null);

  const sheetPeek = EDITOR_SHEET_COLLAPSED_CONTENT + insets.bottom + spacing.md;
  const routeColor = parseItemColor(
    Array.isArray(colorParam) ? colorParam[0] : colorParam
  );
  // Route color only while loading — once loaded, null means “sem cor”
  // (do not fall back with ?? or cleared color keeps the stale param tint).
  const activeColor = item ? item.color : routeColor;
  const screenTint =
    itemColorTint(activeColor, themeName) ?? colors.background;
  const sheetTone =
    itemColorSheet(activeColor, themeName) ?? colors.surface;
  const mutedText =
    itemColorMuted(activeColor, themeName) ?? colors.textSecondary;
  const backColor = activeColor
    ? itemColorSwatch(activeColor, themeName)
    : colors.brand;

  const collapseSheet = () => {
    collapseSheetRef.current?.();
  };

  useEffect(() => {
    if (notFound) router.back();
  }, [notFound, router]);

  const handleDelete = () => {
    if (!item || !online || deleting) return;
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await remove();
      setConfirmOpen(false);
      router.back();
    } catch {
      setDeleting(false);
    }
  };

  const handleCloseConfirm = () => {
    if (deleting) return;
    setConfirmOpen(false);
  };

  if (notFound) return null;

  if (loadError && !item) {
    return (
      <SafeAreaView
        style={[styles.screen, styles.padded, { backgroundColor: screenTint }]}
      >
        <Text style={{ color: colors.textPrimary }}>Não foi possível carregar</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void retryLoad()}
          style={{ minHeight: touchTarget }}
        >
          <Text style={{ color: colors.brand }}>Tentar novamente</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={{ minHeight: touchTarget }}
        >
          <Text style={{ color: colors.brand }}>Voltar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.screen, { backgroundColor: screenTint }]}
      >
        <EditorHeader backColor={backColor} deleteDisabled onBack={() => router.back()} />
        {!online ? <OfflineBanner /> : null}
        <EditorLoadingSkeleton
          titleHeight={EDITOR_TITLE_LINE}
          contentBottomInset={sheetPeek}
          sheetHeight={EDITOR_SHEET_COLLAPSED_CONTENT + insets.bottom}
          skeletonColor={activeColor ? sheetTone : undefined}
          sheetColor={sheetTone}
          handleColor={activeColor ? itemColorSwatch(activeColor, themeName) : colors.border}
        />
      </SafeAreaView>
    );
  }

  const isTask = item.type === "task";
  const titleColor =
    isTask && item.done ? mutedText : colors.textPrimary;
  const checkAccent = item.color
    ? itemColorSwatch(item.color, themeName)
    : colors.brand;
  const checkEmpty = item.color ? "transparent" : colors.accentSubtle;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.screen, { backgroundColor: screenTint }]}
    >
      <EditorHeader
        backColor={backColor}
        status={status}
        deleteDisabled={!online}
        onBack={() => router.back()}
        onDelete={handleDelete}
      />

      {!online ? <OfflineBanner /> : null}
      {status === "error" ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => void retrySave()}
          style={styles.padded}
        >
          <Text style={{ color: colors.warning }}>Não foi possível salvar. Tentar novamente</Text>
        </Pressable>
      ) : null}

      {/* Edge-to-edge Android no longer resizes the window for the IME. */}
      <KeyboardAvoidingView
        style={[styles.flex, styles.padded]}
        behavior="padding"
        keyboardVerticalOffset={spacing.md}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: sheetPeek }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View style={styles.titleRow}>
            {isTask ? (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel="Feito"
                accessibilityState={{ checked: item.done, disabled: !online }}
                onPress={() => {
                  collapseSheet();
                  update({ done: !item.done });
                }}
                disabled={!online}
                hitSlop={spacing.sm}
                style={[
                  styles.titleCheck,
                  {
                    borderColor: checkAccent,
                    backgroundColor: item.done ? checkAccent : checkEmpty,
                    opacity: online ? 1 : 0.4,
                  },
                ]}
              >
                {item.done ? (
                  <AppIcon name="check" size={iconSize.xs} color={colors.textInverse} />
                ) : null}
              </Pressable>
            ) : null}
            <TextInput
              value={item.title}
              onChangeText={(title) => update({ title })}
              onFocus={collapseSheet}
              editable={online}
              placeholder="Título"
              placeholderTextColor={mutedText}
              style={[
                styles.title,
                {
                  color: titleColor,
                  fontFamily: font.semibold,
                  fontSize: fontSize.editorTitle,
                  lineHeight: EDITOR_TITLE_LINE,
                  textDecorationLine: isTask && item.done ? "line-through" : "none",
                },
              ]}
            />
          </View>

          <TextInput
            value={item.body}
            onChangeText={(body) => update({ body })}
            onFocus={collapseSheet}
            editable={online}
            placeholder={
              isTask ? "Detalhes da tarefa (opcional)…" : "Anote algo…"
            }
            placeholderTextColor={mutedText}
            multiline
            scrollEnabled={false}
            style={[
              styles.body,
              {
                color: colors.textPrimary,
                fontFamily: font.regular,
                fontSize: fontSize.body,
                lineHeight: lineHeight.body,
              },
            ]}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <EditorOptionsSheet
        collapseRef={collapseSheetRef}
        online={online}
        isTask={isTask}
        color={item.color}
        reminder={item.reminder}
        permissionDeniedHint={permissionDenied}
        onConvert={convert}
        onColorChange={(next) => update({ color: next })}
        onReminderChange={(next) => update({ reminder: next })}
      />

      <DeleteItemsDialog
        visible={confirmOpen}
        title={item.type === "note" ? "Excluir esta anotação?" : "Excluir esta tarefa?"}
        busy={deleting}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: spacing.md },
  padded: { paddingHorizontal: spacing.md },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  titleCheck: {
    width: TITLE_CHECK_SIZE,
    height: TITLE_CHECK_SIZE,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: (EDITOR_TITLE_LINE - TITLE_CHECK_SIZE) / 2,
  },
  title: {
    flex: 1,
    padding: 0,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  body: {
    minHeight: 160,
    padding: 0,
    textAlignVertical: "top",
  },
});
