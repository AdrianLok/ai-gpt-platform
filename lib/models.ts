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
    value: "gpt-5-mini",
    provider: "OpenAI",
    tag: "低成本",
    sub: "适合测试和快速生成",
    qualityLabel: "1K",
  },

  {
    label: "GPT Image 1.5",
    value: "gpt-image-1.5",
    provider: "OpenAI",
    tag: "主力模型",
    sub: "高质量 AI 出图",
    qualityLabel: "4K",
  },

  {
    label: "GPT Image 2 Plus",
    value: "gpt-image-2-plus",
    provider: "OpenAI",
    tag: "旗舰",
    sub: "更强细节与审美",
    qualityLabel: "4K",
  },
];

export const defaultImageModel = imageModels[1];
