import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      prompt,
      model,
    } = body;

    if (!prompt) {
      return NextResponse.json(
        {
          error: "请输入提示词",
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${process.env.WILDCARD_BASE_URL}/images/generations`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WILDCARD_API_KEY}`,
        },

        body: JSON.stringify({
          model: model || "gpt-image-1.5",
          prompt,
          n: 1,
        }),
      }
    );

    const data = await response.json();

    console.log(data);

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            data?.message ||
            "图片生成失败",
        },
        {
          status: 500,
        }
      );
    }

    let imageUrl = "";

    // OpenAI 格式
    if (data?.data?.[0]?.url) {
      imageUrl = data.data[0].url;
    }

    // base64 格式
    if (data?.data?.[0]?.b64_json) {
      imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
    }

    if (!imageUrl) {
      return NextResponse.json(
        {
          error: "未获取到图片",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      imageUrl,
    });

  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error: error.message || "生成失败",
      },
      {
        status: 500,
      }
    );
  }
}
