import AsyncStorage from "@react-native-async-storage/async-storage";
import type { InboxFilter } from "@/types/item";
import { clearWidgetThemePreference } from "@/widgets/capture/widgetThemePreference";

const VALID_FILTERS: InboxFilter[] = ["all", "notes", "tasks"];

const FILTER_LABELS: Record<InboxFilter, string> = {
  all: "Tudo",
  notes: "Notas",
  tasks: "Tarefas",
};

export function inboxWidgetFilterStorageKey(widgetId: number): string {
  return `thinkdo.widget.${widgetId}.filter`;
}

export function parseInboxWidgetFilter(stored: string | null): InboxFilter {
  if (stored !== null && VALID_FILTERS.includes(stored as InboxFilter)) {
    return stored as InboxFilter;
  }
  return "all";
}

export function inboxFilterLabel(filter: InboxFilter): string {
  return FILTER_LABELS[filter];
}

export async function loadInboxWidgetFilter(
  widgetId: number
): Promise<InboxFilter> {
  try {
    const stored = await AsyncStorage.getItem(
      inboxWidgetFilterStorageKey(widgetId)
    );
    return parseInboxWidgetFilter(stored);
  } catch {
    return "all";
  }
}

export async function saveInboxWidgetFilter(
  widgetId: number,
  filter: InboxFilter
): Promise<void> {
  await AsyncStorage.setItem(inboxWidgetFilterStorageKey(widgetId), filter);
}

export async function clearInboxWidgetFilter(widgetId: number): Promise<void> {
  try {
    await AsyncStorage.removeItem(inboxWidgetFilterStorageKey(widgetId));
  } catch {
    // best-effort cleanup
  }
}

export async function clearInboxWidgetInstancePrefs(
  widgetId: number
): Promise<void> {
  await clearWidgetThemePreference(widgetId);
  await clearInboxWidgetFilter(widgetId);
}
