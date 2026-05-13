"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NodePosition } from "../types/node";

export function useCanvasViewport() {
  const [offset, setOffset] = useState<NodePosition>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ pointerX: 0, pointerY: 0, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const beginPan = useCallback(
    (clientX: number, clientY: number) => {
      if (!isSpacePressed) return false;

      panStartRef.current = {
        pointerX: clientX,
        pointerY: clientY,
        offsetX: offset.x,
        offsetY: offset.y,
      };
      setIsPanning(true);
      return true;
    },
    [isSpacePressed, offset.x, offset.y]
  );

  useEffect(() => {
    if (!isPanning) return;

    const handleMove = (event: PointerEvent) => {
      const start = panStartRef.current;
      setOffset({
        x: start.offsetX + event.clientX - start.pointerX,
        y: start.offsetY + event.clientY - start.pointerY,
      });
    };
    const stop = () => setIsPanning(false);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, [isPanning]);

  function resetViewport() {
    setOffset({ x: 0, y: 0 });
  }

  return {
    offset,
    setOffset,
    isSpacePressed,
    isPanning,
    beginPan,
    resetViewport,
  };
}
