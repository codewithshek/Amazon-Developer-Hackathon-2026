import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

export interface TvNavigation {
  index: number;
  setIndex: (index: number) => void;
  registerAction: (index: number) => (element: HTMLButtonElement | null) => void;
  move: (delta: number) => void;
  select: (index?: number) => void;
  focusIndex: (index: number) => void;
}

interface TvNavigationOptions {
  count: number;
  onBack: () => void;
  enabled?: boolean;
  force?: boolean;
  containerRef?: RefObject<HTMLElement | null>;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable;
}

/**
 * Roving D-pad focus for the care card. In the studio the keys only act while
 * focus is inside the living-room panel; on the Fire TV surface they are global.
 */
export function useTvNavigation({
  count,
  onBack,
  enabled = true,
  force = false,
  containerRef
}: TvNavigationOptions): TvNavigation {
  const [index, setIndexState] = useState(0);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  const setIndex = useCallback(
    (next: number) => {
      setIndexState(Math.max(0, Math.min(next, Math.max(0, count - 1))));
    },
    [count]
  );

  const registerAction = useCallback(
    (position: number) => (element: HTMLButtonElement | null) => {
      buttons.current[position] = element;
    },
    []
  );

  const focusIndex = useCallback(
    (next: number) => {
      if (count === 0) return;
      const bounded = ((next % count) + count) % count;
      setIndexState(bounded);
      const element = buttons.current[bounded];
      if (element) {
        element.focus({ preventScroll: true });
      }
    },
    [count]
  );

  const move = useCallback(
    (delta: number) => {
      if (count === 0) return;
      focusIndex(index + delta);
    },
    [count, focusIndex, index]
  );

  const select = useCallback(
    (position?: number) => {
      if (count === 0) return;
      const target = position ?? index;
      buttons.current[target]?.click();
    },
    [count, index]
  );

  useEffect(() => {
    setIndexState((current) => Math.min(current, Math.max(0, count - 1)));
  }, [count]);

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (count === 0 || isTypingTarget(event.target)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (!force && !containerRef?.current?.contains(document.activeElement)) return;

      switch (event.key) {
        case "ArrowDown":
        case "ArrowRight":
          event.preventDefault();
          move(1);
          break;
        case "ArrowUp":
        case "ArrowLeft":
          event.preventDefault();
          move(-1);
          break;
        case "Enter": {
          // Let a focused native control activate itself. The global handler only
          // owns Enter when focus is on the HUD surface itself.
          if (
            event.target instanceof HTMLElement &&
            event.target.closest("button, a, input, select, textarea, [role='button']")
          ) {
            return;
          }
          event.preventDefault();
          select();
          break;
        }
        case "Escape":
        case "Backspace":
          event.preventDefault();
          onBack();
          break;
        case "1":
        case "2":
        case "3": {
          const position = Number(event.key) - 1;
          if (position >= count) return;
          event.preventDefault();
          focusIndex(position);
          select(position);
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [containerRef, count, enabled, focusIndex, force, move, onBack, select]);

  return {
    index,
    setIndex,
    registerAction,
    move,
    select,
    focusIndex
  };
}
