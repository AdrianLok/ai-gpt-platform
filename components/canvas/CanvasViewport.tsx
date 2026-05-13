"use client";

import type { ReactNode } from "react";

type CanvasViewportProps = {
  children: ReactNode;
  offset: { x: number; y: number };
};

export function CanvasViewport({ children, offset }: CanvasViewportProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transformOrigin: "0 0",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
