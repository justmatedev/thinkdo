import { auth } from "@/lib/firebase";
import { EMPTY_SNAPSHOT, readInboxSnapshot } from "@/widgets/snapshot/inboxSnapshot";
import { getInboxSession, isInboxSessionCurrent } from "@/widgets/snapshot/session";

export async function readAuthenticatedInboxSnapshot() {
  await auth.authStateReady();
  const uid = auth.currentUser?.uid;
  if (!uid) return EMPTY_SNAPSHOT;
  const session = getInboxSession(uid);
  if (!isInboxSessionCurrent(session)) return EMPTY_SNAPSHOT;
  const snapshot = await readInboxSnapshot();
  return auth.currentUser?.uid === uid &&
    isInboxSessionCurrent(session) &&
    snapshot.uid === uid
    ? snapshot
    : EMPTY_SNAPSHOT;
}
