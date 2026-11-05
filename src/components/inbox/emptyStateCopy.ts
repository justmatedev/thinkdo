export type EmptyStateVariant = "inbox" | "searchIdle" | "searchNone";

export function emptyStateMessage(variant: EmptyStateVariant): string {
  switch (variant) {
    case "inbox":
      return "Nada por aqui. Anote acima.";
    case "searchIdle":
      return "Nada por aqui.";
    case "searchNone":
      return "Nenhum resultado.";
  }
}

export function inboxEmptyVariant(
  searchMode: boolean,
  query: string
): EmptyStateVariant {
  if (!searchMode) return "inbox";
  return query.trim().length > 0 ? "searchNone" : "searchIdle";
}
