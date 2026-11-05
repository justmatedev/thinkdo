import Constants from "expo-constants";
import appConfig from "../../app.json";

export function getAppVersionLabel(): string {
  const version =
    appConfig.expo.version.trim() ||
    Constants.expoConfig?.version?.trim();
  return version ? `Thinkdo ${version}` : "Thinkdo";
}
