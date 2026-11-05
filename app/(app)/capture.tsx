import { Redirect, type Href } from "expo-router";
import { WIDGET_INBOX_CAPTURE_HREF } from "@/lib/inboxWidgetEntry";

export default function CaptureRedirect() {
  return <Redirect href={WIDGET_INBOX_CAPTURE_HREF as Href} />;
}
