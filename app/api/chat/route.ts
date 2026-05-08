import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "请输入有效内容" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "服务器未配置 OPENAI_API_KEY，你现在可以先看界面，后面添加 API Key 后即可使用 GPT 功能。" },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "你是一个中文 AI 创作助手，擅长帮助用户写提示词、做内容策划、生成商业创意。",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    return NextResponse.json({
      reply: response.choices[0]?.message?.content || "没有返回内容",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "AI 调用失败，请检查 API Key 或稍后重试" },
      { status: 500 }
    );
  }
}
