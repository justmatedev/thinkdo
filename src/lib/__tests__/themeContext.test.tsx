import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@/widgets/refreshWidgets', () => ({ refreshCaptureWidgets: jest.fn().mockResolvedValue(undefined) }));
import { ThemeProvider, useTheme } from '@/lib/themeContext';
import { THEME_STORAGE_KEY } from '@/lib/theme';

let tree: ReactTestRenderer;
let nativeTheme: jest.SpyInstance;
beforeEach(async () => {
  await AsyncStorage.clear();
  nativeTheme = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});
});
afterEach(() => { act(() => tree?.unmount()); nativeTheme.mockRestore(); });
async function mount() {
  let current!: ReturnType<typeof useTheme>;
  function Consumer() { current = useTheme(); return null; }
  await act(async () => { tree = create(createElement(ThemeProvider, null, createElement(Consumer))); });
  return { get current() { return current; } };
}
test('restores the saved dark preference to native dialogs on startup', async () => {
  await AsyncStorage.setItem(THEME_STORAGE_KEY, 'dark');
  const theme = await mount();
  expect(theme.current.themeName).toBe('dark');
  expect(nativeTheme).toHaveBeenLastCalledWith('dark');
});
test('keeps native dialogs in sync with light, dark and automatic preference', async () => {
  const theme = await mount();
  act(() => theme.current.setPreference('dark'));
  expect(nativeTheme).toHaveBeenLastCalledWith('dark');
  act(() => theme.current.setPreference('light'));
  expect(nativeTheme).toHaveBeenLastCalledWith('light');
  act(() => theme.current.setPreference('system'));
  expect(nativeTheme).toHaveBeenLastCalledWith('unspecified');
});
