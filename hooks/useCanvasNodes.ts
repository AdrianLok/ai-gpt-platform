import { useMemo, useState } from "react";
import { defaultCanvasZoom } from "../lib/image-options";
import type {
  AddNodeMenuState,
  CanvasNode,
  GeneratedImageNode,
  LinkDragState,
  NodeConnection,
  NodePosition,
  ReferenceImage,
} from "../lib/types";

export function useCanvasNodes() {
  const [addNodeMenu, setAddNodeMenu] = useState<AddNodeMenuState>({
    open: false,
    x: 0,
    y: 0,
  });
  const [linkDrag, setLinkDrag] = useState<LinkDragState>({
    active: false,
    menuOpen: false,
    sourceId: null,
    source: null,
    x: 0,
    y: 0,
  });
  const [imageNodePosition, setImageNodePosition] = useState<NodePosition | null>(null);
  const [promptNodePosition, setPromptNodePosition] = useState<NodePosition | null>(null);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [generatedNodes, setGeneratedNodes] = useState<GeneratedImageNode[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [canvasZoom, setCanvasZoom] = useState(defaultCanvasZoom);

  const canvasNodes: CanvasNode[] = useMemo(
    () => [...referenceImages, ...generatedNodes],
    [referenceImages, generatedNodes]
  );
  const selectedGeneratedNode = useMemo(
    () => generatedNodes.find((node) => node.id === selectedNodeId) || null,
    [generatedNodes, selectedNodeId]
  );

  return {
    addNodeMenu,
    setAddNodeMenu,
    linkDrag,
    setLinkDrag,
    imageNodePosition,
    setImageNodePosition,
    promptNodePosition,
    setPromptNodePosition,
    referenceImages,
    setReferenceImages,
    generatedNodes,
    setGeneratedNodes,
    connections,
    setConnections,
    selectedNodeId,
    setSelectedNodeId,
    canvasZoom,
    setCanvasZoom,
    canvasNodes,
    selectedGeneratedNode,
  };
}
