import { useEffect, useRef } from "react";

/**
 * Global keyboard shortcuts (Ctrl/Cmd + key). Handlers are read from a ref
 * so the listener is only ever attached once, regardless of how often the
 * caller's handler functions change identity across renders.
 */
export function useKeyboardShortcuts(handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    function handleKeyDown(event) {
      const isMod = event.ctrlKey || event.metaKey;
      if (!isMod) return;

      const key = event.key.toLowerCase();

      if (key === "k") {
        event.preventDefault();
        handlersRef.current.onCommandPalette?.();
      } else if (key === "s") {
        event.preventDefault();
        handlersRef.current.onSave?.();
      } else if (key === "o") {
        event.preventDefault();
        handlersRef.current.onImport?.();
      } else if (event.key === "Enter") {
        event.preventDefault();
        handlersRef.current.onAnalyze?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
