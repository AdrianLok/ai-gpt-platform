"use client";

import { memo } from "react";
import {
  History,
  ImagePlus,
  Settings,
  Sparkles,
  Upload,
  type LucideIcon,
} from "lucide-react";

type ToolbarItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

const toolbarItems: ToolbarItem[] = [
  { id: "generate", label: "生成图片", icon: ImagePlus, active: true },
  { id: "upload", label: "上传图片", icon: Upload },
  { id: "templates", label: "模板", icon: Sparkles },
  { id: "history", label: "历史记录", icon: History },
  { id: "settings", label: "设置", icon: Settings },
];

type SidebarProps = {
  onAction: (id: string) => void;
};

export const Sidebar = memo(function Sidebar({ onAction }: SidebarProps) {
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
                borderRadius: 18,
                background: item.active ? "white" : "rgba(255,255,255,0.045)",
                color: item.active ? "black" : "rgba(255,255,255,0.7)",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "0 14px",
                fontSize: 14,
                fontWeight: 650,
                cursor: "pointer",
                boxShadow: item.active
                  ? "0 14px 38px rgba(255,255,255,0.14)"
                  : "none",
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
});
