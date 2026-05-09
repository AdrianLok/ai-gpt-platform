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
];

export const defaultImageModel = imageModels[0];
