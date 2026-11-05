export type InboxSnapshotRow = {
  id: string;
  type: "note" | "task";
  title: string;
  done: boolean;
};

export type InboxSnapshot = {
  uid: string | null;
  updatedAt: number;
  signedIn: boolean;
  items: InboxSnapshotRow[];
};
