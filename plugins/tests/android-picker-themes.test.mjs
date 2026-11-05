import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { withPlugins, compileModsAsync, XML } = require('@expo/config-plugins');
const app = require('../../app.json').expo;

test('prebuild generates light and dark native picker styles and preserves other resources on rerun', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'thinkdo-picker-themes-'));
  const res = path.join(root, 'android/app/src/main/res');
  try {
    await mkdir(path.join(res, 'values'), { recursive: true });
    await mkdir(path.join(res, 'values-night'), { recursive: true });
    await writeFile(path.join(res, 'values/styles.xml'), '<resources><style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar" /></resources>');
    await writeFile(path.join(res, 'values-night/styles.xml'), '<resources><style name="OtherTheme" parent="Theme.AppCompat.Dialog" /></resources>');
    const entries = app.plugins.filter((entry) => /datetimepicker|withAndroidPickerThemes/.test(Array.isArray(entry) ? entry[0] : entry));
    for (let run = 0; run < 2; run++) {
      const config = withPlugins({ name: app.name, slug: app.slug, _internal: { projectRoot: root } }, entries.map((entry) => {
        const [name, options] = Array.isArray(entry) ? entry : [entry, undefined];
        return [name.startsWith('.') ? path.resolve(name) : require.resolve(`${name}/app.plugin.js`), options];
      }));
      await compileModsAsync(config, { projectRoot: root, platforms: ['android'] });
      const day = await XML.parseXMLAsync(await readFile(path.join(res, 'values/styles.xml'), 'utf8'));
      const night = await XML.parseXMLAsync(await readFile(path.join(res, 'values-night/styles.xml'), 'utf8'));
      const style = (xml, name) => xml.resources.style.find((entry) => entry.$.name === name);
      assert.equal(style(day, 'DatePickerDialogTheme').$.parent, 'Theme.AppCompat.Light.Dialog');
      assert.equal(style(day, 'TimePickerTheme').$.parent, 'android:Widget.Material.Light.TimePicker');
      assert.equal(style(night, 'DatePickerDialogTheme')?.$.parent, 'android:Theme.Material.Dialog.Alert');
      assert.equal(style(night, 'TimePickerTheme')?.$.parent, 'android:Widget.Material.TimePicker');
      for (const name of ['DatePickerDialogTheme', 'TimePickerTheme']) {
        assert.equal(night.resources.style.filter((entry) => entry.$.name === name).length, 1);
        for (const item of style(day, name).item) {
          assert.ok(style(night, name).item.some((entry) => entry.$.name === item.$.name && entry._ === item._));
        }
      }
      const dateItems = Object.fromEntries(style(night, 'DatePickerDialogTheme').item.map((item) => [item.$.name, item._]));
      assert.equal(dateItems['android:colorAccent'], '@color/datePicker_colorAccent');
      assert.equal(dateItems['android:colorControlActivated'], '@color/datePicker_colorControlActivated');
      assert.ok(style(night, 'OtherTheme'));
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});
