import type { ImageRatio } from "./image-options";
import type { ImageModel } from "./models";

export type HistoryItem = {
  id: string;
  nodeId: string;
  type: "image" | "reference";
  imageUrl: string;
  prompt: string;
  model: string;
  modelLabel: string;
  modelValue: string;
  ratio: string;
  x: number;
  y: number;
  parentId: string | null;
  createdAt: string;
  creditCost?: number;
  draft?: boolean;
  sourceImageUrl?: string;
};

export type NodePosition = {
  x: number;
  y: number;
};

export type DraggableNode = "image" | "prompt";

export type ReferenceImage = {
  id: string;
  type: "reference";
  title?: string;
  collapsed?: boolean;
  x: number;
  y: number;
  prompt: string;
  imageUrl: string;
  model: string;
  ratio: string;
  parentId: string | null;
  createdAt: string;
  url: string;
  name: string;
  position: NodePosition;
};

export type GeneratedImageNode = {
  id: string;
  type: "image";
  title?: string;
  collapsed?: boolean;
  x: number;
  y: number;
  imageUrl: string;
  model: string;
  parentId: string | null;
  createdAt: string;
  url: string;
  prompt: string;
  modelLabel: string;
  modelValue: string;
  ratio: string;
  position: NodePosition;
  creditCost?: number;
  draft?: boolean;
  sourceImageUrl?: string;
};

export type CanvasNode = ReferenceImage | GeneratedImageNode;

export type NodeConnection = {
  id: string;
  fromId: string | null;
  toId: string;
};

export type GenerateOverrides = {
  promptText?: string;
  modelOption?: ImageModel;
  ratioOption?: ImageRatio;
  parentId?: string | null;
};

export type ToastType = "success" | "error" | "warning";

export type ToastMessage = {
  id: string;
  type: ToastType;
  message: string;
};

export type ProjectState = {
  version: 1;
  savedAt: string;
  nodeCreated: boolean;
  promptPanelOpen?: boolean;
  prompt: string;
  image: string;
  modelValue: string;
  ratioValue: string;
  quality: string;
  imageNodePosition: NodePosition | null;
  promptNodePosition: NodePosition | null;
  canvasNodes?: CanvasNode[];
  referenceImages: ReferenceImage[];
  generatedNodes: GeneratedImageNode[];
  connections: NodeConnection[];
  selectedNodeId: string | null;
  canvasZoom: number;
};

export type AddNodeMenuState = {
  open: boolean;
  x: number;
  y: number;
};

export type LinkDragState = {
  active: boolean;
  menuOpen: boolean;
  sourceId: string | null;
  source: NodePosition | null;
  x: number;
  y: number;
};

export type PromptTemplateItem = {
  name: string;
  description: string;
  prompt: string;
};
