import type { Item } from "@/types/item";

export function normalizeSearchText(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function itemMatchesQuery(
  item: Pick<Item, "title" | "body">,
  query: string
): boolean {
  const needle = normalizeSearchText(query).trim();
  if (!needle) return true;
  return (
    normalizeSearchText(item.title).includes(needle) ||
    normalizeSearchText(item.body).includes(needle)
  );
}
