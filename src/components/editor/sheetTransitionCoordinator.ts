const KEYBOARD_OPEN_FALLBACK_MS = 400;

type Dependencies = {
  isKeyboardVisible: () => boolean;
  subscribeHidden: (callback: () => void) => () => void;
  dismiss: () => void;
  transition: (opening: boolean) => void;
};

/** One cancellable transition path shared by taps, drags and editor focus. */
export function createSheetTransitionCoordinator(deps: Dependencies) {
  let generation = 0;
  let disposed = false;
  let pending = false;
  let unsubscribe: (() => void) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => {
    ++generation;
    pending = false;
    unsubscribe?.();
    unsubscribe = undefined;
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  return {
    isOpening: () => pending,
    cancel,
    activate() { disposed = false; },
    dispose() { cancel(); disposed = true; },
    request(opening: boolean) {
      if (disposed) return;
      cancel();
      if (!opening || !deps.isKeyboardVisible()) {
        deps.transition(opening);
        return;
      }
      pending = true;
      const version = generation;
      const finish = () => {
        if (disposed || !pending || version !== generation) return;
        cancel();
        deps.transition(true);
      };
      unsubscribe = deps.subscribeHidden(finish);
      timer = setTimeout(finish, KEYBOARD_OPEN_FALLBACK_MS);
      deps.dismiss();
    },
  };
}
