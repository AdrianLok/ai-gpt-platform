"use client";

import { useCallback, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  Connection,
  Node,
} from "reactflow";
import "reactflow/dist/style.css";

const initialNodes: Node[] = [
  {
    id: "1",
    type: "default",
    position: { x: 120, y: 120 },
    data: { label: "① 提示词输入\n写下你想生成的图片内容" },
  },
  {
    id: "2",
    type: "default",
    position: { x: 420, y: 120 },
    data: { label: "② GPT 优化提示词\n让描述更适合出图" },
  },
  {
    id: "3",
    type: "default",
    position: { x: 720, y: 120 },
    data: { label: "③ AI 生成图片\n调用 GPT Image" },
  },
  {
    id: "4",
    type: "default",
    position: { x: 1020, y: 120 },
    data: { label: "④ 图片预览\n查看生成结果" },
  },
];

const initialEdges = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
  { id: "e3-4", source: "3", target: "4" },
];

export default function Home() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  async function runImageWorkflow() {
    if (!prompt) return;

    setLoading(true);
    setImage("");
    setResult("");

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
        setImage(data.imageUrl);
      } else {
        setResult(data.error || "生成失败");
      }
    } catch {
      setResult("图片生成失败");
    }

    setLoading(false);
  }

  return (
    <main className="h-screen w-screen bg-[#050509] text-white overflow-hidden">
      <div className="absolute left-0 top-0 z-20 flex h-full w-72 flex-col border-r border-white/10 bg-black/60 p-4 backdrop-blur">
        <h1 className="text-2xl font-bold">AI 节点工作台</h1>
        <p className="mt-2 text-sm text-white/50">
          节点式 AI 生图流程 MVP
        </p>

        <div className="mt-6 space-y-3">
          <button className="w-full rounded-xl bg-white/10 px-4 py-3 text-left hover:bg-white/20">
            + 文本提示词节点
          </button>
          <button className="w-full rounded-xl bg-white/10 px-4 py-3 text-left hover:bg-white/20">
            + GPT 优化节点
          </button>
          <button className="w-full rounded-xl bg-white/10 px-4 py-3 text-left hover:bg-white/20">
            + AI 生图节点
          </button>
          <button className="w-full rounded-xl bg-white/10 px-4 py-3 text-left hover:bg-white/20">
            + 图片预览节点
          </button>
        </div>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/60">当前流程</p>
          <p className="mt-2 text-lg font-semibold">Prompt → Image</p>
        </div>
      </div>

      <div className="absolute right-0 top-0 z-20 flex h-full w-96 flex-col border-l border-white/10 bg-black/60 p-4 backdrop-blur">
        <h2 className="text-xl font-bold">节点参数</h2>

        <label className="mt-6 text-sm text-white/60">图片提示词</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="例如：一个韩系水果IP角色，二头身，可爱插画风格..."
          className="mt-2 h-40 resize-none rounded-2xl border border-white/10 bg-white/10 p-4 outline-none"
        />

        <button
          onClick={runImageWorkflow}
          disabled={loading}
          className="mt-4 rounded-2xl bg-white px-4 py-3 font-bold text-black disabled:opacity-50"
        >
          {loading ? "运行中..." : "运行工作流"}
        </button>

        <div className="mt-6 flex-1 overflow-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-3 font-semibold">输出结果</h3>

          {result && <p className="text-sm text-red-300">{result}</p>}

          {image && (
            <img
              src={image}
              alt="AI生成图片"
              className="w-full rounded-2xl"
            />
          )}

          {!image && !result && !loading && (
            <p className="text-sm text-white/40">
              运行工作流后，这里会显示生成结果。
            </p>
          )}
        </div>
      </div>

      <div className="h-full w-full pl-72 pr-96">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background color="#333" gap={20} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </main>
  );
}
