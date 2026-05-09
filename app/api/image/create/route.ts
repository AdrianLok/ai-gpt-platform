import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, ratio } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "请输入提示词" }, { status: 400 });
    }

    const apiKey = process.env.WILDCARD_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "缺少 WILDCARD_API_KEY" }, { status: 500 });
    }

    const res = await fetch(
      "https://api.gptsapi.net/api/v3/openai/gpt-image-2-plus/text-to-image",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          aspect_ratio: ratio || "1:1",
          output_format: "png",
        }),
      }
    );

    const data = await res.json();

    const resultUrl = data?.data?.urls?.get || data?.urls?.get;

    if (!resultUrl) {
      return NextResponse.json({ error: "任务创建失败" }, { status: 500 });
    }

    return NextResponse.json({
      resultUrl,
      taskId: data?.data?.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "创建任务失败" }, { status: 500 });
  }
}
