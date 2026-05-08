import { NextResponse } from "next/server";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  try {
    const { prompt, model, ratio } = await req.json();

    const apiKey = process.env.WILDCARD_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "缺少 WILDCARD_API_KEY" },
        { status: 500 }
      );
    }

    // GPT Image 2 Plus
    if (model === "gpt-image-2-plus") {
      const createRes = await fetch(
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

      const createData = await createRes.json();

      const resultUrl = createData?.data?.urls?.get;

      if (!resultUrl) {
        return NextResponse.json(
          { error: "任务创建失败" },
          { status: 500 }
        );
      }

      // 轮询结果
      for (let i = 0; i < 90; i++) {
        await sleep(2000);

        const resultRes = await fetch(resultUrl, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        const resultData = await resultRes.json();

        const output =
          resultData?.data?.outputs?.[0] ||
          resultData?.outputs?.[0];

        if (output?.url) {
          return NextResponse.json({
            imageUrl: output.url,
          });
        }

        if (
          resultData?.data?.status === "failed" ||
          resultData?.status === "failed"
        ) {
          return NextResponse.json(
            { error: "生成失败" },
            { status: 500 }
          );
        }
      }

      return NextResponse.json(
        { error: "生成超时" },
        { status: 500 }
      );
    }

    // GPT Image 1.5 兼容
    const response = await fetch(
      "https://api.gptsapi.net/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-image-1.5",
          prompt,
          size: "1024x1024",
          quality: "low",
        }),
      }
    );

    const data = await response.json();

    const imageBase64 = data?.data?.[0]?.b64_json;

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${imageBase64}`,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      { error: error.message || "生成失败" },
      { status: 500 }
    );
  }
}
