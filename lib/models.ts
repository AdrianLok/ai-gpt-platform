export type ImageModel = {
  label: string;
  value: string;
  provider: string;
  tag: string;
  sub: string;
  qualityLabel: string;
};

export const imageModels: ImageModel[] = [
  {
    label: "GPT Image Mini",
    value: "openai/gpt-image-1-mini",
    provider: "OpenAI",
    tag: "低成本",
    sub: "适合测试和日常出图",
    qualityLabel: "1K",
  },
  {
    label: "GPT Image 1",
    value: "openai/gpt-image-1",
    provider: "OpenAI",
    tag: "稳定",
    sub: "质量更好，成本更高",
    qualityLabel: "4K",
  },
  {
    label: "即梦 Lite",
    value: "jimeng/jimeng-lite",
    provider: "即梦",
    tag: "中文审美",
    sub: "适合电商、海报、中文风格图",
    qualityLabel: "2K",
  },
];

export const defaultImageModel = imageModels[0];
