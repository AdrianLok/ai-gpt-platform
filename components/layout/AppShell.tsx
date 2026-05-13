"use client";

import type {
  ChangeEvent,
  FormEvent,
  MouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useEffect, useRef, useState } from "react";
import { CanvasArea } from "../canvas/Canvas";
import { HistoryPanel } from "../history/ImageHistory";
import { PreviewModal } from "../../components/PreviewModal";
import { LeftToolbar } from "../panels/LeftToolbar";
import { RightInspector } from "../panels/RightInspector";
import { TopBar } from "./Topbar";
import { AppInteractionStyles, Toast } from "../../components/Toast";
import {
  aspectRatioMap,
  canvasZoomSizeMultiplier,
  defaultCanvasZoom,
  defaultRatio,
  ratios,
} from "../../lib/image-options";
import { requestGeneratedImage } from "../../lib/api/generateImage";
import { downloadImageFile } from "../../lib/utils/downloadImage";
import { useCanvasNodes } from "../../hooks/useCanvasNodes";
import { defaultImageModel, imageModels, isGptModel } from "../../lib/models";
import {
  creditsStorageKey,
  projectStorageKey,
  readStorageItem,
  writeStorageItem,
  zoomBaselineMigrationKey,
} from "../../lib/storage";
import {
  readImageHistory,
  readPromptHistory,
  writeImageHistory,
  writePromptHistory,
} from "../../lib/storage/imageHistory";
import type {
  AddNodeMenuState,
  CanvasNode,
  DraggableNode,
  GeneratedImageNode,
  GenerateOverrides,
  HistoryItem,
  LinkDragState,
  NodeConnection,
  NodePosition,
  ProjectState,
  ReferenceImage,
  ToastMessage,
  ToastType,
} from "../../lib/types";

const initialCredits = 20;
const generationCreditCost = 1;
const dragSafePadding = 96;
const gridSize = 24;
const loadingMessage = "正在生成中，通常需要 20-60 秒";
const busyModelMessage = "当前模型繁忙，请切换 Gemini 再试";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function shouldIgnoreDrag(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return true;

  return Boolean(
    target.closest("button, textarea, input, select, option, a, [data-no-drag='true']")
  );
}

