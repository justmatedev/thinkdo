# Inbox Widget Hybrid Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Android Inbox home-screen widget scroll via `ListWidget`, while keeping the widget config preview on a static `FlexWidget` slice so WidgetPreview/config stays stable.

**Architecture:** Extract pure row-selection (`selectInboxWidgetRows`) for TDD. `InboxWidget` gains `scrollable?: boolean` (default `true`): when true, render all filtered rows inside `ListWidget`; when false, keep today’s height-based `slice` inside a `FlexWidget` column. Home render paths keep the default; `WidgetConfigScreen` passes `scrollable={false}`.

**Tech Stack:** Expo SDK 57, `react-native-android-widget` (`ListWidget` / `FlexWidget`), Jest (`jest-expo`).

## Global Constraints

- Read Expo docs at https://docs.expo.dev/versions/v57.0.0/ before writing Expo API code
- Hybrid only: home = `ListWidget` + full filtered rows; config preview = `FlexWidget` + height `slice`
- Default `scrollable` is `true` (home path)
- Config preview must pass `scrollable={false}`
- Do not change empty state, row chrome, click actions, theme/palette, filter, or `INBOX_SNAPSHOT_CAP`
- Out of scope: “+N more” indicator, iOS widgets, `app.json` cell sizes, upgrading `react-native-android-widget`
- Automated tests cannot assert RemoteViews scrolling; device check is part of done

## File Structure

| File | Responsibility |
|------|----------------|
| `src/widgets/inbox/inboxWidgetRows.ts` | Pure helpers: row height constant + `selectInboxWidgetRows` |
| `src/widgets/inbox/__tests__/inboxWidgetRows.test.ts` | Unit tests for static vs scrollable selection |
| `src/widgets/inbox/InboxWidget.tsx` | Use helper; `ListWidget` when scrollable, static column when not |
| `src/widgets/android/WidgetConfigScreen.tsx` | Pass `scrollable={false}` on config preview `InboxWidget` |
| Spec (no code change required) | `docs/superpowers/specs/2026-09-13-inbox-widget-scroll-design.md` |

Home paths (`inboxWidgetRender.tsx` / `taskHandler.tsx` / `update.tsx`) need no edits if default `scrollable` is `true`.

---

### Task 1: Pure row-selection helper

**Files:**
- Create: `src/widgets/inbox/inboxWidgetRows.ts`
- Create: `src/widgets/inbox/__tests__/inboxWidgetRows.test.ts`

**Interfaces:**
- Consumes: none (generic array)
- Produces:
  - `INBOX_WIDGET_ROW_HEIGHT = 44`
  - `INBOX_WIDGET_VERTICAL_CHROME = 16` (matches today’s `height - 16` for list area)
  - `selectInboxWidgetRows<T>(rows: T[], options: { scrollable: boolean; widgetHeight: number }): T[]`

- [ ] **Step 1: Write the failing tests**

Create `src/widgets/inbox/__tests__/inboxWidgetRows.test.ts`:

```ts
import {
  INBOX_WIDGET_ROW_HEIGHT,
  selectInboxWidgetRows,
} from "../inboxWidgetRows";

const ids = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: String(i) }));

describe("selectInboxWidgetRows", () => {
  it("returns all rows when scrollable", () => {
    const rows = ids(10);
    expect(
      selectInboxWidgetRows(rows, { scrollable: true, widgetHeight: 100 })
    ).toEqual(rows);
  });

  it("slices to rows that fit when not scrollable", () => {
    // listHeight = max(44, 148 - 16) = 132 → floor(132/44) = 3
    const rows = ids(10);
    expect(
      selectInboxWidgetRows(rows, { scrollable: false, widgetHeight: 148 })
    ).toEqual(rows.slice(0, 3));
  });

  it("always shows at least one row slot when not scrollable", () => {
    const rows = ids(5);
    expect(
      selectInboxWidgetRows(rows, { scrollable: false, widgetHeight: 10 })
    ).toEqual(rows.slice(0, 1));
  });

  it("exports ROW_HEIGHT 44 for layout parity", () => {
    expect(INBOX_WIDGET_ROW_HEIGHT).toBe(44);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/widgets/inbox/__tests__/inboxWidgetRows.test.ts`

Expected: FAIL (module `../inboxWidgetRows` not found, or export missing)

- [ ] **Step 3: Write minimal implementation**

Create `src/widgets/inbox/inboxWidgetRows.ts`:

```ts
export const INBOX_WIDGET_ROW_HEIGHT = 44;
/** Vertical padding/chrome subtracted from widget height for the list area. */
export const INBOX_WIDGET_VERTICAL_CHROME = 16;

export function selectInboxWidgetRows<T>(
  rows: T[],
  options: { scrollable: boolean; widgetHeight: number }
): T[] {
  if (options.scrollable) return rows;

  const listHeight = Math.max(
    INBOX_WIDGET_ROW_HEIGHT,
    options.widgetHeight - INBOX_WIDGET_VERTICAL_CHROME
  );
  const maxRows = Math.max(
    1,
    Math.floor(listHeight / INBOX_WIDGET_ROW_HEIGHT)
  );
  return rows.slice(0, maxRows);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/widgets/inbox/__tests__/inboxWidgetRows.test.ts`

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/widgets/inbox/inboxWidgetRows.ts src/widgets/inbox/__tests__/inboxWidgetRows.test.ts
git commit -m "$(cat <<'EOF'
feat(widget): add inbox row selection helper for scroll modes

