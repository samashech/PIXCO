export {};
declare global {
  interface Window {
    pixcoDesktop?: { onPause: (callback: () => void) => () => void };
  }
}
