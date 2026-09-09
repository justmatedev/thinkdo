# Weekly reminder: multiple weekdays

**Date:** 2026-09-07  
**Status:** Approved  
**Depends on:** reminder system picker UX

## Goal

Allow selecting **one or more** weekdays for `kind: "weekly"` reminders so the same time fires on each chosen day.

## Decision

- Model: `weekdays: ReminderWeekday[]` (replace singular `weekday`)
- UI: multi-select toggle; **at least one day always selected** (cannot clear the last)
- Scheduling: one local `WEEKLY` notification per selected weekday
- Legacy: parse old `{ weekday: N }` as `{ weekdays: [N] }`

## Data

```ts
| {
    kind: "weekly";
    weekdays: ReminderWeekday[]; // unique, sorted ascending, length >= 1
    hour: number;
    minute: number;
  }
```

## UI

- `ReminderWeekdayPicker`: `selected: ReminderWeekday[]`, toggle on press
- Pressing the only selected day is a no-op
- Switching to Semanal: default `[today’s weekday]` (same as today’s single-day default)
- Options summary: e.g. `Toda seg, qua · 15:00`; if all seven days: `Todos os dias · HH:mm`

## Scheduling

- Notification ids: `reminder:{itemId}:w{weekday}` for weekly multi; cancel all `reminder:{itemId}` and `reminder:{itemId}:w*` when rescheduling/clearing
- Keep existing once/daily single-id behavior (`reminder:{itemId}`)
- `reconcileReminders` must cancel orphan weekday ids

## Non-goals

- Changing once/daily
- Web reminder UI
- Allowing zero weekdays
