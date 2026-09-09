# Reminder System Date/Time Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the custom reminder calendar and time scroller with OS date/time pickers behind ThinkDo-styled tappable rows, with brand accent colors where the platform allows.

**Architecture:** Keep `ItemReminder`, autosave, and local notification scheduling unchanged. Extract pure date/time mutation helpers for TDD. Rework `ReminderEditorSheet` to show Data/Hora rows that open `@react-native-community/datetimepicker` (Android dialog, iOS inline spinner). Apply Android brand colors via the package config plugin; iOS via `accentColor` / `themeVariant`.

**Tech Stack:** Expo SDK 57, React Native 0.86, `@react-native-community/datetimepicker`, Jest (`jest-expo`), existing theme (`colors.brand` `#8B5CF6` light / `#A78BFA` dark).

## Global Constraints

- Read Expo docs at https://docs.expo.dev/versions/v57.0.0/ before writing Expo API code
- Install datetimepicker only via `npx expo install @react-native-community/datetimepicker`
- Do not change `ItemReminder` shape or Firestore schema
- Do not add web reminder UI
- Do not add quick presets (“daqui 1h”, etc.)
- Keep Portuguese UI copy (`Data`, `Hora`, `Lembrete`, repetition labels)
- Live commit via existing `onChange` + autosave (no new Save button)
- Past `once` reminders must not commit (`isReminderSchedulable`)
- Android picker brand colors require a native rebuild after the config plugin is added

## File Structure

| File | Responsibility |
|------|----------------|
| `src/lib/reminderHelpers.ts` | Add `withReminderDate` / `withReminderTime` / `tryCommitReminder`; format Data/Hora row values; remove `showsReminderCalendar` and `formatMonthYearLabel` (calendar-only) |
| `src/lib/__tests__/reminderHelpers.test.ts` | Tests for new helpers; drop dead helper tests |
| `src/components/editor/ReminderFieldRow.tsx` | Tappable label + value row |
| `src/components/editor/ReminderDateTimePicker.tsx` | Platform wrapper around system DateTimePicker |
| `src/components/editor/ReminderEditorSheet.tsx` | Sheet orchestration: pills, rows, weekday picker, system picker state |
| `src/components/editor/reminderEditorInteractions.ts` | Keep dismiss threshold only |
| `src/components/editor/__tests__/reminderEditorInteractions.test.ts` | Dismiss tests only |
| `app.json` | Register datetimepicker Android styling plugin |
| Delete | `ReminderMonthCalendar.tsx`, `ReminderTimeScroller.tsx` |

---

### Task 1: Pure reminder date/time helpers

**Files:**
- Modify: `src/lib/reminderHelpers.ts`
- Modify: `src/lib/__tests__/reminderHelpers.test.ts`

**Interfaces:**
- Consumes: existing `ItemReminder`, `isReminderSchedulable`
- Produces:
  - `withReminderDate(reminder: ItemReminder, date: Date): ItemReminder`
  - `withReminderTime(reminder: ItemReminder, hour: number, minute: number): ItemReminder`
  - `tryCommitReminder(next: ItemReminder, now?: Date): ItemReminder | null`
  - `formatReminderDateValue(date: Date): string`
  - `formatReminderTimeValue(hour: number, minute: number): string`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/__tests__/reminderHelpers.test.ts` (and add imports for the new symbols). Remove the `showsReminderCalendar` and `formatMonthYearLabel` describe blocks and their imports in the same edit once those exports are deleted in Step 3 — for Step 1 only add the new tests:

```ts
describe("withReminderDate", () => {
  it("sets once date and keeps hour/minute", () => {
    const at = new Date(2026, 8, 7, 14, 30);
    const next = withReminderDate({ kind: "once", at }, new Date(2026, 8, 10));
    expect(next).toEqual({
      kind: "once",
      at: new Date(2026, 8, 10, 14, 30),
    });
  });

  it("promotes daily to once using selected date and existing time", () => {
    const next = withReminderDate(
      { kind: "daily", hour: 9, minute: 15 },
      new Date(2026, 8, 12)
    );
    expect(next).toEqual({
      kind: "once",
      at: new Date(2026, 8, 12, 9, 15),
    });
  });
});

