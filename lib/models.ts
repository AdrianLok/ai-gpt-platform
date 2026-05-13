export type ImageModel = {
  label: string;
  value: string;
  apiUrl: string;
};

export const imageModels: ImageModel[] = [
  {
    label: "Gemini 3 Pro",
    value: "gemini-3-pro-image-preview",
    apiUrl:
      "https://api.gptsapi.net/api/v3/google/gemini-3-pro-image-preview/text-to-image",
  },
  {
    label: "GPT Image 2 Plus（实验 / 可能较慢）",
    value: "gpt-image-2-plus",
    apiUrl:
      "https://api.gptsapi.net/api/v3/openai/gpt-image-2-plus/text-to-image",
  },
];

export const defaultImageModel = imageModels[0];

export function getImageModel(value?: string) {
  if (!value) return defaultImageModel;

  return imageModels.find((model) => model.value === value);
}

export function isGptModel(modelValue: string) {
  return modelValue === "gpt-image-2-plus";
}
