"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0..1
  size: number;
}

interface ParticleBurstProps {
  /** Any value; when changes, replay animation. */
  trigger: unknown;
  /** Center X in pixels, relative to parent. */
  x: number;
  /** Center Y in pixels, relative to parent. */
  y: number;
  /** Particle color. Defaults to brand teal. */
  color?: string;
  /** Number of particles. Default 16. */
  count?: number;
  /** When false, render nothing. Tier B precision games should disable. */
  enabled?: boolean;
}

const CANVAS_SIZE = 240; // px — centered on (x, y), covers burst radius
const DURATION_MS = 500;
const GRAVITY = 0.15; // px/frame^2

export function ParticleBurst({
  trigger,
  x,
  y,
  color = "#00D4AA",
  count = 16,
  enabled = true,
}: ParticleBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTsRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gctx = canvas.getContext("2d");
    if (!gctx) return;

    // Initialize particles
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 2 + Math.random() * 3;
      particles.push({
        x: CANVAS_SIZE / 2,
        y: CANVAS_SIZE / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        size: 2 + Math.random() * 3,
      });
    }
    particlesRef.current = particles;
    startTsRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTsRef.current;
      const progress = Math.min(1, elapsed / DURATION_MS);
      gctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += GRAVITY;
        p.life = 1 - progress;

        if (p.life > 0) {
          gctx.globalAlpha = p.life;
          gctx.fillStyle = color;
          gctx.beginPath();
          gctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          gctx.fill();
        }
      }
      gctx.globalAlpha = 1;

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        gctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      gctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, enabled, count, color]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      aria-hidden="true"
      style={{
        position: "absolute",
        left: x - CANVAS_SIZE / 2,
        top: y - CANVAS_SIZE / 2,
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        pointerEvents: "none",
      }}
    />
  );
}
