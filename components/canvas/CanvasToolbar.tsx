"use client";

import { Maximize2 } from "lucide-react";

type CanvasToolbarProps = {
  onFitView: () => void;
};

export function CanvasToolbar({ onFitView }: CanvasToolbarProps) {
  return (
    <div
      data-no-drag="true"
      style={{
        position: "absolute",
        right: 22,
        top: 18,
        zIndex: 22,
        display: "flex",
        gap: 8,
        padding: 8,
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(18,18,19,0.86)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
        backdropFilter: "blur(18px)",
      }}
    >
      <button
        type="button"
        onClick={onFitView}
        style={{
          height: 34,
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.82)",
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontSize: 12,
          fontWeight: 850,
          cursor: "pointer",
        }}
      >
        <Maximize2 size={15} />
        适应视图
      </button>
    </div>
  );
}
