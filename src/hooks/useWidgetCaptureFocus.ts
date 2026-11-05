import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { InboxWidgetEntry } from "@/lib/inboxWidgetEntry";
import { isWidgetCaptureLink } from "@/widgets/widgetLinks";

type Options = {
  entry: InboxWidgetEntry;
  loading: boolean;
  onWidgetCaptureOpen: () => void;
};

/** Focus capture field on every widget open, including warm resume with the same URL. */
export function useWidgetCaptureFocus({
  entry,
  loading,
  onWidgetCaptureOpen,
}: Options) {
  const router = useRouter();
  const [focusEpoch, setFocusEpoch] = useState(0);
  const pendingRef = useRef(false);
  const prevFocusCaptureRef = useRef(false);

  const requestFocus = useCallback(() => {
    setFocusEpoch((epoch) => epoch + 1);
  }, []);

  const clearWidgetQueryParams = useCallback(() => {
    router.setParams({ focus: "", source: "" });
  }, [router]);

  const openFromWidget = useCallback(() => {
    onWidgetCaptureOpen();
    pendingRef.current = true;
    if (!loading) {
      requestFocus();
      clearWidgetQueryParams();
      pendingRef.current = false;
    }
  }, [clearWidgetQueryParams, loading, onWidgetCaptureOpen, requestFocus]);

  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      if (!isWidgetCaptureLink(url)) return;
      openFromWidget();
    });
    return () => sub.remove();
  }, [openFromWidget]);

  useEffect(() => {
    const becameFocused =
      entry.focusCapture && entry.fromWidget && !prevFocusCaptureRef.current;
    prevFocusCaptureRef.current = entry.focusCapture;
    if (!becameFocused) return;
    openFromWidget();
  }, [entry.focusCapture, entry.fromWidget, openFromWidget]);

  useEffect(() => {
    if (loading || !pendingRef.current) return;
    requestFocus();
    clearWidgetQueryParams();
    pendingRef.current = false;
  }, [clearWidgetQueryParams, loading, requestFocus]);

  return {
    focusEpoch,
    autoFocus: entry.focusCapture && !loading,
  };
}
