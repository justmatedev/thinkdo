import * as Haptics from "expo-haptics";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
  type Href,
} from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BackHandler, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import Sortable from "react-native-sortables";
import { SafeAreaView } from "react-native-safe-area-context";
import { InboxHeader } from "@/components/inbox/InboxHeader";
import { InboxSelectionBar } from "@/components/inbox/InboxSelectionBar";
import { InboxLoadingSkeleton } from "@/components/inbox/InboxLoadingSkeleton";
import { DeleteItemsDialog } from "@/components/items/DeleteItemsDialog";
import { useInboxDeletion } from "@/hooks/useInboxDeletion";
import { CaptureBar } from "@/components/inbox/CaptureBar";
import { EmptyState } from "@/components/inbox/EmptyState";
import { InboxFilter } from "@/components/inbox/InboxFilter";
import { ItemRow } from "@/components/inbox/ItemRow";
import { OfflineBanner } from "@/components/inbox/OfflineBanner";
import { SearchBar } from "@/components/inbox/SearchBar";
import { SwipeDeleteRow } from "@/components/inbox/SwipeDeleteRow";
import { inboxEmptyVariant } from "@/components/inbox/emptyStateCopy";
import { useAuth } from "@/features/auth/AuthProvider";
import { getAvatarPresentation } from "@/features/auth/avatarPresentation";
import { useInboxSelection } from "@/hooks/useInboxSelection";
import { useItems } from "@/hooks/useItems";
import { useOnline } from "@/hooks/useOnline";
import { useWidgetCaptureFocus } from "@/hooks/useWidgetCaptureFocus";
import { itemMatchesQuery } from "@/lib/inboxSearch";
import { shouldEnterSelectionFromDrag } from "@/lib/inboxSelection";
import {
  parseInboxWidgetParams,
  shouldDismissAfterWidgetCapture,
  shouldDismissOnInboxBack,
} from "@/lib/inboxWidgetEntry";
import { font, spacing } from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";
import type { InboxFilter as Filter, Item, ItemType } from "@/types/item";
import { dismissToLauncher } from "@/widgets/dismissToLauncher";

function sameItemIds(a: Item[], b: Item[]): boolean {
  return a.length === b.length && a.every((item, i) => item.id === b[i]?.id);
}

