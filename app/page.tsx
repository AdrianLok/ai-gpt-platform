"use client";

import type {
  ChangeEvent,
  CSSProperties,
  FormEvent,
  MouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Download,
  FileUp,
  History,
  ImageIcon,
  ImagePlus,
  Maximize2,
  Minus,
  MoreHorizontal,
  MousePointer2,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { defaultImageModel, imageModels } from "../lib/models";

type HistoryItem = {
  id: string;
  imageUrl: string;
  prompt: string;
  modelLabel: string;
  modelValue: string;
  ratio: string;
  createdAt: string;
  creditCost?: number;
};

type NodePosition = {
  x: number;
  y: number;
};

type DraggableNode = "image" | "prompt";

type ReferenceImage = {
  id: string;
  url: string;
  name: string;
  position: NodePosition;
};

type GeneratedImageNode = {
  id: string;
  url: string;
  prompt: string;
  modelLabel: string;
  modelValue: string;
  ratio: string;
  position: NodePosition;
  parentId?: string | null;
  creditCost?: number;
};

type NodeConnection = {
  id: string;
  fromId: string;
  toId: string;
};

type GenerateOverrides = {
  promptText?: string;
  modelOption?: (typeof imageModels)[number];
  ratioOption?: (typeof ratios)[number];
  parentId?: string | null;
};

type ToastType = "success" | "error" | "warning";

type ToastMessage = {
  id: string;
  type: ToastType;
  message: string;
};

type ProjectState = {
  version: 1;
  savedAt: string;
  nodeCreated: boolean;
  prompt: string;
  image: string;
  modelValue: string;
  ratioValue: string;
  quality: string;
  imageNodePosition: NodePosition | null;
  promptNodePosition: NodePosition | null;
  referenceImages: ReferenceImage[];
  generatedNodes: GeneratedImageNode[];
  connections: NodeConnection[];
  selectedNodeId: string | null;
  canvasZoom: number;
};

type PromptTemplateItem = {
  name: string;
  description: string;
  prompt: string;
};

const historyStorageKey = "ai-canvas-generation-history";
const projectStorageKey = "ai-canvas-current-project";
const creditsStorageKey = "ai-canvas-credits";
const promptHistoryStorageKey = "ai-canvas-prompt-history";

const ratios = [
  { label: "自适应", value: "auto", requestValue: "1:1" },
  { label: "1:1", value: "1:1", requestValue: "1:1" },
  { label: "9:16", value: "9:16", requestValue: "9:16" },
  { label: "16:9", value: "16:9", requestValue: "16:9" },
  { label: "3:4", value: "3:4", requestValue: "3:4" },
  { label: "4:3", value: "4:3", requestValue: "4:3" },
  { label: "3:2", value: "3:2", requestValue: "3:2" },
  { label: "2:3", value: "2:3", requestValue: "2:3" },
  { label: "5:4", value: "5:4", requestValue: "5:4" },
  { label: "4:5", value: "4:5", requestValue: "4:5" },
  { label: "21:9", value: "21:9", requestValue: "21:9" },
];

const aspectRatioMap: Record<string, string> = {
  auto: "1 / 1",
  "1:1": "1 / 1",
  "9:16": "9 / 16",
  "16:9": "16 / 9",
  "3:4": "3 / 4",
  "4:3": "4 / 3",
  "3:2": "3 / 2",
  "2:3": "2 / 3",
  "5:4": "5 / 4",
  "4:5": "4 / 5",
  "21:9": "21 / 9",
};

const qualityOptions = ["1K", "2K", "4K"];
const defaultRatio = ratios.find((item) => item.value === "4:3") || ratios[0];
const dragSafePadding = 96;

const toolbarItems = [
  { id: "generate", label: "生成图片", icon: ImagePlus, active: true },
  { id: "upload", label: "上传图片", icon: Upload },
  { id: "templates", label: "模板", icon: Sparkles },
  { id: "history", label: "历史记录", icon: History },
  { id: "settings", label: "设置", icon: Settings },
];

const quickActions = ["文字生视频", "图片换背景", "首帧生成视频", "音频生视频", "模板"];
const promptTemplates = ["电商海报", "IP角色", "表情包", "产品图", "国潮风"];
const initialCredits = 20;
const generationCreditCost = 1;
const membershipPlans = [
  { name: "Free", credits: 20, tone: "入门体验" },
  { name: "Pro", credits: 500, tone: "日常创作" },
  { name: "Studio", credits: 2000, tone: "团队生产" },
];
const templateCategories: Record<string, PromptTemplateItem[]> = {
  电商海报: [
    {
      name: "高转化主图",
      description: "适合单品卖点展示，画面干净、有点击欲。",
      prompt:
        "电商产品主图海报，核心主体居中，突出产品质感和卖点，干净高级背景，柔和棚拍光，清晰商业摄影风格，高清细节。",
    },
    {
      name: "节日促销",
      description: "适合活动大促、限时折扣、节日氛围图。",
      prompt:
        "节日促销电商海报，产品作为视觉中心，加入热闹但克制的活动氛围，醒目的留白标题区，高级商业光影，细节精致。",
    },
  ],
  IP角色: [
    {
      name: "品牌吉祥物",
      description: "生成可爱、有记忆点的品牌 IP 角色。",
      prompt:
        "原创品牌 IP 角色设计，可爱亲和，造型简洁有辨识度，适合商业品牌传播，正面展示，干净背景，细节清晰。",
    },
    {
      name: "潮玩角色",
      description: "偏潮玩和收藏感的角色设定。",
      prompt:
        "潮玩风 IP 角色，三维玩具质感，夸张比例，表情生动，配色高级，产品级渲染，柔和光影，高清细节。",
    },
  ],
  表情包: [
    {
      name: "夸张情绪",
      description: "适合社交平台传播的强情绪表情。",
      prompt:
        "表情包角色，夸张表情，动作有趣，情绪强烈，背景简洁，适合聊天传播，卡通风格，轮廓清晰。",
    },
    {
      name: "可爱吐槽",
      description: "偏可爱、轻松、日常吐槽语气。",
      prompt:
        "可爱表情包角色，轻松吐槽感，表情灵动，动作夸张但不复杂，干净背景，适合社交媒体使用，高清线条。",
    },
  ],
  产品图: [
    {
      name: "棚拍质感",
      description: "适合产品详情页和高级质感图。",
      prompt:
        "产品商业摄影，主体清晰，棚拍柔光，高级材质表现，干净背景，构图稳定，突出细节纹理，高清真实质感。",
    },
    {
      name: "生活方式",
      description: "把产品放进真实使用场景。",
      prompt:
        "生活方式产品图，产品融入真实使用场景，自然光影，画面温暖高级，构图有呼吸感，商业摄影质感，高清细节。",
    },
  ],
  国潮风: [
    {
      name: "新中式海报",
      description: "国潮视觉，适合品牌海报和节日活动。",
      prompt:
        "国潮新中式海报，东方美学元素，现代商业设计，主体突出，层次丰富，精致纹理，戏剧化光影，高清细节。",
    },
    {
      name: "传统纹样",
      description: "更强调纹样、色彩和装饰感。",
      prompt:
        "国潮插画视觉，传统纹样与现代构图结合，浓郁但高级的配色，画面主体明确，细节丰富，适合商业宣传。",
    },
  ],
  小红书封面: [
    {
      name: "种草封面",
      description: "适合小红书笔记首图，清爽抓眼。",
      prompt:
        "小红书种草封面，画面明亮清爽，主体突出，留出标题区域，生活方式氛围，高点击率封面构图，高清细节。",
    },
    {
      name: "教程封面",
      description: "适合教程、合集、步骤类内容。",
      prompt:
        "小红书教程封面，清晰信息层级，主体醒目，简洁背景，适合添加标题文字，视觉干净高级，高清细节。",
    },
  ],
};
const extensionActions = [
  { label: "生成同款", prompt: "参考当前图片，生成同款构图、色彩和视觉风格。" },
  { label: "改风格", prompt: "在保留主体和构图的基础上，改成更鲜明的艺术风格。" },
  { label: "放大细节", prompt: "强化主体细节、材质纹理和光影层次，画面更高清精致。" },
  { label: "生成海报", prompt: "基于当前图片生成一张完整商业海报，加入标题感构图和高级排版。" },
];
const loadingMessage = "正在生成中，通常需要 20-60 秒";
const busyModelMessage = "当前模型繁忙，请切换 Gemini 再试";
const requestTimeoutMs = 45000;

const glassButton: CSSProperties = {
  height: 40,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.045)",
  color: "rgba(255,255,255,0.78)",
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "0 14px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const iconButton: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.64)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 12px 34px rgba(0,0,0,0.35)",
};

