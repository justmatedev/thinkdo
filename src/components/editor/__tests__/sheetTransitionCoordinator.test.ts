import { createSheetTransitionCoordinator } from '../sheetTransitionCoordinator';

function setup(visible = true) {
  let listener = () => {};
  const remove = jest.fn();
  const transition = jest.fn();
  const subscribeHidden = jest.fn((callback: () => void) => { listener = callback; return remove; });
  const dismiss = jest.fn();
  const coordinator = createSheetTransitionCoordinator({
    isKeyboardVisible: () => visible, subscribeHidden, dismiss, transition,
  });
  return { ...coordinator, transition, subscribeHidden, dismiss, remove, hidden: () => listener(), getListener: () => listener };
}
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
test('touch and drag can use one pending opening, waiting for keyboard hide', () => {
  const c = setup();
  c.request(true);
  expect(c.isOpening()).toBe(true);
  expect(c.dismiss).toHaveBeenCalledTimes(1);
  expect(c.transition).not.toHaveBeenCalled();
  c.hidden();
  expect(c.transition).toHaveBeenCalledWith(true);
  jest.advanceTimersByTime(400);
  expect(c.transition).toHaveBeenCalledTimes(1);
});
test('uses the 400ms fallback exactly once', () => {
  const c = setup(); c.request(true);
  jest.advanceTimersByTime(399); expect(c.transition).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1); c.hidden();
  expect(c.transition).toHaveBeenCalledTimes(1);
});
test('closing or focus cancels pending opening and ignores late native callbacks', () => {
  const c = setup(); c.request(true); const late = c.getListener();
  c.request(false); late(); jest.runAllTimers();
  expect(c.transition.mock.calls).toEqual([[false]]);
  expect(c.remove).toHaveBeenCalled();
});
test('keeps one listener and one fallback after repeated opening requests', () => {
  const c = setup(); c.request(true); const late = c.getListener(); c.request(true);
  late(); expect(c.transition).not.toHaveBeenCalled();
  c.hidden(); jest.runAllTimers(); expect(c.transition).toHaveBeenCalledTimes(1);
});
test('subscribes before dismissing so synchronous hide is not lost', () => {
  const c = setup(); c.dismiss.mockImplementation(() => c.hidden()); c.request(true);
  expect(c.transition).toHaveBeenCalledWith(true);
});
test('opens immediately without a keyboard and ignores requests after disposal', () => {
  const c = setup(false); c.request(true);
  expect(c.transition).toHaveBeenCalledWith(true);
  c.dispose(); c.request(true); expect(c.transition).toHaveBeenCalledTimes(1);
  c.activate(); c.request(true); expect(c.transition).toHaveBeenCalledTimes(2);
});
