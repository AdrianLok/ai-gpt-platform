import { useState } from "react";
import type { HistoryItem } from "../types/image";
import {
  readImageHistory,
  readPromptHistory,
  writeImageHistory,
  writePromptHistory,
} from "../lib/storage/imageHistory";

export function useImageHistory() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [promptHistoryItems, setPromptHistoryItems] = useState<string[]>([]);

  function loadHistory() {
    setHistoryItems(readImageHistory());
    setPromptHistoryItems(readPromptHistory());
  }

  function saveHistory(nextItems: HistoryItem[]) {
    setHistoryItems(nextItems);
    writeImageHistory(nextItems);
  }

  function savePromptHistory(nextItems: string[]) {
    setPromptHistoryItems(nextItems);
    writePromptHistory(nextItems);
  }

  return {
    historyItems,
    setHistoryItems,
    promptHistoryItems,
    setPromptHistoryItems,
    loadHistory,
    saveHistory,
    savePromptHistory,
  };
}
