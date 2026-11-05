import type { CreateItemInput, ItemType } from "@/types/item";
import { nextSortOrder } from "@/lib/itemOrdering";

export function buildCreatePayload(
  input: CreateItemInput,
  now: number = Date.now()
): {
  type: ItemType;
  title: string;
  body: string;
  done: boolean;
  sortOrder: number;
} {
  return {
    type: input.type,
    title: input.title,
    body: input.body ?? "",
    done: input.done ?? false,
    sortOrder: nextSortOrder(now),
  };
}