function snapToGrid(value: number) {
  return Math.round(value / gridSize) * gridSize;
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

export function AppShell() {
  const canvasRef = useRef<HTMLElement | null>(null);
  const promptInputRef = useRef<HTMLTextAreaElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const skipNextDraftImageClickRef = useRef(false);
  const draggingRef = useRef(false);
  const mountedRef = useRef(true);
  const pollingActiveRef = useRef(false);
  const promptDraftRef = useRef("");
  const toastTimersRef = useRef<number[]>([]);
  const [nodeCreated, setNodeCreated] = useState(false);
  const [promptPanelOpen, setPromptPanelOpen] = useState(false);
  const {
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
  } = useCanvasNodes();
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
    useState("????");
  const [promptHistoryItems, setPromptHistoryItems] = useState<string[]>([]);
  const [promptHistoryOpen, setPromptHistoryOpen] = useState(false);
  const [nodeMenuOpen, setNodeMenuOpen] = useState<string | null>(null);
  const [extensionMenuOpen, setExtensionMenuOpen] = useState<string | null>(null);
  const [pendingParentNodeId, setPendingParentNodeId] = useState<string | null>(
    null
  );
  const [activeDragNodeId, setActiveDragNodeId] = useState<string | null>(null);
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
  const activeGeneratedNode =
    selectedGeneratedNode || generatedNodes[generatedNodes.length - 1] || null;
  const activeImageUrl = activeGeneratedNode?.url || image;
  const canvasRenderScale = canvasZoom * canvasZoomSizeMultiplier;
  const draftImageSelected = selectedNodeId === "draft-image";

  function showToast(type: ToastType, message: string) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((items) => [...items, { id, type, message }].slice(-4));
    const timer = window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, 3200);
    toastTimersRef.current.push(timer);
  }

  function getCurrentPrompt() {
    return promptInputRef.current?.value ?? promptDraftRef.current ?? prompt;
  }

  function setPromptValue(nextPrompt: string) {
    promptDraftRef.current = nextPrompt;
    setPrompt(nextPrompt);
    if (promptInputRef.current && promptInputRef.current.value !== nextPrompt) {
      promptInputRef.current.value = nextPrompt;
    }
  }

  function getFallbackNodePosition(index: number): NodePosition {
    return {
      x: 320 + (index % 4) * 72,
      y: 240 + Math.floor(index / 4) * 72,
    };
  }

  function normalizeReferenceNode(
    item: Partial<ReferenceImage>,
    index: number
  ): ReferenceImage {
    const fallback = getFallbackNodePosition(index);
    const position = item.position || {
      x: typeof item.x === "number" ? item.x : fallback.x,
      y: typeof item.y === "number" ? item.y : fallback.y,
    };
    const imageUrl = item.imageUrl || item.url || "";

    return {
      id: item.id || `reference-${Date.now()}-${index}`,
      type: "reference",
      x: typeof item.x === "number" ? item.x : position.x,
      y: typeof item.y === "number" ? item.y : position.y,
      prompt: item.prompt || "",
      imageUrl,
      model: item.model || "",
      ratio: item.ratio || "4:3",
      parentId: item.parentId || null,
      createdAt: item.createdAt || new Date().toISOString(),
      url: imageUrl,
      name: item.name || "Reference Image",
      title: item.title,
      collapsed: item.collapsed,
      position,
    };
  }

  function normalizeGeneratedNode(
    item: Partial<GeneratedImageNode>,
    index: number
  ): GeneratedImageNode {
    const fallback = getFallbackNodePosition(index);
    const position = item.position || {
      x: typeof item.x === "number" ? item.x : fallback.x,
      y: typeof item.y === "number" ? item.y : fallback.y,
    };
    const imageUrl = item.imageUrl || item.url || "";
    const modelValue = item.model || item.modelValue || defaultImageModel.value;
    const modelLabel =
      item.modelLabel ||
      imageModels.find((modelItem) => modelItem.value === modelValue)?.label ||
      defaultImageModel.label;

    return {
      id: item.id || `image-${Date.now()}-${index}`,
      type: "image",
      x: typeof item.x === "number" ? item.x : position.x,
      y: typeof item.y === "number" ? item.y : position.y,
      imageUrl,
      model: modelValue,
      parentId: item.parentId || null,
      createdAt: item.createdAt || new Date().toISOString(),
      url: imageUrl,
      prompt: item.prompt || "",
      modelLabel,
      modelValue,
      ratio: item.ratio || defaultRatio.value,
      position,
      creditCost: item.creditCost,
      draft: item.draft,
      sourceImageUrl: item.sourceImageUrl,
      title: item.title,
      collapsed: item.collapsed,
    };
  }

  function createProjectState(): ProjectState {
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      nodeCreated,
      promptPanelOpen,
      prompt: getCurrentPrompt(),
      image,
      modelValue: model.value,
      ratioValue: ratio.value,
      quality,
      imageNodePosition,
      promptNodePosition,
      canvasNodes,
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
    const importedCanvasNodes = Array.isArray(project.canvasNodes)
      ? project.canvasNodes
      : null;
    const restoredReferences = importedCanvasNodes
      ? importedCanvasNodes
          .filter((node) => node.type === "reference")
          .map((node, index) => normalizeReferenceNode(node, index))
      : Array.isArray(project.referenceImages)
        ? project.referenceImages.map((node, index) =>
            normalizeReferenceNode(node, index)
          )
        : [];
    const restoredGeneratedNodes = importedCanvasNodes
      ? importedCanvasNodes
          .filter((node) => node.type === "image")
          .map((node, index) => normalizeGeneratedNode(node, index))
      : Array.isArray(project.generatedNodes)
        ? project.generatedNodes.map((node, index) =>
            normalizeGeneratedNode(node, index)
          )
        : [];
    const restoredConnections = Array.isArray(project.connections)
      ? project.connections
      : restoredGeneratedNodes
          .filter((node) => node.parentId)
          .map((node) => ({
            id: `${node.parentId}-${node.id}`,
            fromId: String(node.parentId),
            toId: node.id,
          }));

    setNodeCreated(Boolean(project.nodeCreated));
    setPromptPanelOpen(Boolean(project.promptPanelOpen));
    setPromptValue(project.prompt || "");
    setImage(project.image || "");
    setModel(restoredModel);
    setRatio(restoredRatio);
    setQuality(project.quality || "1K");
    setImageNodePosition(project.imageNodePosition || null);
    setPromptNodePosition(project.promptNodePosition || null);
    setReferenceImages(restoredReferences);
    setGeneratedNodes(restoredGeneratedNodes);
    setConnections(restoredConnections);
    setSelectedNodeId(project.selectedNodeId || null);
    let restoredCanvasZoom = project.canvasZoom || defaultCanvasZoom;
    try {
      const migrated = readStorageItem(zoomBaselineMigrationKey);
      if (!migrated && Math.abs(restoredCanvasZoom - 0.75) < 0.01) {
        restoredCanvasZoom = defaultCanvasZoom;
      }
      writeStorageItem(zoomBaselineMigrationKey, "true");
    } catch {
      // Keep project import resilient when localStorage is unavailable.
    }
    setCanvasZoom(restoredCanvasZoom);
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
      writeStorageItem(projectStorageKey, JSON.stringify(project));
      setLastSavedAt(project.savedAt);
      if (showMessage) showToast("success", "保存成功");
    } catch {
      if (showMessage) {
        showToast("error", "保存失败，本地存储空间可能不足");
      }
    }
  }

  function openMembership() {
    setMembershipOpen(true);
  }

  function handleManualSave() {
    saveProject(true);
  }

  function openClearConfirm() {
    setClearConfirmOpen(true);
  }

  function getDefaultNodePositions() {
    const rect = canvasRef.current?.getBoundingClientRect();
    const width = (rect?.width || window.innerWidth) / canvasRenderScale;
    const height =
      (rect?.height || Math.max(window.innerHeight - 64, 640)) / canvasRenderScale;
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

  function getAttachedPromptPosition(imagePosition: NodePosition): NodePosition {
    return {
      x: imagePosition.x,
      y: imagePosition.y + 295,
    };
  }

  function getNodeAnchor(id: string | null, side: "left" | "right" = "right") {
    if (!id) return null;

    if (id === "draft-image") {
      const position = imageNodePosition;
      if (!position) return null;
      return {
        x: position.x + (side === "right" ? 220 : -220),
        y: position.y,
      };
    }

    const node = generatedNodes.find((item) => item.id === id);
    if (!node) return null;

    return {
      x: node.x + (side === "right" ? 170 : -170),
      y: node.y,
    };
  }

  function getSourceImageUrl(sourceId: string | null) {
    if (!sourceId) return "";
    if (sourceId === "draft-image") return image;

    return generatedNodes.find((node) => node.id === sourceId)?.imageUrl || "";
  }

  function startLinkDragFromNode(sourceId: string, event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    const source = getNodeAnchor(sourceId, "right");
    if (!rect || !source) return;

    event.preventDefault();
    event.stopPropagation();
    setPromptPanelOpen(false);
    setModelPanelOpen(false);
    setRatioPanelOpen(false);
    setExtensionMenuOpen(null);
    setNodeMenuOpen(null);

    const pointFromEvent = (pointerEvent: PointerEvent | ReactPointerEvent) => ({
      x: (pointerEvent.clientX - rect.left) / canvasRenderScale,
      y: (pointerEvent.clientY - rect.top) / canvasRenderScale,
    });
    const initialPoint = pointFromEvent(event);

    setLinkDrag({
      active: true,
      menuOpen: false,
      sourceId,
      source,
      x: initialPoint.x,
      y: initialPoint.y,
    });

    const handleMove = (moveEvent: PointerEvent) => {
      const point = pointFromEvent(moveEvent);
      setLinkDrag((current) => ({
        ...current,
        active: true,
        menuOpen: false,
        x: point.x,
        y: point.y,
      }));
    };

    const stopDrag = (upEvent: PointerEvent) => {
      const point = pointFromEvent(upEvent);
      setLinkDrag({
        active: false,
        menuOpen: true,
        sourceId,
        source,
        x: point.x,
        y: point.y,
      });
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
  }

  function openPromptPanelForDraft() {
    if (skipNextDraftImageClickRef.current) {
      skipNextDraftImageClickRef.current = false;
      return;
    }

    const imagePosition = imageNodePosition || getDefaultNodePositions().image;
    setImageNodePosition(imagePosition);
    setPromptNodePosition(getAttachedPromptPosition(imagePosition));
    setSelectedNodeId("draft-image");
    setPromptPanelOpen(true);
    setNodeCreated(true);
    setNodeMenuOpen(null);
    setExtensionMenuOpen(null);
    setAddNodeMenu((current) => ({ ...current, open: false }));
    window.setTimeout(() => promptInputRef.current?.focus(), 0);
  }

  function openAddNodeMenuAtPoint(clientX: number, clientY: number) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setAddNodeMenu({
      open: true,
      x: clamp(clientX - rect.left, 24, Math.max(24, rect.width - 460)),
      y: clamp(clientY - rect.top, 24, Math.max(24, rect.height - 500)),
    });
    setModelPanelOpen(false);
    setRatioPanelOpen(false);
    setExtensionMenuOpen(null);
    setNodeMenuOpen(null);
  }

  function openAddNodeMenuAtCenter() {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    openAddNodeMenuAtPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  function createImageDraftNode() {
    const rect = canvasRef.current?.getBoundingClientRect();
    const fallback = getDefaultNodePositions().image;
    const position = addNodeMenu.open
      ? {
          x: clamp(addNodeMenu.x, 210, Math.max(210, (rect?.width || 900) - 210)),
          y: clamp(addNodeMenu.y + 52, 190, Math.max(190, (rect?.height || 680) - 190)),
        }
      : fallback;

    setImageNodePosition(position);
    setPromptNodePosition(getAttachedPromptPosition(position));
    setNodeCreated(true);
    setPromptPanelOpen(false);
    setAddNodeMenu((current) => ({ ...current, open: false }));
    setSelectedNodeId("draft-image");
    setImage("");
    setError("");
    setStatusMessage("");
  }

  function handleAddNodeChoice(kind: "text" | "image" | "video" | "audio" | "world" | "upload") {
    if (kind === "image") {
      createImageDraftNode();
      return;
    }

    if (kind === "upload") {
      setAddNodeMenu((current) => ({ ...current, open: false }));
      openUploadPicker();
      return;
    }

    showToast("warning", "该节点下一步接入");
  }

  function createLinkedImageNodeFromDrag() {
    if (!linkDrag.sourceId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const position = {
      x: clamp(linkDrag.x + 230, 190, Math.max(190, (rect?.width || 1200) / canvasRenderScale - 190)),
      y: clamp(linkDrag.y, 170, Math.max(170, (rect?.height || 760) / canvasRenderScale - 170)),
    };
    const sourceNode = generatedNodes.find((node) => node.id === linkDrag.sourceId);
    const nextPrompt =
      sourceNode?.prompt ||
      (linkDrag.sourceId === "draft-image" ? getCurrentPrompt() : "") ||
      "参考连接的图片，生成新的画面。";
    const node: GeneratedImageNode = {
      id,
      type: "image",
      x: position.x,
      y: position.y,
      imageUrl: "",
      model: model.value,
      parentId: linkDrag.sourceId,
      createdAt: new Date().toISOString(),
      url: "",
      prompt: nextPrompt,
      modelLabel: model.label,
      modelValue: model.value,
      ratio: ratio.value,
      position,
      draft: true,
      sourceImageUrl: getSourceImageUrl(linkDrag.sourceId),
      title: "图片生成节点",
    };

    setGeneratedNodes((items) => [...items, node]);
    setConnections((items) => [
      ...items,
      { id: `${linkDrag.sourceId}-${id}`, fromId: linkDrag.sourceId, toId: id },
    ]);
    setSelectedNodeId(id);
    setPendingParentNodeId(linkDrag.sourceId);
    setPromptValue(nextPrompt);
    setImage("");
    setPromptNodePosition(getAttachedPromptPosition(position));
    setPromptPanelOpen(true);
    setLinkDrag({
      active: false,
      menuOpen: false,
      sourceId: null,
      source: null,
      x: 0,
      y: 0,
    });
    window.setTimeout(() => promptInputRef.current?.focus(), 0);
  }

  function getReferenceNodePosition(index: number) {
    const rect = canvasRef.current?.getBoundingClientRect();
    const width = (rect?.width || window.innerWidth) / canvasRenderScale;
    const height =
      (rect?.height || Math.max(window.innerHeight - 64, 640)) / canvasRenderScale;

    return {
      x: clamp(width * 0.26 + index * 28, 150, Math.max(150, width - 150)),
      y: clamp(height * 0.34 + index * 24, 150, Math.max(150, height - 150)),
    };
  }

  function getGeneratedNodePosition(index: number, parentId?: string | null) {
    const rect = canvasRef.current?.getBoundingClientRect();
    const width = (rect?.width || window.innerWidth) / canvasRenderScale;
    const height =
      (rect?.height || Math.max(window.innerHeight - 64, 640)) / canvasRenderScale;
    const parent = parentId
      ? generatedNodes.find((node) => node.id === parentId)
      : null;

    if (parent) {
      return {
        x: clamp(parent.x + 470, 190, Math.max(190, width - 190)),
        y: clamp(parent.y + 72, 170, Math.max(170, height - 170)),
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
    draggingRef.current = true;
    setActiveDragNodeId(node === "image" ? "draft-image" : "prompt-node");
    if (node === "image") {
      openPromptPanelForDraft();
    }
    setModelPanelOpen(false);
    setRatioPanelOpen(false);
    setExtensionMenuOpen(null);

    const handleMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      if (Math.hypot(deltaX, deltaY) < 4) return;

      setPromptPanelOpen(false);
      if (node === "image") skipNextDraftImageClickRef.current = true;

      const nextX = clamp(
        startPosition.x + deltaX / canvasRenderScale,
        dragSafePadding,
        Math.max(dragSafePadding, rect.width / canvasRenderScale - dragSafePadding)
      );
      const nextY = clamp(
        startPosition.y + deltaY / canvasRenderScale,
        dragSafePadding,
        Math.max(dragSafePadding, rect.height / canvasRenderScale - dragSafePadding)
      );

      updatePosition({ x: nextX, y: nextY });
    };

    const stopDrag = () => {
      draggingRef.current = false;
      updatePosition((current) =>
        current
          ? { x: snapToGrid(current.x), y: snapToGrid(current.y) }
          : current
      );
      setActiveDragNodeId(null);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
      window.setTimeout(() => saveProject(false), 0);
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
    draggingRef.current = true;
    setActiveDragNodeId(id);
    setModelPanelOpen(false);
    setRatioPanelOpen(false);
    setExtensionMenuOpen(null);

    const handleMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      if (Math.hypot(deltaX, deltaY) < 4) return;

      const nextPosition = {
        x: clamp(
          startPosition.x + deltaX / canvasRenderScale,
          dragSafePadding,
          Math.max(dragSafePadding, rect.width / canvasRenderScale - dragSafePadding)
        ),
        y: clamp(
          startPosition.y + deltaY / canvasRenderScale,
          dragSafePadding,
          Math.max(dragSafePadding, rect.height / canvasRenderScale - dragSafePadding)
        ),
      };

      setReferenceImages((items) =>
        items.map((item) =>
          item.id === id
            ? { ...item, x: nextPosition.x, y: nextPosition.y, position: nextPosition }
            : item
        )
      );
    };

    const stopDrag = () => {
      draggingRef.current = false;
      setReferenceImages((items) =>
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                x: snapToGrid(item.x),
                y: snapToGrid(item.y),
                position: {
                  x: snapToGrid(item.position.x),
                  y: snapToGrid(item.position.y),
                },
              }
            : item
        )
      );
      setActiveDragNodeId(null);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
      window.setTimeout(() => saveProject(false), 0);
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
    draggingRef.current = true;
    setActiveDragNodeId(id);
    selectGeneratedNode(startItem);
    setModelPanelOpen(false);
    setRatioPanelOpen(false);
    setExtensionMenuOpen(null);
    setNodeMenuOpen(null);

    const handleMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      if (Math.hypot(deltaX, deltaY) < 4) return;

      const nextPosition = {
        x: clamp(
          startPosition.x + deltaX / canvasRenderScale,
          dragSafePadding,
          Math.max(dragSafePadding, rect.width / canvasRenderScale - dragSafePadding)
        ),
        y: clamp(
          startPosition.y + deltaY / canvasRenderScale,
          dragSafePadding,
          Math.max(dragSafePadding, rect.height / canvasRenderScale - dragSafePadding)
        ),
      };

      setGeneratedNodes((items) =>
        items.map((item) =>
          item.id === id
            ? { ...item, x: nextPosition.x, y: nextPosition.y, position: nextPosition }
            : item
        )
      );
    };

    const stopDrag = () => {
      draggingRef.current = false;
      setGeneratedNodes((items) =>
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                x: snapToGrid(item.x),
                y: snapToGrid(item.y),
                position: {
                  x: snapToGrid(item.position.x),
                  y: snapToGrid(item.position.y),
                },
              }
            : item
        )
      );
      setActiveDragNodeId(null);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
      window.setTimeout(() => saveProject(false), 0);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
  }

  useEffect(() => {
    try {
      setHistoryItems(readImageHistory());

      const projectRaw = readStorageItem(projectStorageKey);
      if (projectRaw) {
        const project = JSON.parse(projectRaw) as ProjectState;
        if (project?.version === 1) {
          applyProjectState(project);
          setLastSavedAt(project.savedAt || "");
        }
      }

      const creditsRaw = readStorageItem(creditsStorageKey);
      if (creditsRaw !== null) {
        const parsedCredits = Number(creditsRaw);
        if (Number.isFinite(parsedCredits)) {
          setCredits(Math.max(0, parsedCredits));
        }
      }

      setPromptHistoryItems(readPromptHistory());
    } catch {
      setHistoryItems([]);
    } finally {
      setProjectLoaded(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      pollingActiveRef.current = false;
      toastTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      toastTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    promptDraftRef.current = prompt;
    if (promptInputRef.current && promptInputRef.current.value !== prompt) {
      promptInputRef.current.value = prompt;
    }
  }, [prompt]);

  useEffect(() => {
    if (nodeCreated) {
      ensureNodePositions();
    }
  }, [nodeCreated]);

  useEffect(() => {
    if (!projectLoaded) return;
    if (draggingRef.current) return;

    const timer = window.setTimeout(() => {
      saveProject(false);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [
    projectLoaded,
    nodeCreated,
    image,
    quality,
    referenceImages,
    generatedNodes,
    connections,
    canvasZoom,
  ]);

  useEffect(() => {
    if (!projectLoaded) return;

    writeStorageItem(creditsStorageKey, String(credits));
  }, [projectLoaded, credits]);

  function saveHistory(nextItems: HistoryItem[]) {
    setHistoryItems(nextItems);
    writeImageHistory(nextItems);
  }

  function savePromptHistory(nextItems: string[]) {
    setPromptHistoryItems(nextItems);
    writePromptHistory(nextItems);
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
    setPromptValue(nextPrompt);
    addPromptHistory(nextPrompt);
    setNodeCreated(true);
    setPromptPanelOpen(true);
    ensureNodePositions();
    setTemplateOpen(false);
    setPromptHistoryOpen(false);
    window.setTimeout(() => promptInputRef.current?.focus(), 0);
    showToast("success", message);
  }

  function addHistoryItem(node: GeneratedImageNode) {
    const item: HistoryItem = {
      id: `history-${node.id}`,
      nodeId: node.id,
      type: node.type,
      imageUrl: node.imageUrl,
      prompt: node.prompt,
      model: node.model,
      modelLabel: node.modelLabel,
      modelValue: node.modelValue,
      ratio: node.ratio,
      x: node.x,
      y: node.y,
      parentId: node.parentId,
      createdAt: node.createdAt,
      creditCost: node.creditCost || generationCreditCost,
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
    const position = getGeneratedNodePosition(generatedNodes.length, parentId);
    const createdAt = new Date().toISOString();
    const node: GeneratedImageNode = {
      id,
      type: "image",
      x: position.x,
      y: position.y,
      imageUrl,
      model: usedModel.value,
      parentId,
      createdAt,
      url: imageUrl,
      prompt: usedPrompt,
      modelLabel: usedModel.label,
      modelValue: usedModel.value,
      ratio: usedRatio.value,
      position,
      creditCost: generationCreditCost,
      title: "图片生成节点",
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
    addHistoryItem(node);
    setCredits((current) => Math.max(0, current - generationCreditCost));
    showToast("success", `生成成功，已消耗 ${generationCreditCost} credit`);
  }

  function finishGeneratedResult(
    imageUrl: string,
    usedPrompt: string,
    usedModel = model,
    usedRatio = ratio,
    parentId: string | null = null
  ) {
    const targetNode =
      selectedGeneratedNode && !selectedGeneratedNode.imageUrl
        ? selectedGeneratedNode
        : null;

    if (targetNode) {
      const completedNode: GeneratedImageNode = {
        ...targetNode,
        imageUrl,
        url: imageUrl,
        prompt: usedPrompt,
        model: usedModel.value,
        modelLabel: usedModel.label,
        modelValue: usedModel.value,
        ratio: usedRatio.value,
        draft: false,
        creditCost: generationCreditCost,
      };

      setGeneratedNodes((items) =>
        items.map((item) => (item.id === targetNode.id ? completedNode : item))
      );
      setSelectedNodeId(targetNode.id);
      setImage(imageUrl);
      addHistoryItem(completedNode);
      setCredits((current) => Math.max(0, current - generationCreditCost));
      showToast("success", "生成成功，已消耗 1 credit");
      return;
    }

    addGeneratedNode(imageUrl, usedPrompt, usedModel, usedRatio, parentId);
  }

  function selectGeneratedNode(node: GeneratedImageNode) {
    const restoredModel =
      imageModels.find((modelItem) => modelItem.value === node.modelValue) ||
      defaultImageModel;
    const restoredRatio =
      ratios.find((ratioItem) => ratioItem.value === node.ratio) || defaultRatio;

    setSelectedNodeId(node.id);
    setPromptValue(node.prompt);
    setModel(restoredModel);
    setRatio(restoredRatio);
    setImage(node.url);
    setPendingParentNodeId(node.imageUrl ? node.id : node.parentId || node.id);
    setPromptNodePosition(getAttachedPromptPosition({ x: node.x, y: node.y }));
    setPromptPanelOpen(true);
    setNodeMenuOpen(null);
    setModelPanelOpen(false);
    setRatioPanelOpen(false);
  }

  function createNodeAndFocus() {
    openAddNodeMenuAtCenter();
  }

  function appendPrompt(text: string) {
    const trimmed = getCurrentPrompt().trim();
    const nextPrompt = trimmed ? `${trimmed}\n${text}` : text;

    setPromptValue(nextPrompt);
    addPromptHistory(nextPrompt || text);
    setNodeCreated(true);
    setPromptPanelOpen(true);
    ensureNodePositions();
    window.setTimeout(() => promptInputRef.current?.focus(), 0);
  }
  function clearPromptInput() {
    setPromptValue("");
    setPendingParentNodeId(null);
    setPromptHistoryOpen(false);
    window.setTimeout(() => promptInputRef.current?.focus(), 0);
  }

  function optimizePrompt() {
    const basePrompt = getCurrentPrompt().trim();
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
              reader.onload = () => {
                const position = getReferenceNodePosition(
                  referenceImages.length + index
                );
                const imageUrl = String(reader.result);

                resolve({
                  id: `${Date.now()}-${index}`,
                  type: "reference",
                  x: position.x,
                  y: position.y,
                  prompt: "",
                  imageUrl,
                  model: "",
                  ratio: "4:3",
                  parentId: null,
                  createdAt: new Date().toISOString(),
                  url: imageUrl,
                  name: file.name || "Reference Image",
                  title: file.name || "Reference Image",
                  position,
                });
              };
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
    if (event.target instanceof HTMLElement) {
      const interactive = event.target.closest(
        "[data-canvas-node='true'], form, button, textarea, input, select, a, [data-no-drag='true']"
      );
      if (interactive) return;
    }

    openAddNodeMenuAtPoint(event.clientX, event.clientY);
  }

  function handleCanvasClick(event: MouseEvent<HTMLElement>) {
    if (event.target instanceof HTMLElement) {
      const interactive = event.target.closest(
        "[data-canvas-node='true'], form, button, textarea, input, select, a, [data-no-drag='true']"
      );
      if (interactive) return;
    }

    setPromptPanelOpen(false);
    setSelectedNodeId(null);
    setPendingParentNodeId(null);
    setNodeMenuOpen(null);
    setExtensionMenuOpen(null);
    setModelPanelOpen(false);
    setRatioPanelOpen(false);
    setPromptHistoryOpen(false);
    setAddNodeMenu((current) => ({ ...current, open: false }));
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

    if (id === "assets") {
      openUploadPicker();
      return;
    }

    if (id === "settings") {
      showToast("warning", "设置功能下一步接入");
    }
  }

  async function downloadImage(imageUrl = activeImageUrl) {
    await downloadImageFile(imageUrl);
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
        writeStorageItem(projectStorageKey, JSON.stringify(project));
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
    setNodeCreated(false);
    setPromptPanelOpen(false);
    setAddNodeMenu((current) => ({ ...current, open: false }));
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
    setCanvasZoom(defaultCanvasZoom);
    showToast("success", "画布已清空");
  }

  function clearHistory() {
    if (historyItems.length === 0) return;

    saveHistory([]);
    showToast("success", "历史记录已清空");
  }

  function closeHistoryPanel() {
    setHistoryOpen(false);
  }

  function restoreHistoryItem(item: HistoryItem) {
    const restoredModel =
      imageModels.find(
        (modelItem) => modelItem.value === (item.modelValue || item.model)
      ) ||
      defaultImageModel;
    const restoredRatio =
      ratios.find((ratioItem) => ratioItem.value === item.ratio) || defaultRatio;
    const existingNode = generatedNodes.find(
      (node) => node.id === item.nodeId || node.id === item.id
    );

    if (existingNode) {
      selectGeneratedNode(existingNode);
      setHistoryOpen(false);
      return;
    }

    setNodeCreated(true);
    ensureNodePositions(true);
    const id = item.nodeId || `history-${Date.now()}`;
    const fallbackPosition = getGeneratedNodePosition(generatedNodes.length);
    const position = {
      x: typeof item.x === "number" ? item.x : fallbackPosition.x,
      y: typeof item.y === "number" ? item.y : fallbackPosition.y,
    };
    const node: GeneratedImageNode = {
      id,
      type: "image",
      x: position.x,
      y: position.y,
      imageUrl: item.imageUrl,
      model: restoredModel.value,
      parentId: item.parentId || null,
      createdAt: item.createdAt || new Date().toISOString(),
      url: item.imageUrl,
      prompt: item.prompt,
      modelLabel: restoredModel.label,
      modelValue: restoredModel.value,
      ratio: restoredRatio.value,
      position,
      creditCost: item.creditCost || generationCreditCost,
      title: item.prompt ? item.prompt.slice(0, 18) : "历史图片节点",
    };

    setGeneratedNodes((nodes) => [...nodes, node]);
    if (node.parentId) {
      setConnections((items) => [
        ...items,
        { id: `${node.parentId}-${node.id}`, fromId: node.parentId, toId: node.id },
      ]);
    }
    setSelectedNodeId(id);
    setImage(item.imageUrl);
    setPromptValue(item.prompt);
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

  function deleteDraftNode() {
    if (loading) {
      showToast("warning", "\u6b63\u5728\u751f\u6210\u4e2d\uff0c\u6682\u65f6\u4e0d\u80fd\u5220\u9664\u8282\u70b9");
      return;
    }

    setImageNodePosition(null);
    setPromptNodePosition(null);
    setNodeCreated(false);
    setPromptPanelOpen(false);
    setSelectedNodeId(null);
    setPendingParentNodeId(null);
    setImage("");
    setError("");
    setStatusMessage("");
    setNodeMenuOpen(null);
    setExtensionMenuOpen(null);
    setModelPanelOpen(false);
    setRatioPanelOpen(false);
    setPromptHistoryOpen(false);
    showToast("success", "\u8282\u70b9\u5df2\u5220\u9664");
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
      if (nextActive) {
        const restoredModel =
          imageModels.find((modelItem) => modelItem.value === nextActive.modelValue) ||
          defaultImageModel;
        const restoredRatio =
          ratios.find((ratioItem) => ratioItem.value === nextActive.ratio) ||
          defaultRatio;

        setSelectedNodeId(nextActive.id);
        setPromptValue(nextActive.prompt);
        setModel(restoredModel);
        setRatio(restoredRatio);
        setImage(nextActive.url);
        setPendingParentNodeId(
          nextActive.imageUrl ? nextActive.id : nextActive.parentId || nextActive.id
        );
        setPromptNodePosition(
          getAttachedPromptPosition({ x: nextActive.x, y: nextActive.y })
        );
        setPromptPanelOpen(true);
      } else {
        setSelectedNodeId(null);
        setImage("");
        setPendingParentNodeId(null);
        setPromptPanelOpen(false);
      }
    }
    showToast("success", "节点已删除");
  }

  function duplicateGeneratedNode(id: string) {
    const source = generatedNodes.find((node) => node.id === id);
    if (!source) return;

    const copyId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const position = {
      x: snapToGrid(source.x + 72),
      y: snapToGrid(source.y + 72),
    };
    const copy: GeneratedImageNode = {
      ...source,
      id: copyId,
      x: position.x,
      y: position.y,
      position,
      parentId: null,
      createdAt: new Date().toISOString(),
      title: `${source.title || "图片节点"} 副本`,
    };

    setGeneratedNodes((items) => [...items, copy]);
    setSelectedNodeId(copyId);
    setPromptValue(copy.prompt);
    setImage(copy.url);
    setPromptNodePosition(getAttachedPromptPosition(position));
    setPromptPanelOpen(true);
    showToast("success", "节点已复制");
  }

  function renameGeneratedNode(id: string, title: string) {
    setGeneratedNodes((items) =>
      items.map((node) => (node.id === id ? { ...node, title } : node))
    );
  }

  function toggleGeneratedNodeCollapse(id: string) {
    setGeneratedNodes((items) =>
      items.map((node) =>
        node.id === id ? { ...node, collapsed: !node.collapsed } : node
      )
    );
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
    setCanvasZoom(clamp(Number(nextZoom.toFixed(2)), 0.5, 1.5));
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
      setPromptPanelOpen(true);
      ensureNodePositions();
    }

    const usedModel = overrides.modelOption || model;
    const usedRatio = overrides.ratioOption || ratio;
    const parentId =
      overrides.parentId === undefined ? pendingParentNodeId : overrides.parentId;
    const currentPrompt = overrides.promptText ?? getCurrentPrompt();

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

    pollingActiveRef.current = true;
    setLoading(true);
    setError("");
    setStatusMessage("正在提交任务...");
    setPreviewOpen(false);
    setPreviewImage("");

    try {
      const imageUrl = await requestGeneratedImage({
        prompt: currentPrompt.trim(),
        model: usedModel,
        ratio: usedRatio,
        onStatus: setStatusMessage,
        isActive: () => pollingActiveRef.current,
      });

      if (!imageUrl) return;

      finishGeneratedResult(
        imageUrl,
        currentPrompt.trim(),
        usedModel,
        usedRatio,
        parentId
      );
      setStatusMessage("");
      setPendingParentNodeId(null);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error && error.name === "AbortError"
          ? "请求超时，请稍后重试"
          : error instanceof Error
            ? error.message || "图片生成失败"
            : "图片生成失败";

      const status = error instanceof Error ? (error as Error & { status?: string }).status || error.name : undefined;
      reportError(message, status);
    } finally {
      pollingActiveRef.current = false;
      if (!mountedRef.current) return;
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
      <AppInteractionStyles />
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

      <TopBar
        credits={credits}
        lastSavedAt={lastSavedAt}
        onRecharge={openMembership}
        onSave={handleManualSave}
        onImport={openImportPicker}
        onClear={openClearConfirm}
        onExport={handleExport}
        onGenerate={() => void generateImage()}
      />

      <div style={{ height: "calc(100vh - 64px)", display: "flex" }}>
        <LeftToolbar onAction={handleToolbarAction} />

        <CanvasArea
          canvasRef={canvasRef}
          nodeCreated={nodeCreated}
          addNodeMenu={addNodeMenu}
          linkDrag={linkDrag}
          referenceImages={referenceImages}
          generatedNodes={generatedNodes}
          canvasNodes={canvasNodes}
          selectedNodeId={selectedNodeId}
          activeDragNodeId={activeDragNodeId}
          draftImageSelected={draftImageSelected}
          nodeMenuOpen={nodeMenuOpen}
          extensionMenuOpen={extensionMenuOpen}
          imageNodePosition={imageNodePosition}
          promptNodePosition={promptNodePosition}
          canvasRenderScale={canvasRenderScale}
          nodeAspectRatio={nodeAspectRatio}
          image={image}
          error={error}
          loading={loading}
          statusMessage={statusMessage}
          loadingMessage={loadingMessage}
          model={model}
          ratio={ratio}
          quality={quality}
          promptPanelOpen={promptPanelOpen}
          promptInputRef={promptInputRef}
          prompt={prompt}
          promptHistoryOpen={promptHistoryOpen}
          promptHistoryItems={promptHistoryItems}
          modelPanelOpen={modelPanelOpen}
          ratioPanelOpen={ratioPanelOpen}
          canvasZoom={canvasZoom}
          clearConfirmOpen={clearConfirmOpen}
          membershipOpen={membershipOpen}
          onCanvasClick={handleCanvasClick}
          onCanvasDoubleClick={handleCanvasDoubleClick}
          onAddNodeChoice={handleAddNodeChoice}
          onReferenceDrag={startReferenceDrag}
          getNodeAnchor={getNodeAnchor}
          onCreateLinkedImageNodeFromDrag={createLinkedImageNodeFromDrag}
          onShowUnavailable={(message) => showToast("warning", message)}
          onGeneratedNodeDrag={startGeneratedNodeDrag}
          onSelectGeneratedNode={selectGeneratedNode}
          onToggleNodeMenu={(id) =>
            setNodeMenuOpen((current) => (current === id ? null : id))
          }
          onCloseNodeMenu={() => setNodeMenuOpen(null)}
          onDeleteGeneratedNode={deleteGeneratedNode}
          onDuplicateGeneratedNode={duplicateGeneratedNode}
          onRenameGeneratedNode={renameGeneratedNode}
          onToggleGeneratedNodeCollapse={toggleGeneratedNodeCollapse}
          onDownloadImage={(imageUrl) => void downloadImage(imageUrl)}
          onOpenPreview={openPreview}
          onCopyPrompt={(text) => void copyPrompt(text)}
          onRegenerateFromNode={regenerateFromNode}
          onStartLinkDragFromNode={startLinkDragFromNode}
          onExtensionAction={handleExtensionAction}
          onCreateNodeAndFocus={createNodeAndFocus}
          onDraftPointerDown={(event) => startNodeDrag("image", event)}
          onOpenDraftPrompt={openPromptPanelForDraft}
          onDeleteDraftNode={deleteDraftNode}
          onOpenUploadPicker={openUploadPicker}
          onGenerateImage={() => void generateImage()}
          onPromptSubmit={handlePromptSubmit}
          onPromptPointerDown={(event) => startNodeDrag("prompt", event)}
          onPromptDraftChange={(value) => {
            promptDraftRef.current = value;
          }}
          onAppendPrompt={appendPrompt}
          onTogglePromptHistory={() => setPromptHistoryOpen((open) => !open)}
          onFillPrompt={fillPrompt}
          onClearPromptInput={clearPromptInput}
          onToggleModelPanel={() => {
            setModelPanelOpen((open) => !open);
            setRatioPanelOpen(false);
          }}
          onToggleRatioPanel={() => {
            setRatioPanelOpen((open) => !open);
            setModelPanelOpen(false);
          }}
          onSelectModel={(item) => {
            setModel(item);
            setModelPanelOpen(false);
          }}
          onSelectRatio={(item) => {
            setRatio(item);
            setRatioPanelOpen(false);
          }}
          onSetQuality={setQuality}
          onUpdateZoom={updateZoom}
          onCancelClear={() => setClearConfirmOpen(false)}
          onClearCanvas={clearCanvas}
          onCloseMembership={() => setMembershipOpen(false)}
          onRechargeCredits={rechargeCredits}
        />

        <RightInspector
          selectedNode={selectedGeneratedNode}
          draftSelected={draftImageSelected}
          model={model}
          ratio={ratio}
          quality={quality}
          prompt={getCurrentPrompt()}
          onRenameNode={renameGeneratedNode}
          onToggleCollapse={toggleGeneratedNodeCollapse}
          onDuplicateNode={duplicateGeneratedNode}
          onDeleteNode={deleteGeneratedNode}
        />
      </div>

      <HistoryPanel
        open={historyOpen}
        items={historyItems}
        onClose={closeHistoryPanel}
        onRestore={restoreHistoryItem}
        onClear={clearHistory}
      />

      <Toast toasts={toasts} />

      <PreviewModal
        open={previewOpen}
        imageUrl={previewImage || activeImageUrl}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewImage("");
        }}
      />
    </main>
  );
}
