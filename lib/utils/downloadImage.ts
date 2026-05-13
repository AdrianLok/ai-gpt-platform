export async function downloadImageFile(imageUrl: string) {
  if (!imageUrl) return;

  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "ai-canvas-image.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch {
    window.open(imageUrl, "_blank", "noopener,noreferrer");
  }
}
