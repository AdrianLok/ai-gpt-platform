"use client";

import {
  History,
  ImagePlus,
  Package,
  Settings,
  type LucideIcon,
} from "lucide-react";

const toolbarItems: Array<{ id: string; label: string; icon: LucideIcon; active?: boolean }> = [
  { id: "generate", label: "新建生图节点", icon: ImagePlus, active: true },
  { id: "history", label: "历史图片", icon: History },
  { id: "assets", label: "素材", icon: Package },
  { id: "settings", label: "设置", icon: Settings },
];

type LeftToolbarProps = {
  onAction: (id: string) => void;
};

export function LeftToolbar({ onAction }: LeftToolbarProps) {
  return (
    <aside
      style={{
        width: 232,
        minWidth: 232,
        borderRight: "1px solid rgba(255,255,255,0.08)",
        background: "#080809",
        padding: 12,
        boxSizing: "border-box",
        zIndex: 3,
      }}
    >
      <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {toolbarItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onAction(item.id)}
              style={{
                height: 48,
                border: "none",
                borderRadius: 16,
                background: item.active ? "white" : "rgba(255,255,255,0.045)",
                color: item.active ? "black" : "rgba(255,255,255,0.7)",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "0 14px",
                fontSize: 14,
                fontWeight: 650,
                cursor: "pointer",
                boxShadow: item.active ? "0 14px 38px rgba(255,255,255,0.14)" : "none",
              }}
            >
              <Icon size={17} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
