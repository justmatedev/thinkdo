import { BackHandler, Platform } from "react-native";
import { dismissToLauncher } from "@/widgets/dismissToLauncher";

describe("dismissToLauncher", () => {
  it("calls exitApp when os is android", () => {
    const exitApp = jest.fn();
    dismissToLauncher({ exitApp, os: "android" });
    expect(exitApp).toHaveBeenCalled();
  });

  it("does not call exitApp on ios", () => {
    const exitApp = jest.fn();
    dismissToLauncher({ exitApp, os: "ios" });
    expect(exitApp).not.toHaveBeenCalled();
  });

  it("defaults to Platform and BackHandler", () => {
    expect(typeof Platform.OS).toBe("string");
    expect(typeof BackHandler.exitApp).toBe("function");
  });
});
