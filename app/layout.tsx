import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 聚合平台 MVP",
  description: "一个可连接 GPT 的 AI 平台最小版本",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
