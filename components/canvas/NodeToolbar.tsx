"use client";

import type { ReactNode } from "react";

type NodeToolbarProps = {
  children: ReactNode;
};

export function NodeToolbar({ children }: NodeToolbarProps) {
  return (
    <div data-no-drag="true" style={{ position: "relative" }}>
      {children}
    </div>
  );
}
