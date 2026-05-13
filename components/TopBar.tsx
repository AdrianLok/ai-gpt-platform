"use client";

import type { CSSProperties } from "react";
import { memo } from "react";
import { FileUp, Save, Sparkles, Trash2, Upload } from "lucide-react";

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

type TopBarProps = {
  credits: number;
  lastSavedAt: string;
  onRecharge: () => void;
  onSave: () => void;
  onImport: () => void;
  onClear: () => void;
  onExport: () => void;
};

export const TopBar = memo(function TopBar({
  credits,
  lastSavedAt,
  onRecharge,
  onSave,
  onImport,
  onClear,
  onExport,
}: TopBarProps) {
  return (
    <header
      style={{
        height: 64,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(8,8,9,0.96)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "relative",
        boxSizing: "border-box",
        zIndex: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 16,
            background: "white",
            color: "black",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 28px rgba(255,255,255,0.18)",
          }}
        >
          <Sparkles size={18} />
        </div>
        <div style={{ fontWeight: 700, letterSpacing: 0.2 }}>AI Canvas</div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.045)",
          borderRadius: 999,
          padding: "8px 16px",
          color: "rgba(255,255,255,0.76)",
          fontSize: 14,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: "#34d399",
            boxShadow: "0 0 16px rgba(52,211,153,0.65)",
          }}
        />
        <span>Untitled Project</span>
        <span style={{ color: "rgba(255,255,255,0.38)" }}>?</span>
        <span style={{ color: "#86efac", fontWeight: 750 }}>
          {lastSavedAt ? "?????" : "??????"}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            height: 40,
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 999,
            background: "rgba(255,255,255,0.045)",
            color: "rgba(255,255,255,0.78)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 14px",
            fontSize: 13,
            fontWeight: 750,
          }}
        >
          <span>????</span>
          <span style={{ color: "rgba(255,255,255,0.32)" }}>|</span>
          <span style={{ color: credits > 0 ? "#86efac" : "#fca5a5" }}>
            {credits} credits
          </span>
        </div>
        <button
          type="button"
          onClick={onRecharge}
          style={{
            ...glassButton,
            border: "1px solid rgba(134,239,172,0.28)",
            color: "#bbf7d0",
          }}
        >
          ??
        </button>
        <button type="button" onClick={onSave} style={glassButton}>
          <Save size={16} />
          ??
        </button>
        <button type="button" onClick={onImport} style={glassButton}>
          <Upload size={16} />
          ??
        </button>
        <button type="button" onClick={onClear} style={glassButton}>
          <Trash2 size={16} />
          ??
        </button>
        <button
          type="button"
          onClick={onExport}
          style={{ ...glassButton, border: "none", background: "white", color: "black" }}
        >
          <FileUp size={16} />
          ??
        </button>
      </div>
    </header>
  );
});
