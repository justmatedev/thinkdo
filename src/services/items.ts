import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { buildCreatePayload } from "@/services/itemPayload";
import { rebalanceSortOrders } from "@/lib/itemOrdering";
import { mapItemRecord } from "@/lib/itemRecord";
import type { CreateItemInput, Item, UpdateItemInput } from "@/types/item";

function itemsCollection(userId: string) {
  return collection(db, "users", userId, "items");
}

function mapDoc(
  snap: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>
): Item {
  return mapItemRecord(snap.id, snap.data() as Record<string, unknown> | undefined);
}

export function subscribeItems(
  userId: string,
  onData: (items: Item[]) => void,
  onError: (e: Error) => void
): () => void {
  const q = query(itemsCollection(userId), orderBy("sortOrder", "desc"));
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map(mapDoc)),
    (e) => onError(e)
  );
}

export async function getItem(
  userId: string,
  itemId: string
): Promise<Item | null> {
  const snap = await getDoc(doc(db, "users", userId, "items", itemId));
  return snap.exists() ? mapDoc(snap) : null;
}

export async function createItem(
  userId: string,
  input: CreateItemInput
): Promise<string> {
  const payload = buildCreatePayload(input);
  const ref = await addDoc(itemsCollection(userId), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateItem(
  userId: string,
  itemId: string,
  patch: UpdateItemInput
): Promise<void> {
  await updateDoc(doc(db, "users", userId, "items", itemId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteItem(
  userId: string,
  itemId: string
): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "items", itemId));
}

/** Writes sortOrder from updatedAt for docs missing the field. Safe to call repeatedly. */
export async function backfillMissingSortOrders(userId: string): Promise<void> {
  const snap = await getDocs(itemsCollection(userId));
  const missing = snap.docs.filter((d) => typeof d.data().sortOrder !== "number");
  if (missing.length === 0) return;

  for (let i = 0; i < missing.length; i += 450) {
    const chunk = missing.slice(i, i + 450);
    const batch = writeBatch(db);
    for (const d of chunk) {
      const data = d.data();
      const ms = data.updatedAt?.toDate?.()?.getTime?.() ?? Date.now();
      batch.update(d.ref, { sortOrder: ms });
    }
    await batch.commit();
  }
}

export async function reorderItem(
  userId: string,
  itemId: string,
  sortOrder: number
): Promise<void> {
  await updateDoc(doc(db, "users", userId, "items", itemId), {
    sortOrder,
    updatedAt: serverTimestamp(),
  });
}

/** `orderedIds` = full inbox order top → bottom after rebalance. */
export async function rebalanceAllSortOrders(
  userId: string,
  orderedIds: string[]
): Promise<void> {
  const orders = rebalanceSortOrders(orderedIds.length);
  for (let i = 0; i < orderedIds.length; i += 450) {
    const chunkIds = orderedIds.slice(i, i + 450);
    const batch = writeBatch(db);
    chunkIds.forEach((id, offset) => {
      const index = i + offset;
      batch.update(doc(db, "users", userId, "items", id), {
        sortOrder: orders[index],
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }
}
