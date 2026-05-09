import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { resultUrl } = await req.json();

    if (!resultUrl) {
      return NextResponse.json({ error: "缺少 resultUrl" }, { status: 400 });
    }

    const apiKey = process.env.WILDCARD_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "缺少 WILDCARD_API_KEY" }, { status: 500 });
    }

    const res = await fetch(resultUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const data = await res.json();

    const status = data?.data?.status || data?.status;

    const output =
      data?.data?.outputs?.[0] ||
      data?.outputs?.[0];

    const imageUrl =
      typeof output === "string"
        ? output
        : output?.url || output?.image || output?.image_url;

    if (imageUrl) {
      return NextResponse.json({
        status: "completed",
        imageUrl,
      });
    }

    if (status === "failed") {
      return NextResponse.json({ status: "failed", error: "生成失败" }, { status: 500 });
    }

    return NextResponse.json({
      status: status || "processing",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "查询结果失败" }, { status: 500 });
  }
}
