import { NextResponse } from "next/server";

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
        toMessage(data.data.detail) ||
        toMessage(data.data.logs)
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

function normalizeStatus(value: unknown) {
  const status = typeof value === "string" ? value.toLowerCase() : "";

  if (["succeeded", "success", "completed", "complete", "done"].includes(status)) {
    return "completed";
  }

  if (["failed", "failure", "error", "canceled", "cancelled"].includes(status)) {
    return "failed";
  }

  if (["starting", "processing", "pending", "queued", "running"].includes(status)) {
    return "processing";
  }

  return status || "processing";
}

function readStatus(data: unknown) {
  if (!isRecord(data)) return "processing";

  const candidates = [
    data.status,
    isRecord(data.data) ? data.data.status : undefined,
    isRecord(data.prediction) ? data.prediction.status : undefined,
  ];

  for (const candidate of candidates) {
    const status = normalizeStatus(candidate);
    if (status) return status;
  }

  return "processing";
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

  const nestedFields = [
    "outputs",
    "output",
    "images",
    "imageUrls",
    "result",
    "results",
    "data",
  ];

  for (const field of nestedFields) {
    const imageUrl = extractImageUrl(value[field]);
    if (imageUrl) return imageUrl;
  }

  return "";
}

export async function POST(req: Request) {
  try {
    const { resultUrl } = await req.json();

    if (!resultUrl || typeof resultUrl !== "string") {
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

    const data = await readJson(res);
    const errorMsg = extractError(data);
    const overloaded = isOverloaded(errorMsg, res.status);

    if (!res.ok) {
      return NextResponse.json(
        {
          status: overloaded ? "overloaded" : "failed",
          error: overloaded ? "模型繁忙，请稍后重试" : errorMsg || "查询结果失败",
        },
        { status: res.status }
      );
    }

    if (overloaded) {
      return NextResponse.json({
        status: "overloaded",
        error: "模型繁忙，请稍后重试",
      });
    }

    const status = readStatus(data);
    const imageUrl = extractImageUrl(data);

    if (status === "completed" || imageUrl) {
      return NextResponse.json({
        status: "completed",
        imageUrl,
      });
    }

    if (status === "failed") {
      return NextResponse.json({
        status: "failed",
        error: errorMsg || "生成失败",
      });
    }

    return NextResponse.json({
      status: "processing",
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      { status: "failed", error: error.message || "查询结果失败" },
      { status: 500 }
    );
  }
}
