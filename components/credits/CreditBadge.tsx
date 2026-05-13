"use client";

type CreditBadgeProps = {
  credits: number;
};

export function CreditBadge({ credits }: CreditBadgeProps) {
  return (
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
  );
}
