import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, model, size, quality } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "请输入提示词" }, { status: 400 });
    }

    const baseUrl = process.env.WILDCARD_BASE_URL;
    const apiKey = process.env.WILDCARD_API_KEY;

    if (!baseUrl || !apiKey) {
      return NextResponse.json(
        { error: "未配置 WILDCARD_BASE_URL 或 WILDCARD_API_KEY" },
        { status: 500 }
      );
    }

    const response = await fetch(`${baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "gpt-image-1.5",
        prompt,
        n: 1,
        size: size || "1024x1024",
        quality: quality || "low",
      }),
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("非 JSON 返回:", text);
      return NextResponse.json(
        { error: "接口返回非JSON，请检查 WILDCARD_BASE_URL 是否正确" },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || data?.message || "图片生成失败" },
        { status: 500 }
      );
    }

    const imageBase64 = data?.data?.[0]?.b64_json;

    if (!imageBase64) {
      return NextResponse.json({ error: "未获取到图片" }, { status: 500 });
    }

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${imageBase64}`,
      used: {
        model: data.model || model || "gpt-image-1.5",
        size: data.size || size || "1024x1024",
        quality: data.quality || quality || "low",
      },
      usage: data.usage || null,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "生成失败" },
      { status: 500 }
    );
  }
}
