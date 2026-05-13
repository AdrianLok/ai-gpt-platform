"use client";

import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { memo } from "react";
import {
  Download,
  ImageIcon,
  Maximize2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import { aspectRatioMap } from "../lib/image-options";
import type { ImageModel } from "../lib/models";
import type { GeneratedImageNode, NodePosition } from "../lib/types";

const extensionActions = [
  { label: "生成同款", prompt: "参考当前图片，生成同款构图、色彩和视觉风格。" },
  { label: "改风格", prompt: "在保留主体和构图的基础上，改成更鲜明的艺术风格。" },
  { label: "做海报", prompt: "基于当前图片生成一张完整商业海报，加入标题感构图和高级排版。" },
  { label: "放大细节", prompt: "强化主体细节、材质纹理和光影层次，画面更高清精致。" },
];

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

type ImageNodeProps = {
  node: GeneratedImageNode;
  selected: boolean;
  menuOpen: boolean;
  extensionOpen: boolean;
  canvasRenderScale: number;
  onPointerDown: (id: string, event: ReactPointerEvent<HTMLElement>) => void;
  onSelect: (node: GeneratedImageNode) => void;
  onToggleMenu: (id: string) => void;
  onCloseMenu: () => void;
  onDelete: (id: string) => void;
  onDownload: (imageUrl: string) => void;
  onOpenPreview: (imageUrl: string) => void;
  onCopyPrompt: (text: string) => void;
  onRegenerate: (node: GeneratedImageNode) => void;
  onStartLinkDrag: (sourceId: string, event: ReactPointerEvent<HTMLElement>) => void;
  onExtensionAction: (prompt: string, parentId?: string | null) => void;
};

export const ImageNode = memo(function ImageNode({
  node,
  selected,
  menuOpen,
  extensionOpen,
  canvasRenderScale,
  onPointerDown,
  onSelect,
  onToggleMenu,
  onCloseMenu,
  onDelete,
  onDownload,
  onOpenPreview,
  onCopyPrompt,
  onRegenerate,
  onStartLinkDrag,
  onExtensionAction,
}: ImageNodeProps) {
  return (
    <article
      data-canvas-node="true"
      onPointerDown={(event) => onPointerDown(node.id, event)}
      onClick={() => onSelect(node)}
      style={{
        position: "absolute",
        left: node.position.x * canvasRenderScale,
        top: node.position.y * canvasRenderScale,
        transform: `translate3d(-50%, -50%, 0) scale(${canvasRenderScale})`,
        transformOrigin: "center",
        willChange: "transform",
        width: 320,
        border: "none",
        background: "transparent",
        borderRadius: 0,
        padding: 0,
        boxSizing: "border-box",
        boxShadow: "none",
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
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ImageIcon size={15} />
          图片生成
        </span>
        <div style={{ position: "relative" }} data-no-drag="true">
          {selected ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(node.id);
              }}
              style={{
                ...iconButton,
                position: "absolute",
                right: 40,
                top: 0,
                width: 34,
                height: 34,
                background: "rgba(127,29,29,0.72)",
                color: "#fecaca",
              }}
              aria-label="delete node"
            >
              <Trash2 size={16} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleMenu(node.id);
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
                { label: "下载", action: () => onDownload(node.url) },
                { label: "放大预览", action: () => onOpenPreview(node.url) },
                { label: "复制 Prompt", action: () => onCopyPrompt(node.prompt) },
                { label: "重新生成", action: () => onRegenerate(node) },
                { label: "删除节点", action: () => onDelete(node.id) },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    item.action();
                    if (item.label !== "删除节点") onCloseMenu();
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

      <div
        style={{
          position: "relative",
          border: selected
            ? "2px solid rgba(255,255,255,0.92)"
            : "1px solid rgba(255,255,255,0.16)",
          background: "rgba(32,32,33,0.96)",
          borderRadius: 24,
          padding: 10,
          boxSizing: "border-box",
          boxShadow: selected
            ? "0 0 0 1px rgba(255,255,255,0.18), 0 28px 96px rgba(255,255,255,0.2)"
            : "0 22px 72px rgba(0,0,0,0.55)",
        }}
      >
        {node.imageUrl ? (
          <img
            src={node.url}
            alt={node.prompt}
            loading="lazy"
            decoding="async"
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
        ) : (
          <div
            style={{
              width: "100%",
              aspectRatio: aspectRatioMap[node.ratio] || "4 / 3",
              borderRadius: 18,
              background: "#202020",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ImageIcon size={54} color="rgba(255,255,255,0.28)" />
          </div>
        )}
        <button
          type="button"
          data-no-drag="true"
          onPointerDown={(event) => onStartLinkDrag(node.id, event)}
          onClick={(event) => {
            event.stopPropagation();
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
                  onExtensionAction(action.prompt, node.id);
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
    </article>
  );
});

type DraftImageNodeProps = {
  imageNodePosition: NodePosition | null;
  canvasRenderScale: number;
  nodeAspectRatio: string;
  loading: boolean;
  statusMessage: string;
  loadingMessage: string;
  model: ImageModel;
  image: string;
  error: string;
  selected: boolean;
  hasGeneratedNodes: boolean;
  extensionMenuOpen: string | null;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onClick: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onDelete: () => void;
  onUpload: () => void;
  onStartLinkDrag: (sourceId: string, event: ReactPointerEvent<HTMLElement>) => void;
  onExtensionAction: (prompt: string, parentId?: string | null) => void;
  onDownload: () => void;
  onOpenPreview: (imageUrl: string) => void;
  onRegenerate: () => void;
};

export const DraftImageNode = memo(function DraftImageNode({
  imageNodePosition,
  canvasRenderScale,
  nodeAspectRatio,
  loading,
  statusMessage,
  loadingMessage,
  model,
  image,
  error,
  selected,
  hasGeneratedNodes,
  extensionMenuOpen,
  onPointerDown,
  onClick,
  onDelete,
  onUpload,
  onStartLinkDrag,
  onExtensionAction,
  onDownload,
  onOpenPreview,
  onRegenerate,
}: DraftImageNodeProps) {
  return (
    <div
      data-canvas-node="true"
      onPointerDown={onPointerDown}
      onClick={onClick}
      style={{
        position: "absolute",
        left: imageNodePosition ? imageNodePosition.x * canvasRenderScale : "50%",
        top: imageNodePosition ? imageNodePosition.y * canvasRenderScale : "36%",
        transform: `translate3d(-50%, -50%, 0) scale(${canvasRenderScale})`,
        transformOrigin: "center",
        willChange: "transform",
        width: "min(490px, calc(100% - 64px))",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        cursor: "grab",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <div
        style={{
          width: 320,
          alignSelf: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: -6,
          color: "rgba(255,255,255,0.68)",
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ImageIcon size={15} />
          Image
        </span>
        <div data-no-drag="true" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {selected ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              style={{
                ...iconButton,
                width: 32,
                height: 32,
                background: "rgba(127,29,29,0.72)",
                color: "#fecaca",
              }}
              aria-label="delete image node"
            >
              <Trash2 size={15} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onUpload();
            }}
            style={{
              height: 32,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.09)",
              color: "white",
              padding: "0 12px",
              display: selected ? "flex" : "none",
              alignItems: "center",
              gap: 7,
              fontSize: 13,
              fontWeight: 750,
              cursor: "pointer",
            }}
          >
            <Upload size={14} />
            上传
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ position: "relative", display: "block" }}>
          <button
            type="button"
            onPointerDown={(event) => onStartLinkDrag("draft-image", event)}
            onClick={(event) => event.stopPropagation()}
            style={{ ...iconButton, background: "rgba(255,255,255,0.04)" }}
          >
            <Plus size={22} />
          </button>

          {extensionMenuOpen === "left" ? (
            <DraftExtensionMenu side="left" onExtensionAction={onExtensionAction} />
          ) : null}
        </div>

        <article
          style={{
            width: 320,
            border: selected
              ? "2px solid rgba(255,255,255,0.92)"
              : "1px solid rgba(255,255,255,0.16)",
            background: "rgba(32,32,33,0.96)",
            borderRadius: 24,
            padding: 10,
            boxSizing: "border-box",
            boxShadow: selected
              ? "0 0 0 1px rgba(255,255,255,0.18), 0 28px 96px rgba(255,255,255,0.2)"
              : "0 24px 90px rgba(0,0,0,0.55)",
          }}
        >
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 16,
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
                <Wand2 size={36} color="rgba(255,255,255,0.5)" />
                <div>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.72)" }}>
                    {statusMessage || loadingMessage}
                  </p>
                  <p
                    style={{
                      margin: "8px 0 0",
                      color: "rgba(255,255,255,0.45)",
                      fontSize: 13,
                    }}
                  >
                    当前模型：{model.label}
                  </p>
                </div>
              </div>
            ) : !hasGeneratedNodes && image ? (
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
                  <button type="button" onClick={onDownload} style={iconButton} aria-label="下载图片">
                    <Download size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPreview(image)}
                    style={iconButton}
                    aria-label="放大预览"
                  >
                    <Maximize2 size={16} />
                  </button>
                  <button type="button" onClick={onRegenerate} style={iconButton} aria-label="重新生成">
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
                <ImageIcon size={52} color="rgba(255,255,255,0.26)" />
              </div>
            )}
          </div>
        </article>

        <div style={{ position: "relative", display: "block" }}>
          <button
            type="button"
            onPointerDown={(event) => onStartLinkDrag("draft-image", event)}
            onClick={(event) => event.stopPropagation()}
            style={{ ...iconButton, background: "rgba(255,255,255,0.04)" }}
          >
            <Plus size={22} />
          </button>

          {extensionMenuOpen === "right" ? (
            <DraftExtensionMenu side="right" onExtensionAction={onExtensionAction} />
          ) : null}
        </div>
      </div>
    </div>
  );
});

type DraftExtensionMenuProps = {
  side: "left" | "right";
  onExtensionAction: (prompt: string, parentId?: string | null) => void;
};

function DraftExtensionMenu({ side, onExtensionAction }: DraftExtensionMenuProps) {
  const sidePosition = side === "left" ? { right: 50 } : { left: 50 };

  return (
    <div
      data-no-drag="true"
      style={{
        position: "absolute",
        ...sidePosition,
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
          onClick={() => onExtensionAction(action.prompt)}
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
  );
}
