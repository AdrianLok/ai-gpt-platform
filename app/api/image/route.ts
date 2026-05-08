import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, model, size, quality } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "请输入提示词" }, { status: 400 });
    }

    const apiKey = process.env.WILDCARD_API_KEY;
    const baseUrl = process.env.WILDCARD_BASE_URL;

    if (!apiKey || !baseUrl) {
      return NextResponse.json(
        { error: "未配置 WILDCARD_API_KEY 或 WILDCARD_BASE_URL" },
        { status: 500 }
      );
    }

    const safeModel = model || "openai/gpt-image-1-mini";
    const safeSize = size || "1024x1024";
    const safeQuality = quality || "low";

    const response = await fetch(`${baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: safeModel,
        prompt,
        n: 1,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Wildcard error:", data);
      return NextResponse.json(
        { error: data.error?.message || data.message || "图片生成失败" },
        { status: 500 }
      );
    }

    const item = data.data?.[0];

    const imageUrl =
      item?.b64_json
        ? `data:image/png;base64,${item.b64_json}`
        : item?.url || item?.image_url || item?.image;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "没有拿到图片结果，请检查 Wildcard 返回格式" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imageUrl,
      used: {
        model: safeModel,
        size: safeSize,
        quality: safeQuality,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "图片生成失败，请检查 Wildcard API、模型名称或余额" },
      { status: 500 }
    );
  }
}
