import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  WidgetPreview,
  type WidgetConfigurationScreenProps,
} from "react-native-android-widget";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { InboxFilter } from "../../components/inbox/InboxFilter";
import { ThemeSegment } from "../../components/settings/ThemeSegment";
import { ModalActionRow } from "../../components/ui/ModalActionRow";
import { font, fontSize, radius, spacing } from "../../lib/theme";
import { ThemeProvider, useTheme } from "../../lib/themeContext";
import type { InboxFilter as InboxFilterValue } from "../../types/item";
import { CaptureWidget } from "../capture/CaptureWidget";
import { captureWidgetRepresentationForPrefs } from "../capture/captureWidgetRender";
import {
  loadWidgetThemePreference,
  resolveThemeNameFromWidgetPreference,
  saveWidgetThemePreference,
  type WidgetThemePreference,
} from "../capture/widgetThemePreference";
import { InboxWidget } from "../inbox/InboxWidget";
import {
  loadInboxWidgetFilter,
  saveInboxWidgetFilter,
} from "../inbox/inboxWidgetFilter";
import { resolveInboxWidgetRepresentation } from "../inbox/inboxWidgetRender";
import {
  readInboxSnapshot,
  type InboxSnapshot,
} from "../snapshot/inboxSnapshot";
import { resolveWidgetConfigKind } from "./widgetConfigPresentation";

function CaptureThemeConfigBody({
  widgetInfo,
  renderWidget,
  setResult,
}: WidgetConfigurationScreenProps) {
  const { colors } = useTheme();
  const systemScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [pref, setPref] = useState<WidgetThemePreference>("system");
  const [busy, setBusy] = useState(false);
  const [previewArea, setPreviewArea] = useState({ width: 0, height: 0 });

  const tileWidth = widgetInfo.width;
  const tileHeight = widgetInfo.height;
  const previewThemeName = resolveThemeNameFromWidgetPreference(
    pref,
    systemScheme
  );

  useEffect(() => {
    void loadWidgetThemePreference(widgetInfo.widgetId).then(setPref);
  }, [widgetInfo.widgetId]);

  const renderPreviewWidget = useCallback(
    ({ width, height }: { width: number; height: number }) => (
      <CaptureWidget
        width={width}
        height={height}
        themeName={previewThemeName}
      />
    ),
    [previewThemeName]
  );

  const onPreviewLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setPreviewArea({ width, height });
  };

  const scale =
    previewArea.width > 0 &&
    previewArea.height > 0 &&
    tileWidth > 0 &&
    tileHeight > 0
      ? Math.min(
          1,
          previewArea.width / tileWidth,
          previewArea.height / tileHeight
        )
      : 1;
  const previewWidth = Math.max(1, Math.round(tileWidth * scale));
  const previewHeight = Math.max(1, Math.round(tileHeight * scale));

  const onConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await saveWidgetThemePreference(widgetInfo.widgetId, pref);
      renderWidget(
        captureWidgetRepresentationForPrefs(tileWidth, tileHeight, pref)
      );
      setResult("ok");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Tema do widget
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Escolha como este tile aparece na tela inicial.
        </Text>
        <ThemeSegment value={pref} onChange={setPref} />
      </View>

      <View style={styles.previewArea} onLayout={onPreviewLayout}>
        <View
          style={[
            styles.previewFrame,
            {
              width: previewWidth,
              height: previewHeight,
              borderColor: colors.border,
            },
          ]}
        >
          <WidgetPreview
            width={previewWidth}
            height={previewHeight}
            renderWidget={renderPreviewWidget}
          />
        </View>
      </View>

      <ModalActionRow
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        busy={busy}
        onCancel={() => setResult("cancel")}
        onConfirm={() => {
          void onConfirm();
        }}
      />
    </View>
  );
}

const EMPTY_INBOX_PREVIEW_SNAPSHOT: InboxSnapshot = {
  updatedAt: 0,
  signedIn: false,
  items: [],
};

