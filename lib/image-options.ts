export const imageRatios = [
  { label: "1:1", value: "1:1" },
  { label: "4:3", value: "4:3" },
  { label: "3:4", value: "3:4" },
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
];

export const imageDetails = [
  { label: "低", value: "low" },
  { label: "中", value: "medium" },
  { label: "高", value: "high" },
];

export type ImageRatio = {
  label: string;
  value: string;
  requestValue: string;
};

export const ratios: ImageRatio[] = [
  { label: "自适应", value: "auto", requestValue: "1:1" },
  { label: "1:1", value: "1:1", requestValue: "1:1" },
  { label: "9:16", value: "9:16", requestValue: "9:16" },
  { label: "16:9", value: "16:9", requestValue: "16:9" },
  { label: "3:4", value: "3:4", requestValue: "3:4" },
  { label: "4:3", value: "4:3", requestValue: "4:3" },
  { label: "3:2", value: "3:2", requestValue: "3:2" },
  { label: "2:3", value: "2:3", requestValue: "2:3" },
  { label: "5:4", value: "5:4", requestValue: "5:4" },
  { label: "4:5", value: "4:5", requestValue: "4:5" },
  { label: "21:9", value: "21:9", requestValue: "21:9" },
];

export const aspectRatioMap: Record<string, string> = {
  auto: "1 / 1",
  "1:1": "1 / 1",
  "9:16": "9 / 16",
  "16:9": "16 / 9",
  "3:4": "3 / 4",
  "4:3": "4 / 3",
  "3:2": "3 / 2",
  "2:3": "2 / 3",
  "5:4": "5 / 4",
  "4:5": "4 / 5",
  "21:9": "21 / 9",
};

export const qualityOptions = ["1K", "2K", "4K"];
export const defaultRatio = ratios.find((item) => item.value === "4:3") || ratios[0];
export const defaultCanvasZoom = 1;
export const defaultZoomIndex = 2;
export const canvasZoomSizeMultiplier = 0.75;
export const zoomLevels = [0.5, 0.75, defaultCanvasZoom, 1.25, 1.5];

export function getRequestRatio(ratio: ImageRatio) {
  return ratio.requestValue;
}
