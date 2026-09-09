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

/** Expo/iOS weekday: 1 = Sunday … 7 = Saturday */
export type ReminderWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ItemReminder =
  | { kind: "once"; at: Date }
  | { kind: "daily"; hour: number; minute: number }
  | {
      kind: "weekly";
      /** Unique Expo weekdays 1–7, sorted ascending, length ≥ 1 */
      weekdays: ReminderWeekday[];
      hour: number;
      minute: number;
    };

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

export type SaveStatus = "saved" | "saving" | "error";
