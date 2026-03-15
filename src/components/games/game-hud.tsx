"use client";

interface GameHudProps {
  timeLeft?: number;
  elapsed?: number;
  score?: number;
  round?: number;
  totalRounds?: number;
  label?: string;
}

export function GameHud({
  timeLeft,
  elapsed,
  score,
  round,
  totalRounds,
  label,
}: GameHudProps) {
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 bg-card/80 backdrop-blur-sm rounded-lg border border-border text-sm font-mono">
      {label && <span className="text-muted-foreground">{label}</span>}
      {timeLeft != null && (
        <span className={timeLeft < 5 ? "text-red-400 animate-pulse" : ""}>
          {formatTime(timeLeft)}
        </span>
      )}
      {elapsed != null && <span>{formatTime(elapsed)}</span>}
      {score != null && <span>得分: {score}</span>}
      {round != null && totalRounds != null && (
        <span>
          {round}/{totalRounds}
        </span>
      )}
    </div>
  );
}
