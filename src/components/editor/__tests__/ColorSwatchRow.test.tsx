import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { ScrollView, StyleSheet, View } from 'react-native';
let mockScheme: 'light' | 'dark' = 'light';
jest.mock('react-native/Libraries/Components/ScrollView/ScrollView', () => ({
  __esModule: true,
  default: require('react').forwardRef((props: { children: React.ReactNode }, ref: unknown) => require('react').createElement(require('react-native').View, { ...props, ref }, props.children)),
}));
jest.mock('@/lib/themeContext', () => ({ useTheme: () => ({ colors: require('@/lib/theme').themes[mockScheme], themeName: mockScheme }) }));
jest.mock('@/components/ui/AppIcon', () => ({ AppIcon: () => null }));
import { ColorSwatchRow } from '../ColorSwatchRow';
import { AppIcon } from '@/components/ui/AppIcon';
let tree: ReactTestRenderer;
afterEach(() => { if (tree) act(() => tree.unmount()); });
for (const scheme of ['light', 'dark'] as const) test(`has nine reachable 44×44 cells and a decorative selected check in ${scheme}`, () => {
  mockScheme = scheme;
  const onChange = jest.fn();
  act(() => { tree = create(createElement(ColorSwatchRow, { value: 'purple', onChange })); });
  const scroll = tree.root.findByType(ScrollView);
  expect(scroll.props.horizontal).toBe(true);
  expect(scroll.props.showsHorizontalScrollIndicator).toBe(false);
  const buttons = tree.root.findAll(n => n.props.accessibilityRole === "button" && typeof n.props.onPress === "function");
  expect(buttons).toHaveLength(9);
  for (const button of buttons) {
    const style = StyleSheet.flatten(button.props.style);
    expect(style.width).toBeGreaterThanOrEqual(44); expect(style.height).toBeGreaterThanOrEqual(44);
    expect(style.flexShrink).toBe(0);
  }
  expect(buttons[0].props.accessibilityLabel).toBe('Sem cor');
  expect(buttons[5].props.accessibilityState.selected).toBe(true);
  act(() => buttons[8].props.onPress()); expect(onChange).toHaveBeenCalledWith('gray');
  const check = tree.root.findAllByType(AppIcon).find(n => n.props.name === 'check')!;
  expect(check).toBeTruthy();
  expect(check.parent?.props.importantForAccessibility).toBe('no-hide-descendants');
  expect(check.props.color).toBe(scheme === 'light' ? '#FFFFFF' : '#000000');
});
test('preserves no-color icon and disabled states', () => {
  act(() => { tree = create(createElement(ColorSwatchRow, { value: null, disabled: true, onChange: jest.fn() })); });
  const buttons = tree.root.findAll(n => n.props.accessibilityRole === "button" && typeof n.props.onPress === "function");
  expect(buttons[0].props.accessibilityState.selected).toBe(true);
  expect(buttons.every(n => n.props.disabled)).toBe(true);
  expect(tree.root.findAllByType(AppIcon).map(n => n.props.name)).toEqual(['circleOff']);
  expect(tree.root.findAllByType(View).length).toBeGreaterThan(0);
});
