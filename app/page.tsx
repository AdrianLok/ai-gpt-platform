"use client";

import { useState } from "react";
import {
  ArrowUp,
  ChevronDown,
  Download,
  ImageIcon,
  Loader2,
  Maximize2,
  Sparkles,
  X,
} from "lucide-react";

import { imageModels } from "@/lib/models";
import {
  imageDetails,
  imageRatios,
} from "@/lib/image-options";

export default function Home() {
  const [prompt, setPrompt] = useState("");

  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);

  const [modelOpen, setModelOpen] = useState(false);
  const [ratioOpen, setRatioOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const [model, setModel] = useState(
    imageModels[0]
  );

  const [ratio, setRatio] = useState(
    imageRatios[0]
  );

  const [detail, setDetail] = useState(
    imageDetails[0]
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

        body: JSON.stringify({
          prompt,
          model: model.value,
          size: ratio.value,
          quality: detail.value,
        }),
      });

      const data = await res.json();

      if (data.imageUrl) {
        setImage(data.imageUrl);
      } else {
        alert(data.error || "生成失败");
      }
    } catch (error) {
      console.error(error);
      alert("图片生成失败");
    }

    setLoading(false);
  }

  return (
    <main className="relative h-screen overflow-hidden bg-black text-white">
      {/* 顶部 */}
      <div className="absolute left-6 top-6 z-50 flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-400 via-purple-400 to-pink-400" />

        <div>
          <p className="text-sm text-white/40">
            AI Canvas
          </p>

          <h1 className="font-semibold">
            Wildcard AI Platform
          </h1>
        </div>
      </div>

      {/* 左侧工具栏 */}
      <div className="absolute left-6 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
        <button className="rounded-2xl bg-white p-3 text-black">
          <ImageIcon size={20} />
        </button>

        <button className="rounded-2xl p-3 text-white/60 hover:bg-white/10">
          <Sparkles size={20} />
        </button>
      </div>

      {/* 中间画布 */}
      <div className="flex h-full items-center justify-center">
        <div className="relative flex h-[520px] w-[760px] items-center justify-center overflow-hidden rounded-[32px] border border-white/10 bg-[#1a1a1a] shadow-2xl">
          {loading ? (
            <div className="flex flex-col items-center gap-4 text-white/50">
              <Loader2
                size={52}
                className="animate-spin"
              />

              <p>AI 正在生成图片...</p>
            </div>
          ) : image ? (
            <>
              <img
                src={image}
                alt="AI Image"
                className="h-full w-full object-contain"
              />

              <div className="absolute right-4 top-4 flex gap-2">
                <button
                  onClick={() =>
                    setPreviewOpen(true)
                  }
                  className="rounded-full bg-black/70 p-3 hover:bg-black"
                >
                  <Maximize2 size={18} />
                </button>

                <a
                  href={image}
                  download="ai-image.png"
                  className="rounded-full bg-black/70 p-3 hover:bg-black"
                >
                  <Download size={18} />
                </a>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 text-white/20">
              <ImageIcon size={72} />

              <p>开始你的第一张 AI 图片</p>
            </div>
          )}
        </div>
      </div>

      {/* 底部输入框 */}
      <div className="absolute bottom-8 left-1/2 z-50 w-[860px] -translate-x-1/2 rounded-[32px] border border-white/10 bg-[#202020]/95 p-5 shadow-2xl backdrop-blur-xl">
        {/* 输入 */}
        <textarea
          value={prompt}
          onChange={(e) =>
            setPrompt(e.target.value)
          }
          placeholder="描述你想生成的内容..."
          className="h-28 w-full resize-none bg-transparent text-base outline-none placeholder:text-white/30"
        />

        {/* 参数栏 */}
        <div className="relative mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
          {/* 模型 */}
          <div className="relative">
            <button
              onClick={() => {
                setModelOpen(!modelOpen);

                setRatioOpen(false);
                setDetailOpen(false);
              }}
              className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
            >
              {model.label}

              <ChevronDown size={14} />
            </button>

            {modelOpen && (
              <div className="absolute bottom-14 left-0 w-80 rounded-3xl border border-white/10 bg-[#2b2b2b] p-3 shadow-2xl">
                {imageModels.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      setModel(item);

                      setModelOpen(false);
                    }}
                    className="mb-2 flex w-full flex-col rounded-2xl px-4 py-3 text-left hover:bg-white/10"
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        {item.label}
                      </span>

                      <span className="rounded-full bg-cyan-300 px-2 py-0.5 text-xs text-black">
                        {item.tag}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-white/40">
                      {item.sub}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 比例 */}
          <div className="relative">
            <button
              onClick={() => {
                setRatioOpen(!ratioOpen);

                setModelOpen(false);
                setDetailOpen(false);
              }}
              className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
            >
              {ratio.label}

              <ChevronDown size={14} />
            </button>

            {ratioOpen && (
              <div className="absolute bottom-14 left-0 w-72 rounded-3xl border border-white/10 bg-[#2b2b2b] p-4 shadow-2xl">
                <div className="grid grid-cols-3 gap-3">
                  {imageRatios.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => {
                        setRatio(item);

                        setRatioOpen(false);
                      }}
                      className={`rounded-2xl px-4 py-3 text-sm ${
                        ratio.value === item.value
                          ? "bg-white/20"
                          : "bg-white/5 text-white/50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 精细度 */}
          <div className="relative">
            <button
              onClick={() => {
                setDetailOpen(!detailOpen);

                setRatioOpen(false);
                setModelOpen(false);
              }}
              className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
            >
              精细度 · {detail.label}

              <ChevronDown size={14} />
            </button>

            {detailOpen && (
              <div className="absolute bottom-14 left-0 w-60 rounded-3xl border border-white/10 bg-[#2b2b2b] p-4 shadow-2xl">
                <div className="grid grid-cols-3 gap-3">
                  {imageDetails.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => {
                        setDetail(item);

                        setDetailOpen(false);
                      }}
                      className={`rounded-2xl px-4 py-3 text-sm ${
                        detail.value === item.value
                          ? "bg-white/20"
                          : "bg-white/5 text-white/50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 生成按钮 */}
          <button
            onClick={generateImage}
            disabled={loading}
            className="ml-auto flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-black disabled:opacity-50"
          >
            {loading ? "生成中" : "生成"}

            <ArrowUp size={18} />
          </button>
        </div>
      </div>

      {/* 图片预览 */}
      {previewOpen && image && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-10">
          <button
            onClick={() =>
              setPreviewOpen(false)
            }
            className="absolute right-8 top-8 rounded-full bg-white/10 p-3 hover:bg-white/20"
          >
            <X size={24} />
          </button>

          <img
            src={image}
            alt="Preview"
            className="max-h-full max-w-full rounded-3xl object-contain"
          />

          <a
            href={image}
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
