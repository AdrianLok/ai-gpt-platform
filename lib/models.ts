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
    label: "GPT Image 2 Plus",
    value: "gpt-image-2-plus",
    provider: "OpenAI",
    tag: "主力",
    sub: "主力生图模型",
    qualityLabel: "4K",
  },
  {
    label: "GPT Image 1.5",
    value: "gpt-image-1.5",
    provider: "OpenAI",
    tag: "备用",
    sub: "稳定备用模型",
    qualityLabel: "默认",
  },
];

export const defaultImageModel = imageModels[0];
