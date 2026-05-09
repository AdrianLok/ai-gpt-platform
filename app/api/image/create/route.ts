import { NextResponse } from "next/server";
import { defaultImageModel, getImageModel } from "../../../../lib/models";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function readJson(res: Response) {
  const text = await res.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function toMessage(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(toMessage).filter(Boolean).join(" ");
  }

  if (isRecord(value)) {
    return (
      toMessage(value.message) ||
      toMessage(value.error) ||
      toMessage(value.detail) ||
      toMessage(value.reason) ||
      JSON.stringify(value)
    );
  }

  return "";
}

function extractError(data: unknown) {
  if (!isRecord(data)) return "";

  return (
    toMessage(data.error) ||
    toMessage(data.message) ||
    toMessage(data.detail) ||
    (isRecord(data.data)
      ? toMessage(data.data.error) ||
        toMessage(data.data.message) ||
        toMessage(data.data.detail)
      : "") ||
    (isRecord(data.prediction)
      ? toMessage(data.prediction.error) || toMessage(data.prediction.message)
      : "")
  );
}

function isOverloaded(message: string, status?: number) {
  const text = message.toLowerCase();

  return (
    status === 429 ||
    status === 503 ||
    text.includes("overload") ||
    text.includes("over capacity") ||
    text.includes("capacity") ||
    text.includes("busy") ||
    text.includes("too many requests") ||
    text.includes("rate limit") ||
    text.includes("temporarily unavailable")
  );
}

function getByPath(data: unknown, path: string[]) {
  let current = data;

  for (const key of path) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }

  return typeof current === "string" && current.trim()
    ? current.trim()
    : undefined;
}

function isImageUrl(value: string) {
  return value.startsWith("data:image/") || /^https?:\/\//i.test(value);
}

function extractImageUrl(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") {
    return isImageUrl(value) ? value : "";
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const imageUrl = extractImageUrl(item);
      if (imageUrl) return imageUrl;
    }

    return "";
  }

  if (!isRecord(value)) return "";

  const directFields = [
    "imageUrl",
    "image_url",
    "url",
    "file_url",
    "download_url",
    "src",
    "image",
  ];

  for (const field of directFields) {
    const imageUrl = extractImageUrl(value[field]);
    if (imageUrl) return imageUrl;
  }

  const nestedFields = ["data", "output", "outputs", "images", "result", "results"];

  for (const field of nestedFields) {
    const imageUrl = extractImageUrl(value[field]);
    if (imageUrl) return imageUrl;
  }

  return "";
}

function extractResultUrl(data: unknown) {
  const paths = [
    ["data", "urls", "get"],
    ["urls", "get"],
    ["data", "prediction", "urls", "get"],
    ["prediction", "urls", "get"],
    ["data", "links", "self"],
    ["links", "self"],
    ["data", "resultUrl"],
    ["resultUrl"],
  ];

  for (const path of paths) {
    const resultUrl = getByPath(data, path);
    if (resultUrl) return resultUrl;
  }

  return "";
}

function extractTaskId(data: unknown) {
  if (!isRecord(data)) return undefined;

  if (typeof data.id === "string") return data.id;
  if (isRecord(data.data) && typeof data.data.id === "string") return data.data.id;
  if (isRecord(data.prediction) && typeof data.prediction.id === "string") {
    return data.prediction.id;
  }

  return undefined;
}

export async function POST(req: Request) {
  try {
    const { prompt, ratio, model } = await req.json();

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "请输入提示词" }, { status: 400 });
    }

    const apiKey = process.env.WILDCARD_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "缺少 WILDCARD_API_KEY" }, { status: 500 });
    }

    const selectedModel = getImageModel(model) || defaultImageModel;

    if (model && !getImageModel(model)) {
      return NextResponse.json(
        { error: `暂不支持该模型：${model}` },
        { status: 400 }
      );
    }

    const res = await fetch(selectedModel.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        aspect_ratio: ratio || "1:1",
        output_format: "png",
      }),
    });

    const data = await readJson(res);
    const errorMessage = extractError(data);
    const overloaded = isOverloaded(errorMessage, res.status);

    if (!res.ok) {
      return NextResponse.json(
        {
          status: overloaded ? "overloaded" : "failed",
          error: overloaded
            ? "模型繁忙，请稍后重试"
            : errorMessage || "任务创建失败",
        },
        { status: res.status }
      );
    }

    const resultUrl = extractResultUrl(data);
    const imageUrl = extractImageUrl(data);

    if (!resultUrl && !imageUrl) {
      return NextResponse.json(
        {
          status: overloaded ? "overloaded" : "failed",
          error: overloaded
            ? "模型繁忙，请稍后重试"
            : errorMessage || "任务创建失败",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: imageUrl ? "completed" : "processing",
      resultUrl,
      imageUrl,
      taskId: extractTaskId(data),
      model: selectedModel.value,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "failed", error: error.message || "创建任务失败" },
      { status: 500 }
    );
  }
}