describe("withReminderTime", () => {
  it("updates once time in place", () => {
    const at = new Date(2026, 8, 7, 14, 30);
    expect(withReminderTime({ kind: "once", at }, 16, 45)).toEqual({
      kind: "once",
      at: new Date(2026, 8, 7, 16, 45),
    });
  });

  it("updates daily and weekly hour/minute", () => {
    expect(
      withReminderTime({ kind: "daily", hour: 9, minute: 0 }, 8, 5)
    ).toEqual({ kind: "daily", hour: 8, minute: 5 });
    expect(
      withReminderTime(
        { kind: "weekly", weekday: 2, hour: 9, minute: 0 },
        18,
        0
      )
    ).toEqual({ kind: "weekly", weekday: 2, hour: 18, minute: 0 });
  });
});

describe("tryCommitReminder", () => {
  it("returns null for past once", () => {
    const now = new Date(2026, 8, 7, 12, 0);
    expect(
      tryCommitReminder({ kind: "once", at: new Date(2026, 8, 7, 11, 0) }, now)
    ).toBeNull();
  });

  it("returns the reminder when schedulable", () => {
    const next = { kind: "daily" as const, hour: 9, minute: 0 };
    expect(tryCommitReminder(next)).toEqual(next);
  });
});

describe("formatReminderDateValue / formatReminderTimeValue", () => {
  it("formats date in pt-BR short style and time as HH:mm", () => {
    const label = formatReminderDateValue(new Date(2026, 8, 7));
    expect(label.length).toBeGreaterThan(0);
    expect(formatReminderTimeValue(9, 5)).toBe("09:05");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern=reminderHelpers.test --no-coverage`

Expected: FAIL — new symbols not exported / not defined.

- [ ] **Step 3: Implement helpers and remove calendar-only exports**

In `src/lib/reminderHelpers.ts`:

1. Delete `formatMonthYearLabel` and `showsReminderCalendar`.
2. Add:

```ts
export function withReminderDate(
  reminder: ItemReminder,
  date: Date
): ItemReminder {
  const hour =
    reminder.kind === "once" ? reminder.at.getHours() : reminder.hour;
  const minute =
    reminder.kind === "once" ? reminder.at.getMinutes() : reminder.minute;
  const at = new Date(date);
  at.setHours(hour, minute, 0, 0);
  return { kind: "once", at };
}

export function withReminderTime(
  reminder: ItemReminder,
  hour: number,
  minute: number
): ItemReminder {
  if (reminder.kind === "once") {
    const at = new Date(reminder.at);
    at.setHours(hour, minute, 0, 0);
    return { kind: "once", at };
  }
  return { ...reminder, hour, minute };
}

export function tryCommitReminder(
  next: ItemReminder,
  now: Date = new Date()
): ItemReminder | null {
  if (!isReminderSchedulable(next, now)) return null;
  return next;
}

export function formatReminderDateValue(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatReminderTimeValue(hour: number, minute: number): string {
  return timeHm(hour, minute);
}
```

3. In `src/lib/__tests__/reminderHelpers.test.ts`, remove imports and describe blocks for `formatMonthYearLabel` and `showsReminderCalendar`; ensure new helpers are imported.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern=reminderHelpers.test --no-coverage`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/reminderHelpers.ts src/lib/__tests__/reminderHelpers.test.ts
git commit -m "$(cat <<'EOF'
refactor(reminders): add date/time commit helpers for system picker

EOF
)"
```

---

### Task 2: Install datetimepicker + ThinkDo Android theme plugin

**Files:**
- Modify: `package.json` / lockfile (via expo install)
- Modify: `app.json`

**Interfaces:**
- Consumes: none from Task 1
- Produces: dependency usable as `import DateTimePicker from "@react-native-community/datetimepicker"`; Android plugin branded with light `#8B5CF6` and dark `#A78BFA`

- [ ] **Step 1: Install the package**

Run: `npx expo install @react-native-community/datetimepicker`

Expected: package added at an Expo SDK 57–compatible version; no peer dependency errors.

- [ ] **Step 2: Register the Android styling plugin**

In `app.json`, inside `expo.plugins`, add (after `expo-notifications` is fine):

```json
[
  "@react-native-community/datetimepicker",
  {
    "android": {
      "datePicker": {
        "colorAccent": {
          "light": "#8B5CF6",
          "dark": "#A78BFA"
        },
        "colorControlActivated": {
          "light": "#8B5CF6",
          "dark": "#A78BFA"
        }
      },
      "timePicker": {
        "numbersSelectorColor": {
          "light": "#8B5CF6",
          "dark": "#A78BFA"
        }
      }
    }
  }
]
```

Both light and dark must be set for each color key (plugin requirement).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json app.json
git commit -m "$(cat <<'EOF'
chore: add datetimepicker with ThinkDo Android accent theme

EOF
)"
```

(If the lockfile name differs, e.g. `yarn.lock` / `pnpm-lock.yaml`, stage that file instead.)

---

### Task 3: Field row + system picker wrapper + sheet rework

**Files:**
- Create: `src/components/editor/ReminderFieldRow.tsx`
- Create: `src/components/editor/ReminderDateTimePicker.tsx`
- Modify: `src/components/editor/ReminderEditorSheet.tsx`
- Modify: `src/components/editor/reminderEditorInteractions.ts`
- Modify: `src/components/editor/__tests__/reminderEditorInteractions.test.ts`
- Delete: `src/components/editor/ReminderMonthCalendar.tsx`
- Delete: `src/components/editor/ReminderTimeScroller.tsx`

**Interfaces:**
- Consumes: `withReminderDate`, `withReminderTime`, `tryCommitReminder`, `formatReminderDateValue`, `formatReminderTimeValue` from Task 1; DateTimePicker from Task 2
- Produces:
  - `ReminderFieldRow({ label, value, onPress, selected? })`
  - `ReminderDateTimePicker({ mode, value, visible, minimumDate?, onChange, onDismiss })`
  - Updated `ReminderEditorSheet` with no calendar/scroller imports

- [ ] **Step 1: Slim `reminderEditorInteractions` and its tests**

Replace `src/components/editor/reminderEditorInteractions.ts` with:

```ts
export const REMINDER_DISMISS_DRAG_Y = 100;

export function shouldDismissReminderEditor(translationY: number): boolean {
  "worklet";
  return translationY > REMINDER_DISMISS_DRAG_Y;
}
```

Replace `src/components/editor/__tests__/reminderEditorInteractions.test.ts` with:

```ts
import { shouldDismissReminderEditor } from "../reminderEditorInteractions";

describe("shouldDismissReminderEditor", () => {
  it("dismisses only after a downward drag passes the threshold", () => {
    expect(shouldDismissReminderEditor(100)).toBe(false);
    expect(shouldDismissReminderEditor(101)).toBe(true);
    expect(shouldDismissReminderEditor(-140)).toBe(false);
  });
});
```

Run: `npm test -- --testPathPattern=reminderEditorInteractions.test --no-coverage`

Expected: PASS

- [ ] **Step 2: Create `ReminderFieldRow`**

Create `src/components/editor/ReminderFieldRow.tsx`:

```tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import { font, fontSize, radius, spacing, touchTarget } from "../../lib/theme";
import { useTheme } from "../../lib/themeContext";

export type ReminderFieldRowProps = {
  label: string;
  value: string;
  selected?: boolean;
  onPress: () => void;
};

export function ReminderFieldRow({
  label,
  value,
  selected = false,
  onPress,
}: ReminderFieldRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor:
            selected || pressed ? colors.accentSubtle : colors.surfaceMuted,
          borderColor: selected ? colors.accentBorder : colors.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  label: {
    fontFamily: font.medium,
    fontSize: fontSize.meta,
  },
  value: {
    fontFamily: font.medium,
    fontSize: fontSize.body,
  },
});
```

- [ ] **Step 3: Create `ReminderDateTimePicker`**

Create `src/components/editor/ReminderDateTimePicker.tsx`:

```tsx
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Platform } from "react-native";
import { useTheme } from "../../lib/themeContext";

export type ReminderDateTimePickerProps = {
  mode: "date" | "time";
  value: Date;
  visible: boolean;
  minimumDate?: Date;
  onChange: (next: Date) => void;
  onDismiss: () => void;
};

export function ReminderDateTimePicker({
  mode,
  value,
  visible,
  minimumDate,
  onChange,
  onDismiss,
}: ReminderDateTimePickerProps) {
  const { colors, themeName } = useTheme();

  if (!visible) return null;

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      onDismiss();
      if (event.type !== "set" || !selected) return;
      onChange(selected);
      return;
    }
    if (selected) onChange(selected);
  };

  return (
    <DateTimePicker
      value={value}
      mode={mode}
      display={Platform.OS === "ios" ? "spinner" : "default"}
      is24Hour
      locale="pt-BR"
      minimumDate={minimumDate}
      themeVariant={themeName}
      accentColor={colors.brand}
      onChange={handleChange}
    />
  );
}
```

`useTheme()` already exposes `themeName: "light" | "dark"` and `colors.brand` — use both; do not change `themeContext`.

- [ ] **Step 4: Rewrite `ReminderEditorSheet`**

Replace the body of `src/components/editor/ReminderEditorSheet.tsx` so that:

1. Local private `withDate` / `withTime` are removed; import `withReminderDate`, `withReminderTime`, `tryCommitReminder`, `formatReminderDateValue`, `formatReminderTimeValue`.
2. State: `activePicker: null | "date" | "time"`.
3. Layout order: handle + title → repetition pills → when-section → remove.
4. When-section:
   - `once`: `ReminderFieldRow` Data + Hora; show `ReminderDateTimePicker` when `activePicker` matches
   - `daily`: Hora row + picker
   - `weekly`: `ReminderWeekdayPicker` + Hora row + picker
5. `commit` helper:

```ts
const commit = (next: ItemReminder): boolean => {
  const accepted = tryCommitReminder(next);
  if (!accepted) return false;
  onChange(accepted);
  return true;
};
```

6. Date picker `value`: for `once` use `reminder.at`; for building a date-mode value when somehow needed, still only show date row for `once`.
7. Time picker `value`: construct `Date` with current hour/minute (from `once.at` or `hour`/`minute`).
8. `minimumDate` for date mode: start of today (`new Date()` with hours/min/sec/ms zeroed).
9. Toggle: tapping the active row again on iOS sets `activePicker` to `null`; tapping the other row switches mode.
10. Android: picker visibility is `activePicker !== null`; wrapper calls `onDismiss` after dialog closes.
11. Keep drag-dismiss, overlay, remove button, repetition pills behavior.
12. Remove all imports of `ReminderMonthCalendar` and `ReminderTimeScroller`.
13. Weekday changes: `commit({ kind: "weekly", weekday, hour, minute })` using current hour/minute from reminder.

Full target structure (adapt styles from the existing file’s `StyleSheet`):

```tsx
// imports: Modal, Pressable, StyleSheet, Text, View, gestures, theme,
// reminderHelpers (applyReminderRepetition, repetitionLabel, format*, with*, tryCommit),
// ReminderFieldRow, ReminderDateTimePicker, ReminderWeekdayPicker, shouldDismissReminderEditor

