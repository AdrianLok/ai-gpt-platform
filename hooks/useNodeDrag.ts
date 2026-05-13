"use client";

import { useState } from "react";

export function useNodeDrag() {
  const [activeDragNodeId, setActiveDragNodeId] = useState<string | null>(null);

  return { activeDragNodeId, setActiveDragNodeId };
}
