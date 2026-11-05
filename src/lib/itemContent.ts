import type { Item, UpdateItemInput } from "@/types/item";

export function normalizeTitle(text: string): string | null {
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveEditorTitle(draft: string, lastValid: string): string {
  return normalizeTitle(draft) ?? lastValid;
}

export function toTask(_item: Item): UpdateItemInput {
  return { type: "task", done: false };
}

export function toNote(_item: Item): UpdateItemInput {
  return { type: "note" };
}

export function normalizePreviewText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/** Inbox preview line — null when body is empty or redundant with title */
export function getItemPreview(item: Pick<Item, "title" | "body">): string | null {
  const preview = normalizePreviewText(item.body);
  if (!preview) return null;

  const title = normalizePreviewText(item.title);
  if (!title) return preview;

  if (preview.toLowerCase() === title.toLowerCase()) return null;

  if (preview.toLowerCase().startsWith(title.toLowerCase())) {
    const rest = preview.slice(title.length).trim();
    if (!rest) return null;
    const continuation = rest.replace(/^[-–—:,.;\s]+/, "").trim();
    return continuation || null;
  }

  return preview;
}
