import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, model, size, quality } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "请输入提示词" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "未配置 OPENAI_API_KEY" }, { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const result = await openai.images.generate({
      model: model || "gpt-image-1",
      prompt,
      size: size || "1024x1024",
      quality: quality || "medium",
    } as any);

    const imageBase64 = result.data?.[0]?.b64_json;

    if (!imageBase64) {
      return NextResponse.json({ error: "生成失败" }, { status: 500 });
    }

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${imageBase64}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "图片生成失败，请检查模型/参数/API余额" }, { status: 500 });
  }
}
