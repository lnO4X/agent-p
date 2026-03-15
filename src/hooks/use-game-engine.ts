"use client";

import { useRef, useEffect, useCallback, useState } from "react";

interface GameEngineOptions {
  width?: number;
  height?: number;
  onUpdate?: (ctx: CanvasRenderingContext2D, dt: number) => void;
  onRender?: (ctx: CanvasRenderingContext2D) => void;
}

export function useGameEngine(options: GameEngineOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const runningRef = useRef(false);
  const [dimensions, setDimensions] = useState({
    width: options.width || 800,
    height: options.height || 600,
  });

  const start = useCallback(() => {
    runningRef.current = true;
    lastTimeRef.current = performance.now();

    const loop = (time: number) => {
      if (!runningRef.current) return;
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        options.onUpdate?.(ctx, dt);
        options.onRender?.(ctx);
      }

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
  }, [options]);

  const stop = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(frameRef.current);
  }, []);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  // Responsive sizing
  useEffect(() => {
    function handleResize() {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const w = Math.min(rect.width, options.width || 800);
        const h = Math.min(rect.height, options.height || 600);
        setDimensions({ width: w, height: h });
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [options.width, options.height]);

  return { canvasRef, start, stop, dimensions };
}
