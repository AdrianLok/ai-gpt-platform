import type { ImageRatio } from "../../types/image";
import type { ImageModel } from "../../types/model";
import { getRequestRatio } from "../image-options";

const requestTimeoutMs = 45000;

type GenerateImageRequest = {
  prompt: string;
  model: ImageModel;
  ratio: ImageRatio;
  onStatus?: (message: string) => void;
  isActive?: () => boolean;
};

export const loadingMessage = "正在生成中，通常需要 20-60 秒";

async function fetchJsonWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    const data = await response.json();

    return { response, data };
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function requestGeneratedImage({
  prompt,
  model,
  ratio,
  onStatus,
  isActive = () => true,
}: GenerateImageRequest) {
  onStatus?.("正在提交任务...");

  const { response: createRes, data: createData } = await fetchJsonWithTimeout(
    "/api/image/create",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        ratio: getRequestRatio(ratio),
        model: model.value,
      }),
    }
  );

  if (!createRes.ok || createData.status === "failed" || createData.status === "overloaded") {
    throw Object.assign(new Error(createData.error || "任务创建失败"), {
      status: createData.status,
    });
  }

  if (createData.imageUrl) {
    return createData.imageUrl as string;
  }

  if (!createData.resultUrl) {
    throw new Error(createData.error || "任务创建失败");
  }

  onStatus?.(loadingMessage);

  for (let i = 0; i < 80; i++) {
    if (!isActive()) return "";

    await new Promise((resolve) => setTimeout(resolve, 3000));
    if (!isActive()) return "";

    const { response: resultRes, data: resultData } = await fetchJsonWithTimeout(
      "/api/image/result",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resultUrl: createData.resultUrl,
        }),
      }
    );

    if (!resultRes.ok || resultData.status === "failed" || resultData.status === "overloaded") {
      throw Object.assign(new Error(resultData.error || "生成失败"), {
        status: resultData.status,
      });
    }

    if (resultData.status === "completed" && resultData.imageUrl) {
      return resultData.imageUrl as string;
    }
  }

  throw new Error("生成超时，请稍后重试");
}