type ActivePicker = "date" | "time" | null;

// inside component:
const [activePicker, setActivePicker] = useState<ActivePicker>(null);
const hour = reminder.kind === "once" ? reminder.at.getHours() : reminder.hour;
const minute =
  reminder.kind === "once" ? reminder.at.getMinutes() : reminder.minute;
const timeValue = new Date();
timeValue.setHours(hour, minute, 0, 0);
const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);

const togglePicker = (which: "date" | "time") => {
  setActivePicker((current) => (current === which ? null : which));
};

// In JSX after title, before remove:
{/* repetition pills — same as today, but call commit(applyReminderRepetition(...)) */}

{reminder.kind === "once" ? (
  <ReminderFieldRow
    label="Data"
    value={formatReminderDateValue(reminder.at)}
    selected={activePicker === "date"}
    onPress={() => togglePicker("date")}
  />
) : null}

{reminder.kind === "weekly" ? (
  <ReminderWeekdayPicker
    selected={reminder.weekday}
    onSelect={(weekday) =>
      commit({
        kind: "weekly",
        weekday,
        hour,
        minute,
      })
    }
  />
) : null}

<ReminderFieldRow
  label="Hora"
  value={formatReminderTimeValue(hour, minute)}
  selected={activePicker === "time"}
  onPress={() => togglePicker("time")}
