import { useRef, useState } from "react";
import {
  loadingMessage,
  requestGeneratedImage,
} from "../lib/api/generateImage";
import type { ImageRatio } from "../types/image";
import type { ImageModel } from "../types/model";

export function useImageGeneration() {
  const pollingActiveRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  async function generateWithApi(prompt: string, model: ImageModel, ratio: ImageRatio) {
    pollingActiveRef.current = true;
    setLoading(true);
    setError("");
    setStatusMessage("正在提交任务...");

    try {
      const imageUrl = await requestGeneratedImage({
        prompt,
        model,
        ratio,
        onStatus: setStatusMessage,
        isActive: () => pollingActiveRef.current,
      });

      setStatusMessage("");
      return imageUrl;
    } finally {
      pollingActiveRef.current = false;
      setLoading(false);
    }
  }

  function cancelGeneration() {
    pollingActiveRef.current = false;
  }

  return {
    loading,
    setLoading,
    error,
    setError,
    statusMessage,
    setStatusMessage,
    loadingMessage,
    pollingActiveRef,
    generateWithApi,
    cancelGeneration,
  };
}
