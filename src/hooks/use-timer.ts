"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export function useTimer(initialSeconds: number = 0, countDown: boolean = false) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null!);
  const startTimeRef = useRef(0);

  const start = useCallback(() => {
    setRunning(true);
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      if (countDown) {
        const remaining = Math.max(0, initialSeconds - elapsed);
        setSeconds(remaining);
        if (remaining <= 0) {
          clearInterval(intervalRef.current);
          setRunning(false);
        }
      } else {
        setSeconds(elapsed);
      }
    }, 100);
  }, [initialSeconds, countDown]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  const getElapsedMs = useCallback(() => {
    return Date.now() - startTimeRef.current;
  }, []);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return { seconds, running, start, stop, reset, getElapsedMs };
}
