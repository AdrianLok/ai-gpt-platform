import type { NodePosition } from "./node";

export type CanvasViewportState = {
  offset: NodePosition;
  isSpacePressed: boolean;
  isPanning: boolean;
};
