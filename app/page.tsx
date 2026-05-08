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
import {
  ImageIcon,
  Plus,
  ArrowUp,
  Sparkles,
  Maximize2,
  Download,
  X,
  Trash2,
  Loader2,
  Check,
  ChevronDown,
} from "lucide-react";

const modelOptions = [
  { label: "GPT Image 1", value: "gpt-image-1", tag: "稳定" },
  { label: "GPT Image 1.5", value: "gpt-image-1.5", tag: "新" },
  { label: "GPT Image Mini", value: "gpt-image-1-mini", tag: "省钱" },
];

const ratioOptions = [
  { label: "1:1", value: "1024x1024" },
  { label: "4:3", value: "1536x1024" },
  { label: "3:4", value: "1024x1536" },
  { label: "16:9", value: "1536x1024" },
  { label: "9:16", value: "1024x1536" },
];

const qualityOptions = [
  { label: "低", value: "low" },
  { label: "中", value: "medium" },
  { label: "高", value: "high" },
];

function ImageNode({ data, selected }: NodeProps) {
  return (
    <div className="relative">
      <div className="mb-2 flex items-center gap-2 text-sm text-white/70">
        <ImageIcon size={16} />
        {data.title}
        {data.loading && (
          <span className="ml-2 flex items-center gap-1 text-xs text-blue-300">
            <Loader2 size={12} className="animate-spin" />
            生成中
          </span>
        )}
      </div>

      <div
        className={`relative flex h-72 w-[430px] items-center justify-center rounded-3xl bg-[#1f1f1f] shadow-2xl transition ${
          selected ? "border-2 border-white/70" : "border border-white/10"
        }`}
      >
        {data.loading ? (
          <div className="flex flex-col items-center gap-3 text-white/50">
            <Loader2 size={42} className="animate-spin" />
            <p>AI 正在生成图片...</p>
          </div>
        ) : data.image ? (
          <>
            <img src={data.image} className="h-full w-full rounded-3xl bg-[#1f1f1f] object-contain" />

            <div className="absolute right-3 top-3 flex gap-2">
              <button onClick={() => data.onPreview(data.image)} className="rounded-full bg-black/60 p-2 hover:bg-black">
                <Maximize2 size={16} />
              </button>

              <a href={data.image} download="ai-image.png" className="rounded-full bg-black/60 p-2 hover:bg-black">
                <Download size={16} />
              </a>

              <button onClick={() => data.onDelete(data.id)} className="rounded-full bg-black/60 p-2 hover:bg-red-500">
                <Trash2 size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-white/25">
            <ImageIcon size={54} />
            <p className="text-sm">空图片节点</p>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!h-5 !w-5 !bg-white/50" />
      <Handle type="target" position={Position.Left} className="!h-5 !w-5 !bg-white/50" />
    </div>
  );
}

const nodeTypes = { imageNode: ImageNode };

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [count, setCount] = useState(1);

  const [model, setModel] = useState("gpt-image-1");
  const [size, setSize] = useState("1536x1024");
  const [quality, setQuality] = useState("medium");

  const [modelOpen, setModelOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [qualityOpen, setQualityOpen] = useState(false);

  const deleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  }, []);

  const createNodeData = useCallback(
    (id: string, title: string, image = "", nodeLoading = false) => ({
      id,
      title,
      image,
      loading: nodeLoading,
      onPreview: setPreviewImage,
      onDelete: deleteNode,
    }),
    [deleteNode]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: "source",
      type: "imageNode",
      position: { x: 120, y: 180 },
      data: createNodeData("source", "Image"),
    },
  ]);

  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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

  function addEmptyNode() {
    const id = `node-${Date.now()}`;
    setCount((v) => v + 1);

    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "imageNode",
        position: { x: 260 + count * 80, y: 180 + count * 70 },
        data: createNodeData(id, `Image ${count + 1}`),
      },
    ]);
  }

  async function generateImage() {
    if (!prompt.trim()) return;

    setLoading(true);

    const id = `result-${Date.now()}`;

    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "imageNode",
        position: { x: 760 + count * 70, y: 210 + count * 55 },
        data: createNodeData(id, `图片生成 ${count}`, "", true),
      },
    ]);

    setEdges((eds) => [
      ...eds,
      {
        id: `edge-${id}`,
        source: "source",
        target: id,
        animated: true,
        style: { stroke: "#8b8b8b", strokeWidth: 3 },
      },
    ]);

    setCount((v) => v + 1);

    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model, size, quality }),
      });

      const data = await res.json();

      if (data.imageUrl) {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === id
              ? { ...node, data: createNodeData(id, node.data.title, data.imageUrl, false) }
              : node
          )
        );
      } else {
        alert(data.error || "图片生成失败");
        setNodes((nds) => nds.filter((node) => node.id !== id));
      }
    } catch {
      alert("图片生成失败");
      setNodes((nds) => nds.filter((node) => node.id !== id));
    }

    setLoading(false);
  }

  const currentModel = modelOptions.find((m) => m.value === model)?.label || "GPT Image";
  const currentRatio = ratioOptions.find((r) => r.value === size)?.label || "4:3";
  const currentQuality = qualityOptions.find((q) => q.value === quality)?.label || "中";

  return (
    <main className="h-screen w-screen overflow-hidden bg-black text-white">
      <div className="absolute left-5 top-5 z-30 flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-purple-400 to-cyan-400" />
        <span className="font-semibold">AI Canvas</span>
      </div>

      <div className="absolute right-5 top-5 z-30 flex items-center gap-3">
        <button className="rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur hover:bg-white/20">702</button>
        <button className="rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur hover:bg-white/20">社区</button>
        <button className="rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur hover:bg-white/20">分享</button>
      </div>

      <div className="absolute left-5 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-3 rounded-2xl bg-white/10 p-2 backdrop-blur">
        <button onClick={addEmptyNode} className="rounded-full bg-white p-2 text-black hover:scale-105">
          <Plus size={20} />
        </button>
        <button onClick={addEmptyNode} className="rounded-xl p-2 text-white/70 hover:bg-white/10">
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
          <button onClick={addEmptyNode} className="rounded-xl bg-white/10 p-3 text-white/70">
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

        <div className="relative flex items-center gap-3 border-t border-white/10 pt-3 text-sm text-white/70">
          <div className="relative">
            <button
              onClick={() => {
                setModelOpen(!modelOpen);
                setSizeOpen(false);
                setQualityOpen(false);
              }}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-white hover:bg-white/20"
            >
              ◎ {currentModel}
              <ChevronDown size={14} />
            </button>

            {modelOpen && (
              <div className="absolute bottom-12 left-0 w-72 rounded-3xl bg-[#2b2b2b] p-3 shadow-2xl">
                {modelOptions.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      setModel(item.value);
                      setModelOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left hover:bg-white/10"
                  >
                    <span>{item.label}</span>
                    <div className="flex items-center gap-2">
                      {item.tag && <span className="rounded-full bg-cyan-300 px-2 py-0.5 text-xs text-black">{item.tag}</span>}
                      {model === item.value && <Check size={16} />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setSizeOpen(!sizeOpen);
                setModelOpen(false);
                setQualityOpen(false);
              }}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-white hover:bg-white/20"
            >
              ▣ {currentRatio} · 4K
              <ChevronDown size={14} />
            </button>

            {sizeOpen && (
              <div className="absolute bottom-12 left-0 w-96 rounded-3xl bg-[#2b2b2b] p-5 shadow-2xl">
                <p className="mb-3 text-white/50">比例</p>
                <div className="grid grid-cols-5 gap-3">
                  {ratioOptions.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        setSize(item.value);
                        setSizeOpen(false);
                      }}
                      className={`rounded-2xl px-3 py-4 ${
                        size === item.value ? "bg-white/20 text-white" : "bg-white/5 text-white/50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setQualityOpen(!qualityOpen);
                setModelOpen(false);
                setSizeOpen(false);
              }}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-white hover:bg-white/20"
            >
              精细度 · {currentQuality}
              <ChevronDown size={14} />
            </button>

            {qualityOpen && (
              <div className="absolute bottom-12 left-0 w-72 rounded-3xl bg-[#2b2b2b] p-5 shadow-2xl">
                <p className="mb-3 text-white/50">精细度</p>
                <div className="grid grid-cols-3 gap-3">
                  {qualityOptions.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => {
                        setQuality(item.value);
                        setQualityOpen(false);
                      }}
                      className={`rounded-2xl px-4 py-3 ${
                        quality === item.value ? "bg-white/20 text-white" : "bg-white/5 text-white/50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

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
          <button onClick={() => setPreviewImage("")} className="absolute right-8 top-8 rounded-full bg-white/10 p-3 hover:bg-white/20">
            <X size={24} />
          </button>

          <img src={previewImage} className="max-h-full max-w-full rounded-3xl object-contain" />

          <a href={previewImage} download="ai-image.png" className="absolute bottom-8 rounded-full bg-white px-6 py-3 font-bold text-black">
            下载图片
          </a>
        </div>
      )}
    </main>
  );
}
