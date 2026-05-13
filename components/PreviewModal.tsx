"use client";

import type { CSSProperties } from "react";
import { memo } from "react";
import { X } from "lucide-react";

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

type PreviewModalProps = {
  open: boolean;
  imageUrl: string;
  onClose: () => void;
};

export const PreviewModal = memo(function PreviewModal({
  open,
  imageUrl,
  onClose,
}: PreviewModalProps) {
  if (!open || !imageUrl) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.92)",
        padding: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="关闭预览"
        style={{
          ...iconButton,
          position: "absolute",
          right: 20,
          top: 20,
          background: "rgba(255,255,255,0.1)",
        }}
      >
        <X size={18} />
      </button>
      <div
        style={{
          width: "100%",
          maxWidth: 1180,
          maxHeight: "88vh",
          borderRadius: 28,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "#111113",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 30px 120px rgba(0,0,0,0.7)",
        }}
      >
        <img
          src={imageUrl}
          alt="AI 生成图片预览"
          style={{
            width: "100%",
            maxHeight: "88vh",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>
    </div>
  );
});
