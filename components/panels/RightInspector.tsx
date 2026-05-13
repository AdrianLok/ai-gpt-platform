"use client";

import type { GeneratedImageNode } from "../../types/image";
import type { ImageModel } from "../../types/model";
import type { ImageRatio } from "../../lib/image-options";

type RightInspectorProps = {
  selectedNode: GeneratedImageNode | null;
  draftSelected: boolean;
  model: ImageModel;
  ratio: ImageRatio;
  quality: string;
  prompt: string;
  onRenameNode: (nodeId: string, title: string) => void;
  onToggleCollapse: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
};

export function RightInspector({
  selectedNode,
  draftSelected,
  model,
  ratio,
  quality,
  prompt,
  onRenameNode,
  onToggleCollapse,
  onDuplicateNode,
  onDeleteNode,
}: RightInspectorProps) {
  const title = selectedNode?.title || selectedNode?.prompt?.slice(0, 18) || "图片生成节点";

  return (
    <aside
      style={{
        width: 304,
        minWidth: 304,
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(9,9,10,0.98)",
        padding: 16,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        zIndex: 4,
      }}
    >
      <div>
        <div style={{ color: "rgba(255,255,255,0.46)", fontSize: 12, fontWeight: 850 }}>
          属性面板
        </div>
        <div style={{ marginTop: 8, fontSize: 18, fontWeight: 900 }}>
          {selectedNode ? "图片结果节点" : draftSelected ? "生图草稿节点" : "未选择节点"}
        </div>
      </div>

      {selectedNode ? (
        <>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 800 }}>
              节点名称
            </span>
            <input
              value={title}
              onChange={(event) => onRenameNode(selectedNode.id, event.currentTarget.value)}
              style={{
                height: 38,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.055)",
                color: "white",
                padding: "0 12px",
                outline: "none",
                fontWeight: 750,
              }}
            />
          </label>

          <InspectorRow label="模型" value={selectedNode.modelLabel || selectedNode.model} />
          <InspectorRow label="比例" value={selectedNode.ratio} />
          <InspectorRow label="消耗" value={`${selectedNode.creditCost || 1} credit`} />
          <InspectorText label="Prompt" value={selectedNode.prompt || "暂无 prompt"} />

          <div style={{ display: "grid", gap: 8, marginTop: 4 }}>
            <InspectorButton onClick={() => onDuplicateNode(selectedNode.id)}>复制节点</InspectorButton>
            <InspectorButton onClick={() => onToggleCollapse(selectedNode.id)}>
              {selectedNode.collapsed ? "展开节点" : "折叠节点"}
            </InspectorButton>
            <InspectorButton danger onClick={() => onDeleteNode(selectedNode.id)}>
              删除节点
            </InspectorButton>
          </div>
        </>
      ) : draftSelected ? (
        <>
          <InspectorRow label="模型" value={model.label} />
          <InspectorRow label="比例" value={ratio.label} />
          <InspectorRow label="画质" value={quality} />
          <InspectorText label="当前 Prompt" value={prompt || "暂无 prompt"} />
        </>
      ) : (
        <div style={{ color: "rgba(255,255,255,0.42)", fontSize: 13, lineHeight: 1.7 }}>
          选择画布中的图片节点后，可在这里查看参数、重命名、复制、折叠或删除。
        </div>
      )}
    </aside>
  );
}

function InspectorRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        background: "rgba(255,255,255,0.04)",
        padding: "11px 12px",
      }}
    >
      <div style={{ color: "rgba(255,255,255,0.44)", fontSize: 12, fontWeight: 800 }}>{label}</div>
      <div style={{ marginTop: 5, color: "rgba(255,255,255,0.84)", fontSize: 13, fontWeight: 750 }}>
        {value}
      </div>
    </div>
  );
}

function InspectorText({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        background: "rgba(255,255,255,0.04)",
        padding: 12,
      }}
    >
      <div style={{ color: "rgba(255,255,255,0.44)", fontSize: 12, fontWeight: 800 }}>{label}</div>
      <div style={{ marginTop: 7, color: "rgba(255,255,255,0.72)", fontSize: 13, lineHeight: 1.6 }}>
        {value}
      </div>
    </div>
  );
}

function InspectorButton({
  children,
  danger,
  onClick,
}: {
  children: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 38,
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        background: danger ? "rgba(127,29,29,0.48)" : "rgba(255,255,255,0.06)",
        color: danger ? "#fecaca" : "rgba(255,255,255,0.82)",
        fontSize: 13,
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
