"use client";

import type {
  CSSProperties,
  FormEvent,
  MouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";
import { memo } from "react";
import {
  ImageIcon,
  Maximize2,
  Minus,
  MoreHorizontal,
  MousePointer2,
  Plus,
  Settings,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import {
  defaultCanvasZoom,
  defaultZoomIndex,
  zoomLevels,
  type ImageRatio,
} from "../lib/image-options";
import type { ImageModel } from "../lib/models";
import type {
  AddNodeMenuState,
  CanvasNode,
  GeneratedImageNode,
  LinkDragState,
  NodePosition,
  ReferenceImage,
} from "../lib/types";
import { DraftImageNode, ImageNode } from "./ImageNode";
import { PromptBar } from "./PromptBar";

const quickActions = ["文字生视频", "图片换背景", "首帧生成视频", "音频生视频", "模板"];

const membershipPlans = [
  { name: "Free", credits: 20, tone: "入门体验" },
  { name: "Pro", credits: 500, tone: "日常创作" },
  { name: "Studio", credits: 2000, tone: "团队生产" },
];

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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function shouldIgnoreDrag(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return true;

  return Boolean(
    target.closest("button, textarea, input, select, option, a, [data-no-drag='true']")
  );
}

type AddNodeChoice = "text" | "image" | "video" | "audio" | "world" | "upload";

type CanvasAreaProps = {
  canvasRef: RefObject<HTMLElement>;
  nodeCreated: boolean;
  addNodeMenu: AddNodeMenuState;
  linkDrag: LinkDragState;
  referenceImages: ReferenceImage[];
  generatedNodes: GeneratedImageNode[];
  canvasNodes: CanvasNode[];
  selectedNodeId: string | null;
  draftImageSelected: boolean;
  nodeMenuOpen: string | null;
  extensionMenuOpen: string | null;
  imageNodePosition: NodePosition | null;
  promptNodePosition: NodePosition | null;
  canvasRenderScale: number;
  nodeAspectRatio: string;
  image: string;
  error: string;
  loading: boolean;
  statusMessage: string;
  loadingMessage: string;
  model: ImageModel;
  ratio: ImageRatio;
  quality: string;
  promptPanelOpen: boolean;
  promptInputRef: RefObject<HTMLTextAreaElement>;
  prompt: string;
  promptHistoryOpen: boolean;
  promptHistoryItems: string[];
  modelPanelOpen: boolean;
  ratioPanelOpen: boolean;
  canvasZoom: number;
  clearConfirmOpen: boolean;
  membershipOpen: boolean;
  onCanvasClick: (event: MouseEvent<HTMLElement>) => void;
  onCanvasDoubleClick: (event: MouseEvent<HTMLElement>) => void;
  onAddNodeChoice: (kind: AddNodeChoice) => void;
  onReferenceDrag: (id: string, event: ReactPointerEvent<HTMLElement>) => void;
  getNodeAnchor: (id: string | null, side?: "left" | "right") => NodePosition | null;
  onCreateLinkedImageNodeFromDrag: () => void;
  onShowUnavailable: (message: string) => void;
  onGeneratedNodeDrag: (id: string, event: ReactPointerEvent<HTMLElement>) => void;
  onSelectGeneratedNode: (node: GeneratedImageNode) => void;
  onToggleNodeMenu: (id: string) => void;
  onCloseNodeMenu: () => void;
  onDeleteGeneratedNode: (id: string) => void;
  onDownloadImage: (imageUrl?: string) => void;
  onOpenPreview: (imageUrl: string) => void;
  onCopyPrompt: (text: string) => void;
  onRegenerateFromNode: (node: GeneratedImageNode) => void;
  onStartLinkDragFromNode: (sourceId: string, event: ReactPointerEvent<HTMLElement>) => void;
  onExtensionAction: (prompt: string, parentId?: string | null) => void;
  onCreateNodeAndFocus: () => void;
  onDraftPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onOpenDraftPrompt: () => void;
  onDeleteDraftNode: () => void;
  onOpenUploadPicker: () => void;
  onGenerateImage: () => void;
  onPromptSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPromptPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPromptDraftChange: (value: string) => void;
  onAppendPrompt: (text: string) => void;
  onTogglePromptHistory: () => void;
  onFillPrompt: (text: string, message?: string) => void;
  onClearPromptInput: () => void;
  onToggleModelPanel: () => void;
  onToggleRatioPanel: () => void;
  onSelectModel: (model: ImageModel) => void;
  onSelectRatio: (ratio: ImageRatio) => void;
  onSetQuality: (quality: string) => void;
  onUpdateZoom: (zoom: number) => void;
  onCancelClear: () => void;
  onClearCanvas: () => void;
  onCloseMembership: () => void;
  onRechargeCredits: (amount: number, planName: string) => void;
};

export const CanvasArea = memo(function CanvasArea({
  canvasRef,
  nodeCreated,
  addNodeMenu,
  linkDrag,
  referenceImages,
  generatedNodes,
  canvasNodes,
  selectedNodeId,
  draftImageSelected,
  nodeMenuOpen,
  extensionMenuOpen,
  imageNodePosition,
  promptNodePosition,
  canvasRenderScale,
  nodeAspectRatio,
  image,
  error,
  loading,
  statusMessage,
  loadingMessage,
  model,
  ratio,
  quality,
  promptPanelOpen,
  promptInputRef,
  prompt,
  promptHistoryOpen,
  promptHistoryItems,
  modelPanelOpen,
  ratioPanelOpen,
  canvasZoom,
  clearConfirmOpen,
  membershipOpen,
  onCanvasClick,
  onCanvasDoubleClick,
  onAddNodeChoice,
  onReferenceDrag,
  getNodeAnchor,
  onCreateLinkedImageNodeFromDrag,
  onShowUnavailable,
  onGeneratedNodeDrag,
  onSelectGeneratedNode,
  onToggleNodeMenu,
  onCloseNodeMenu,
  onDeleteGeneratedNode,
  onDownloadImage,
  onOpenPreview,
  onCopyPrompt,
  onRegenerateFromNode,
  onStartLinkDragFromNode,
  onExtensionAction,
  onCreateNodeAndFocus,
  onDraftPointerDown,
  onOpenDraftPrompt,
  onDeleteDraftNode,
  onOpenUploadPicker,
  onGenerateImage,
  onPromptSubmit,
  onPromptPointerDown,
  onPromptDraftChange,
  onAppendPrompt,
  onTogglePromptHistory,
  onFillPrompt,
  onClearPromptInput,
  onToggleModelPanel,
  onToggleRatioPanel,
  onSelectModel,
  onSelectRatio,
  onSetQuality,
  onUpdateZoom,
  onCancelClear,
  onClearCanvas,
  onCloseMembership,
  onRechargeCredits,
}: CanvasAreaProps) {
  return (
    <>
      <section
        ref={canvasRef}
        onClick={onCanvasClick}
        onDoubleClick={onCanvasDoubleClick}
        style={{
          position: "relative",
          flex: 1,
          overflow: "hidden",
          background: "#050505",
          cursor: nodeCreated ? "default" : "crosshair",
        }}
      >
        <CanvasBackground />

        <AddNodeMenu
          menu={addNodeMenu}
          onAddNodeChoice={onAddNodeChoice}
        />

        {referenceImages.map((item) => (
          <ReferenceImageNode
            key={item.id}
            item={item}
            canvasRenderScale={canvasRenderScale}
            onPointerDown={onReferenceDrag}
          />
        ))}

        <ConnectionLayer
          generatedNodes={generatedNodes}
          linkDrag={linkDrag}
          canvasRenderScale={canvasRenderScale}
          getNodeAnchor={getNodeAnchor}
        />

        <LinkActionMenu
          linkDrag={linkDrag}
          canvasRenderScale={canvasRenderScale}
          onCreateLinkedImageNodeFromDrag={onCreateLinkedImageNodeFromDrag}
          onShowUnavailable={onShowUnavailable}
        />

        {generatedNodes.map((node) => (
          <ImageNode
            key={node.id}
            node={node}
            selected={node.id === selectedNodeId}
            menuOpen={nodeMenuOpen === node.id}
            extensionOpen={extensionMenuOpen === `node:${node.id}`}
            canvasRenderScale={canvasRenderScale}
            onPointerDown={onGeneratedNodeDrag}
            onSelect={onSelectGeneratedNode}
            onToggleMenu={onToggleNodeMenu}
            onCloseMenu={onCloseNodeMenu}
            onDelete={onDeleteGeneratedNode}
            onDownload={(imageUrl) => onDownloadImage(imageUrl)}
            onOpenPreview={onOpenPreview}
            onCopyPrompt={onCopyPrompt}
            onRegenerate={onRegenerateFromNode}
            onStartLinkDrag={onStartLinkDragFromNode}
            onExtensionAction={onExtensionAction}
          />
        ))}

        {!nodeCreated ? (
          <EmptyCanvasHint
            onCreateNodeAndFocus={onCreateNodeAndFocus}
            onShowUnavailable={onShowUnavailable}
          />
        ) : (
          <>
            <DraftImageNode
              imageNodePosition={imageNodePosition}
              canvasRenderScale={canvasRenderScale}
              nodeAspectRatio={nodeAspectRatio}
              loading={loading}
              statusMessage={statusMessage}
              loadingMessage={loadingMessage}
              model={model}
              image={image}
              error={error}
              selected={draftImageSelected}
              hasGeneratedNodes={generatedNodes.length > 0}
              extensionMenuOpen={extensionMenuOpen}
              onPointerDown={onDraftPointerDown}
              onClick={(event) => {
                if (shouldIgnoreDrag(event.target)) return;
                onOpenDraftPrompt();
              }}
              onDelete={onDeleteDraftNode}
              onUpload={onOpenUploadPicker}
              onStartLinkDrag={onStartLinkDragFromNode}
              onExtensionAction={onExtensionAction}
              onDownload={() => onDownloadImage()}
              onOpenPreview={onOpenPreview}
              onRegenerate={onGenerateImage}
            />

            <PromptBar
              promptPanelOpen={promptPanelOpen}
              promptNodePosition={promptNodePosition}
              canvasRenderScale={canvasRenderScale}
              promptInputRef={promptInputRef}
              prompt={prompt}
              promptHistoryOpen={promptHistoryOpen}
              promptHistoryItems={promptHistoryItems}
              model={model}
              ratio={ratio}
              quality={quality}
              loading={loading}
              modelPanelOpen={modelPanelOpen}
              ratioPanelOpen={ratioPanelOpen}
              onSubmit={onPromptSubmit}
              onPointerDown={onPromptPointerDown}
              onPromptDraftChange={onPromptDraftChange}
              onGenerate={onGenerateImage}
              onAppendPrompt={onAppendPrompt}
              onTogglePromptHistory={onTogglePromptHistory}
              onFillPrompt={onFillPrompt}
              onClearPrompt={onClearPromptInput}
              onToggleModelPanel={onToggleModelPanel}
              onToggleRatioPanel={onToggleRatioPanel}
              onSelectModel={onSelectModel}
              onSelectRatio={onSelectRatio}
              onSetQuality={onSetQuality}
            />
          </>
        )}

        <MiniMap
          canvasNodes={canvasNodes}
          selectedNodeId={selectedNodeId}
        />

        <ZoomControls
          canvasZoom={canvasZoom}
          onUpdateZoom={onUpdateZoom}
        />
      </section>

      <ClearConfirmDialog
        open={clearConfirmOpen}
        onCancel={onCancelClear}
        onClear={onClearCanvas}
      />

      <MembershipDialog
        open={membershipOpen}
        onClose={onCloseMembership}
        onRechargeCredits={onRechargeCredits}
      />
    </>
  );
});

function CanvasBackground() {
  return (
    <>
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
    </>
  );
}

type AddNodeMenuProps = {
  menu: AddNodeMenuState;
  onAddNodeChoice: (kind: AddNodeChoice) => void;
};

function AddNodeMenu({ menu, onAddNodeChoice }: AddNodeMenuProps) {
  if (!menu.open) return null;

  return (
    <div
      data-no-drag="true"
      style={{
        position: "absolute",
        left: menu.x,
        top: menu.y,
        zIndex: 45,
        width: 430,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(27,27,28,0.98)",
        borderRadius: 28,
        padding: 18,
        boxShadow: "0 28px 100px rgba(0,0,0,0.62)",
      }}
    >
      <div style={{ color: "rgba(255,255,255,0.48)", fontSize: 18, fontWeight: 850, marginBottom: 14 }}>
        添加节点
      </div>
      {[
        { id: "text", label: "文本", note: "脚本、广告词、品牌文案", icon: MoreHorizontal },
        { id: "image", label: "图片", note: "", icon: ImageIcon },
        { id: "video", label: "视频", note: "", icon: Maximize2 },
        { id: "audio", label: "音频", note: "", icon: Settings },
        { id: "world", label: "3D 世界", note: "Beta", icon: Sparkles },
        { id: "upload", label: "上传", note: "", icon: Upload },
      ].map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onAddNodeChoice(item.id as AddNodeChoice)}
            style={{
              width: "100%",
              minHeight: 76,
              border: "none",
              borderRadius: 18,
              background: item.id === "text" ? "rgba(255,255,255,0.08)" : "transparent",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "10px 12px",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: 54,
                height: 54,
                borderRadius: 14,
                background: "rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "0 0 auto",
              }}
            >
              <Icon size={24} />
            </span>
            <span style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 900 }}>{item.label}</span>
              {item.note ? (
                <span style={{ color: "rgba(255,255,255,0.42)", fontSize: 14 }}>
                  {item.note}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

type ReferenceImageNodeProps = {
  item: ReferenceImage;
  canvasRenderScale: number;
  onPointerDown: (id: string, event: ReactPointerEvent<HTMLElement>) => void;
};

function ReferenceImageNode({ item, canvasRenderScale, onPointerDown }: ReferenceImageNodeProps) {
  return (
    <article
      data-canvas-node="true"
      onPointerDown={(event) => onPointerDown(item.id, event)}
      style={{
        position: "absolute",
        left: item.position.x * canvasRenderScale,
        top: item.position.y * canvasRenderScale,
        transform: `translate3d(-50%, -50%, 0) scale(${canvasRenderScale})`,
        transformOrigin: "center",
        willChange: "transform",
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
        loading="lazy"
        decoding="async"
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
  );
}

type ConnectionLayerProps = {
  generatedNodes: GeneratedImageNode[];
  linkDrag: LinkDragState;
  canvasRenderScale: number;
  getNodeAnchor: (id: string | null, side?: "left" | "right") => NodePosition | null;
};

function ConnectionLayer({
  generatedNodes,
  linkDrag,
  canvasRenderScale,
  getNodeAnchor,
}: ConnectionLayerProps) {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
        transform: `scale(${canvasRenderScale})`,
        transformOrigin: "0 0",
      }}
    >
      {generatedNodes
        .filter((node) => node.parentId)
        .map((to) => {
          const from = getNodeAnchor(to.parentId, "right");
          const toAnchor = getNodeAnchor(to.id, "left");
          if (!from || !toAnchor) return null;

          const midX = (from.x + toAnchor.x) / 2;
          const pathD = `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${toAnchor.y}, ${toAnchor.x} ${toAnchor.y}`;

          return (
            <path
              key={`${to.parentId}-${to.id}`}
              d={pathD}
              fill="none"
              stroke="rgba(255,255,255,0.42)"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      {linkDrag.source && (linkDrag.active || linkDrag.menuOpen) ? (
        <path
          d={`M ${linkDrag.source.x} ${linkDrag.source.y} C ${(linkDrag.source.x + linkDrag.x) / 2} ${linkDrag.source.y}, ${(linkDrag.source.x + linkDrag.x) / 2} ${linkDrag.y}, ${linkDrag.x} ${linkDrag.y}`}
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  );
}

type LinkActionMenuProps = {
  linkDrag: LinkDragState;
  canvasRenderScale: number;
  onCreateLinkedImageNodeFromDrag: () => void;
  onShowUnavailable: (message: string) => void;
};

function LinkActionMenu({
  linkDrag,
  canvasRenderScale,
  onCreateLinkedImageNodeFromDrag,
  onShowUnavailable,
}: LinkActionMenuProps) {
  if (!linkDrag.menuOpen || !linkDrag.sourceId) return null;

  return (
    <div
      data-no-drag="true"
      style={{
        position: "absolute",
        left: linkDrag.x * canvasRenderScale,
        top: linkDrag.y * canvasRenderScale,
        zIndex: 46,
        width: 336,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(27,27,28,0.98)",
        borderRadius: 22,
        padding: 12,
        boxShadow: "0 28px 100px rgba(0,0,0,0.62)",
      }}
    >
      <div style={{ color: "rgba(255,255,255,0.48)", fontSize: 14, fontWeight: 850, margin: "4px 8px 10px" }}>
        引用该节点生成
      </div>
      {[
        { id: "text", label: "文本生成", note: "脚本、广告词、品牌文案", icon: MoreHorizontal },
        { id: "image", label: "图片生成", note: "", icon: ImageIcon },
        { id: "video", label: "视频生成", note: "", icon: Maximize2 },
        { id: "editor", label: "图片编辑器", note: "", icon: Settings },
        { id: "world", label: "3D 世界", note: "Beta", icon: Sparkles },
      ].map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (item.id === "image") {
                onCreateLinkedImageNodeFromDrag();
                return;
              }
              onShowUnavailable("该节点下一步接入");
            }}
            style={{
              width: "100%",
              minHeight: 58,
              border: "none",
              borderRadius: 14,
              background: item.id === "text" ? "rgba(255,255,255,0.08)" : "transparent",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 10px",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <span style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={20} />
            </span>
            <span style={{ display: "grid", gap: 3 }}>
              <span style={{ fontSize: 16, fontWeight: 900 }}>{item.label}</span>
              {item.note ? (
                <span style={{ color: "rgba(255,255,255,0.42)", fontSize: 12 }}>
                  {item.note}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

type EmptyCanvasHintProps = {
  onCreateNodeAndFocus: () => void;
  onShowUnavailable: (message: string) => void;
};

function EmptyCanvasHint({ onCreateNodeAndFocus, onShowUnavailable }: EmptyCanvasHintProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "48%",
        transform: "translate3d(-50%, -50%, 0)",
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
          onClick={onCreateNodeAndFocus}
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
            onClick={() => onShowUnavailable(`${action} 下一步接入`)}
            style={{
              height: 46,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.055)",
              color: "rgba(255,255,255,0.52)",
              padding: "0 16px",
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}

type MiniMapProps = {
  canvasNodes: CanvasNode[];
  selectedNodeId: string | null;
};

function MiniMap({ canvasNodes, selectedNodeId }: MiniMapProps) {
  return (
    <div
      style={{
        position: "absolute",
        right: 22,
        bottom: 84,
        zIndex: 18,
        width: 188,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(18,18,19,0.9)",
        borderRadius: 18,
        padding: 10,
        boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
        backdropFilter: "blur(18px)",
      }}
    >
      <div
        style={{
          color: "rgba(255,255,255,0.54)",
          fontSize: 12,
          fontWeight: 850,
          marginBottom: 8,
        }}
      >
        Mini Map
      </div>
      <div
        style={{
          position: "relative",
          height: 108,
          borderRadius: 12,
          overflow: "hidden",
          background: "radial-gradient(circle, rgba(255,255,255,0.22) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      >
        {canvasNodes.map((node) => (
          <span
            key={node.id}
            style={{
              position: "absolute",
              left: clamp(node.x / 10, 6, 170),
              top: clamp(node.y / 8, 6, 98),
              width: node.type === "image" ? 16 : 12,
              height: node.type === "image" ? 12 : 12,
              borderRadius: node.type === "image" ? 4 : 999,
              background:
                node.id === selectedNodeId
                  ? "white"
                  : node.type === "image"
                    ? "rgba(134,239,172,0.88)"
                    : "rgba(96,165,250,0.82)",
              boxShadow:
                node.id === selectedNodeId ? "0 0 0 3px rgba(255,255,255,0.18)" : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

type ZoomControlsProps = {
  canvasZoom: number;
  onUpdateZoom: (zoom: number) => void;
};

function ZoomControls({ canvasZoom, onUpdateZoom }: ZoomControlsProps) {
  return (
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
      {zoomLevels.map((level) => {
        const active = Math.abs(canvasZoom - level) < 0.01;

        return (
          <button
            key={level}
            type="button"
            onClick={() => onUpdateZoom(level)}
            style={{
              height: 34,
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 999,
              background: active ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.06)",
              color: active ? "black" : "rgba(255,255,255,0.72)",
              padding: "0 10px",
              fontSize: 12,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {Math.round(level * 100)}%
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => {
          const currentIndex = zoomLevels.findIndex(
            (level) => Math.abs(level - canvasZoom) < 0.01
          );
          onUpdateZoom(
            zoomLevels[Math.max(0, (currentIndex === -1 ? defaultZoomIndex : currentIndex) - 1)]
          );
        }}
        style={{ ...iconButton, width: 34, height: 34, background: "rgba(255,255,255,0.06)" }}
        aria-label="缩小"
      >
        <Minus size={16} />
      </button>
      <button
        type="button"
        onClick={() => {
          const currentIndex = zoomLevels.findIndex(
            (level) => Math.abs(level - canvasZoom) < 0.01
          );
          onUpdateZoom(
            zoomLevels[
              Math.min(zoomLevels.length - 1, (currentIndex === -1 ? defaultZoomIndex : currentIndex) + 1)
            ]
          );
        }}
        style={{ ...iconButton, width: 34, height: 34, background: "rgba(255,255,255,0.06)" }}
        aria-label="放大"
      >
        <Plus size={16} />
      </button>
      <button
        type="button"
        onClick={() => onUpdateZoom(defaultCanvasZoom)}
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
  );
}

type ClearConfirmDialogProps = {
  open: boolean;
  onCancel: () => void;
  onClear: () => void;
};

function ClearConfirmDialog({ open, onCancel, onClear }: ClearConfirmDialogProps) {
  if (!open) return null;

  return (
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
          <button type="button" onClick={onCancel} style={glassButton}>
            取消
          </button>
          <button
            type="button"
            onClick={onClear}
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
  );
}

type MembershipDialogProps = {
  open: boolean;
  onClose: () => void;
  onRechargeCredits: (amount: number, planName: string) => void;
};

function MembershipDialog({ open, onClose, onRechargeCredits }: MembershipDialogProps) {
  if (!open) return null;

  return (
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
            onClick={onClose}
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
              onClick={() => onRechargeCredits(plan.credits, plan.name)}
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
                  plan.name === "Pro" ? "0 18px 60px rgba(134,239,172,0.12)" : "none",
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
  );
}
