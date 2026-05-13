"use client";

type CanvasGridProps = {
  offset: { x: number; y: number };
  zoom: number;
};

export function CanvasGrid({ offset, zoom }: CanvasGridProps) {
  const gridSize = Math.max(18, 32 * zoom);

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.075) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.075) 1px, transparent 1px)",
          backgroundPosition: `${offset.x}px ${offset.y}px`,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 50% 38%, rgba(255,255,255,0.055), transparent 36%), linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.42))",
        }}
      />
    </>
  );
}
