import { parseItemColor } from "@/lib/itemColors";
import { parseItemReminder } from "@/features/reminders/reminderModel";
import type { Item, ItemType } from "@/types/item";

function timestampToDate(value: unknown, fallback: Date): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    const d = (value as { toDate: () => Date }).toDate();
    if (d instanceof Date && !Number.isNaN(d.getTime())) return d;
  }
  return fallback;
}

function sortOrderFrom(data: Record<string, unknown>): number {
  if (typeof data.sortOrder === "number") return data.sortOrder;
  const updatedAt = data.updatedAt;
  if (
    updatedAt &&
    typeof updatedAt === "object" &&
    "toDate" in updatedAt &&
    typeof (updatedAt as { toDate: unknown }).toDate === "function"
  ) {
    const d = (updatedAt as { toDate: () => Date }).toDate();
    const ms = d instanceof Date ? d.getTime() : NaN;
    return Number.isNaN(ms) ? 0 : ms;
  }
  if (updatedAt instanceof Date && !Number.isNaN(updatedAt.getTime())) {
    return updatedAt.getTime();
  }
  return 0;
}

/** Single mapping point: Firestore-shaped data → Item. */
export function mapItemRecord(
  id: string,
  data: Record<string, unknown> | undefined,
  now: Date = new Date()
): Item {
  if (!data) throw new Error(`Item ${id} has no data`);
  return {
    id,
    type: data.type as ItemType,
    title: data.title as string,
    body: data.body as string,
    done: data.done as boolean,
    color: parseItemColor(data.color),
    reminder: parseItemReminder(data.reminder),
    sortOrder: sortOrderFrom(data),
    createdAt: timestampToDate(data.createdAt, now),
    updatedAt: timestampToDate(data.updatedAt, now),
  };
}
