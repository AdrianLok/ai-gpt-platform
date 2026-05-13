"use client";

import { useEffect } from "react";

type CanvasShortcutHandlers = {
  selectedNodeId: string | null;
  onDeleteSelected?: () => void;
  onDuplicateSelected?: () => void;
  onFitView?: () => void;
};

export function useCanvasShortcuts({
  selectedNodeId,
  onDeleteSelected,
  onDuplicateSelected,
  onFitView,
}: CanvasShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && selectedNodeId) {
        event.preventDefault();
        onDeleteSelected?.();
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d" && selectedNodeId) {
        event.preventDefault();
        onDuplicateSelected?.();
      }

      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        onFitView?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDeleteSelected, onDuplicateSelected, onFitView, selectedNodeId]);
}