/>

<ReminderDateTimePicker
  mode={activePicker === "date" ? "date" : "time"}
  value={activePicker === "date" ? reminder.at : timeValue}
  visible={activePicker !== null}
  minimumDate={activePicker === "date" ? startOfToday : undefined}
  onDismiss={() => setActivePicker(null)}
  onChange={(selected) => {
    if (activePicker === "date") {
      commit(withReminderDate(reminder, selected));
      return;
    }
    commit(
      withReminderTime(reminder, selected.getHours(), selected.getMinutes())
    );
  }}
/>
```

Only render `ReminderDateTimePicker` when `activePicker !== null`. When `activePicker === "date"`, `reminder.kind` must be `"once"` (Data row only exists then) — TypeScript: narrow or assert `reminder.at`.

Fix date-mode value safely:

```tsx
{activePicker !== null ? (
  <ReminderDateTimePicker
    mode={activePicker}
    value={
      activePicker === "date" && reminder.kind === "once"
        ? reminder.at
        : timeValue
    }
    visible
    minimumDate={activePicker === "date" ? startOfToday : undefined}
    onDismiss={() => setActivePicker(null)}
    onChange={(selected) => {
      if (activePicker === "date") {
        const accepted = commit(withReminderDate(reminder, selected));
        if (!accepted && Platform.OS === "ios") {
          /* keep spinner; value prop stays previous reminder */
        }
        return;
      }
      commit(
        withReminderTime(
          reminder,
          selected.getHours(),
          selected.getMinutes()
        )
      );
    }}
  />
) : null}
```

Import `Platform` only if used; otherwise omit the unused branch comment and keep behavior simple: failed commit = no `onChange` to parent.

When switching repetition away from `once`, clear `activePicker` if it was `"date"`:

```ts
onPress={() => {
  if (active) return;
  const next = applyReminderRepetition(reminder, option.value);
  if (option.value !== "once") {
    setActivePicker((p) => (p === "date" ? null : p));
  }
  commit(next);
}}
```

- [ ] **Step 5: Delete obsolete components**

Delete:
- `src/components/editor/ReminderMonthCalendar.tsx`
- `src/components/editor/ReminderTimeScroller.tsx`

Grep the repo for `ReminderMonthCalendar`, `ReminderTimeScroller`, `formatMonthYearLabel`, `showsReminderCalendar`, `adjustedTimeScrollerIndex`, `nextTimeScrollerIndex` — expect no remaining references outside docs.

- [ ] **Step 6: Run unit tests**

Run: `npm test -- --no-coverage`

Expected: PASS for reminder-related suites; fix any broken imports.

- [ ] **Step 7: Commit**

```bash
git add src/components/editor/ReminderFieldRow.tsx \
  src/components/editor/ReminderDateTimePicker.tsx \
  src/components/editor/ReminderEditorSheet.tsx \
  src/components/editor/reminderEditorInteractions.ts \
  src/components/editor/__tests__/reminderEditorInteractions.test.ts \
  src/components/editor/ReminderMonthCalendar.tsx \
  src/components/editor/ReminderTimeScroller.tsx
