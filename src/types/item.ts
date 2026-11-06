import type { ItemReminder } from "@/features/reminders/types";

export type ItemType = "note" | "task";

export type InboxFilter = "all" | "notes" | "tasks";

export type ItemColor =
  | "yellow"
  | "orange"
  | "red"
  | "pink"
  | "purple"
  | "blue"
  | "green"
  | "gray";

/** Document as the app uses after reading from Firestore */
export type Item = {
  id: string;
  type: ItemType;
  title: string;
  body: string;
  done: boolean;
  color: ItemColor | null;
  reminder: ItemReminder | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

/** Payload to create (id and timestamps generated in service) */
export type CreateItemInput = {
  type: ItemType;
  title: string;
  body?: string;
  done?: boolean;
};

/** Partial patch in editor / toggle done */
export type UpdateItemInput = Partial<
  Pick<Item, "type" | "title" | "body" | "done" | "color" | "reminder">
>;

export type SaveStatus = "saved" | "saving" | "draft" | "error";
