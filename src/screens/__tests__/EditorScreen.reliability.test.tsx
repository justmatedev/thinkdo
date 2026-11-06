import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Text, TextInput, ScrollView, StyleSheet } from 'react-native';
const mockBack = jest.fn();
const mockFinishTitle = jest.fn();
let mockOnline = true;
let mockState: Record<string, unknown>;
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }), useLocalSearchParams: () => ({ id: 'a' }) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View, useSafeAreaInsets: () => ({ bottom: 0 }) }));
jest.mock('@/lib/themeContext', () => ({ useTheme: () => ({ colors: {}, themeName: 'light' }) }));
jest.mock('@/hooks/useOnline', () => ({ useOnline: () => mockOnline }));
jest.mock('@/hooks/useItemEditor', () => ({ useItemEditor: () => mockState }));
jest.mock('@/components/ui/AppIcon', () => ({ AppIcon: () => null }));
jest.mock('@/components/editor/EditorOptionsSheet', () => ({ EditorOptionsSheet: () => null }));
jest.mock('@/components/editor/EditorLoadingSkeleton', () => ({ EditorLoadingSkeleton: () => null }));
jest.mock('@/components/ui/AppModal', () => ({ AppModal: ({ visible, children, actions, title }: { visible: boolean; children: React.ReactNode; actions: React.ReactNode; title: string }) => visible ? require('react').createElement(require('react-native').View, null, title, children, actions) : null }));
import EditorScreen from '../../../app/(app)/item/[id]';
import { EditorOptionsSheet } from '@/components/editor/EditorOptionsSheet';
import { SaveIndicator } from '@/components/editor/SaveIndicator';
import { DeleteItemsDialog } from '@/components/items/DeleteItemsDialog';
let tree: ReactTestRenderer;
beforeEach(() => {
  mockOnline = true;
  mockBack.mockClear(); mockFinishTitle.mockClear();
  mockState = { item: { id: 'a', type: 'task', title: 'Title', body: 'Body', done: true, color: null, reminder: { kind: 'daily', hour: 9, minute: 0 } },
    status: 'saved', localPersistence: 'idle', fieldErrors: {}, recoveryConflicts: [], recoveryDraft: null, deleting: false,
    update: jest.fn(), convert: jest.fn(), remove: jest.fn(), retrySave: jest.fn(), finishTitleEditing: mockFinishTitle, recoverDraft: jest.fn(), discardDraft: jest.fn() };
});
afterEach(() => { if (tree) act(() => tree.unmount()); });
function render() { act(() => { tree = create(createElement(EditorScreen)); }); }
test('shows inline validation and finalizes the title on blur', () => {
  mockState.fieldErrors = { title: 'Título inválido', body: 'Texto longo' };
  render();
  act(() => tree.root.findAllByType(TextInput)[0].props.onBlur());
  expect(mockFinishTitle).toHaveBeenCalled();
  const text = tree.root.findAllByType(Text).map(n => n.props.children);
  expect(text).toContain('Título inválido'); expect(text).toContain('Texto longo');
});
test('locks inputs while deleting and exposes deletion errors', () => {
  mockState.deleting = true; mockState.deleteError = 'Falha ao excluir';
  render();
  expect(tree.root.findAllByType(TextInput).every(n => n.props.editable === false)).toBe(true);
  expect(tree.root.findByType(DeleteItemsDialog).props.error).toBe('Falha ao excluir');
});
test('communicates paused reminders and local-only drafts', () => {
  mockState.status = 'draft'; render();
  expect(tree.root.findByType(EditorOptionsSheet).props.reminderPaused).toBe(true);
  expect(tree.root.findByType(SaveIndicator).findByType(Text).props.children).toBe('Rascunho neste aparelho');
});
test('blocks editing until a recovery choice and warns of conflicting content', () => {
  mockState.recoveryDraft = { patch: { body: 'Local' }, original: { body: 'Old' } }; mockState.recoveryConflicts = ['body'];
  render();
  expect(tree.root.findAllByType(TextInput).every(n => n.props.editable === false)).toBe(true);
  expect(JSON.stringify(tree.toJSON())).toContain('substituir');
});
test('keeps missing-item text selectable without navigating back automatically', () => {
  mockState.item = null; mockState.missing = true; mockState.notFound = false;
  mockState.recoveryDraft = { patch: { body: 'Recover deleted text' }, original: { title: 'Deleted', body: '' } };
  render();
  expect(mockBack).not.toHaveBeenCalled();
  expect(tree.root.findAllByType(Text).some(n => n.props.selectable)).toBe(true);
  expect(JSON.stringify(tree.toJSON())).toContain('Recover deleted text');
});

test('shows durable local edits as a draft while a network write waits offline', () => {
  mockOnline = false; mockState.status = 'saving'; mockState.localPersistence = 'saved';
  render();
  expect(tree.root.findByType(SaveIndicator).findByType(Text).props.children).toBe('Rascunho neste aparelho');
});

test('reserves space below editor text for the measured enlarged options header', () => {
  render();
  act(() => tree.root.findByType(EditorOptionsSheet).props.onCollapsedHeightChange(120));
  const scroll = tree.root.findByType(ScrollView);
  expect(StyleSheet.flatten(scroll.props.contentContainerStyle).paddingBottom).toBe(136);
});