git commit -m "$(cat <<'EOF'
feat(reminders): use system date/time pickers in reminder editor

EOF
)"
```

(Deleted files must be staged so Git records the deletion.)

---

### Task 4: Native rebuild smoke check

**Files:**
- None required (manual verification)

**Interfaces:**
- Consumes: Tasks 1–3 complete on a device/emulator build that includes the new native module + Android theme plugin

- [ ] **Step 1: Rebuild the native app**

Because the Android config plugin and native module changed, rebuild (do not rely on Metro-only reload):

Run: `npx expo run:android`

(On macOS with an iOS target available: also `npx expo run:ios`.)

Expected: build succeeds; app launches.

- [ ] **Step 2: Manual smoke checklist**

On a device/emulator:

1. Open a note/task → Opções → Adicionar lembrete  
2. **once:** tap Data → system date UI → choose a future day → row updates  
3. Tap Hora → system time UI → choose a time → row updates  
4. Switch to Diário → only Hora row; change time  
5. Switch to Semanal → weekday list + Hora; change both  
6. Pick a past time today on **once** → value must not stick as past (rejected)  
7. Remover lembrete → sheet closes; summary gone  
8. Confirm Android dialog accent looks purple-ish (ThinkDo brand)

- [ ] **Step 3: Commit only if Step 4 produced code fixes**

If smoke testing required code fixes, commit those separately with a focused message. If no code changes, skip commit.

```bash
git add -A
git status
# if there are fix files:
git commit -m "$(cat <<'EOF'
fix(reminders): address system picker smoke-test issues

EOF
)"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Rows Data/Hora + system picker on tap | Task 3 |
| Android dialog / iOS spinner under row | Task 3 (`ReminderDateTimePicker`) |
| Brand Android plugin + iOS accent | Task 2 + Task 3 |
| Repetition pills / weekday picker / remove | Task 3 |
| No schema / autosave / web changes | Global constraints |
| Remove calendar + scroller | Task 3 Step 6 |
| Pure commit helpers + tests | Task 1 |
| Native rebuild for plugin | Task 4 |
| Past once rejection | Task 1 `tryCommitReminder` + Task 3 commit |

## Placeholder / consistency check

- Helper names are consistently `withReminderDate` / `withReminderTime` / `tryCommitReminder` across tasks.
- No TBD/TODO left in steps.
- Lockfile name called out as variable in Task 2 commit step.
