export function truncateNotificationBody(
  body: string,
  max: number = 120
): string {
  if (body.length <= max) return body;
  if (max <= 1) return "…".slice(0, max);
  return body.slice(0, max - 1) + "…";
}

export function notificationContent(item: {
  title: string;
  body: string;
}): { title: string; body: string } {
  const title = item.title.trim() || "Lembrete";
  const trimmedBody = item.body.trim();
  const body = trimmedBody
    ? truncateNotificationBody(trimmedBody)
    : "Abrir no ThinkDo";
  return { title, body };
}
