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

    const allowedModels = ["gpt-image-1", "gpt-image-1-mini"];
    const allowedSizes = ["1024x1024", "1536x1024", "1024x1536"];
    const allowedQuality = ["low", "medium", "high"];

    const safeModel = allowedModels.includes(model) ? model : "gpt-image-1-mini";
    const safeSize = allowedSizes.includes(size) ? size : "1024x1024";
    const safeQuality = allowedQuality.includes(quality) ? quality : "low";

    const result = await openai.images.generate({
      model: safeModel,
      prompt,
      size: safeSize,
      quality: safeQuality,
    } as any);

    const imageBase64 = result.data?.[0]?.b64_json;

    if (!imageBase64) {
      return NextResponse.json({ error: "生成失败" }, { status: 500 });
    }

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${imageBase64}`,
      used: {
        model: safeModel,
        size: safeSize,
        quality: safeQuality,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "图片生成失败，请检查模型、参数、API余额" },
      { status: 500 }
    );
  }
}
