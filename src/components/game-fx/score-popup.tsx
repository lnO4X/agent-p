"use client";

import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { useEffect, useState } from "react";

interface ScorePopupProps {
  /** Score delta. Positive renders green "+N", negative renders red "-N". */
  value: number;
  /** Anchor X in pixels, relative to parent. */
  x: number;
  /** Anchor Y in pixels, relative to parent. */
  y: number;
  /** Any value; when changes, replay animation. */
  trigger: unknown;
  /** When false, render nothing. */
  enabled?: boolean;
}

export function ScorePopup({
  value,
  x,
  y,
  trigger,
  enabled = true,
}: ScorePopupProps) {
  // We key the motion element on `trigger` so re-firing replays the animation.
  // A render-gate flag ensures nothing shows until `trigger` has changed at
  // least once (avoids initial flash on mount).
  const [fired, setFired] = useState<boolean>(false);

  useEffect(() => {
    setFired(true);
    // Auto-clear after animation completes so AnimatePresence exits cleanly.
    const t = setTimeout(() => setFired(false), 1000);
    return () => clearTimeout(t);
  }, [trigger]);

  if (!enabled) return null;

  const label =
    value >= 0 ? `+${Math.round(value)}` : `${Math.round(value)}`;
  const color = value >= 0 ? "#00D4AA" : "#F43F5E";

  return (
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence>
        {fired && (
          <m.div
            key={String(trigger)}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -30 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 1, ease: "easeOut" }}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              fontWeight: 700,
              fontSize: "1.5rem",
              lineHeight: 1,
              color,
              textShadow: "0 2px 6px rgba(0, 0, 0, 0.35)",
              whiteSpace: "nowrap",
              userSelect: "none",
            }}
          >
            {label}
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
