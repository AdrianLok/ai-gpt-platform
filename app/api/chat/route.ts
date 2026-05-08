import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
        { error: "服务器未配置 OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const response = await client.responses.create({
      model: "gpt-5.5",
      input: [
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
      reply: response.output_text,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "AI 调用失败，请检查 API Key 或稍后重试" },
      { status: 500 }
    );
  }
}
