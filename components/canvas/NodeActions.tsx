"use client";

import type { ReactNode } from "react";

type NodeActionsProps = {
  children: ReactNode;
};

export function NodeActions({ children }: NodeActionsProps) {
  return <>{children}</>;
}