function InboxWidgetConfigBody({
  widgetInfo,
  renderWidget,
  setResult,
}: WidgetConfigurationScreenProps) {
  const { colors } = useTheme();
  const systemScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [pref, setPref] = useState<WidgetThemePreference>("system");
  const [filter, setFilter] = useState<InboxFilterValue>("all");
  const [snapshot, setSnapshot] = useState<InboxSnapshot>(
    EMPTY_INBOX_PREVIEW_SNAPSHOT
  );
  const [busy, setBusy] = useState(false);
  const [previewArea, setPreviewArea] = useState({ width: 0, height: 0 });

  const tileWidth = widgetInfo.width;
  const tileHeight = widgetInfo.height;
  const previewThemeName = resolveThemeNameFromWidgetPreference(
    pref,
    systemScheme
  );

  useEffect(() => {
    void Promise.all([
      loadWidgetThemePreference(widgetInfo.widgetId),
      loadInboxWidgetFilter(widgetInfo.widgetId),
      readInboxSnapshot(),
    ]).then(([savedTheme, savedFilter, savedSnapshot]) => {
      setPref(savedTheme);
      setFilter(savedFilter);
      setSnapshot(savedSnapshot);
    });
  }, [widgetInfo.widgetId]);

  const renderPreviewWidget = useCallback(
    ({ width, height }: { width: number; height: number }) => (
      <InboxWidget
        width={width}
        height={height}
        themeName={previewThemeName}
        filter={filter}
        snapshot={snapshot}
        scrollable={false}
      />
    ),
    [previewThemeName, filter, snapshot]
  );

  const onPreviewLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setPreviewArea({ width, height });
  };

  const scale =
    previewArea.width > 0 &&
    previewArea.height > 0 &&
    tileWidth > 0 &&
    tileHeight > 0
      ? Math.min(
          1,
          previewArea.width / tileWidth,
          previewArea.height / tileHeight
        )
      : 1;
  const previewWidth = Math.max(1, Math.round(tileWidth * scale));
  const previewHeight = Math.max(1, Math.round(tileHeight * scale));

  const onConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await Promise.all([
        saveWidgetThemePreference(widgetInfo.widgetId, pref),
        saveInboxWidgetFilter(widgetInfo.widgetId, filter),
      ]);
      // Prefer in-memory prefs so confirm does not depend on a second storage round-trip.
      const representation = await resolveInboxWidgetRepresentation(
        widgetInfo.widgetId,
        tileWidth > 0 ? tileWidth : widgetInfo.width,
        tileHeight > 0 ? tileHeight : widgetInfo.height
      );
      renderWidget(representation);
      setResult("ok");
    } catch {
      // Still accept the widget with the last successful render / defaults.
      setResult("ok");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
    >
      <View style={styles.inboxContent}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Configurar Inbox
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Escolha quais itens aparecem e o tema do widget.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Itens
          </Text>
          <InboxFilter value={filter} onChange={setFilter} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Tema
          </Text>
          <ThemeSegment value={pref} onChange={setPref} />
        </View>
      </View>

      <View style={styles.previewArea} onLayout={onPreviewLayout}>
        <View
          style={[
            styles.previewFrame,
            {
              width: previewWidth,
              height: previewHeight,
              borderColor: colors.border,
            },
          ]}
        >
          <WidgetPreview
            width={previewWidth}
            height={previewHeight}
            renderWidget={renderPreviewWidget}
          />
        </View>
      </View>

      <ModalActionRow
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        busy={busy}
        onCancel={() => setResult("cancel")}
        onConfirm={() => {
          void onConfirm();
        }}
      />
    </View>
  );
}

function WidgetConfigBody(props: WidgetConfigurationScreenProps) {
  if (resolveWidgetConfigKind(props.widgetInfo.widgetName) === "inbox") {
    return <InboxWidgetConfigBody {...props} />;
  }

  return <CaptureThemeConfigBody {...props} />;
}

export function WidgetConfigScreen(props: WidgetConfigurationScreenProps) {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  return (
    <GestureHandlerRootView style={styles.shell}>
      <SafeAreaProvider>
        <ThemeProvider>
          {!fontsLoaded ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <WidgetConfigBody {...props} />
          )}
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  root: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: "space-between",
  },
  content: { gap: spacing.md },
  inboxContent: { gap: spacing.md },
  section: { gap: spacing.sm },
  title: { fontFamily: font.semibold, fontSize: fontSize.editorTitle },
  subtitle: { fontFamily: font.regular, fontSize: fontSize.body },
  sectionLabel: { fontFamily: font.medium, fontSize: fontSize.meta },
  previewArea: {
    flex: 1,
    marginVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  previewFrame: {
    overflow: "hidden",
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
