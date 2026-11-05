const fs = require("fs/promises");
const path = require("path");
const {
  AndroidConfig,
  XML,
  withFinalizedMod,
  createRunOncePlugin,
} = require("@expo/config-plugins");

const NIGHT_PARENTS = {
  DatePickerDialogTheme: "android:Theme.Material.Dialog.Alert",
  TimePickerTheme: "android:Widget.Material.TimePicker",
};

function withAndroidPickerThemes(config) {
  // Run after the datetimepicker plugin writes its light styles. Android then
  // selects the matching values-night resource when Appearance switches modes.
  return withFinalizedMod(config, ["android", async (config) => {
    const res = path.join(config.modRequest.platformProjectRoot, "app/src/main/res");
    const day = await AndroidConfig.Styles.readStylesXMLAsync({
      path: path.join(res, "values/styles.xml"),
    });
    const nightPath = path.join(res, "values-night/styles.xml");
    const night = await AndroidConfig.Styles.readStylesXMLAsync({ path: nightPath });
    const styles = night.resources.style ?? [];

    for (const [name, parent] of Object.entries(NIGHT_PARENTS)) {
      const source = day.resources.style?.find((style) => style.$.name === name);
      if (!source) throw new Error(`Missing datetimepicker style: ${name}`);
      const next = { ...source, $: { ...source.$, parent } };
      if (name === "DatePickerDialogTheme") {
        // DatePickerDialog is a framework dialog. Its calendar must inherit the
        // framework dark theme, including backgrounds and day/year text colors.
        // The upstream plugin provides AppCompat color attributes; mirror them
        // into Android's namespace for the native dialog to use the same accent.
        const nativeColors = (source.item ?? [])
          .filter((item) => item.$.name.startsWith("color"))
          .map((item) => ({ ...item, $: { ...item.$, name: `android:${item.$.name}` } }));
        next.item = [...(source.item ?? []), ...nativeColors];
      }
      const index = styles.findIndex((style) => style.$.name === name);
      if (index >= 0) styles[index] = next;
      else styles.push(next);
    }

    night.resources.style = styles;
    await fs.mkdir(path.dirname(nightPath), { recursive: true });
    await XML.writeXMLAsync({ path: nightPath, xml: night });
    return config;
  }]);
}

module.exports = createRunOncePlugin(
  withAndroidPickerThemes,
  "with-android-picker-themes",
  "1.0.0"
);
