"use client";

import { RefreshCw, Wand2 } from "lucide-react";

type GenerateButtonProps = {
  loading: boolean;
};

export function GenerateButton({ loading }: GenerateButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: 48,
        height: 48,
        border: "none",
        borderRadius: 999,
        background: "rgba(255,255,255,0.86)",
        color: "black",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
        boxShadow: "0 10px 34px rgba(255,255,255,0.14)",
      }}
      aria-label={loading ? "生成中" : "生成"}
    >
      {loading ? <RefreshCw size={22} /> : <Wand2 size={22} />}
    </button>
  );
}
