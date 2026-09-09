# Reminder editor: Confirm before save

**Date:** 2026-09-07  
**Status:** Approved (conversation)

## Behavior

- Sheet edits a **local draft** only
- **Confirmar** commits draft via `onChange` then closes (triggers existing autosave + schedule)
- Dismiss (backdrop / drag / back) **discards** draft — item unchanged
- **Remover lembrete** still immediate `onChange(null)` + close (only when editing an existing saved reminder)
- **Adicionar lembrete** opens sheet with `defaultReminderDraft()` **without** writing to the item until Confirmar

## UI

Bottom row only (`ModalActionRow`):
- **Editing existing:** left **Remover lembrete** (`cancelVariant=danger`) | right **Confirmar**
- **Adding new:** left **Cancelar** | right **Confirmar**
- Backdrop / drag / Android back still discard the draft without removing a saved reminder
