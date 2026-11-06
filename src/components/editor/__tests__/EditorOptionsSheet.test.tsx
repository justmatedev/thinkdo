import { createElement, createRef } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Keyboard, ScrollView, StyleSheet, type KeyboardEvent } from 'react-native';
let mockDimensions = { width: 320, height: 600, scale: 1, fontScale: 1 };
let mockInsets = { top: 100, bottom: 24, left: 0, right: 0 };
let mockPan: Record<string, (event: { translationY: number }, success?: boolean) => void> = {};
const mockTiming = jest.fn((value: number) => value);
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => mockDimensions }));
jest.mock('react-native/Libraries/Components/ScrollView/ScrollView', () => ({
  __esModule: true,
  default: require('react').forwardRef((props: { children: React.ReactNode }, ref: unknown) => require('react').createElement(require('react-native').View, { ...props, ref }, props.children)),
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => mockInsets }));
jest.mock('@/lib/themeContext', () => ({ useTheme: () => ({ colors: require('@/lib/theme').themes.dark, themeName: 'dark' }) }));
jest.mock('@/components/ui/AppIcon', () => ({ AppIcon: () => null }));
jest.mock('@/features/reminders/components/ReminderSection', () => ({ ReminderSection: () => null }));
jest.mock('react-native-reanimated', () => ({ __esModule: true,
  default: { View: require('react-native').View },
  useSharedValue: (value: unknown) => require('react').useRef({ value }).current,
  useAnimatedStyle: (fn: () => unknown) => fn(),
  withTiming: (...args: [number]) => mockTiming(...args), runOnJS: (fn: unknown) => fn,
  Easing: { inOut: (v: unknown) => v, cubic: 0 },
}));
jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
  Gesture: { Pan: () => {
    const gesture = {
      onStart: (fn: typeof mockPan[string]) => { mockPan.onStart = fn; return gesture; },
      onBegin: (fn: typeof mockPan[string]) => { mockPan.onStart = fn; return gesture; },
      onUpdate: (fn: typeof mockPan[string]) => { mockPan.onUpdate = fn; return gesture; },
      onEnd: (fn: typeof mockPan[string]) => { mockPan.onEnd = fn; return gesture; },
      onFinalize: (fn: typeof mockPan[string]) => { mockPan.onFinalize = fn; return gesture; },
    }; return gesture;
  } },
}));
import { EditorOptionsSheet } from '../EditorOptionsSheet';
let tree: ReactTestRenderer;
const props = { online: true, isTask: false, color: null, reminder: null, onConvert: jest.fn(), onColorChange: jest.fn(), onReminderChange: jest.fn() };
let visible = false;
const keyboardListeners = new Map<string, Set<(event: KeyboardEvent) => void>>();
beforeEach(() => {
  jest.useFakeTimers(); mockPan = {}; mockTiming.mockClear(); visible = false;
  mockDimensions = { width: 320, height: 600, scale: 1, fontScale: 1 };
  mockInsets = { top: 100, bottom: 24, left: 0, right: 0 };
  keyboardListeners.clear();
  jest.spyOn(Keyboard, 'isVisible').mockImplementation(() => visible);
  jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  jest.spyOn(Keyboard, 'addListener').mockImplementation((event, listener) => {
    const listeners = keyboardListeners.get(event) ?? new Set();
    listeners.add(listener); keyboardListeners.set(event, listeners);
    return { remove: () => { listeners.delete(listener); } } as ReturnType<typeof Keyboard.addListener>;
  });
});
afterEach(() => { if (tree) act(() => tree.unmount()); jest.restoreAllMocks(); jest.useRealTimers(); });
function body() { return tree.root.findAllByType(ScrollView).find(n => !n.props.horizontal)!; }
function render(extra: object = {}) { act(() => { tree = create(createElement(EditorOptionsSheet, { ...props, ...extra })); }); }
function header() { return tree.root.findByProps({ testID: 'editor-options-header' }); }
function measure(headerHeight = 56, contentHeight = 400) {
  act(() => {
    header().props.onLayout({ nativeEvent: { layout: { height: headerHeight } } });
    body().props.onContentSizeChange(320, contentHeight);
  });
}
function keyboard(event: string) { for (const listener of keyboardListeners.get(event) ?? []) listener({} as KeyboardEvent); }
test('hides collapsed controls from accessibility and touch while keeping header accessible', () => {
  render();
  expect(body().props.importantForAccessibility).toBe('no-hide-descendants');
  expect(body().props.accessibilityElementsHidden).toBe(true);
  expect(body().props.pointerEvents).toBe('none'); expect(body().props.scrollEnabled).toBe(false);
  expect(header().props.accessibilityLabel).toBe('Abrir opções');
  measure(); act(() => header().props.onPress());
  expect(header().props.accessibilityState.expanded).toBe(true);
  expect(body().props.importantForAccessibility).toBe('auto');
  expect(body().props.scrollEnabled).toBe(true);
});
test('measures intrinsic content, keeps one safe-area footer, and reports enlarged collapsed height', () => {
  const onCollapsedHeightChange = jest.fn(); render({ onCollapsedHeightChange });
  measure(96, 900); act(() => header().props.onPress());
  expect(onCollapsedHeightChange).toHaveBeenLastCalledWith(120);
  const sheet = tree.root.findByProps({ testID: 'editor-options-sheet' });
  expect(StyleSheet.flatten(sheet.props.style).height).toBe(500);
  expect(StyleSheet.flatten(tree.root.findByProps({ testID: 'editor-options-footer' }).props.style).height).toBe(24);
  expect(StyleSheet.flatten(body().props.contentContainerStyle).paddingBottom).toBe(8);
  mockTiming.mockClear(); act(() => body().props.onContentSizeChange(320, 1100));
  expect(mockTiming).not.toHaveBeenCalled();
});
test('remeasures orientation and font size without forcing a new opening animation', () => {
  render(); measure(56, 600); act(() => header().props.onPress()); mockTiming.mockClear();
  mockDimensions = { width: 600, height: 320, scale: 1, fontScale: 2 };
  act(() => tree.update(createElement(EditorOptionsSheet, props)));
  measure(96, 1100); expect(mockTiming).not.toHaveBeenCalled();
  act(() => header().props.onPress()); act(() => header().props.onPress());
  expect(StyleSheet.flatten(tree.root.findByProps({ testID: 'editor-options-sheet' }).props.style).height).toBe(220);
});
test('touch and drag wait for keyboard hide and a focus collapse cancels pending openings', () => {
  const collapseRef = createRef<(() => void) | null>(); render({ collapseRef }); measure();
  visible = true; act(() => keyboard('keyboardDidShow'));
  act(() => header().props.onPress());
  expect(header().props.accessibilityState.expanded).toBe(false);
  act(() => collapseRef.current?.());
  act(() => { visible = false; keyboard('keyboardDidHide'); jest.runAllTimers(); });
  expect(header().props.accessibilityState.expanded).toBe(false);
  visible = true; act(() => keyboard('keyboardDidShow'));
  act(() => { mockPan.onStart({ translationY: 0 }); mockPan.onUpdate({ translationY: -400 }); mockPan.onEnd({ translationY: -400 }); });
  expect(header().props.accessibilityState.expanded).toBe(false);
  act(() => { visible = false; keyboard('keyboardDidHide'); });
  expect(header().props.accessibilityState.expanded).toBe(true);
});
test('a second header tap cancels a pending opening and unmount removes all listeners', () => {
  render(); measure(); visible = true; act(() => keyboard('keyboardDidShow'));
  act(() => header().props.onPress()); act(() => header().props.onPress());
  act(() => { visible = false; keyboard('keyboardDidHide'); jest.runAllTimers(); });
  expect(header().props.accessibilityState.expanded).toBe(false);
  act(() => tree.unmount());
  expect([...keyboardListeners.values()].every(listeners => listeners.size === 0)).toBe(true);
});
