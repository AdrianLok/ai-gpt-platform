"use client";

import { useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";

export default function HomePage() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!message.trim()) return;

    setLoading(true);
    setReply("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setReply(data.error || "请求失败");
      } else {
        setReply(data.reply);
      }
    } catch {
      setReply("网络错误，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-black px-6 py-10">
      <section className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur">
            <Sparkles size={16} />
            AI 聚合平台 MVP
          </div>

          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            你的第一个 AI 创作平台
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base text-white/60 md:text-lg">
            先连接 GPT，实现提示词优化、文案生成、创意策划。后面可以继续扩展 AI 出图、会员积分、支付系统。
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <h2 className="mb-4 text-xl font-semibold">输入你的需求</h2>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="例如：帮我生成一个适合小红书封面的 AI 出图提示词，主题是水果 IP 角色..."
              className="min-h-[260px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-white/35 focus:border-indigo-400"
            />

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              {loading ? "生成中..." : "发送给 GPT"}
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <h2 className="mb-4 text-xl font-semibold">AI 返回结果</h2>

            <div className="min-h-[330px] whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-white/85">
              {reply || "这里会显示 GPT 的回复结果。"}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            "提示词优化",
            "AI 文案生成",
            "后续扩展出图模型",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center text-white/80"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
