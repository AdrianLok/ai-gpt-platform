"use client";

import type { HistoryItem as HistoryItemData } from "../../types/image";

type HistoryItemProps = {
  item: HistoryItemData;
  onRestore: (item: HistoryItemData) => void;
};

export function HistoryItem({ item, onRestore }: HistoryItemProps) {
  return (
    <button
      type="button"
      onClick={() => onRestore(item)}
      style={{
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16,
        background: "rgba(255,255,255,0.045)",
        color: "white",
        padding: 10,
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <img
        src={item.imageUrl}
        alt={item.prompt}
        loading="lazy"
        decoding="async"
        style={{
          width: "100%",
          aspectRatio: "4 / 3",
          objectFit: "cover",
          borderRadius: 12,
          display: "block",
        }}
      />
      <div
        style={{
          marginTop: 9,
          fontSize: 13,
          fontWeight: 800,
          color: "rgba(255,255,255,0.82)",
        }}
      >
        {item.prompt
          ? item.prompt.length > 48
            ? item.prompt.slice(0, 48) + "..."
            : item.prompt
          : "?????"}
      </div>
      <div style={{ marginTop: 6, color: "rgba(255,255,255,0.42)", fontSize: 12 }}>
        {item.modelLabel || item.model} ? {item.ratio} ? ?? {item.creditCost || 1} credit
      </div>
    </button>
  );
}
