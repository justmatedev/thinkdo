import { test } from "node:test";
import assert from "node:assert/strict";

const project = "demo-thinkdo";
const base = `http://${process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080"}/v1/projects/${project}/databases/(default)/documents`;
function value(v) {
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(value) } };
  if (v === null) return { nullValue: null };
  if (typeof v === "object") return { mapValue: { fields: fields(v) } };
  if (typeof v === "number")
    return Number.isInteger(v)
      ? { integerValue: String(v) }
      : { doubleValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  return { stringValue: v };
}
const fields = (v) =>
  Object.fromEntries(Object.entries(v).map(([k, x]) => [k, value(x)]));
function token(uid) {
  const now = Math.floor(Date.now() / 1000);
  const encode = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({ sub: uid, user_id: uid, aud: project, iss: `https://securetoken.google.com/${project}`, iat: now, exp: now + 3600, firebase: { sign_in_provider: "custom", identities: {} } })}.`;
}
let counter = 0;
async function write(reminder, uid = "owner", overrides = {}) {
  return fetch(`${base}/users/owner/items/test-${++counter}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token(uid)}`,
    },
    body: JSON.stringify({
      fields: fields({
        type: "note",
        title: "Test",
        body: "",
        done: false,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        reminder,
        ...overrides,
      }),
    }),
  });
}
const valid = [
  null,
  { kind: "once", at: new Date() },
  { kind: "daily", hour: 9, minute: 0 },
  { kind: "weekly", weekdays: [2], hour: 9, minute: 0 },
  { kind: "weekly", weekdays: [2, 4], hour: 9, minute: 0 },
];
for (const reminder of valid)
  test(`accepts ${JSON.stringify(reminder)}`, async () => {
    const result = await write(reminder);
    assert.equal(result.status, 200, await result.text());
  });
const invalid = [
  { weekdays: [] },
  { weekdays: [2, 2] },
  { weekdays: [0] },
  { weekdays: [8] },
  { weekdays: [1.5] },
  { weekdays: ["2"] },
  { weekdays: 2 },
  { weekdays: [2], weekday: 2 },
  { weekdays: [2], extra: true },
  { weekdays: [2], hour: 24 },
  { weekdays: [2], minute: -1 },
  { weekday: 8 },
  { weekday: 2 },
];
for (const patch of invalid)
  test(`rejects ${JSON.stringify(patch)}`, async () => {
    const result = await write({
      kind: "weekly",
      hour: 9,
      minute: 0,
      ...patch,
    });
    assert.equal(result.status, 403, await result.text());
  });
test("rejects writes from another account", async () => {
  const result = await write(null, "intruder");
  assert.equal(result.status, 403);
});
test("rejects reads and deletes from another account", async () => {
  const created = await write(null);
  const { name } = await created.json();
  const url = `http://${process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080"}/v1/${name}`;
  for (const method of ["GET", "DELETE"]) {
    const result = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token("intruder")}` },
    });
    assert.equal(result.status, 403);
  }
});

test('updates selected weekdays without rewriting other fields', async () => {
  const created = await write({ kind: 'weekly', weekdays: [2], hour: 9, minute: 0 });
  const { name } = await created.json();
  const url = `http://${process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080'}/v1/${name}?updateMask.fieldPaths=reminder`;
  const result = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token('owner')}` },
    body: JSON.stringify({ fields: fields({ reminder: { kind: 'weekly', weekdays: [2, 4], hour: 10, minute: 30 } }) }),
  });
  assert.equal(result.status, 200, await result.text());
});
for (const reminder of [{ kind: 'daily', hour: 24, minute: 0 }, { kind: 'once', at: 'tomorrow' }]) {
  test(`keeps rejecting malformed non-weekly reminders ${JSON.stringify(reminder)}`, async () => {
    const result = await write(reminder);
    assert.equal(result.status, 403, await result.text());
  });
}


async function patchItem(name, patch, mask = Object.keys(patch)) {
  const params = new URLSearchParams();
  mask.forEach((key) => params.append("updateMask.fieldPaths", key));
  return fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080"}/v1/${name}?${params}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token("owner")}` },
    body: JSON.stringify({ fields: fields(patch) }),
  });
}

for (const [label, patch, status] of [
  ["known optional fields", { color: "blue" }, 200],
  ["unknown root field", { extra: true }, 403],
  ["title at limit", { title: "a".repeat(500) }, 200],
  ["title over limit", { title: "a".repeat(501) }, 403],
  ["empty title", { title: "" }, 403],
  ["body at limit", { body: "a".repeat(100000) }, 200],
  ["body over limit", { body: "a".repeat(100001) }, 403],
  ["wrong title type", { title: 123 }, 403],
  ["wrong body type", { body: null }, 403],
]) {
  test(`item creation: ${label}`, async () => {
    const result = await write(null, "owner", patch);
    assert.equal(result.status, status, await result.text());
  });
}

for (const [label, patch, status] of [
  ["partial text update", { title: "Edited", body: "Updated body" }, 200],
  ["task completion", { done: true }, 200],
  ["fractional sort order", { sortOrder: 0.25 }, 200],
  ["extra field", { extra: true }, 403],
  ["creation timestamp change", { createdAt: new Date("2000-01-01") }, 403],
  ["overlong title", { title: "a".repeat(501) }, 403],
  ["overlong body", { body: "a".repeat(100001) }, 403],
]) {
  test(`item update: ${label}`, async () => {
    const created = await write(null);
    const { name } = await created.json();
    const result = await patchItem(name, patch);
    assert.equal(result.status, status, await result.text());
  });
}

test("allows preserving createdAt and rejects its removal", async () => {
  const created = await write(null);
  const { name, fields: original } = await created.json();
  const same = await patchItem(name, { createdAt: new Date(original.createdAt.timestampValue), title: "Edited" });
  assert.equal(same.status, 200, await same.text());
  const removed = await patchItem(name, {}, ["createdAt"]);
  assert.equal(removed.status, 403, await removed.text());
});