export default function InboxScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const {
    items,
    loading,
    error,
    saveError,
    create,
    toggleDone,
    reorder,
    remove,
    removeMany,
  } = useItems();
  const online = useOnline();
  const router = useRouter();
  const params = useLocalSearchParams();
  const entry = parseInboxWidgetParams(
    params as Record<string, string | string[] | undefined>
  );
  const {
    mode: selectionMode,
    selectedIds,
    selectedSet,
    enter: enterSelection,
    toggle: toggleSelection,
    clear: clearSelection,
    prune: pruneSelection,
    removeIds: removeSelectionIds,
  } = useInboxSelection();
  const {
    confirmOpen,
    confirmTitle,
    deleting,
    requestDelete,
    requestDeleteSelected,
    confirmDelete,
    closeConfirm,
    resetConfirm,
  } = useInboxDeletion({
    online,
    items,
    selectedIds,
    remove,
    removeMany,
    clearSelection,
    removeSelectionIds,
  });
  const [fromWidget, setFromWidget] = useState(entry.fromWidget);
  const [prevFromWidgetParam, setPrevFromWidgetParam] = useState(
    entry.fromWidget
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [searchMode, setSearchMode] = useState(false);
  const [query, setQuery] = useState("");
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  const onWidgetCaptureOpen = useCallback(() => {
    clearSelection();
    resetConfirm();
    setFromWidget(true);
    setSearchMode(false);
    setQuery("");
  }, [clearSelection, resetConfirm]);

  const { focusEpoch, autoFocus: captureAutoFocus } = useWidgetCaptureFocus({
    entry,
    loading,
    onWidgetCaptureOpen,
  });

  if (entry.fromWidget !== prevFromWidgetParam) {
    setPrevFromWidgetParam(entry.fromWidget);
    if (entry.fromWidget) setFromWidget(true);
  }
  if (selectionMode && searchMode) {
    setSearchMode(false);
    setQuery("");
  }
  if (entry.focusCapture && !loading && searchMode) {
    setSearchMode(false);
    setQuery("");
  }

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (searchMode) {
        setSearchMode(false);
        setQuery("");
        return true;
      }
      if (!shouldDismissOnInboxBack(fromWidget)) return false;
      dismissToLauncher();
      return true;
    });
    return () => sub.remove();
  }, [fromWidget, searchMode]);

  const clearWidgetMode = useCallback(() => setFromWidget(false), []);

  const exitSearch = useCallback(() => {
    setSearchMode(false);
    setQuery("");
  }, []);

  const avatar = getAvatarPresentation({
    photoURL: user?.photoURL ?? null,
    displayName: user?.displayName ?? null,
    email: user?.email ?? null,
  });

  const visible = useMemo(() => {
    const byType =
      filter === "notes"
        ? items.filter((i) => i.type === "note")
        : filter === "tasks"
          ? items.filter((i) => i.type === "task")
          : items;
    if (!searchMode) return byType;
    return byType.filter((i) => itemMatchesQuery(i, query));
  }, [items, filter, searchMode, query]);

  const [listDataHold, setListDataHold] = useState<Item[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const listData = listDataHold ?? visible;

  if (!isDragging && listDataHold && sameItemIds(visible, listDataHold)) {
    setListDataHold(null);
  } else if (
    !isDragging &&
    listDataHold &&
    visible.length !== listDataHold.length
  ) {
    setListDataHold(null);
  }

  useEffect(() => {
    pruneSelection(visible.map((i) => i.id));
  }, [visible, pruneSelection]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        clearSelection();
        resetConfirm();
      };
    }, [clearSelection, resetConfirm])
  );

  const handleCapture = async (type: ItemType, title: string) => {
    const saved = await create(type, title);
    if (saved && shouldDismissAfterWidgetCapture(fromWidget)) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      dismissToLauncher();
    }
    return saved;
  };

  const handleToggleDone = useCallback(
    async (itemId: string, done: boolean) => {
      if (!online) return;
      await toggleDone(itemId, done);
    },
    [online, toggleDone]
  );

  const handleFilterChange = useCallback(
    (next: Filter) => {
      clearSelection();
      setFilter(next);
    },
    [clearSelection]
  );

  const openItem = useCallback(
    (item: Item) => {
      clearWidgetMode();
      router.push({
        pathname: "/item/[id]",
        params: {
          id: item.id,
          ...(item.color ? { color: item.color } : {}),
        },
      } as Href);
    },
    [router, clearWidgetMode]
  );

  const renderItem = useCallback(
    ({ item }: { item: Item }) => (
      <SwipeDeleteRow
        enabled={online && !selectionMode}
        onRequestDelete={() => requestDelete(item.id)}
      >
        <ItemRow
          item={item}
          selectionMode={selectionMode}
          selected={selectedSet.has(item.id)}
          onPress={() => {
            if (selectionMode) toggleSelection(item.id);
            else openItem(item);
          }}
          onToggleDone={(done) => handleToggleDone(item.id, done)}
        />
      </SwipeDeleteRow>
    ),
    [
      handleToggleDone,
      requestDelete,
      online,
      openItem,
      selectionMode,
      selectedSet,
      toggleSelection,
    ]
  );

  const handleDragEnd = useCallback(
    async ({
      data,
      fromIndex,
      toIndex,
    }: {
      data: Item[];
      fromIndex: number;
      toIndex: number;
    }) => {
      setIsDragging(false);
      setListDataHold(data);
      if (shouldEnterSelectionFromDrag(fromIndex, toIndex)) {
        const held = data[fromIndex];
        if (held) enterSelection(held.id);
        return;
      }
      if (!online) {
        setListDataHold(null);
        return;
      }
      const moved = data[toIndex];
      if (!moved) return;
      try {
        await reorder(moved.id, data);
      } catch {
        setListDataHold(null);
      }
    },
    [enterSelection, online, reorder]
  );

  const showEmpty = !loading && !error && listData.length === 0;
  const showSkeleton = loading && !error && listData.length === 0;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.chrome}>
        {selectionMode ? (
          <InboxSelectionBar
            count={selectedIds.length}
            online={online}
            deleting={deleting}
            onCancel={clearSelection}
            onDelete={requestDeleteSelected}
          />
        ) : (
          <InboxHeader
            avatar={avatar}
            searchMode={searchMode}
            onToggleSearch={() => {
              if (searchMode) exitSearch();
              else setSearchMode(true);
            }}
            onSettings={() => {
              clearSelection();
              clearWidgetMode();
              router.push("/settings" as Href);
            }}
          />
        )}

        {!online ? <OfflineBanner /> : null}

        <InboxFilter value={filter} onChange={handleFilterChange} />
        {searchMode ? (
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onClose={exitSearch}
          />
        ) : (
          <CaptureBar
            onSubmit={handleCapture}
            disabled={!online || selectionMode}
            autoFocus={captureAutoFocus}
            focusEpoch={focusEpoch}
          />
        )}

        {error ? (
          <Text style={{ fontFamily: font.regular, color: colors.danger }}>
            Não foi possível carregar. Verifique a conexão.
          </Text>
        ) : saveError ? (
          <Text style={{ fontFamily: font.regular, color: colors.danger }}>
            {saveError}
          </Text>
        ) : null}
      </View>

      <Animated.ScrollView
        ref={scrollableRef}
        style={styles.listContainer}
        contentContainerStyle={[styles.list, showEmpty && styles.listEmpty]}
        keyboardShouldPersistTaps="handled"
      >
        {showSkeleton ? (
          <InboxLoadingSkeleton />
        ) : showEmpty ? (
          <EmptyState variant={inboxEmptyVariant(searchMode, query)} />
        ) : (
          <Sortable.Grid
            columns={1}
            data={listData}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            rowGap={spacing.sm}
            sortEnabled={online && !selectionMode && !searchMode}
            dragActivationDelay={220}
            activationAnimationDuration={180}
            dropAnimationDuration={220}
            activeItemScale={1.03}
            activeItemOpacity={1}
            activeItemShadowOpacity={0}
            inactiveItemOpacity={0.72}
            inactiveItemScale={1}
            enableActiveItemSnap={false}
            overDrag="vertical"
            scrollableRef={scrollableRef}
            onDragStart={() => {
              setListDataHold(visible);
              setIsDragging(true);
            }}
            onDragEnd={handleDragEnd}
          />
        )}
      </Animated.ScrollView>

      <DeleteItemsDialog
        visible={confirmOpen}
        title={confirmTitle}
        busy={deleting}
        onClose={closeConfirm}
        onConfirm={confirmDelete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  chrome: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  listContainer: { flex: 1 },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  listEmpty: { flexGrow: 1, justifyContent: "center" },
});
