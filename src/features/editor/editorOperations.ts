// Serialize outgoing operations and subsequent reads across editor remounts.
const operations = new Map<string, Promise<unknown>>();
export function runEditorOperation<T>(uid: string, itemId: string, operation: () => Promise<T>): Promise<T> {
  const key = JSON.stringify([uid, itemId]);
  const result = (operations.get(key) ?? Promise.resolve()).then(operation);
  const settled = result.catch(() => {});
  operations.set(key, settled);
  void settled.then(() => { if (operations.get(key) === settled) operations.delete(key); });
  return result;
}
