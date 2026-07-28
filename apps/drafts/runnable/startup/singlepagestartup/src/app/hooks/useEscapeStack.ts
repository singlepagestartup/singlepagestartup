import { useEffect, useRef } from "react";

/**
 * Global LIFO stack for Escape-key handlers.
 * When Escape is pressed, only the most recently registered (topmost) handler fires.
 */
const escapeStack: (() => void)[] = [];

// Single global listener — added once
let listenerAttached = false;

function ensureListener() {
  if (listenerAttached) return;
  listenerAttached = true;

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && escapeStack.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      const top = escapeStack[escapeStack.length - 1];
      top();
    }
  });
}

/**
 * Registers a close handler on the global Escape stack while `isOpen` is true.
 * The last registered handler wins (LIFO), so the topmost overlay closes first.
 */
export function useEscapeStack(isOpen: boolean, onClose: () => void) {
  const closeFnRef = useRef(onClose);
  closeFnRef.current = onClose;

  useEffect(() => {
    ensureListener();
    if (!isOpen) return;

    const handler = () => closeFnRef.current();
    escapeStack.push(handler);

    return () => {
      const idx = escapeStack.indexOf(handler);
      if (idx !== -1) escapeStack.splice(idx, 1);
    };
  }, [isOpen]);
}
