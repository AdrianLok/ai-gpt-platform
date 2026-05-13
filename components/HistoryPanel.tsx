"use client";

import type { CSSProperties } from "react";
import { memo } from "react";
import { Trash2, X } from "lucide-react";
import type { HistoryItem } from "../lib/types";

const glassButton: CSSProperties = {
  height: 40,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.045)",
  color: "rgba(255,255,255,0.78)",
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "0 14px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const iconButton: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.64)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 12px 34px rgba(0,0,0,0.35)",
};

type HistoryPanelProps = {
  open: boolean;
  items: HistoryItem[];
  onClose: () => void;
  onRestore: (item: HistoryItem) => void;
  onClear: () => void;
};

export const HistoryPanel = memo(function HistoryPanel({
  open,
  items,
  onClose,
  onRestore,
  onClear,
}: HistoryPanelProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 64,
        right: 0,
        bottom: 0,
        width: 360,
        zIndex: 42,
        borderLeft: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(14,14,15,0.98)",
        boxShadow: "-24px 0 80px rgba(0,0,0,0.44)",
        padding: 18,
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>????</div>
          <div style={{ marginTop: 4, color: "rgba(255,255,255,0.44)", fontSize: 12 }}>
            {items.length} ???
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ ...iconButton, background: "rgba(255,255,255,0.08)" }}
          aria-label="??????"
        >
          <X size={17} />
        </button>
      </div>

      <button
        type="button"
        onClick={onClear}
        disabled={items.length === 0}
        style={{ ...glassButton, height: 38, marginTop: 16, color: "#fca5a5" }}
      >
        <Trash2 size={15} />
        ????
      </button>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        {items.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,0.42)", fontSize: 14, lineHeight: 1.6 }}>
            ???????????????????
          </div>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
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
          ))
        )}
      </div>
    </div>
  );
});
