"use no memo";

import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { auth } from "@/lib/firebase";
import { updateItem } from "@/services/items";
import { resolveCaptureWidgetRepresentation } from "@/widgets/capture/captureWidgetRender";
import { clearWidgetThemePreference } from "@/widgets/capture/widgetThemePreference";
import { CLICK_TOGGLE_DONE } from "@/widgets/inbox/inboxWidgetActions";
import { clearInboxWidgetInstancePrefs } from "@/widgets/inbox/inboxWidgetFilter";
import { resolveInboxWidgetRepresentation } from "@/widgets/inbox/inboxWidgetRender";
import { WIDGET_NATIVE_NAMES } from "@/widgets/registry";
import { patchInboxSnapshotItemDone } from "@/widgets/snapshot";
import { readAuthenticatedInboxSnapshot } from "@/widgets/snapshot/authenticatedSnapshot";
import { getInboxSession, isInboxSessionCurrent } from "@/widgets/snapshot/session";
import { refreshInboxWidgets } from "@/widgets/refreshWidgets";

export async function widgetTaskHandler(
  props: WidgetTaskHandlerProps
): Promise<void> {
  "use no memo";
  const name = props.widgetInfo.widgetName;

  if (name === WIDGET_NATIVE_NAMES.inbox) {
    const renderInbox = async () => {
      try {
        props.renderWidget(
          await resolveInboxWidgetRepresentation(
            props.widgetInfo.widgetId,
            props.widgetInfo.width,
            props.widgetInfo.height
          )
        );
      } catch {
        // Keep the widget alive even if snapshot/render fails.
      }
    };

    switch (props.widgetAction) {
      case "WIDGET_ADDED":
      case "WIDGET_UPDATE":
      case "WIDGET_RESIZED":
        await renderInbox();
        break;
      case "WIDGET_DELETED":
        await clearInboxWidgetInstancePrefs(props.widgetInfo.widgetId);
        break;
      case "WIDGET_CLICK":
        if (props.clickAction === CLICK_TOGGLE_DONE) {
          const itemId = String(props.clickActionData?.itemId ?? "");
          const done = Boolean(props.clickActionData?.done);
          let saved = false;
          try {
            const snapshot = await readAuthenticatedInboxSnapshot();
            const uid = auth.currentUser?.uid;
            const session = uid ? getInboxSession(uid) : null;
            if (uid && itemId && snapshot.uid === uid && snapshot.items.some((row) => row.id === itemId) && isInboxSessionCurrent(session)) {
              await updateItem(uid, itemId, { done });
              await patchInboxSnapshotItemDone(itemId, done, session!);
              saved = true;
            }
          } catch {
            // Leave the snapshot unchanged when persistence fails.
          }
          await renderInbox();
          if (saved) {
            try {
              await refreshInboxWidgets();
            } catch {
              // A refresh failure must not undo a successfully saved task.
            }
          }
        }
        break;
      default:
        break;
    }
    return;
  }

  if (name !== WIDGET_NATIVE_NAMES.capture) return;

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED": {
      const representation = await resolveCaptureWidgetRepresentation(
        props.widgetInfo.widgetId,
        props.widgetInfo.width,
        props.widgetInfo.height
      );
      props.renderWidget(representation);
      break;
    }
    case "WIDGET_DELETED": {
      await clearWidgetThemePreference(props.widgetInfo.widgetId);
      break;
    }
    case "WIDGET_CLICK":
      break;
    default:
      break;
  }
}
