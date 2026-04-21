"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

interface UseScreenShakeReturn {
  trigger: () => void;
  style: CSSProperties;
}

// Three iterations of +/- 4px over 300ms (~100ms each). Step index 0..6 (idle).
const STEPS: ReadonlyArray<number> = [4, -4, 4, -4, 4, -4, 0];
const STEP_MS = 50;

/**
 * Hook that returns an inline `style` to apply to a container and a `trigger`
 * function that starts a brief shake animation (~300ms total).
 *
 * Usage:
 *   const { trigger, style } = useScreenShake();
 *   return <div style={style}>... <button onClick={trigger}>Shake</button> ...</div>
 */
export function useScreenShake(): UseScreenShakeReturn {
  const [offset, setOffset] = useState<number>(0);
  const stepRef = useRef<number>(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const advance = useCallback(() => {
    stepRef.current += 1;
    if (stepRef.current >= STEPS.length) {
      stepRef.current = -1;
      setOffset(0);
      return;
    }
    setOffset(STEPS[stepRef.current]);
    timerRef.current = setTimeout(advance, STEP_MS);
  }, []);

  const trigger = useCallback(() => {
    clearTimer();
    stepRef.current = -1;
    advance();
  }, [advance, clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  const style: CSSProperties = {
    transform: offset === 0 ? undefined : `translate3d(${offset}px, 0, 0)`,
    transition: "transform 40ms linear",
    willChange: offset === 0 ? undefined : "transform",
  };

  return { trigger, style };
}
