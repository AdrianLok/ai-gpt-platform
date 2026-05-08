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
    label: "GPT Image 1.5",
    value: "gpt-image-1.5",
    provider: "OpenAI",
    tag: "可用模型",
    sub: "Wildcard 后台已显示该模型",
    qualityLabel: "默认",
  },
];

export const defaultImageModel = imageModels[0];
