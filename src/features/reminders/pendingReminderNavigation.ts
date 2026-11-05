let pendingItemId: string | null = null;

export function setPendingReminderItemId(itemId: string): void {
  pendingItemId = itemId;
}

export function consumePendingReminderItemId(): string | null {
  const id = pendingItemId;
  pendingItemId = null;
  return id;
}
