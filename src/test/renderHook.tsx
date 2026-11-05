import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

export { act };
export function renderHook<T>(hook: () => T) {
  let current: T;
  let renderer: ReactTestRenderer;
  function Harness() {
    current = hook();
    return null;
  }
  act(() => {
    renderer = create(createElement(Harness));
  });
  return {
    get current() {
      return current!;
    },
    rerender() {
      act(() => renderer.update(createElement(Harness)));
    },
    unmount() {
      act(() => renderer.unmount());
    },
  };
}
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