function getRequestRatio(ratio: (typeof ratios)[number]) {
  return ratio.requestValue;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function shouldIgnoreDrag(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return true;

  return Boolean(
    target.closest("button, textarea, input, select, option, a, [data-no-drag='true']")
  );
}

function getRatioLabel(value: string) {
  return ratios.find((item) => item.value === value)?.label || value;
}

function getRatioIconStyle(value: string, active: boolean): CSSProperties {
  const sizeMap: Record<string, { width: number; height: number }> = {
    auto: { width: 22, height: 22 },
    "1:1": { width: 21, height: 21 },
    "9:16": { width: 12, height: 25 },
    "16:9": { width: 28, height: 10 },
    "3:4": { width: 16, height: 24 },
    "4:3": { width: 25, height: 15 },
    "3:2": { width: 26, height: 14 },
    "2:3": { width: 14, height: 24 },
    "5:4": { width: 23, height: 17 },
    "4:5": { width: 17, height: 23 },
    "21:9": { width: 30, height: 10 },
  };
  const size = sizeMap[value] || sizeMap["1:1"];

  return {
    width: size.width,
    height: size.height,
    borderRadius: value === "auto" ? 6 : 3,
    border: value === "auto" ? "2px dashed currentColor" : "2px solid currentColor",
    color: active ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.42)",
    boxSizing: "border-box",
    display: "block",
  };
}

function getModelChips(modelValue: string) {
  if (modelValue === "gpt-image-2-plus") {
    return ["实验", "可能较慢"];
  }

  return ["默认", "主力"];
}

function isGptModel(modelValue: string) {
  return modelValue === "gpt-image-2-plus";
}

function isBusyError(message: string, status?: string) {
  const text = `${message} ${status || ""}`.toLowerCase();

  return (
    text.includes("overload") ||
    text.includes("busy") ||
    text.includes("capacity") ||
    text.includes("timeout") ||
    text.includes("超时") ||
    text.includes("temporarily unavailable") ||
    text.includes("rate limit")
  );
}

