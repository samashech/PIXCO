import { useCallback, useEffect, useRef, useState } from "react";
/** Promote the existing LCD element. The canvas/engine never move or remount. */
export function useLCDFullscreen(
  stage: React.RefObject<HTMLDivElement | null>,
) {
  const [immersive, setImmersive] = useState(false);
  const nativeOwned = useRef(false),
    pendingExit = useRef<Promise<void> | null>(null);
  const active = useRef(false),
    transitionUntil = useRef(0),
    previousFocus = useRef<HTMLElement | null>(null);
  const exit = useCallback(async () => {
    transitionUntil.current = performance.now() + 350;
    active.current = false;
    nativeOwned.current = false;
    setImmersive(false);
    if (document.fullscreenElement === stage.current) {
      const pending = document.exitFullscreen().catch(() => {});
      pendingExit.current = pending;
      await pending;
      if (pendingExit.current === pending) pendingExit.current = null;
    }
  }, [stage]);
  const toggle = useCallback(async () => {
    if (active.current) {
      await exit();
      return;
    }
    if (pendingExit.current) await pendingExit.current;
    previousFocus.current = document.activeElement as HTMLElement | null;
    active.current = true;
    transitionUntil.current = performance.now() + 350;
    setImmersive(true);
    const element = stage.current;
    if (!element) return;
    // Synchronous request preserves browser user activation. Rejection keeps CSS immersive mode.
    try {
      if (!document.fullscreenElement && element.requestFullscreen) {
        await element.requestFullscreen();
        nativeOwned.current =
          active.current && document.fullscreenElement === element;
      }
    } catch {
      /* Unsupported or denied: CSS fallback is already active. */
    }
    if (!active.current && document.fullscreenElement === element)
      try {
        await document.exitFullscreen();
      } catch {
        /* Exit already handled. */
      }
    element
      .querySelector<HTMLCanvasElement>("canvas.game-canvas")
      ?.focus({ preventScroll: true });
  }, [stage, exit]);
  useEffect(() => {
    const hotkey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (active.current && event.code === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        void exit();
        return;
      }
      if (
        (event.target as HTMLElement)?.closest(
          'input,select,textarea,[contenteditable="true"]',
        )
      )
        return;
      if (event.code === "KeyF") {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!event.repeat) void toggle();
      }
    };
    const changed = () => {
      if (
        !document.fullscreenElement &&
        active.current &&
        nativeOwned.current
      ) {
        transitionUntil.current = performance.now() + 350;
        active.current = false;
        nativeOwned.current = false;
        setImmersive(false);
      }
    };
    const requested = () => {
      void toggle();
    };
    window.addEventListener("keydown", hotkey, true);
    window.addEventListener("pixco:lcd-fullscreen", requested);
    document.addEventListener("fullscreenchange", changed);
    return () => {
      active.current = false;
      window.removeEventListener("keydown", hotkey, true);
      window.removeEventListener("pixco:lcd-fullscreen", requested);
      document.removeEventListener("fullscreenchange", changed);
      if (document.fullscreenElement === stage.current)
        void document.exitFullscreen().catch(() => {});
    };
  }, [exit, toggle, stage]);
  useEffect(() => {
    if (!immersive) {
      previousFocus.current?.focus({ preventScroll: true });
      return;
    }
    document.documentElement.dataset.lcdImmersive = "true";
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const siblings = new Map<HTMLElement, boolean>();
    let branch: HTMLElement | null = stage.current;
    while (branch && branch !== document.body) {
      const parent: HTMLElement | null = branch.parentElement;
      if (!parent) break;
      for (const node of parent.children)
        if (node !== branch && node instanceof HTMLElement) {
          siblings.set(node, node.inert);
          node.inert = true;
        }
      branch = parent;
    }
    return () => {
      delete document.documentElement.dataset.lcdImmersive;
      document.body.style.overflow = overflow;
      siblings.forEach((value, node) => {
        node.inert = value;
      });
    };
  }, [immersive, stage]);
  return {
    immersive,
    toggle,
    transitioning: () => performance.now() < transitionUntil.current,
  };
}
