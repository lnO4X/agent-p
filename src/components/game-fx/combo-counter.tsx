"use client";

import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";

interface ComboCounterProps {
  /** When > 1, render "xN"; when <= 1, render nothing. */
  combo: number;
  /** Anchor X in pixels, relative to parent. */
  x: number;
  /** Anchor Y in pixels, relative to parent. */
  y: number;
  /** When false, render nothing. */
  enabled?: boolean;
}

export function ComboCounter({ combo, x, y, enabled = true }: ComboCounterProps) {
  const visible = enabled && combo > 1;

  return (
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence>
        {visible && (
          <m.div
            key={combo}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -40 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              fontWeight: 800,
              fontSize: "2rem",
              lineHeight: 1,
              color: "#FFB800",
              textShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
              whiteSpace: "nowrap",
              userSelect: "none",
            }}
          >
            {`x${combo}`}
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
