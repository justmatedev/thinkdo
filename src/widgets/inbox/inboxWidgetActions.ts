import * as Linking from "expo-linking";

export const CLICK_TOGGLE_DONE = "INBOX_TOGGLE_DONE";

export function inboxHomeDeepLink(): string {
  return Linking.createURL("/");
}

export function inboxItemDeepLink(itemId: string): string {
  return Linking.createURL(`/item/${itemId}`);
}
