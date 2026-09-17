export {};
declare global {
  interface Window {
    brickboxDesktop?: { onPause: (callback: () => void) => () => void };
  }
}
