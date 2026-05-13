export const historyStorageKey = "ai-canvas-generation-history";
export const projectStorageKey = "ai-canvas-current-project";
export const creditsStorageKey = "ai-canvas-credits";
export const promptHistoryStorageKey = "ai-canvas-prompt-history";
export const zoomBaselineMigrationKey = "ai-canvas-zoom-baseline-migrated";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function readStorageItem(key: string) {
  if (!canUseStorage()) return null;

  return window.localStorage.getItem(key);
}

export function writeStorageItem(key: string, value: string) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(key, value);
}
