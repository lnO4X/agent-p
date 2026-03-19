import confetti from "canvas-confetti";

/** Burst of confetti from center — for archetype reveal, big achievements */
export function celebrationBurst() {
  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}

/** Quick upward burst — for daily streak milestones, rank-up */
export function quickCelebration() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.8 },
    colors: ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"],
  });
}

/** Star-shaped burst — for S-rank achievement */
export function starBurst() {
  const defaults = {
    spread: 360,
    ticks: 80,
    gravity: 0.5,
    decay: 0.94,
    startVelocity: 20,
    shapes: ["star" as const],
    colors: ["#FFD700", "#FFA500", "#FF6347", "#FF1493", "#9400D3"],
  };

  confetti({ ...defaults, particleCount: 30, scalar: 1.2, origin: { x: 0.5, y: 0.4 } });
  confetti({ ...defaults, particleCount: 15, scalar: 0.75, origin: { x: 0.5, y: 0.4 } });
}
