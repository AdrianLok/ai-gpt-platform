"use client";

import { memo } from "react";
import type { ToastMessage } from "../lib/types";

type ToastProps = {
  toasts: ToastMessage[];
};

export const Toast = memo(function Toast({ toasts }: ToastProps) {
  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        top: 78,
        zIndex: 70,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => {
        const color =
          toast.type === "success"
            ? "#86efac"
            : toast.type === "warning"
              ? "#fde68a"
              : "#fca5a5";

        return (
          <div
            key={toast.id}
            style={{
              minWidth: 220,
              maxWidth: 340,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(22,22,23,0.96)",
              borderRadius: 16,
              padding: "12px 14px",
              color: "white",
              boxShadow: "0 18px 70px rgba(0,0,0,0.48)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              transition: "transform 140ms ease, opacity 140ms ease",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: color,
                boxShadow: "0 0 16px " + color,
                flex: "0 0 auto",
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 750, lineHeight: 1.45 }}>
              {toast.message}
            </span>
          </div>
        );
      })}
    </div>
  );
});

export const AppInteractionStyles = memo(function AppInteractionStyles() {
  return (
    <style jsx global>
      {
        "button{transition:transform 120ms ease,background-color 120ms ease,border-color 120ms ease,opacity 120ms ease,box-shadow 160ms ease}button:not(:disabled):hover{filter:brightness(1.08)}button:not(:disabled):active{transform:scale(.985)}button:disabled{opacity:.55;cursor:not-allowed!important}textarea::placeholder{color:rgba(255,255,255,.38)}img{content-visibility:auto}"
      }
    </style>
  );
});
