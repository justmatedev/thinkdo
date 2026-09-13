# Inbox Widget Note Lead Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a framed `≡` lead on note rows in the Android Inbox widget so notes align with task checkboxes and read as the same list chrome.

**Architecture:** Replace the empty note lead `FlexWidget` in `InboxWidget.tsx` with a lead slot + bordered frame matching task checkbox geometry (`LEAD_SLOT` / `CHECK_SIZE`), glyph `≡`, accent border, open-item deep link on tap. No new modules unless needed; visual device check is the acceptance gate.

**Tech Stack:** Expo SDK 57, `react-native-android-widget` (`FlexWidget` / `TextWidget` / `ListWidget`).

## Global Constraints

- Read Expo docs at https://docs.expo.dev/versions/v57.0.0/ before writing Expo API code
- Change only `src/widgets/inbox/InboxWidget.tsx` for the note lead UI
- Frame: 22dp (`CHECK_SIZE`), `borderRadius` 6, `borderWidth` 2, border/`≡` color `palette.accent`, background `palette.background`
- Glyph: `TextWidget` text `≡`, fontSize ~13, fontWeight `700`
- Note lead click: `OPEN_URI` + `inboxItemDeepLink(row.id)` (same as title)
- Do not change task checkbox / toggle, empty state, scroll hybrid, filter, theme, snapshot, `ItemRow`, or `app.json`
- Out of scope: sticky-note PNG/SVG, IconWidget fonts, in-app inbox lead icons

## File Structure

| File | Responsibility |
|------|----------------|
| `src/widgets/inbox/InboxWidget.tsx` | Note lead UI (replace empty FlexWidget branch) |
| Spec (reference) | `docs/superpowers/specs/2026-09-13-inbox-widget-note-lead-design.md` |

---

### Task 1: Note lead chrome in `InboxWidget`

**Files:**
- Modify: `src/widgets/inbox/InboxWidget.tsx` (note branch of the row lead, currently empty `FlexWidget` ~lines 164–170)

**Interfaces:**
- Consumes: existing `LEAD_SLOT`, `CHECK_SIZE`, `palette`, `inboxItemDeepLink`, `INBOX_WIDGET_ROW_HEIGHT`
- Produces: note lead with framed `≡` and open-item click

- [ ] **Step 1: Replace the empty note lead**

In `InboxWidget.tsx`, replace the `else` branch that currently renders only:

```tsx
              ) : (
                <FlexWidget
                  style={{
                    width: LEAD_SLOT,
                    height: INBOX_WIDGET_ROW_HEIGHT,
                  }}
                />
              )}
```

with:

```tsx
              ) : (
                <FlexWidget
                  clickAction="OPEN_URI"
                  clickActionData={{ uri: inboxItemDeepLink(row.id) }}
                  style={{
                    width: LEAD_SLOT,
                    height: INBOX_WIDGET_ROW_HEIGHT,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  accessibilityLabel={`Abrir ${row.title || "nota"}`}
                >
                  <FlexWidget
                    style={{
                      width: CHECK_SIZE,
                      height: CHECK_SIZE,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: palette.accent,
                      backgroundColor: palette.background,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TextWidget
                      text="≡"
                      style={{
                        color: palette.accent,
                        fontSize: 13,
                        fontWeight: "700",
                      }}
                    />
                  </FlexWidget>
                </FlexWidget>
              )}
```

Do not alter the `row.type === "task"` branch.

Optionally update the file comment above `LEAD_SLOT` from “empty spacer” wording (if any) to note that notes use a framed glyph for alignment under `ListWidget`.

- [ ] **Step 2: Run related widget tests**

Run:

```bash
npm test -- src/widgets/inbox/ src/widgets/android/__tests__/taskHandler.test.ts src/widgets/__tests__/update.test.ts
```

Expected: PASS (no new failures; this task does not require a new unit test per the spec).

- [ ] **Step 3: Commit**

```bash
git add src/widgets/inbox/InboxWidget.tsx
git commit -m "$(cat <<'EOF'
feat(widget): add framed note lead icon on inbox widget rows

EOF
)"
```

---

### Task 2: Manual Android verification

**Files:** none (device / emulator)

**Interfaces:** none

- [ ] **Step 1: Ensure the JS change is on device**

If Metro/`expo run:android` is already running with a connected device, reload the app and refresh the Inbox widget (open app once so snapshot/widget update runs). Otherwise:

```bash
npx expo run:android
```

- [ ] **Step 2: Visual + interaction checks**

1. Mixed notes and tasks on the home Inbox widget: each note shows framed `≡`; titles line up with task titles.
2. Tap note lead → opens item; tap note title → opens item.
3. Task checkbox still toggles done.
4. Open Inbox widget config: preview shows note leads and does not crash (`scrollable={false}` path).

- [ ] **Step 3: Record outcome**

If the glyph looks wrong on a specific OEM font, try `☰` only after reporting; do not expand scope to PNG without a new decision.

No commit required unless updating the design spec status to Implemented.

---

## Spec coverage (self-review)

| Spec requirement | Task |
| --- | --- |
| Framed ≡ lead matching checkbox size | Task 1 |
| Accent border, background never filled | Task 1 |
| Open item on lead tap | Task 1 |
| Tasks unchanged | Task 1 |
| Out of scope left alone | Task 1 |
| Device visual / interaction check | Task 2 |
