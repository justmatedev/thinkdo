import { BackHandler, Platform } from "react-native";

type DismissDeps = {
  exitApp: () => void;
  os: string;
};

/** Return user to the launcher after widget-driven capture. Android-only effect in v1. */
export function dismissToLauncher(
  deps: DismissDeps = {
    exitApp: () => BackHandler.exitApp(),
    os: Platform.OS,
  }
): void {
  if (deps.os === "android") deps.exitApp();
}
