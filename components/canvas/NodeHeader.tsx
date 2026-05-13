"use client";

import type { ReactNode } from "react";

type NodeHeaderProps = {
  children: ReactNode;
};

export function NodeHeader({ children }: NodeHeaderProps) {
  return <>{children}</>;
}
