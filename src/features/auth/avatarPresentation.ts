export type AvatarPresentation = {
  uri: string | null;
  initial: string;
};

function firstInitial(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.charAt(0).toUpperCase();
}

export function getAvatarPresentation(input: {
  photoURL: string | null;
  displayName: string | null;
  email: string | null;
}): AvatarPresentation {
  const uri = input.photoURL?.trim() ? input.photoURL.trim() : null;
  const initial =
    firstInitial(input.displayName) ??
    firstInitial(input.email) ??
    "?";
  return { uri, initial };
}

export function getAccountDisplayName(input: {
  displayName: string | null;
  email: string | null;
}): string {
  const name = input.displayName?.trim();
  if (name) return name;
  const email = input.email?.trim();
  if (email) {
    const local = email.split("@")[0]?.trim();
    if (local) return local;
  }
  return "Conta";
}