async function fetchJsonWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    const data = await response.json();

    return { response, data };
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function HomePage() {
  const canvasRef = useRef<HTMLElement | null>(null);
  const promptInputRef = useRef<HTMLTextAreaElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [nodeCreated, setNodeCreated] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [activeTemplateCategory, setActiveTemplateCategory] =
    useState("电商海报");
  const [promptHistoryItems, setPromptHistoryItems] = useState<string[]>([]);
  const [promptHistoryOpen, setPromptHistoryOpen] = useState(false);
  const [imageNodePosition, setImageNodePosition] =
    useState<NodePosition | null>(null);
  const [promptNodePosition, setPromptNodePosition] =
    useState<NodePosition | null>(null);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [generatedNodes, setGeneratedNodes] = useState<GeneratedImageNode[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeMenuOpen, setNodeMenuOpen] = useState<string | null>(null);
  const [extensionMenuOpen, setExtensionMenuOpen] = useState<string | null>(null);
  const [pendingParentNodeId, setPendingParentNodeId] = useState<string | null>(
    null
  );
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [credits, setCredits] = useState(initialCredits);
  const [membershipOpen, setMembershipOpen] = useState(false);

  const [ratio, setRatio] = useState(defaultRatio);
  const [quality, setQuality] = useState("1K");
  const [ratioPanelOpen, setRatioPanelOpen] = useState(false);
  const [modelPanelOpen, setModelPanelOpen] = useState(false);
  const [model, setModel] = useState(defaultImageModel);

  const nodeAspectRatio = aspectRatioMap[ratio.value] || "4 / 3";
  const selectedGeneratedNode =
    generatedNodes.find((node) => node.id === selectedNodeId) || null;
  const activeGeneratedNode =
    selectedGeneratedNode || generatedNodes[generatedNodes.length - 1] || null;
  const activeImageUrl = activeGeneratedNode?.url || image;

  function showToast(type: ToastType, message: string) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((items) => [...items, { id, type, message }].slice(-4));
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, 3200);
  }

  function createProjectState(): ProjectState {
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      nodeCreated,
      prompt,
      image,
      modelValue: model.value,
      ratioValue: ratio.value,
      quality,
      imageNodePosition,
      promptNodePosition,
      referenceImages,
      generatedNodes,
      connections,
      selectedNodeId,
      canvasZoom,
    };
  }

  function applyProjectState(project: ProjectState) {
    const restoredModel =
      imageModels.find((item) => item.value === project.modelValue) ||
      defaultImageModel;
    const restoredRatio =
      ratios.find((item) => item.value === project.ratioValue) || defaultRatio;

    setNodeCreated(Boolean(project.nodeCreated));
    setPrompt(project.prompt || "");
    setImage(project.image || "");
    setModel(restoredModel);
    setRatio(restoredRatio);
    setQuality(project.quality || "1K");
    setImageNodePosition(project.imageNodePosition || null);
    setPromptNodePosition(project.promptNodePosition || null);
    setReferenceImages(Array.isArray(project.referenceImages) ? project.referenceImages : []);
    setGeneratedNodes(Array.isArray(project.generatedNodes) ? project.generatedNodes : []);
    setConnections(Array.isArray(project.connections) ? project.connections : []);
    setSelectedNodeId(project.selectedNodeId || null);
    setCanvasZoom(project.canvasZoom || 1);
    setError("");
    setStatusMessage("");
    setPreviewOpen(false);
    setPreviewImage("");
    setNodeMenuOpen(null);
    setExtensionMenuOpen(null);
    setPendingParentNodeId(null);
  }

  function saveProject(showMessage = false) {
    const project = createProjectState();
    try {
      localStorage.setItem(projectStorageKey, JSON.stringify(project));
      setLastSavedAt(project.savedAt);
      if (showMessage) showToast("success", "保存成功");
    } catch {
      if (showMessage) {
        showToast("error", "保存失败，本地存储空间可能不足");
      }
    }
  }

  function getDefaultNodePositions() {
    const rect = canvasRef.current?.getBoundingClientRect();
    const width = (rect?.width || window.innerWidth) / canvasZoom;
    const height =
      (rect?.height || Math.max(window.innerHeight - 64, 640)) / canvasZoom;
    const centerX = width / 2;

    return {
      image: {
        x: centerX,
        y: clamp(height * 0.36, 180, Math.max(220, height - 360)),
      },
      prompt: {
        x: centerX,
        y: clamp(height * 0.78, 390, Math.max(390, height - 130)),
      },
    };
  }

  function ensureNodePositions(reset = false) {
    const defaults = getDefaultNodePositions();

    if (reset) {
      setImageNodePosition(defaults.image);
      setPromptNodePosition(defaults.prompt);
      return;
    }

    setImageNodePosition((current) => current || defaults.image);
    setPromptNodePosition((current) => current || defaults.prompt);
  }

  function getReferenceNodePosition(index: number) {
    const rect = canvasRef.current?.getBoundingClientRect();
    const width = (rect?.width || window.innerWidth) / canvasZoom;
    const height =
      (rect?.height || Math.max(window.innerHeight - 64, 640)) / canvasZoom;

    return {
      x: clamp(width * 0.26 + index * 28, 150, Math.max(150, width - 150)),
      y: clamp(height * 0.34 + index * 24, 150, Math.max(150, height - 150)),
    };
  }

  function getGeneratedNodePosition(index: number, parentId?: string | null) {
    const rect = canvasRef.current?.getBoundingClientRect();
    const width = (rect?.width || window.innerWidth) / canvasZoom;
    const height =
      (rect?.height || Math.max(window.innerHeight - 64, 640)) / canvasZoom;
    const parent = parentId
      ? generatedNodes.find((node) => node.id === parentId)
      : null;

    if (parent) {
      return {
        x: clamp(parent.position.x + 470, 190, Math.max(190, width - 190)),
        y: clamp(parent.position.y + 72, 170, Math.max(170, height - 170)),
      };
    }

    return {
      x: clamp(width * 0.52 + (index % 4) * 54, 190, Math.max(190, width - 190)),
      y: clamp(height * 0.34 + index * 34, 170, Math.max(170, height - 170)),
    };
  }

  function startNodeDrag(
    node: DraggableNode,
    event: ReactPointerEvent<HTMLElement>
  ) {
    if (event.button !== 0 || shouldIgnoreDrag(event.target)) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const defaults = getDefaultNodePositions();
    const startPosition =
      node === "image"
        ? imageNodePosition || defaults.image
        : promptNodePosition || defaults.prompt;
    const updatePosition =
      node === "image" ? setImageNodePosition : setPromptNodePosition;
    const startX = event.clientX;
    const startY = event.clientY;

    event.preventDefault();
    setModelPanelOpen(false);
    setRatioPanelOpen(false);
    setExtensionMenuOpen(null);

    const handleMove = (moveEvent: PointerEvent) => {
      const nextX = clamp(
        startPosition.x + (moveEvent.clientX - startX) / canvasZoom,
        dragSafePadding,
        Math.max(dragSafePadding, rect.width / canvasZoom - dragSafePadding)
      );
      const nextY = clamp(
        startPosition.y + (moveEvent.clientY - startY) / canvasZoom,
        dragSafePadding,
        Math.max(dragSafePadding, rect.height / canvasZoom - dragSafePadding)
      );

      updatePosition({ x: nextX, y: nextY });
    };

    const stopDrag = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
  }

  function startReferenceDrag(
    id: string,
    event: ReactPointerEvent<HTMLElement>
  ) {
    if (event.button !== 0 || shouldIgnoreDrag(event.target)) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    const startItem = referenceImages.find((item) => item.id === id);
    if (!rect || !startItem) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const startPosition = startItem.position;

    event.preventDefault();
    setModelPanelOpen(false);
    setRatioPanelOpen(false);
    setExtensionMenuOpen(null);

    const handleMove = (moveEvent: PointerEvent) => {
      const nextPosition = {
        x: clamp(
          startPosition.x + (moveEvent.clientX - startX) / canvasZoom,
          dragSafePadding,
          Math.max(dragSafePadding, rect.width / canvasZoom - dragSafePadding)
        ),
        y: clamp(
          startPosition.y + (moveEvent.clientY - startY) / canvasZoom,
          dragSafePadding,
          Math.max(dragSafePadding, rect.height / canvasZoom - dragSafePadding)
        ),
      };

      setReferenceImages((items) =>
        items.map((item) =>
          item.id === id ? { ...item, position: nextPosition } : item
        )
      );
    };

    const stopDrag = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
  }

  function startGeneratedNodeDrag(
    id: string,
    event: ReactPointerEvent<HTMLElement>
  ) {
    if (event.button !== 0 || shouldIgnoreDrag(event.target)) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    const startItem = generatedNodes.find((item) => item.id === id);
    if (!rect || !startItem) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const startPosition = startItem.position;

    event.preventDefault();
    setSelectedNodeId(id);
    setModelPanelOpen(false);
    setRatioPanelOpen(false);
    setExtensionMenuOpen(null);
    setNodeMenuOpen(null);

    const handleMove = (moveEvent: PointerEvent) => {
      const nextPosition = {
        x: clamp(
          startPosition.x + (moveEvent.clientX - startX) / canvasZoom,
          dragSafePadding,
          Math.max(dragSafePadding, rect.width / canvasZoom - dragSafePadding)
        ),
        y: clamp(
          startPosition.y + (moveEvent.clientY - startY) / canvasZoom,
          dragSafePadding,
          Math.max(dragSafePadding, rect.height / canvasZoom - dragSafePadding)
        ),
      };

      setGeneratedNodes((items) =>
        items.map((item) =>
          item.id === id ? { ...item, position: nextPosition } : item
        )
      );
    };

    const stopDrag = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(historyStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistoryItems(parsed);
        }
      }

      const projectRaw = localStorage.getItem(projectStorageKey);
      if (projectRaw) {
        const project = JSON.parse(projectRaw) as ProjectState;
        if (project?.version === 1) {
          applyProjectState(project);
          setLastSavedAt(project.savedAt || "");
        }
      }

      const creditsRaw = localStorage.getItem(creditsStorageKey);
      if (creditsRaw !== null) {
        const parsedCredits = Number(creditsRaw);
        if (Number.isFinite(parsedCredits)) {
          setCredits(Math.max(0, parsedCredits));
        }
      }

      const promptHistoryRaw = localStorage.getItem(promptHistoryStorageKey);
      if (promptHistoryRaw) {
        const parsedPrompts = JSON.parse(promptHistoryRaw);
        if (Array.isArray(parsedPrompts)) {
          setPromptHistoryItems(
            parsedPrompts.filter((item) => typeof item === "string").slice(0, 20)
          );
        }
      }
    } catch {
      setHistoryItems([]);
    } finally {
      setProjectLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (nodeCreated) {
      ensureNodePositions();
    }
  }, [nodeCreated]);

  useEffect(() => {
    if (!projectLoaded) return;

    const timer = window.setTimeout(() => {
      saveProject(false);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [
    projectLoaded,
    nodeCreated,
    prompt,
    image,
    model.value,
    ratio.value,
    quality,
    imageNodePosition,
    promptNodePosition,
    referenceImages,
    generatedNodes,
    connections,
    selectedNodeId,
    canvasZoom,
  ]);

  useEffect(() => {
    if (!projectLoaded) return;

    localStorage.setItem(creditsStorageKey, String(credits));
  }, [projectLoaded, credits]);

  function saveHistory(nextItems: HistoryItem[]) {
    setHistoryItems(nextItems);
    localStorage.setItem(historyStorageKey, JSON.stringify(nextItems));
  }

  function savePromptHistory(nextItems: string[]) {
    setPromptHistoryItems(nextItems);
    localStorage.setItem(promptHistoryStorageKey, JSON.stringify(nextItems));
  }

  function addPromptHistory(nextPrompt: string) {
    const normalized = nextPrompt.trim();
    if (!normalized) return;

    const nextItems = [
      normalized,
      ...promptHistoryItems.filter((item) => item !== normalized),
    ].slice(0, 20);

    savePromptHistory(nextItems);
  }

  function fillPrompt(nextPrompt: string, message = "Prompt 已填入") {
    setPrompt(nextPrompt);
    addPromptHistory(nextPrompt);
    setNodeCreated(true);
    ensureNodePositions();
    setTemplateOpen(false);
    setPromptHistoryOpen(false);
    window.setTimeout(() => promptInputRef.current?.focus(), 0);
    showToast("success", message);
  }

  function addHistoryItem(
    imageUrl: string,
    usedPrompt: string,
    usedModel = model,
    usedRatio = ratio
  ) {
    const item: HistoryItem = {
      id: `${Date.now()}`,
      imageUrl,
      prompt: usedPrompt,
      modelLabel: usedModel.label,
      modelValue: usedModel.value,
      ratio: usedRatio.value,
      createdAt: new Date().toISOString(),
      creditCost: generationCreditCost,
    };

    saveHistory([item, ...historyItems].slice(0, 30));
  }

  function addGeneratedNode(
    imageUrl: string,
    usedPrompt: string,
    usedModel = model,
    usedRatio = ratio,
    parentId: string | null = null
  ) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const node: GeneratedImageNode = {
      id,
      url: imageUrl,
      prompt: usedPrompt,
      modelLabel: usedModel.label,
      modelValue: usedModel.value,
      ratio: usedRatio.value,
      position: getGeneratedNodePosition(generatedNodes.length, parentId),
      parentId,
      creditCost: generationCreditCost,
    };

    setGeneratedNodes((items) => [...items, node]);
    if (parentId) {
      setConnections((items) => [
        ...items,
        { id: `${parentId}-${id}`, fromId: parentId, toId: id },
      ]);
    }
    setSelectedNodeId(id);
    setImage(imageUrl);
    addHistoryItem(imageUrl, usedPrompt, usedModel, usedRatio);
    setCredits((current) => Math.max(0, current - generationCreditCost));
    showToast("success", `生成成功，已消耗 ${generationCreditCost} credit`);
  }

  function selectGeneratedNode(node: GeneratedImageNode) {
    const restoredModel =
      imageModels.find((modelItem) => modelItem.value === node.modelValue) ||
      defaultImageModel;
    const restoredRatio =
      ratios.find((ratioItem) => ratioItem.value === node.ratio) || defaultRatio;

    setSelectedNodeId(node.id);
    setPrompt(node.prompt);
    setModel(restoredModel);
    setRatio(restoredRatio);
    setImage(node.url);
    setNodeMenuOpen(null);
    setModelPanelOpen(false);
    setRatioPanelOpen(false);
  }

  function createNodeAndFocus() {
    ensureNodePositions();
    setNodeCreated(true);
    window.setTimeout(() => promptInputRef.current?.focus(), 0);
  }

  function appendPrompt(text: string) {
    let nextPrompt = "";

    setPrompt((current) => {
      const trimmed = current.trim();
      nextPrompt = trimmed ? `${trimmed}\n${text}` : text;

      return nextPrompt;
    });
    addPromptHistory(nextPrompt || text);
    setNodeCreated(true);
    ensureNodePositions();
    window.setTimeout(() => promptInputRef.current?.focus(), 0);
  }

  function clearPromptInput() {
    setPrompt("");
    setPendingParentNodeId(null);
    setPromptHistoryOpen(false);
    window.setTimeout(() => promptInputRef.current?.focus(), 0);
  }

  function optimizePrompt() {
    const basePrompt = prompt.trim();
    if (!basePrompt) {
      showToast("warning", "请输入内容");
      window.setTimeout(() => promptInputRef.current?.focus(), 0);
      return;
    }

    const optimized = [
      `画面主体：${basePrompt}`,
      "风格：高级商业视觉，画面干净，有品牌质感",
      "光影：柔和棚拍光，主体受光明确，层次自然",
      "构图：主体居中偏上，留出标题和卖点排版空间",
      "高清细节：材质纹理清晰，边缘干净，细节丰富",
      "商业摄影感：真实产品摄影质感，高级背景，适合投放和展示",
    ].join("\n");

    fillPrompt(optimized, "提示词已优化");
  }

  function openUploadPicker() {
    uploadInputRef.current?.click();
  }

  async function handleReferenceUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []).filter((file) =>
      file.type.startsWith("image/")
    );

    if (files.length === 0) return;

    try {
      const uploaded = await Promise.all(
        files.map(
          (file, index) =>
            new Promise<ReferenceImage>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () =>
                resolve({
                  id: `${Date.now()}-${index}`,
                  url: String(reader.result),
                  name: file.name || "Reference Image",
                  position: getReferenceNodePosition(referenceImages.length + index),
                });
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(file);
            })
        )
      );

      ensureNodePositions();
      setNodeCreated(true);
      setReferenceImages((items) => [...items, ...uploaded]);
      showToast("success", "参考图已添加");
    } catch {
      showToast("error", "图片上传失败");
    }

    event.target.value = "";
  }

  function handleExtensionAction(text: string, parentId?: string | null) {
    appendPrompt(text);
    setPendingParentNodeId(parentId || selectedNodeId);
    setExtensionMenuOpen(null);
  }

  function handleCanvasDoubleClick(event: MouseEvent<HTMLElement>) {
    if (event.target === event.currentTarget || !nodeCreated) {
      createNodeAndFocus();
    }
  }

  function normalizeError(message: string, status?: string) {
    if (isGptModel(model.value) && isBusyError(message, status)) {
      return busyModelMessage;
    }

    return message || "生成失败";
  }

  function reportError(message: string, status?: string) {
    const normalized = normalizeError(message, status);
    setError(normalized);
    setStatusMessage("");
    showToast("error", normalized);
  }

  function handleToolbarAction(id: string) {
    if (id === "generate") {
      createNodeAndFocus();
      return;
    }

    if (id === "upload") {
      openUploadPicker();
      return;
    }

    if (id === "history") {
      setHistoryOpen(true);
      setTemplateOpen(false);
      setPromptHistoryOpen(false);
      return;
    }

    if (id === "templates") {
      setTemplateOpen(true);
      setHistoryOpen(false);
      setPromptHistoryOpen(false);
      return;
    }

    if (id === "settings") {
      showToast("warning", "设置功能下一步接入");
    }
  }

  async function downloadImage(imageUrl = activeImageUrl) {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "ai-canvas-image.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, "_blank", "noopener,noreferrer");
    }
  }

  function handleExport() {
    const project = createProjectState();
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "ai-canvas-project.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("success", "项目已导出");
  }

  function openImportPicker() {
    importInputRef.current?.click();
  }

  function handleProjectImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const project = JSON.parse(String(reader.result)) as ProjectState;
        if (project?.version !== 1) {
          showToast("error", "项目文件格式不正确");
          return;
        }

        applyProjectState(project);
        localStorage.setItem(projectStorageKey, JSON.stringify(project));
        setLastSavedAt(project.savedAt || new Date().toISOString());
        showToast("success", "项目已导入");
      } catch {
        showToast("error", "项目导入失败");
      } finally {
        event.target.value = "";
      }
    };
    reader.onerror = () => {
      showToast("error", "项目文件读取失败");
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  function clearCanvas() {
    setClearConfirmOpen(false);
    setImage("");
    setGeneratedNodes([]);
    setConnections([]);
    setReferenceImages([]);
    setSelectedNodeId(null);
    setNodeMenuOpen(null);
    setPendingParentNodeId(null);
    setError("");
    setStatusMessage("");
    setPreviewOpen(false);
    setPreviewImage("");
    setExtensionMenuOpen(null);
    showToast("success", "画布已清空");
  }

  function clearHistory() {
    if (historyItems.length === 0) return;

    saveHistory([]);
    showToast("success", "历史记录已清空");
  }

  function restoreHistoryItem(item: HistoryItem) {
    const restoredModel =
      imageModels.find((modelItem) => modelItem.value === item.modelValue) ||
      defaultImageModel;
    const restoredRatio =
      ratios.find((ratioItem) => ratioItem.value === item.ratio) || defaultRatio;

    setNodeCreated(true);
    ensureNodePositions(true);
    const id = `history-${Date.now()}`;
    const node: GeneratedImageNode = {
      id,
      url: item.imageUrl,
      prompt: item.prompt,
      modelLabel: restoredModel.label,
      modelValue: restoredModel.value,
      ratio: restoredRatio.value,
      position: getGeneratedNodePosition(0),
      parentId: null,
      creditCost: item.creditCost || generationCreditCost,
    };

    setGeneratedNodes((nodes) => [...nodes, node]);
    setSelectedNodeId(id);
    setImage(item.imageUrl);
    setPrompt(item.prompt);
    setModel(restoredModel);
    setRatio(restoredRatio);
    setError("");
    setStatusMessage("");
    setHistoryOpen(false);
    setModelPanelOpen(false);
    setRatioPanelOpen(false);
    setExtensionMenuOpen(null);
  }

  function openPreview(imageUrl: string) {
    setPreviewImage(imageUrl);
    setPreviewOpen(true);
  }

  async function copyPrompt(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    showToast("success", "Prompt 已复制");
  }

  function deleteGeneratedNode(id: string) {
    const nextNodes = generatedNodes.filter((node) => node.id !== id);
    const nextActive = nextNodes[nextNodes.length - 1];

    setGeneratedNodes(nextNodes);
    setConnections((items) =>
      items.filter((item) => item.fromId !== id && item.toId !== id)
    );
    setNodeMenuOpen(null);
    if (selectedNodeId === id) {
      setSelectedNodeId(nextActive?.id || null);
      setImage(nextActive?.url || "");
    }
    showToast("success", "节点已删除");
  }

  function regenerateFromNode(node: GeneratedImageNode) {
    const restoredModel =
      imageModels.find((modelItem) => modelItem.value === node.modelValue) ||
      defaultImageModel;
    const restoredRatio =
      ratios.find((ratioItem) => ratioItem.value === node.ratio) || defaultRatio;

    selectGeneratedNode(node);
    void generateImage({
      promptText: node.prompt,
      modelOption: restoredModel,
      ratioOption: restoredRatio,
      parentId: node.id,
    });
  }

  function updateZoom(nextZoom: number) {
    setCanvasZoom(clamp(Number(nextZoom.toFixed(2)), 0.6, 1.6));
  }

  function rechargeCredits(amount: number, planName: string) {
    setCredits((current) => current + amount);
    setMembershipOpen(false);
    showToast("success", `${planName} 已到账，增加 ${amount} credits`);
  }

  async function generateImage(overrides: GenerateOverrides = {}) {
    if (loading) {
      showToast("warning", "正在生成中，请稍候");
      return;
    }

    setRatioPanelOpen(false);
    setModelPanelOpen(false);
    setExtensionMenuOpen(null);
    setNodeMenuOpen(null);

    if (!nodeCreated) {
      setNodeCreated(true);
    }

    const usedModel = overrides.modelOption || model;
    const usedRatio = overrides.ratioOption || ratio;
    const parentId =
      overrides.parentId === undefined ? pendingParentNodeId : overrides.parentId;
    const currentPrompt =
      overrides.promptText ?? promptInputRef.current?.value ?? prompt;

    if (!currentPrompt.trim()) {
      showToast("warning", "请输入内容");
      window.setTimeout(() => promptInputRef.current?.focus(), 0);
      return;
    }

    if (credits < generationCreditCost) {
      showToast("warning", "积分不足，请升级会员");
      setMembershipOpen(true);
      return;
    }

    addPromptHistory(currentPrompt.trim());

    setLoading(true);
    setError("");
    setStatusMessage("正在提交任务...");
    setPreviewOpen(false);
    setPreviewImage("");

    try {
      const { response: createRes, data: createData } = await fetchJsonWithTimeout(
        "/api/image/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: currentPrompt.trim(),
            ratio: getRequestRatio(usedRatio),
            model: usedModel.value,
          }),
        }
      );

      if (!createRes.ok || createData.status === "failed" || createData.status === "overloaded") {
        reportError(createData.error || "任务创建失败", createData.status);
        return;
      }

      if (createData.imageUrl) {
        addGeneratedNode(
          createData.imageUrl,
          currentPrompt.trim(),
          usedModel,
          usedRatio,
          parentId
        );
        setStatusMessage("");
        setPendingParentNodeId(null);
        return;
      }

      if (!createData.resultUrl) {
        reportError(createData.error || "任务创建失败", createData.status);
        return;
      }

      let completed = false;
      setStatusMessage(loadingMessage);

      for (let i = 0; i < 80; i++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const { response: resultRes, data: resultData } =
          await fetchJsonWithTimeout("/api/image/result", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              resultUrl: createData.resultUrl,
            }),
          });

        if (!resultRes.ok || resultData.status === "failed" || resultData.status === "overloaded") {
          reportError(resultData.error || "生成失败", resultData.status);
          return;
        }

        if (resultData.status === "completed" && resultData.imageUrl) {
          addGeneratedNode(
            resultData.imageUrl,
            currentPrompt.trim(),
            usedModel,
            usedRatio,
            parentId
          );
          setStatusMessage("");
          setPendingParentNodeId(null);
          completed = true;
          break;
        }
      }

      if (!completed) {
        reportError("生成超时，请稍后重试", "timeout");
      }
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error && error.name === "AbortError"
          ? "请求超时，请稍后重试"
          : error instanceof Error
            ? error.message || "图片生成失败"
            : "图片生成失败";

      reportError(message, error instanceof Error ? error.name : undefined);
    } finally {
      setLoading(false);
      if (overrides.parentId !== undefined || pendingParentNodeId) {
        setPendingParentNodeId(null);
      }
    }
  }

  function handlePromptSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void generateImage();
  }

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#030303",
        color: "white",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleReferenceUpload}
        style={{ display: "none" }}
      />
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleProjectImport}
        style={{ display: "none" }}
      />

      <header
        style={{
          height: 64,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(8,8,9,0.96)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          position: "relative",
          boxSizing: "border-box",
          zIndex: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 16,
              background: "white",
              color: "black",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 28px rgba(255,255,255,0.18)",
            }}
          >
            <Sparkles size={18} />
          </div>
          <div style={{ fontWeight: 700, letterSpacing: 0.2 }}>AI Canvas</div>
        </div>

        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.045)",
            borderRadius: 999,
            padding: "8px 16px",
            color: "rgba(255,255,255,0.76)",
            fontSize: 14,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "#34d399",
              boxShadow: "0 0 16px rgba(52,211,153,0.65)",
            }}
          />
          <span>Untitled Project</span>
          <span style={{ color: "rgba(255,255,255,0.38)" }}>·</span>
          <span style={{ color: "#86efac", fontWeight: 750 }}>
            {lastSavedAt ? "已自动保存" : "准备自动保存"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              height: 40,
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 999,
              background: "rgba(255,255,255,0.045)",
              color: "rgba(255,255,255,0.78)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 14px",
              fontSize: 13,
              fontWeight: 750,
            }}
          >
            <span>游客模式</span>
            <span style={{ color: "rgba(255,255,255,0.32)" }}>|</span>
            <span style={{ color: credits > 0 ? "#86efac" : "#fca5a5" }}>
              {credits} credits
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMembershipOpen(true)}
            style={{
              ...glassButton,
              border: "1px solid rgba(134,239,172,0.28)",
              color: "#bbf7d0",
            }}
          >
            充值
          </button>
          <button
            type="button"
            onClick={() => saveProject(true)}
            style={glassButton}
          >
            <Save size={16} />
            保存
          </button>
          <button
            type="button"
            onClick={openImportPicker}
            style={glassButton}
          >
            <Upload size={16} />
            导入
          </button>
          <button type="button" onClick={() => setClearConfirmOpen(true)} style={glassButton}>
            <Trash2 size={16} />
            清空
          </button>
          <button
            type="button"
            onClick={handleExport}
            style={{
              ...glassButton,
              border: "none",
              background: "white",
              color: "black",
            }}
          >
            <FileUp size={16} />
            导出
          </button>
        </div>
      </header>

      <div style={{ height: "calc(100vh - 64px)", display: "flex" }}>
        <aside
          style={{
            width: 232,
            minWidth: 232,
            borderRight: "1px solid rgba(255,255,255,0.08)",
            background: "#080809",
            padding: 12,
            boxSizing: "border-box",
            zIndex: 3,
          }}
        >
          <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {toolbarItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToolbarAction(item.id)}
                  style={{
                    height: 48,
                    border: "none",
                    borderRadius: 18,
                    background: item.active
                      ? "white"
                      : "rgba(255,255,255,0.045)",
                    color: item.active ? "black" : "rgba(255,255,255,0.7)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "0 14px",
                    fontSize: 14,
                    fontWeight: 650,
                    cursor: "pointer",
                    boxShadow: item.active
                      ? "0 14px 38px rgba(255,255,255,0.14)"
                      : "none",
                    textAlign: "left",
                  }}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section
          ref={canvasRef}
          onDoubleClick={handleCanvasDoubleClick}
          style={{
            position: "relative",
            flex: 1,
            overflow: "hidden",
            background: "#050505",
            cursor: nodeCreated ? "default" : "crosshair",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
              opacity: 0.34,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(circle at 50% 38%, rgba(255,255,255,0.055), transparent 36%), linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.42))",
            }}
          />

          {referenceImages.map((item) => (
            <article
              key={item.id}
              onPointerDown={(event) => startReferenceDrag(item.id, event)}
              style={{
                position: "absolute",
                left: item.position.x,
                top: item.position.y,
                transform: `translate(-50%, -50%) scale(${canvasZoom})`,
                transformOrigin: "center",
                width: 260,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(25,25,26,0.96)",
                borderRadius: 22,
                padding: 10,
                boxSizing: "border-box",
                boxShadow: "0 22px 70px rgba(0,0,0,0.5)",
                cursor: "grab",
                touchAction: "none",
                userSelect: "none",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                  color: "rgba(255,255,255,0.62)",
                  fontSize: 13,
                  fontWeight: 750,
                }}
              >
                <ImageIcon size={15} />
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.name}
                </span>
              </div>
              <img
                src={item.url}
                alt={item.name}
                draggable={false}
                style={{
                  width: "100%",
                  aspectRatio: "4 / 3",
                  objectFit: "cover",
                  borderRadius: 16,
                  display: "block",
                  background: "#151515",
                }}
              />
            </article>
          ))}

          <svg
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 1,
              transform: `scale(${canvasZoom})`,
              transformOrigin: "0 0",
            }}
          >
            {connections.map((connection) => {
              const from = generatedNodes.find((node) => node.id === connection.fromId);
              const to = generatedNodes.find((node) => node.id === connection.toId);
              if (!from || !to) return null;

              const midX = (from.position.x + to.position.x) / 2;

              return (
                <path
                  key={connection.id}
                  d={`M ${from.position.x} ${from.position.y} C ${midX} ${from.position.y}, ${midX} ${to.position.y}, ${to.position.x} ${to.position.y}`}
                  fill="none"
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth={2}
                  strokeDasharray="8 10"
                />
              );
            })}
          </svg>

          {generatedNodes.map((node, index) => {
            const selected = node.id === selectedNodeId;
            const menuOpen = nodeMenuOpen === node.id;
            const extensionOpen = extensionMenuOpen === `node:${node.id}`;

            return (
              <article
                key={node.id}
                onPointerDown={(event) => startGeneratedNodeDrag(node.id, event)}
                onClick={() => selectGeneratedNode(node)}
                style={{
                  position: "absolute",
                  left: node.position.x,
                  top: node.position.y,
                  transform: `translate(-50%, -50%) scale(${canvasZoom})`,
                  transformOrigin: "center",
                  width: 350,
                  border: selected
                    ? "2px solid rgba(255,255,255,0.72)"
                    : "1px solid rgba(255,255,255,0.16)",
                  background: "rgba(28,28,29,0.97)",
                  borderRadius: 24,
                  padding: 10,
                  boxSizing: "border-box",
                  boxShadow: selected
                    ? "0 26px 90px rgba(255,255,255,0.16)"
                    : "0 22px 72px rgba(0,0,0,0.55)",
                  cursor: "grab",
                  touchAction: "none",
                  userSelect: "none",
                  zIndex: selected ? 8 : 5,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 8,
                    color: "rgba(255,255,255,0.68)",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  <span>Result {index + 1}</span>
                  <div style={{ position: "relative" }} data-no-drag="true">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setNodeMenuOpen((current) =>
                          current === node.id ? null : node.id
                        );
                      }}
                      style={{
                        ...iconButton,
                        width: 34,
                        height: 34,
                        background: "rgba(0,0,0,0.45)",
                      }}
                      aria-label="节点操作"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {menuOpen ? (
                      <div
                        style={{
                          position: "absolute",
                          right: 0,
                          top: 42,
                          width: 154,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(34,34,35,0.98)",
                          borderRadius: 16,
                          padding: 8,
                          boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
                          zIndex: 30,
                        }}
                      >
                        {[
                          { label: "下载", action: () => downloadImage(node.url) },
                          { label: "放大预览", action: () => openPreview(node.url) },
                          { label: "复制 Prompt", action: () => void copyPrompt(node.prompt) },
                          { label: "重新生成", action: () => regenerateFromNode(node) },
                          { label: "删除节点", action: () => deleteGeneratedNode(node.id) },
                        ].map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              item.action();
                              if (item.label !== "删除节点") setNodeMenuOpen(null);
                            }}
                            style={{
                              width: "100%",
                              height: 36,
                              border: "none",
                              borderRadius: 11,
                              background: "transparent",
                              color:
                                item.label === "删除节点"
                                  ? "#fca5a5"
                                  : "rgba(255,255,255,0.82)",
                              textAlign: "left",
                              padding: "0 10px",
                              fontSize: 13,
                              fontWeight: 750,
                              cursor: "pointer",
                            }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div style={{ position: "relative" }}>
                  <img
                    src={node.url}
                    alt={node.prompt}
                    draggable={false}
                    style={{
                      width: "100%",
                      aspectRatio: aspectRatioMap[node.ratio] || "4 / 3",
                      objectFit: "contain",
                      borderRadius: 18,
                      display: "block",
                      background: "#171717",
                    }}
                  />
                  <button
                    type="button"
                    data-no-drag="true"
                    onClick={(event) => {
                      event.stopPropagation();
                      setExtensionMenuOpen((current) =>
                        current === `node:${node.id}` ? null : `node:${node.id}`
                      );
                      setSelectedNodeId(node.id);
                    }}
                    style={{
                      ...iconButton,
                      position: "absolute",
                      right: -20,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 38,
                      height: 38,
                      background: "rgba(255,255,255,0.08)",
                    }}
                    aria-label="延展节点"
                  >
                    <Plus size={20} />
                  </button>

                  {extensionOpen ? (
                    <div
                      data-no-drag="true"
                      style={{
                        position: "absolute",
                        left: "calc(100% + 26px)",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 156,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(34,34,35,0.98)",
                        borderRadius: 18,
                        padding: 8,
                        boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
                        zIndex: 30,
                      }}
                    >
                      {extensionActions.map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleExtensionAction(action.prompt, node.id);
                          }}
                          style={{
                            width: "100%",
                            height: 38,
                            border: "none",
                            borderRadius: 12,
                            background: "transparent",
                            color: "rgba(255,255,255,0.82)",
                            textAlign: "left",
                            padding: "0 10px",
                            fontSize: 14,
                            fontWeight: 750,
                            cursor: "pointer",
                          }}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div
                  style={{
                    marginTop: 9,
                    color: "rgba(255,255,255,0.56)",
                    fontSize: 12,
                    lineHeight: 1.4,
                  }}
                >
                  {node.prompt.length > 58 ? `${node.prompt.slice(0, 58)}...` : node.prompt}
                </div>
              </article>
            );
          })}

          {!nodeCreated ? (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "48%",
                transform: "translate(-50%, -50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 18,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  color: "rgba(255,255,255,0.52)",
                  fontSize: 22,
                  whiteSpace: "nowrap",
                }}
              >
                <button
                  type="button"
                  onClick={createNodeAndFocus}
                  style={{
                    height: 50,
                    border: "1px solid rgba(255,255,255,0.16)",
                    borderRadius: 18,
                    background: "rgba(255,255,255,0.16)",
                    color: "white",
                    padding: "0 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <MousePointer2 size={22} color="#38bdf8" />
                  双击
                </button>
                画布自由生成，或查看模板
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
                {quickActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => showToast("warning", `${action} 下一步接入`)}
                    style={{
                      height: 46,
                      borderRadius: 16,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.055)",
                      color: "rgba(255,255,255,0.52)",
                      padding: "0 18px",
                      fontSize: 15,
                      cursor: "pointer",
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div
                onPointerDown={(event) => startNodeDrag("image", event)}
                style={{
                  position: "absolute",
                  left: imageNodePosition?.x ?? "50%",
                  top: imageNodePosition?.y ?? "36%",
                  transform: `translate(-50%, -50%) scale(${canvasZoom})`,
                  transformOrigin: "center",
                  width: "min(570px, calc(100% - 64px))",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 20,
                  cursor: "grab",
                  touchAction: "none",
                  userSelect: "none",
                }}
              >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "rgba(255,255,255,0.56)", fontWeight: 650 }}>
                  <ImageIcon size={16} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  Image
                </span>
                <button
                  type="button"
                  onClick={openUploadPicker}
                  style={{
                    height: 44,
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.12)",
                    color: "white",
                    padding: "0 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Upload size={17} />
                  上传
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() =>
                      setExtensionMenuOpen((current) =>
                        current === "left" ? null : "left"
                      )
                    }
                    style={{ ...iconButton, background: "rgba(255,255,255,0.04)" }}
                  >
                    <Plus size={22} />
                  </button>

                  {extensionMenuOpen === "left" ? (
                    <div
                      data-no-drag="true"
                      style={{
                        position: "absolute",
                        right: 50,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 156,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(34,34,35,0.98)",
                        borderRadius: 18,
                        padding: 8,
                        boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
                        zIndex: 20,
                      }}
                    >
                      {extensionActions.map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          onClick={() => handleExtensionAction(action.prompt)}
                          style={{
                            width: "100%",
                            height: 38,
                            border: "none",
                            borderRadius: 12,
                            background: "transparent",
                            color: "rgba(255,255,255,0.82)",
                            textAlign: "left",
                            padding: "0 10px",
                            fontSize: 14,
                            fontWeight: 750,
                            cursor: "pointer",
                          }}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <article
                  style={{
                    width: 430,
                    border: "2px solid rgba(255,255,255,0.38)",
                    background: "rgba(32,32,33,0.96)",
                    borderRadius: 24,
                    padding: 12,
                    boxSizing: "border-box",
                    boxShadow: "0 24px 90px rgba(0,0,0,0.55)",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      overflow: "hidden",
                      borderRadius: 18,
                      background: "#202020",
                      aspectRatio: nodeAspectRatio,
                    }}
                  >
                    {loading ? (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 16,
                          textAlign: "center",
                        }}
                      >
                        <Wand2 size={42} color="rgba(255,255,255,0.5)" />
                        <div>
                          <p style={{ margin: 0, color: "rgba(255,255,255,0.72)" }}>
                            {statusMessage || loadingMessage}
                          </p>
                          <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
                            当前模型：{model.label}
                          </p>
                        </div>
                      </div>
                    ) : generatedNodes.length === 0 && image ? (
                      <>
                        <img
                          src={image}
                          alt="AI 生成图片"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            display: "block",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            right: 12,
                            top: 12,
                            display: "flex",
                            gap: 8,
                          }}
                        >
                          <button type="button" onClick={() => downloadImage()} style={iconButton} aria-label="下载图片">
                            <Download size={16} />
                          </button>
                          <button type="button" onClick={() => openPreview(image)} style={iconButton} aria-label="放大预览">
                            <Maximize2 size={16} />
                          </button>
                          <button type="button" onClick={() => void generateImage()} style={iconButton} aria-label="重新生成">
                            <RefreshCw size={16} />
                          </button>
                        </div>
                      </>
                    ) : error ? (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 24,
                          textAlign: "center",
                        }}
                      >
                        <p style={{ margin: 0, color: "#fca5a5" }}>{error}</p>
                      </div>
                    ) : (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ImageIcon size={58} color="rgba(255,255,255,0.26)" />
                      </div>
                    )}
                  </div>
                </article>

                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() =>
                      setExtensionMenuOpen((current) =>
                        current === "right" ? null : "right"
                      )
                    }
                    style={{ ...iconButton, background: "rgba(255,255,255,0.04)" }}
                  >
                    <Plus size={22} />
                  </button>

                  {extensionMenuOpen === "right" ? (
                    <div
                      data-no-drag="true"
                      style={{
                        position: "absolute",
                        left: 50,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 156,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(34,34,35,0.98)",
                        borderRadius: 18,
                        padding: 8,
                        boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
                        zIndex: 20,
                      }}
                    >
                      {extensionActions.map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          onClick={() => handleExtensionAction(action.prompt)}
                          style={{
                            width: "100%",
                            height: 38,
                            border: "none",
                            borderRadius: 12,
                            background: "transparent",
                            color: "rgba(255,255,255,0.82)",
                            textAlign: "left",
                            padding: "0 10px",
                            fontSize: 14,
                            fontWeight: 750,
                            cursor: "pointer",
                          }}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              </div>

              <form
                onSubmit={handlePromptSubmit}
                onPointerDown={(event) => startNodeDrag("prompt", event)}
                style={{
                  position: "absolute",
                  left: promptNodePosition?.x ?? "50%",
                  top: promptNodePosition?.y ?? "78%",
                  transform: `translate(-50%, -50%) scale(${canvasZoom})`,
                  transformOrigin: "center",
                  width: "min(1018px, calc(100% - 64px))",
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(32,32,33,0.98)",
                  borderRadius: 26,
                  padding: 16,
                  boxShadow: "0 24px 86px rgba(0,0,0,0.62)",
                  boxSizing: "border-box",
                  cursor: "grab",
                  touchAction: "none",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 54,
                    height: 5,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.18)",
                    margin: "0 auto 12px",
                  }}
                />

                <div
                  data-no-drag="true"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  {promptTemplates.map((template) => (
                    <button
                      key={template}
                      type="button"
                      onClick={() => appendPrompt(template)}
                      style={{
                        height: 34,
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.74)",
                        padding: "0 12px",
                        fontSize: 13,
                        fontWeight: 750,
                        cursor: "pointer",
                      }}
                    >
                      {template}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPromptHistoryOpen((open) => !open)}
                    style={{
                      height: 34,
                      border: "1px solid rgba(134,239,172,0.22)",
                      borderRadius: 999,
                      background: "rgba(134,239,172,0.08)",
                      color: "#bbf7d0",
                      padding: "0 12px",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    最近使用
                  </button>
                </div>

                {promptHistoryOpen ? (
                  <div
                    data-no-drag="true"
                    style={{
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(12,12,13,0.72)",
                      borderRadius: 18,
                      padding: 10,
                      marginBottom: 12,
                      display: "grid",
                      gap: 8,
                      maxHeight: 180,
                      overflowY: "auto",
                    }}
                  >
                    {promptHistoryItems.length === 0 ? (
                      <div style={{ color: "rgba(255,255,255,0.42)", fontSize: 13 }}>
                        还没有最近使用的 prompt
                      </div>
                    ) : (
                      promptHistoryItems.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => fillPrompt(item, "已恢复最近使用")}
                          style={{
                            border: "none",
                            borderRadius: 12,
                            background: "rgba(255,255,255,0.055)",
                            color: "rgba(255,255,255,0.78)",
                            padding: "9px 10px",
                            textAlign: "left",
                            fontSize: 13,
                            lineHeight: 1.45,
                            cursor: "pointer",
                          }}
                        >
                          {item.length > 120 ? `${item.slice(0, 120)}...` : item}
                        </button>
                      ))
                    )}
                  </div>
                ) : null}

                <div data-no-drag="true" style={{ position: "relative" }}>
                  <textarea
                    ref={promptInputRef}
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                        event.preventDefault();
                        void generateImage();
                      }
                    }}
                    placeholder="描述任何你想要生成的内容"
                    style={{
                      width: "100%",
                      minHeight: 96,
                      resize: "none",
                      background: "transparent",
                      color: "white",
                      border: "none",
                      outline: "none",
                      padding: "0 46px 0 2px",
                      boxSizing: "border-box",
                      fontSize: 18,
                      lineHeight: 1.45,
                      fontFamily: "inherit",
                    }}
                  />
                  {prompt ? (
                    <button
                      type="button"
                      onClick={clearPromptInput}
                      style={{
                        ...iconButton,
                        position: "absolute",
                        right: 2,
                        top: 0,
                        width: 34,
                        height: 34,
                        background: "rgba(255,255,255,0.08)",
                      }}
                      aria-label="清空输入"
                    >
                      <X size={15} />
                    </button>
                  ) : null}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    paddingTop: 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ position: "relative" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setModelPanelOpen((open) => !open);
                          setRatioPanelOpen(false);
                        }}
                        style={{
                          height: 40,
                          minWidth: 210,
                          borderRadius: 999,
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "rgba(0,0,0,0.22)",
                          color: "white",
                          padding: "0 14px",
                          fontSize: 15,
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          cursor: "pointer",
                        }}
                        aria-haspopup="listbox"
                        aria-expanded={modelPanelOpen}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <Sparkles size={17} color="rgba(255,255,255,0.72)" />
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {model.label}
                          </span>
                        </span>
                        <ChevronDown size={16} color="rgba(255,255,255,0.72)" />
                      </button>

                      {modelPanelOpen ? (
                        <div
                          data-no-drag="true"
                          role="listbox"
                          style={{
                            position: "absolute",
                            left: 0,
                            bottom: 54,
                            zIndex: 32,
                            width: 420,
                            maxWidth: "calc(100vw - 40px)",
                            borderRadius: 24,
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "rgba(39,39,40,0.99)",
                            boxShadow: "0 28px 90px rgba(0,0,0,0.6)",
                            padding: 12,
                            boxSizing: "border-box",
                          }}
                        >
                          {imageModels.map((item) => {
                            const active = item.value === model.value;
                            const chips = getModelChips(item.value);

                            return (
                              <button
                                key={item.value}
                                type="button"
                                role="option"
                                aria-selected={active}
                                onClick={() => {
                                  setModel(item);
                                  setModelPanelOpen(false);
                                }}
                                style={{
                                  width: "100%",
                                  minHeight: 82,
                                  border: "none",
                                  borderRadius: 18,
                                  background: active ? "rgba(255,255,255,0.11)" : "transparent",
                                  color: "white",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 14,
                                  padding: "14px 16px",
                                  cursor: "pointer",
                                  textAlign: "left",
                                }}
                              >
                                <span style={{ display: "flex", gap: 12, alignItems: "flex-start", minWidth: 0 }}>
                                  <Sparkles
                                    size={20}
                                    color={isGptModel(item.value) ? "#25f5b6" : "rgba(255,255,255,0.68)"}
                                    style={{ marginTop: 2, flex: "0 0 auto" }}
                                  />
                                  <span style={{ display: "grid", gap: 8, minWidth: 0 }}>
                                    <span
                                      style={{
                                        fontSize: 18,
                                        fontWeight: 850,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {item.label}
                                    </span>
                                    <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                      {chips.map((chip) => (
                                        <span
                                          key={chip}
                                          style={{
                                            borderRadius: 999,
                                            background:
                                              chip === "实验" || chip === "可能较慢"
                                                ? "#1df0b7"
                                                : "rgba(255,255,255,0.1)",
                                            color:
                                              chip === "实验" || chip === "可能较慢"
                                                ? "black"
                                                : "rgba(255,255,255,0.62)",
                                            padding: "3px 9px",
                                            fontSize: 12,
                                            fontWeight: 900,
                                          }}
                                        >
                                          {chip}
                                        </span>
                                      ))}
                                      <span
                                        style={{
                                          borderRadius: 999,
                                          background: "rgba(255,255,255,0.08)",
                                          color: "rgba(255,255,255,0.58)",
                                          padding: "3px 9px",
                                          fontSize: 12,
                                          fontWeight: 850,
                                        }}
                                      >
                                        {quality}
                                      </span>
                                    </span>
                                  </span>
                                </span>

                                {active ? <Check size={18} color="white" /> : null}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ position: "relative" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setRatioPanelOpen((open) => !open);
                          setModelPanelOpen(false);
                        }}
                        style={{
                          height: 40,
                          borderRadius: 999,
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "rgba(0,0,0,0.22)",
                          color: "white",
                          padding: "0 16px",
                          fontSize: 15,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          cursor: "pointer",
                        }}
                        aria-haspopup="dialog"
                        aria-expanded={ratioPanelOpen}
                      >
                        <span>{ratio.label}</span>
                        <span style={{ color: "rgba(255,255,255,0.55)" }}>·</span>
                        <span>{quality}</span>
                      </button>

                      {ratioPanelOpen ? (
                        <div
                          data-no-drag="true"
                          style={{
                            position: "absolute",
                            left: 0,
                            bottom: 54,
                            zIndex: 30,
                            width: 480,
                            maxWidth: "calc(100vw - 40px)",
                            borderRadius: 28,
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "linear-gradient(135deg, rgba(49,49,50,0.99), rgba(39,39,40,0.99))",
                            boxShadow: "0 28px 90px rgba(0,0,0,0.6)",
                            padding: 18,
                            boxSizing: "border-box",
                          }}
                        >
                          <div
                            style={{
                              color: "rgba(255,255,255,0.58)",
                              fontSize: 15,
                              fontWeight: 800,
                              margin: "0 0 10px 6px",
                            }}
                          >
                            画质
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(3, 1fr)",
                              gap: 0,
                              padding: 4,
                              borderRadius: 18,
                              background: "rgba(255,255,255,0.055)",
                              marginBottom: 22,
                            }}
                          >
                            {qualityOptions.map((item) => {
                              const active = quality === item;

                              return (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() => setQuality(item)}
                                  style={{
                                    height: 48,
                                    border: "none",
                                    borderRadius: 16,
                                    background: active ? "rgba(255,255,255,0.12)" : "transparent",
                                    color: active ? "white" : "rgba(255,255,255,0.38)",
                                    fontSize: 18,
                                    fontWeight: 800,
                                    cursor: "pointer",
                                  }}
                                >
                                  {item}
                                </button>
                              );
                            })}
                          </div>

                          <div
                            style={{
                              color: "rgba(255,255,255,0.58)",
                              fontSize: 15,
                              fontWeight: 800,
                              margin: "0 0 12px 6px",
                            }}
                          >
                            比例
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                              gap: 6,
                              padding: 10,
                              borderRadius: 18,
                              background: "rgba(255,255,255,0.055)",
                            }}
                          >
                            {ratios.map((item) => {
                              const active = ratio.value === item.value;

                              return (
                                <button
                                  key={item.value}
                                  type="button"
                                  onClick={() => {
                                    setRatio(item);
                                    setRatioPanelOpen(false);
                                  }}
                                  style={{
                                    minHeight: 68,
                                    border: "none",
                                    borderRadius: 16,
                                    background: active ? "rgba(255,255,255,0.13)" : "transparent",
                                    color: active ? "white" : "rgba(255,255,255,0.42)",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                    fontSize: 13,
                                    fontWeight: 750,
                                    cursor: "pointer",
                                  }}
                                >
                                  <span style={getRatioIconStyle(item.value, active)} />
                                  <span>{item.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>
                      风格
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>
                      摄影机控制
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: 48,
                      height: 48,
                      border: "none",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.86)",
                      color: "black",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.6 : 1,
                      boxShadow: "0 10px 34px rgba(255,255,255,0.14)",
                    }}
                    aria-label={loading ? "生成中" : "生成"}
                  >
                    {loading ? <RefreshCw size={22} /> : <Wand2 size={22} />}
                  </button>
                </div>
              </form>
            </>
          )}

          <div
            style={{
              position: "absolute",
              right: 22,
              bottom: 22,
              zIndex: 18,
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(18,18,19,0.92)",
              borderRadius: 999,
              padding: 8,
              boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
            }}
          >
            <span
              style={{
                minWidth: 52,
                textAlign: "center",
                color: "rgba(255,255,255,0.72)",
                fontSize: 13,
                fontWeight: 850,
              }}
            >
              {Math.round(canvasZoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => updateZoom(canvasZoom - 0.1)}
              style={{ ...iconButton, width: 34, height: 34, background: "rgba(255,255,255,0.06)" }}
              aria-label="缩小"
            >
              <Minus size={16} />
            </button>
            <button
              type="button"
              onClick={() => updateZoom(canvasZoom + 0.1)}
              style={{ ...iconButton, width: 34, height: 34, background: "rgba(255,255,255,0.06)" }}
              aria-label="放大"
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              onClick={() => updateZoom(1)}
              style={{
                height: 34,
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.78)",
                padding: "0 12px",
                fontSize: 12,
                fontWeight: 850,
                cursor: "pointer",
              }}
            >
              重置视图
            </button>
          </div>
        </section>
      </div>

      {historyOpen ? (
        <div
          style={{
            position: "fixed",
            top: 64,
            right: 0,
            bottom: 0,
            zIndex: 40,
            width: 360,
            borderLeft: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(14,14,16,0.98)",
            boxShadow: "-30px 0 90px rgba(0,0,0,0.55)",
            padding: 18,
            boxSizing: "border-box",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>历史记录</div>
              <div style={{ marginTop: 4, color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
                点击图片恢复到画布
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={clearHistory}
                disabled={historyItems.length === 0}
                style={{
                  ...glassButton,
                  height: 38,
                  opacity: historyItems.length === 0 ? 0.45 : 1,
                  cursor: historyItems.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                <Trash2 size={15} />
                清空
              </button>
              <button type="button" onClick={() => setHistoryOpen(false)} style={iconButton}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
            {historyItems.length === 0 ? (
              <div style={{ color: "rgba(255,255,255,0.42)", fontSize: 14 }}>
                还没有生成历史
              </div>
            ) : (
              historyItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => restoreHistoryItem(item)}
                  style={{
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.045)",
                    borderRadius: 18,
                    padding: 10,
                    textAlign: "left",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.prompt}
                    style={{
                      width: "100%",
                      aspectRatio: "4 / 3",
                      objectFit: "cover",
                      borderRadius: 12,
                      display: "block",
                    }}
                  />
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 13,
                      lineHeight: 1.45,
                      color: "rgba(255,255,255,0.82)",
                    }}
                  >
                    {item.prompt}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.42)" }}>
                    {item.modelLabel} · {getRatioLabel(item.ratio)} ·{" "}
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "#86efac" }}>
                    消耗 {item.creditCost || generationCreditCost} credit
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}

      {clearConfirmOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 52,
            background: "rgba(0,0,0,0.62)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: 380,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(28,28,29,0.98)",
              borderRadius: 24,
              padding: 22,
              boxShadow: "0 28px 100px rgba(0,0,0,0.62)",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 850 }}>清空当前画布？</div>
            <div
              style={{
                marginTop: 10,
                color: "rgba(255,255,255,0.56)",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              这会清除当前项目里的参考图、结果节点和连接线，但不会删除生成历史。
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
              <button
                type="button"
                onClick={() => setClearConfirmOpen(false)}
                style={glassButton}
              >
                取消
              </button>
              <button
                type="button"
                onClick={clearCanvas}
                style={{
                  ...glassButton,
                  border: "none",
                  background: "#fca5a5",
                  color: "#160606",
                }}
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {membershipOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 54,
            background: "rgba(0,0,0,0.66)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: 640,
              maxWidth: "100%",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(27,27,28,0.98)",
              borderRadius: 28,
              padding: 24,
              boxShadow: "0 28px 110px rgba(0,0,0,0.66)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>选择会员套餐</div>
                <div style={{ marginTop: 6, color: "rgba(255,255,255,0.52)", fontSize: 14 }}>
                  当前为游客模式，充值为本地模拟，不会产生真实支付。
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMembershipOpen(false)}
                style={{ ...iconButton, background: "rgba(255,255,255,0.08)" }}
                aria-label="关闭会员套餐"
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 12,
                marginTop: 22,
              }}
            >
              {membershipPlans.map((plan) => (
                <button
                  key={plan.name}
                  type="button"
                  onClick={() => rechargeCredits(plan.credits, plan.name)}
                  style={{
                    minHeight: 168,
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 22,
                    background:
                      plan.name === "Pro"
                        ? "linear-gradient(180deg, rgba(134,239,172,0.18), rgba(255,255,255,0.05))"
                        : "rgba(255,255,255,0.055)",
                    color: "white",
                    padding: 16,
                    textAlign: "left",
                    cursor: "pointer",
                    boxShadow:
                      plan.name === "Pro"
                        ? "0 18px 60px rgba(134,239,172,0.12)"
                        : "none",
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{plan.name}</div>
                  <div
                    style={{
                      marginTop: 18,
                      fontSize: 30,
                      fontWeight: 950,
                      color: plan.name === "Pro" ? "#86efac" : "white",
                    }}
                  >
                    {plan.credits}
                  </div>
                  <div style={{ marginTop: 2, color: "rgba(255,255,255,0.54)", fontSize: 13 }}>
                    credits
                  </div>
                  <div style={{ marginTop: 20, color: "rgba(255,255,255,0.62)", fontSize: 13 }}>
                    {plan.tone}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div
        style={{
          position: "fixed",
          right: 20,
          top: 78,
          zIndex: 70,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => {
          const color =
            toast.type === "success"
              ? "#86efac"
              : toast.type === "warning"
                ? "#fde68a"
                : "#fca5a5";

          return (
            <div
              key={toast.id}
              style={{
                minWidth: 220,
                maxWidth: 340,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(22,22,23,0.96)",
                borderRadius: 16,
                padding: "12px 14px",
                color: "white",
                boxShadow: "0 18px 70px rgba(0,0,0,0.48)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: color,
                  boxShadow: `0 0 16px ${color}`,
                  flex: "0 0 auto",
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 750, lineHeight: 1.45 }}>
                {toast.message}
              </span>
            </div>
          );
        })}
      </div>

      {previewOpen && (previewImage || activeImageUrl) ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.92)",
            padding: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setPreviewOpen(false);
              setPreviewImage("");
            }}
            aria-label="关闭预览"
            style={{
              ...iconButton,
              position: "absolute",
              right: 20,
              top: 20,
              background: "rgba(255,255,255,0.1)",
            }}
          >
            <X size={18} />
          </button>
          <div
            style={{
              width: "100%",
              maxWidth: 1180,
              maxHeight: "88vh",
              borderRadius: 28,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#111113",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 30px 120px rgba(0,0,0,0.7)",
            }}
          >
            <img
              src={previewImage || activeImageUrl}
              alt="AI 生成图片预览"
              style={{
                width: "100%",
                maxHeight: "88vh",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
