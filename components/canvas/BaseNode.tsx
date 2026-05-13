"use client";

import type { ReactNode } from "react";

type BaseNodeProps = {
  children: ReactNode;
};

export function BaseNode({ children }: BaseNodeProps) {
  return <>{children}</>;
}
