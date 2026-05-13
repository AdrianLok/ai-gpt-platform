import type { HistoryItem } from "../../types/image";

export const imageHistoryStorageKey = "ai-canvas-generation-history";
export const promptHistoryStorageKey = "ai-canvas-prompt-history";

export function readImageHistory() {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(imageHistoryStorageKey);
  if (!raw) return [];

  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as HistoryItem[]) : [];
}

export function writeImageHistory(items: HistoryItem[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(imageHistoryStorageKey, JSON.stringify(items));
}

export function readPromptHistory() {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(promptHistoryStorageKey);
  if (!raw) return [];

  const parsed = JSON.parse(raw);
  return Array.isArray(parsed)
    ? parsed.filter((item) => typeof item === "string").slice(0, 20)
    : [];
}

export function writePromptHistory(items: string[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(promptHistoryStorageKey, JSON.stringify(items));
}
