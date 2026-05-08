"use client";

import { useCallback, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
  Connection,
  NodeProps,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { ImageIcon, Plus, ArrowUp, Sparkles, Maximize2, Download, X } from "lucide-react";

function ImageNode({ data }: NodeProps) {
  return (
    <div className="relative">
      <div className="mb-2 flex items-center gap-2 text-sm text-white/70">
        <ImageIcon size={16} />
        {data.title}
      </div>

      <div className="relative flex h-72 w-[430px] items-center justify-center rounded-3xl border border-white/10 bg-[#1f1f1f] shadow-2xl">
        {data.image ? (
          <>
            <img
              src={data.image}
              className="h-full w-full rounded-3xl object-contain bg-[#1f1f1f]"
            />

            <div className="absolute right-3 top-3 flex gap-2">
              <button
                onClick={() => data.onPreview(data.image)}
                className="rounded-full bg-black/60 p-2 hover:bg-black"
              >
                <Maximize2 size={16} />
              </button>

              <a
                href={data.image}
                download="ai-image.png"
                className="rounded-full bg-black/60 p-2 hover:bg-black"
              >
                <Download size={16} />
              </a>
            </div>
          </>
        ) : (
          <ImageIcon size={54} className="text-white/20" />
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!h-5 !w-5 !bg-white/40" />
      <Handle type="target" position={Position.Left} className="!h-5 !w-5 !bg-white/40" />
    </div>
  );
}

const nodeTypes = {
  imageNode: ImageNode,
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [imageCount, setImageCount] = useState(0);

  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: "input-image",
      type: "imageNode",
      position: { x: 120, y: 180 },
      data: {
        title: "Image",
        image: "",
        onPreview: setPreviewImage,
      },
    },
    {
      id: "generate-image",
      type: "imageNode",
      position: { x: 760, y: 220 },
      data: {
        title: "图片生成",
        image: "",
        onPreview: setPreviewImage,
      },
    },
  ]);

  const [edges, setEdges, onEdgesChange] = useEdgesState([
    {
      id: "edge-1",
      source: "input-image",
      target: "generate-image",
      animated: true,
      style: { stroke: "#8b8b8b", strokeWidth: 3 },
    },
  ]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#8b8b8b", strokeWidth: 3 },
          },
          eds
        )
      ),
    [setEdges]
  );

  async function generateImage() {
    if (!prompt.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (data.imageUrl) {
        const newId = `result-${Date.now()}`;
        const nextCount = imageCount + 1;

        setImageCount(nextCount);

        setNodes((nds) => [
          ...nds,
          {
            id: newId,
            type: "imageNode",
            position: { x: 760 + nextCount * 80, y: 220 + nextCount * 70 },
            data: {
              title: `生成结果 ${nextCount}`,
              image: data.imageUrl,
              onPreview: setPreviewImage,
            },
          },
        ]);

        setEdges((eds) => [
          ...eds,
          {
            id: `edge-${newId}`,
            source: "input-image",
            target: newId,
            animated: true,
            style: { stroke: "#8b8b8b", strokeWidth: 3 },
          },
        ]);
      } else {
        alert(data.error || "图片生成失败");
      }
    } catch {
      alert("图片生成失败");
    }

    setLoading(false);
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-black text-white">
      <div className="absolute left-5 top-5 z-30 flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-purple-400 to-cyan-400" />
        <span className="font-semibold">AI Canvas</span>
      </div>

      <div className="absolute right-5 top-5 z-30 flex items-center gap-3">
        <button className="rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur hover:bg-white/20">
          社区
        </button>
        <button className="rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur hover:bg-white/20">
          分享
        </button>
      </div>

      <div className="absolute left-5 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-3 rounded-2xl bg-white/10 p-2 backdrop-blur">
        <button className="rounded-full bg-white p-2 text-black">
          <Plus size={20} />
        </button>
        <button className="rounded-xl p-2 text-white/70 hover:bg-white/10">
          <ImageIcon size={20} />
        </button>
        <button className="rounded-xl p-2 text-white/70 hover:bg-white/10">
          <Sparkles size={20} />
        </button>
      </div>

      <div className="h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#222" gap={18} size={1} />
          <Controls />
        </ReactFlow>
      </div>

      <div className="absolute bottom-8 left-1/2 z-40 w-[760px] -translate-x-1/2 rounded-3xl border border-white/10 bg-[#202020]/95 p-4 shadow-2xl backdrop-blur">
        <div className="mb-3 flex items-center gap-2">
          <button className="rounded-xl bg-white/10 p-3 text-white/70">
            <ImageIcon size={18} />
          </button>
          <button className="rounded-xl bg-white/10 p-3 text-white/70">
            <Plus size={18} />
          </button>
          <button className="ml-auto rounded-xl bg-white/10 p-3 text-white/70">
            <Maximize2 size={18} />
          </button>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="描述任何你想要生成的内容"
          className="h-28 w-full resize-none bg-transparent text-base outline-none placeholder:text-white/35"
        />

        <div className="flex items-center gap-4 border-t border-white/10 pt-3 text-sm text-white/70">
          <span>◎ GPT Image 1.5</span>
          <span>▣ 4:3</span>
          <span>4K · 中</span>
          <span>风格</span>
          <span>摄影机控制</span>

          <button
            onClick={generateImage}
            disabled={loading}
            className="ml-auto flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-black disabled:opacity-60"
          >
            {loading ? "生成中" : "生成"}
            <ArrowUp size={18} />
          </button>
        </div>
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-10">
          <button
            onClick={() => setPreviewImage("")}
            className="absolute right-8 top-8 rounded-full bg-white/10 p-3 hover:bg-white/20"
          >
            <X size={24} />
          </button>

          <img
            src={previewImage}
            className="max-h-full max-w-full rounded-3xl object-contain"
          />

          <a
            href={previewImage}
            download="ai-image.png"
            className="absolute bottom-8 rounded-full bg-white px-6 py-3 font-bold text-black"
          >
            下载图片
          </a>
        </div>
      )}
    </main>
  );
}
