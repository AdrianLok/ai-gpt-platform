"use client";

import { useState } from "react";

const ratios = [
  { label: "1:1", value: "1:1" },
  { label: "4:3", value: "4:3" },
  { label: "3:4", value: "3:4" },
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
];

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);

  const [ratio, setRatio] = useState(ratios[0]);

  async function generateImage() {
    if (!prompt.trim()) return;

    setLoading(true);
    setImage("");

    try {
      // 创建任务
      const createRes = await fetch("/api/image/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          ratio: ratio.value,
        }),
      });

      const createData = await createRes.json();

      console.log("createData:", createData);

      if (!createData.resultUrl) {
        alert(createData.error || "任务创建失败");
        setLoading(false);
        return;
      }

      let completed = false;

      // 轮询结果
      for (let i = 0; i < 80; i++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const resultRes = await fetch("/api/image/result", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resultUrl: createData.resultUrl,
          }),
        });

        const resultData = await resultRes.json();

        console.log("resultData:", resultData);

        // 成功
        if (resultData.imageUrl) {
          setImage(resultData.imageUrl);
          completed = true;
          break;
        }

        // 失败
        if (resultData.status === "failed") {
          alert(resultData.error || "生成失败");
          setLoading(false);
          return;
        }
      }

      if (!completed) {
        alert("生成超时，请稍后重试");
      }
    } catch (error) {
      console.error(error);
      alert("图片生成失败");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-10">
      {/* 图片区域 */}
      <div className="w-full max-w-4xl aspect-square bg-[#151515] rounded-[36px] flex items-center justify-center overflow-hidden border border-white/10">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
            <p className="text-white/60 text-lg">
              AI 正在生成图片...
            </p>
          </div>
        ) : image ? (
          <img
            src={image}
            alt="AI Image"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-white/30 text-lg">
            生成的图片将在这里显示
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="w-full max-w-4xl mt-8 bg-[#151515] rounded-[36px] border border-white/10 p-6">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="帮我生成一张电商海报"
          className="w-full bg-transparent resize-none outline-none text-white text-xl placeholder:text-white/30 min-h-[120px]"
        />

        <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
          {/* 左边 */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* 模型 */}
            <div className="px-4 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center text-white">
              GPT Image 2 Plus
            </div>

            {/* 比例 */}
            <select
              value={ratio.value}
              onChange={(e) => {
                const found = ratios.find(
                  (r) => r.value === e.target.value
                );
                if (found) setRatio(found);
              }}
              className="px-4 h-12 rounded-2xl bg-white/10 border border-white/10 text-white outline-none"
            >
              {ratios.map((r) => (
                <option
                  key={r.value}
                  value={r.value}
                  className="bg-black"
                >
                  {r.label}
                </option>
              ))}
            </select>

            {/* 精细度 */}
            <div className="px-4 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center text-white/60">
              精细度 · 自动
            </div>
          </div>

          {/* 按钮 */}
          <button
            onClick={generateImage}
            disabled={loading}
            className="h-14 px-8 rounded-full bg-white text-black font-semibold text-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "生成中" : "生成"}
          </button>
        </div>
      </div>
    </main>
  );
}
