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

    console.log("GPT IMAGE 2 RESULT:", JSON.stringify(data, null, 2));

    const status = data?.data?.status || data?.status;

    const outputs =
      data?.data?.outputs ||
      data?.outputs ||
      data?.data?.output ||
      data?.output ||
      [];

    let imageUrl = "";

    if (Array.isArray(outputs) && outputs.length > 0) {
      const first = outputs[0];

      if (typeof first === "string") {
        imageUrl = first;
      } else {
        imageUrl =
          first?.url ||
          first?.image ||
          first?.image_url ||
          first?.file_url ||
          "";
      }
    }

    if (!imageUrl && data?.data?.images?.[0]) {
      imageUrl = data.data.images[0];
    }

    if (!imageUrl && data?.data?.url) {
      imageUrl = data.data.url;
    }

    if (!imageUrl && data?.url) {
      imageUrl = data.url;
    }

    if (imageUrl) {
      return NextResponse.json({
        status: "completed",
        imageUrl,
      });
    }

    if (status === "failed") {
      return NextResponse.json(
        { status: "failed", error: "生成失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: status || "processing",
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      { error: error.message || "查询结果失败" },
      { status: 500 }
    );
  }
}
