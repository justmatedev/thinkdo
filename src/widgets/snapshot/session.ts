export type InboxSession = { uid: string; generation: number };
let uid: string | null | undefined;
let generation = 0;

export function beginInboxSession(owner: string | null): void {
  if (uid !== owner) {
    uid = owner;
    generation++;
  }
}

export function invalidateInboxSession(): void {
  uid = null;
  generation++;
}

export function getInboxSession(owner: string): InboxSession | null {
  // Headless widget processes restore Firebase before the React provider mounts.
  if (uid === undefined) beginInboxSession(owner);
  return uid === owner ? { uid: owner, generation } : null;
}

export function isInboxSessionCurrent(session: InboxSession | null): boolean {
  return (
    session !== null && session.uid === uid && session.generation === generation
  );
}
