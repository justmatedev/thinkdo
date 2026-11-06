import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  BackHandler,
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
import { EditorRecoveryDialog } from "@/components/editor/EditorRecoveryDialog";
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
    localPersistence,
    fieldErrors,
    titleHint,
    recoveryDraft,
    recoveryConflicts,
    missing,
    deleting,
    deleteError,
    finishTitleEditing,
    recoverDraft,
    discardDraft,
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
  const [deleteRequested, setDeleteRequested] = useState(false);
  const editable = online && !deleting && !deleteRequested && !recoveryDraft;
  const displayStatus = !online && localPersistence === "saved" && status !== "saved" ? "draft" : status;
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
    if (deleting || deleteRequested) return;
    setDeleteRequested(true);
    try {
      await remove();
      setConfirmOpen(false);
      router.back();
    } catch {
      setDeleteRequested(false);
    }
  };

  const handleCloseConfirm = () => {
    if (deleting || deleteRequested) return;
    setConfirmOpen(false);
  };

  useEffect(() => {
    if (!deleting && !deleteRequested) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => subscription.remove();
  }, [deleting, deleteRequested]);

  const recovery = recoveryDraft ? <EditorRecoveryDialog draft={recoveryDraft}
    missing={missing} hasConflicts={recoveryConflicts.length > 0}
    storageError={localPersistence === "error"} onRecover={recoverDraft}
    onDiscard={discardDraft} onClose={() => router.back()} /> : null;

  if (notFound) return null;
  if (missing) return <SafeAreaView style={[styles.screen, styles.padded, { backgroundColor: colors.background }]}>
    <EditorHeader backColor={backColor} deleteDisabled onBack={() => router.back()} />
    {recovery}
  </SafeAreaView>;

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
        status={displayStatus}
        deleteDisabled={!editable}
        backDisabled={deleting || deleteRequested}
        onBack={() => router.back()}
        onDelete={handleDelete}
      />

      {!online ? <OfflineBanner /> : null}
      {(status === "error" || status === "draft" || localPersistence === "error") && !recoveryDraft ? (
        <Pressable
          accessibilityRole="button"
          disabled={!online || deleting || deleteRequested || Object.keys(fieldErrors).length > 0}
          onPress={() => void retrySave()}
          style={styles.padded}
        >
          <Text style={{ color: colors.warning }}>{localPersistence === "error" ? "Não foi possível guardar o rascunho neste aparelho. Tentar novamente" : status === "draft" ? "Alterações guardadas neste aparelho. Tentar enviar novamente" : "Não foi possível salvar. Tentar novamente"}</Text>
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
                accessibilityState={{ checked: item.done, disabled: !editable }}
                onPress={() => {
                  collapseSheet();
                  update({ done: !item.done });
                }}
                disabled={!editable}
                hitSlop={spacing.sm}
                style={[
                  styles.titleCheck,
                  {
                    borderColor: checkAccent,
                    backgroundColor: item.done ? checkAccent : checkEmpty,
                    opacity: editable ? 1 : 0.4,
                  },
                ]}
              >
                {item.done ? (
                  <AppIcon name="check" size={iconSize.xs} color={colors.textInverse} />
                ) : null}
              </Pressable>
            ) : null}
            <TextInput
              accessibilityLabel="Título"
              value={item.title}
              onBlur={finishTitleEditing}
              onChangeText={(title) => update({ title })}
              onFocus={collapseSheet}
              editable={editable}
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
          {fieldErrors.title ? <Text accessibilityRole="alert" style={{ color: colors.warning }}>{fieldErrors.title}</Text> : null}
          {titleHint ? <Text accessibilityLiveRegion="polite" style={{ color: mutedText }}>{titleHint}</Text> : null}

          <TextInput
            accessibilityLabel={isTask ? "Detalhes da tarefa" : "Texto da anotação"}
            value={item.body}
            onChangeText={(body) => update({ body })}
            onFocus={collapseSheet}
            editable={editable}
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
          {fieldErrors.body ? <Text accessibilityRole="alert" style={{ color: colors.warning }}>{fieldErrors.body}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <EditorOptionsSheet
        collapseRef={collapseSheetRef}
        online={editable}
        isTask={isTask}
        color={item.color}
        reminder={item.reminder}
        reminderPaused={isTask && item.done}
        permissionDeniedHint={permissionDenied}
        onConvert={convert}
        onColorChange={(next) => update({ color: next })}
        onReminderChange={(next) => update({ reminder: next })}
      />

      <DeleteItemsDialog
        visible={confirmOpen}
        title={item.type === "note" ? "Excluir esta anotação?" : "Excluir esta tarefa?"}
        busy={deleting || deleteRequested}
        error={deleteError}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
      />
      {recovery}
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
