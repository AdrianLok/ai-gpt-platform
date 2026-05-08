"use client";

import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendPrompt() {
    if (!prompt) return;

    setLoading(true);
    setResult("");
    setImage("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      setResult(data.result || data.error);
    } catch (err) {
      setResult("GPT 请求失败");
    }

    setLoading(false);
  }

  async function generateImage() {
    if (!prompt) return;

    setLoading(true);
    setImage("");

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
    } catch (err) {
      setResult("图片生成失败");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0b0b3b] to-[#1a114d] text-white flex flex-col items-center p-10">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-10">
          <div className="inline-block px-4 py-1 rounded-full bg-white/10 mb-4">
            ✨ AI 聚合平台 MVP
          </div>

          <h1 className="text-6xl font-bold mb-4">
            你的第一个 AI 创作平台
          </h1>

          <p className="text-gray-300 text-xl">
            GPT 文案 + GPT AI 出图
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/10 rounded-3xl p-6">
            <h2 className="text-3xl font-bold mb-4">输入需求</h2>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-64 rounded-2xl bg-[#23204d] p-4 outline-none"
              placeholder="例如：生成一个韩系水果IP角色，二头身，可爱插画风格"
            />

            <div className="flex gap-4 mt-4">
              <button
                onClick={sendPrompt}
                className="flex-1 bg-white text-black py-4 rounded-2xl font-bold"
              >
                发送给 GPT
              </button>

              <button
                onClick={generateImage}
                className="flex-1 bg-pink-500 py-4 rounded-2xl font-bold"
              >
                AI 生成图片
              </button>
            </div>
          </div>

          <div className="bg-white/10 rounded-3xl p-6">
            <h2 className="text-3xl font-bold mb-4">AI 返回结果</h2>

            <div className="bg-[#23204d] rounded-2xl p-4 min-h-[400px]">
              {loading && <p>AI 正在生成...</p>}

              {!loading && result && (
                <div className="whitespace-pre-wrap mb-4">
                  {result}
                </div>
              )}

              {!loading && image && (
                <img
                  src={image}
                  alt="AI生成"
                  className="rounded-2xl w-full"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