EOF
)"
```

---

### Task 2: Wire `scrollable` + `ListWidget` in `InboxWidget`

**Files:**
- Modify: `src/widgets/inbox/InboxWidget.tsx`

**Interfaces:**
- Consumes: `selectInboxWidgetRows`, `INBOX_WIDGET_ROW_HEIGHT`, `INBOX_WIDGET_VERTICAL_CHROME` from `./inboxWidgetRows`
- Produces: `InboxWidget` props include `scrollable?: boolean` (default `true`)

- [ ] **Step 1: Update imports and props**

In `src/widgets/inbox/InboxWidget.tsx`:

1. Import `ListWidget` from `react-native-android-widget` alongside `FlexWidget` / `TextWidget`.
2. Import helpers from `./inboxWidgetRows`.
3. Remove local `const ROW_HEIGHT = 44`.
4. Extend props:

```ts
type Props = {
  width: number;
  height: number;
  themeName: ThemeName;
  filter: InboxFilter;
  snapshot: InboxSnapshot;
  /** Home widget: true (default). Config preview: false (avoids ListWidget crash). */
  scrollable?: boolean;
};
```

5. Destructure `scrollable = true` in the function signature.
6. Replace the comment about preferring FlexWidget with a short note that config must pass `scrollable={false}`.

- [ ] **Step 2: Select rows and list container**

Replace the current `listHeight` / `maxRows` / `visible` block with:

```ts
  const listHeight = Math.max(
    INBOX_WIDGET_ROW_HEIGHT,
    height - INBOX_WIDGET_VERTICAL_CHROME
  );
  const visible = selectInboxWidgetRows(rows, {
    scrollable,
    widgetHeight: height,
  });
  const ListContainer = scrollable ? ListWidget : FlexWidget;
```

Keep empty-state branch keyed on `visible.length === 0` (unchanged copy).

- [ ] **Step 3: Use `ListContainer` and row height constant**

In the non-empty branch, replace the outer list `FlexWidget` with:

```tsx
        <ListContainer
          style={{
            width: "match_parent",
            height: listHeight,
            ...(scrollable ? {} : { flexDirection: "column" as const }),
          }}
        >
```

Close with `</ListContainer>` instead of `</FlexWidget>`.

Replace every remaining `ROW_HEIGHT` usage in this file with `INBOX_WIDGET_ROW_HEIGHT`.

Do not change click actions, lead slot, checkbox UI, or text styles.

- [ ] **Step 4: Typecheck / related tests**

Run:

```bash
npm test -- src/widgets/inbox/__tests__/inboxWidgetRows.test.ts src/widgets/inbox/__tests__/inboxWidgetFilter.test.ts src/widgets/android/__tests__/taskHandler.test.ts src/widgets/__tests__/update.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/widgets/inbox/InboxWidget.tsx
git commit -m "$(cat <<'EOF'
feat(widget): scroll inbox home list with ListWidget

EOF
)"
```

---

### Task 3: Force static preview on config screen

**Files:**
- Modify: `src/widgets/android/WidgetConfigScreen.tsx` (Inbox preview only — the `renderPreviewWidget` inside `InboxWidgetConfigBody` that returns `<InboxWidget … />`)

**Interfaces:**
- Consumes: `InboxWidget` with `scrollable?: boolean`
- Produces: config preview always `scrollable={false}`

- [ ] **Step 1: Pass `scrollable={false}`**

In `InboxWidgetConfigBody`’s `renderPreviewWidget`, change the `InboxWidget` to:

```tsx
      <InboxWidget
        width={width}
        height={height}
        themeName={previewThemeName}
        filter={filter}
        snapshot={snapshot}
        scrollable={false}
      />
```

Do not pass `scrollable` on any home-path representation builders (default remains `true`).

- [ ] **Step 2: Run widget-related unit tests**

Run:

```bash
npm test -- src/widgets/
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/widgets/android/WidgetConfigScreen.tsx
git commit -m "$(cat <<'EOF'
fix(widget): keep inbox config preview on static FlexWidget path

EOF
)"
```

---

### Task 4: Manual Android verification

**Files:** none (device / emulator only)

**Interfaces:** none

- [ ] **Step 1: Native rebuild**

With a device/emulator available, rebuild so the JS bundle with `ListWidget` is installed (dev client already running is OK if Metro picks up the change; otherwise):

```bash
npx expo run:android
```

Expected: app installs/launches without build errors.

- [ ] **Step 2: Home widget scroll**

1. Ensure inbox snapshot has more items than fit in the widget height (create many notes/tasks in-app, or wait for snapshot refresh).
2. Place / refresh **Thinkdo Inbox** on the home screen.
3. Confirm the list **scrolls** when content overflows.
4. Confirm checkbox toggle and opening an item still work.

- [ ] **Step 3: Config preview stability**

1. Add a new Inbox widget or open reconfigure.
2. Confirm the config `WidgetPreview` renders **without crash**.
3. Confirm theme/filter and confirm button still apply.

- [ ] **Step 4: Record outcome**

If home scroll or config preview crashes, stop and report which surface failed; do not “fix forward” by enabling ListWidget on config. Prefer reverting home to `scrollable={false}` default only if home itself is unstable.

No commit required for this task unless you update the design spec status line to “Implemented”.

---

## Spec coverage (self-review)

| Spec requirement | Task |
| --- | --- |
| Home uses `ListWidget` + full filtered rows | Task 2 (default `scrollable`) |
| Config uses static `FlexWidget` + slice | Task 1 helper + Task 2 + Task 3 |
| `scrollable?: boolean`, default `true` | Task 2 |
| Empty state / clicks / theme / filter unchanged | Task 2 (no intentional changes) |
| Unit test for visibility logic | Task 1 |
| Device verification | Task 4 |
| Out of scope items not implemented | All tasks omit them |
