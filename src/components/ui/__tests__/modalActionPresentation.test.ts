import { themes } from "@/lib/theme";
import { getConfirmButtonColors } from "@/components/ui/modalActionPresentation";

describe("getConfirmButtonColors", () => {
  const light = themes.light;

  it("uses action tokens for default", () => {
    expect(getConfirmButtonColors("default", light)).toEqual({
      background: light.action,
      pressed: light.actionPressed,
      text: light.textInverse,
    });
  });

  it("uses danger for danger variant", () => {
    expect(getConfirmButtonColors("danger", light)).toEqual({
      background: light.danger,
      pressed: light.danger,
      text: light.textInverse,
    });
  });
});
