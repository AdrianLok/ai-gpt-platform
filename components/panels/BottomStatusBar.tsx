"use client";

type BottomStatusBarProps = {
  loading: boolean;
  statusMessage: string;
  error: string;
  selectedNodeId: string | null;
  isSpacePressed: boolean;
};

export function BottomStatusBar({
  loading,
  statusMessage,
  error,
  selectedNodeId,
  isSpacePressed,
}: BottomStatusBarProps) {
  const message = error || statusMessage || (selectedNodeId ? "已选择节点" : "双击空白处新增节点");

  return (
    <div
      style={{
        position: "absolute",
        left: 22,
        right: 22,
        bottom: 18,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: 40,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(18,18,19,0.88)",
          color: error ? "#fca5a5" : loading ? "#fde68a" : "rgba(255,255,255,0.68)",
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "0 14px",
          fontSize: 13,
          fontWeight: 800,
          boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
          backdropFilter: "blur(18px)",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: error ? "#fca5a5" : loading ? "#fde68a" : "#86efac",
            boxShadow: `0 0 16px ${error ? "#fca5a5" : loading ? "#fde68a" : "#86efac"}`,
          }}
        />
        {message}
      </div>
      <div
        style={{
          height: 40,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(18,18,19,0.72)",
          color: "rgba(255,255,255,0.48)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 14px",
          fontSize: 12,
          fontWeight: 800,
          backdropFilter: "blur(18px)",
        }}
      >
        <span>{isSpacePressed ? "松开空格结束移动画布" : "空格 + 拖拽移动画布"}</span>
        <span>滚轮缩放</span>
        <span>Del 删除</span>
        <span>⌘/Ctrl + D 复制</span>
      </div>
    </div>
  );
}
