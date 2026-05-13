"use client";

import { useMemo, useState } from "react";
import type { GeneratedImageNode } from "../types/image";

export function useNodeSelection(nodes: GeneratedImageNode[]) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  return { selectedNodeId, setSelectedNodeId, selectedNode };
}
