"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";
import { useI18n } from "@/i18n/context";
import { playSound } from "@/lib/audio-fx";
import {
  ParticleBurst,
  ScorePopup,
  useScreenShake,
} from "@/components/game-fx";

/**
 * Simplified Iowa Gambling Task (IGT).
 *
 * Four decks with different risk/reward profiles. Players learn which decks
 * are advantageous through experience.
 *
 * - Deck A (disadvantageous): +$100 / 50% chance -$250  → avg -$25/card
 * - Deck B (disadvantageous): +$100 / 10% chance -$1250 → avg -$25/card
 * - Deck C (advantageous):    +$50  / 50% chance -$50   → avg +$25/card
 * - Deck D (advantageous):    +$50  / 10% chance -$250  → avg +$25/card
 *
 * 100 trials total (10 practice + 90 scored). Net score is computed over the
 * LAST 60 scored trials (final three IGT blocks) — this is when learning has
 * stabilised and the measure discriminates best (Bechara 2001).
 */

type DeckId = "A" | "B" | "C" | "D";

const DECK_IDS: DeckId[] = ["A", "B", "C", "D"];
const PRACTICE_TRIALS = 10;
const SCORED_TRIALS = 90;
const TOTAL_TRIALS = PRACTICE_TRIALS + SCORED_TRIALS; // 100
const NET_SCORE_WINDOW = 60; // last 60 scored trials
const STARTING_BALANCE = 2000;

/** Deterministic pseudo-random in [0, 1) from (trialIdx, deck). */
function seededRandom(trialIdx: number, deck: DeckId): number {
  const deckCode = deck.charCodeAt(0); // 65..68
  // Mix trial and deck into a 32-bit int using a simple LCG-like hash.
  let s = (trialIdx * 2654435761) ^ (deckCode * 40503);
  s = (s ^ (s >>> 13)) >>> 0;
  s = (Math.imul(s, 1540483477) ^ (s >>> 15)) >>> 0;
  return (s >>> 0) / 4294967296;
}

interface DrawResult {
  gain: number;
  loss: number;
  net: number;
}

function drawCard(deck: DeckId, trialIdx: number): DrawResult {
  const r = seededRandom(trialIdx, deck);
  let gain = 0;
  let loss = 0;
  if (deck === "A") {
    gain = 100;
    loss = r < 0.5 ? -250 : 0;
  } else if (deck === "B") {
    gain = 100;
    loss = r < 0.1 ? -1250 : 0;
  } else if (deck === "C") {
    gain = 50;
    loss = r < 0.5 ? -50 : 0;
  } else if (deck === "D") {
    gain = 50;
    loss = r < 0.1 ? -250 : 0;
  }
  return { gain, loss, net: gain + loss };
}

const DECK_STYLES: Record<DeckId, { bg: string; border: string; text: string; label: string }> = {
  A: {
    bg: "bg-rose-600/80 hover:bg-rose-500",
    border: "border-rose-400",
    text: "text-rose-50",
    label: "A",
  },
  B: {
    bg: "bg-amber-600/80 hover:bg-amber-500",
    border: "border-amber-400",
    text: "text-amber-50",
    label: "B",
  },
  C: {
    bg: "bg-emerald-600/80 hover:bg-emerald-500",
    border: "border-emerald-400",
    text: "text-emerald-50",
    label: "C",
  },
  D: {
    bg: "bg-sky-600/80 hover:bg-sky-500",
    border: "border-sky-400",
    text: "text-sky-50",
    label: "D",
  },
};

interface PickRecord {
  trial: number; // 0-indexed
  deck: DeckId;
  gain: number;
  loss: number;
  net: number;
  isScored: boolean;
  balanceAfter: number;
}

export default function DecisionGame({ onComplete, onAbort }: GameComponentProps) {
  const { locale } = useI18n();
  const isZh = locale === "zh";

  const [phase, setPhase] = useState<"idle" | "playing" | "reveal" | "done">("idle");
  const [trial, setTrial] = useState(0); // 0-indexed next trial
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [displayBalance, setDisplayBalance] = useState(STARTING_BALANCE);
  const [lastResult, setLastResult] = useState<{
    deck: DeckId;
    gain: number;
    loss: number;
  } | null>(null);
  const [flippingDeck, setFlippingDeck] = useState<DeckId | null>(null);
  const [gainPopup, setGainPopup] = useState<{ value: number; trigger: number }>({ value: 0, trigger: 0 });
  const [lossPopup, setLossPopup] = useState<{ value: number; trigger: number }>({ value: 0, trigger: 0 });
  const [endBurstTrigger, setEndBurstTrigger] = useState(0);

  const startTimeRef = useRef(0);
  const picksRef = useRef<PickRecord[]>([]);
  const balanceRef = useRef(STARTING_BALANCE);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const balanceAnimRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { trigger: shake, style: shakeStyle } = useScreenShake();

  const startGame = useCallback(() => {
    startTimeRef.current = Date.now();
    picksRef.current = [];
    balanceRef.current = STARTING_BALANCE;
    setBalance(STARTING_BALANCE);
    setDisplayBalance(STARTING_BALANCE);
    setTrial(0);
    setLastResult(null);
    setFlippingDeck(null);
    setPhase("playing");
  }, []);

  // Animated balance count-up — tween displayBalance toward balance.
  useEffect(() => {
    if (balance === displayBalance) return;
    if (balanceAnimRef.current) clearInterval(balanceAnimRef.current);
    const start = displayBalance;
    const end = balance;
    const delta = end - start;
    const steps = 15;
    let i = 0;
    balanceAnimRef.current = setInterval(() => {
      i += 1;
      if (i >= steps) {
        setDisplayBalance(end);
        if (balanceAnimRef.current) {
          clearInterval(balanceAnimRef.current);
          balanceAnimRef.current = null;
        }
      } else {
        setDisplayBalance(Math.round(start + (delta * i) / steps));
      }
    }, 25);
    return () => {
      if (balanceAnimRef.current) {
        clearInterval(balanceAnimRef.current);
        balanceAnimRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance]);

  const finishGame = useCallback(() => {
    const picks = picksRef.current;
    const scoredPicks = picks.filter((p) => p.isScored);
    const windowPicks = scoredPicks.slice(-NET_SCORE_WINDOW);

    const countIn = (decks: DeckId[]) =>
      windowPicks.filter((p) => decks.includes(p.deck)).length;

    const aCount = countIn(["A"]);
    const bCount = countIn(["B"]);
    const cCount = countIn(["C"]);
    const dCount = countIn(["D"]);
    const advantageous = cCount + dCount;
    const disadvantageous = aCount + bCount;
    const netScore = advantageous - disadvantageous;

    const totalAll = picks.length || 1;
    const aFullCount = picks.filter((p) => p.deck === "A").length;
    const bFullCount = picks.filter((p) => p.deck === "B").length;
    const cFullCount = picks.filter((p) => p.deck === "C").length;
    const dFullCount = picks.filter((p) => p.deck === "D").length;

    // Celebrate — scale intensity by net score. Negative net = muted.
    if (netScore > 0) {
      playSound("success");
      setEndBurstTrigger((n) => n + 1);
    } else {
      playSound("click", 0.2);
    }

    onComplete({
      rawScore: netScore,
      durationMs: Date.now() - startTimeRef.current,
      metadata: {
        netScore,
        advantageousPicks: advantageous,
        disadvantageousPicks: disadvantageous,
        scoredWindowSize: windowPicks.length,
        windowCounts: { A: aCount, B: bCount, C: cCount, D: dCount },
        totalCounts: {
          A: aFullCount,
          B: bFullCount,
          C: cFullCount,
          D: dFullCount,
        },
        totalTrials: totalAll,
        practiceTrials: PRACTICE_TRIALS,
        scoredTrials: scoredPicks.length,
        finalBalance: balanceRef.current,
        startingBalance: STARTING_BALANCE,
      },
    });
  }, [onComplete]);

  const pickDeck = useCallback(
    (deck: DeckId) => {
      if (phase !== "playing") return;

      const trialIdx = trial; // 0-indexed
      const result = drawCard(deck, trialIdx);
      const isScored = trialIdx >= PRACTICE_TRIALS;
      const newBalance = balanceRef.current + result.net;
      balanceRef.current = newBalance;

      picksRef.current.push({
        trial: trialIdx,
        deck,
        gain: result.gain,
        loss: result.loss,
        net: result.net,
        isScored,
        balanceAfter: newBalance,
      });

      setFlippingDeck(deck);
      setLastResult({ deck, gain: result.gain, loss: result.loss });
      setBalance(newBalance);
      setPhase("reveal");

      // Click sound immediately
      playSound("click", 0.15);

      // Reveal polish: gain popup + coin sound immediately, loss popup +
      // shake shortly after so they don't stack. Reveal window is 900ms.
      setGainPopup({ value: result.gain, trigger: Date.now() });
      playSound("coin", 0.25);

      if (result.loss < 0) {
        timeoutsRef.current.push(
          setTimeout(() => {
            setLossPopup({ value: result.loss, trigger: Date.now() });
            playSound("pop", 0.3);
            shake();
          }, 350)
        );
      }

      timeoutsRef.current.push(
        setTimeout(() => {
          const nextTrial = trialIdx + 1;
          if (nextTrial >= TOTAL_TRIALS) {
            setPhase("done");
            finishGame();
            return;
          }
          setTrial(nextTrial);
          setLastResult(null);
          setFlippingDeck(null);
          setPhase("playing");
        }, 900)
      );
    },
    [phase, trial, finishGame, shake]
  );

  // Keyboard: A/B/C/D to pick decks quickly.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (phase !== "playing") return;
      const key = e.key.toUpperCase();
      if (key === "A" || key === "B" || key === "C" || key === "D") {
        pickDeck(key as DeckId);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, pickDeck]);

  // Cleanup pending timeouts on unmount.
  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  // ----- idle / instruction screen -----
  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
        <div className="text-center space-y-3 p-6 bg-muted/30 rounded-xl">
          <h3 className="text-lg font-bold">
            {isZh ? "决策者 — 操作说明" : "Decision Maker — Instructions"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isZh
              ? "你有 $2000 起始余额。每轮从 A/B/C/D 四副牌中选一副抽一张牌。"
              : "You start with $2000. Each trial, pick one of four decks (A/B/C/D) to draw a card."}
          </p>
          <p className="text-sm text-muted-foreground">
            {isZh
              ? "每张牌都会给你奖励，部分牌会带来损失。两副牌长期亏损，两副牌长期盈利。"
              : "Each card gives a gain; some also bring a loss. Two decks lose in the long run, two decks win in the long run."}
          </p>
          <p className="text-sm text-muted-foreground">
            {isZh
              ? "通过试错找出有利的牌堆，最大化余额。"
              : "Discover which decks are advantageous through trial and error, and maximise your balance."}
          </p>
          <p className="text-sm text-muted-foreground">
            {isZh
              ? `共 ${TOTAL_TRIALS} 轮（前 ${PRACTICE_TRIALS} 轮为练习，不计分）。`
              : `${TOTAL_TRIALS} trials total (first ${PRACTICE_TRIALS} are practice, unscored).`}
          </p>
          <p className="text-xs text-muted-foreground">
            {isZh
              ? "可使用键盘 A / B / C / D 快速选择"
              : "Use A / B / C / D keys for quick selection"}
          </p>
        </div>
        <button
          onClick={startGame}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold text-lg hover:opacity-90 transition"
        >
          {isZh ? "开始游戏" : "Start Game"}
        </button>
        <button
          onClick={onAbort}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {isZh ? "放弃测试" : "Abort Test"}
        </button>
      </div>
    );
  }

  // ----- main play view (playing | reveal | done) -----
  const trialNumber = Math.min(trial + 1, TOTAL_TRIALS);
  const isPractice = trial < PRACTICE_TRIALS;
  const progressPct = (trial / TOTAL_TRIALS) * 100;

  return (
    <div className="relative flex flex-col items-center gap-4 w-full max-w-lg mx-auto" style={shakeStyle}>
      {/* Balance */}
      <div className="relative w-full flex flex-col items-center gap-1 py-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {isZh ? "余额" : "Balance"}
        </span>
        <span
          className={`text-3xl font-mono font-bold ${
            displayBalance >= STARTING_BALANCE ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          ${displayBalance.toLocaleString()}
        </span>
        <ScorePopup
          value={gainPopup.value}
          x={120}
          y={30}
          trigger={gainPopup.trigger}
          enabled={gainPopup.trigger > 0}
        />
        <ScorePopup
          value={lossPopup.value}
          x={220}
          y={30}
          trigger={lossPopup.trigger}
          enabled={lossPopup.trigger > 0}
        />
      </div>
      <ParticleBurst
        trigger={endBurstTrigger}
        x={240}
        y={60}
        color="#FFB800"
        count={24}
        enabled={endBurstTrigger > 0}
      />

      {/* Progress */}
      <div className="flex justify-between w-full text-sm text-muted-foreground px-1">
        <span>
          {isZh ? "第" : "Trial"} {trialNumber}/{TOTAL_TRIALS}
        </span>
        <span
          className={
            isPractice ? "text-yellow-400 font-medium" : "text-muted-foreground"
          }
        >
          {isPractice
            ? isZh
              ? "练习阶段 — 熟悉牌堆"
              : "Practice — learning the decks"
            : isZh
              ? "正式计分阶段"
              : "Scored phase"}
        </span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isPractice ? "bg-yellow-500/70" : "bg-primary"
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Feedback slot — fixed height so decks don't jump */}
      <div className="w-full h-20 flex items-center justify-center">
        {lastResult ? (
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">
              {isZh ? `牌堆 ${lastResult.deck}` : `Deck ${lastResult.deck}`}
            </p>
            <p className="text-lg font-mono font-bold">
              <span className="text-emerald-400">+${lastResult.gain}</span>
              {lastResult.loss < 0 && (
                <>
                  <span className="text-muted-foreground mx-2">/</span>
                  <span className="text-rose-400">
                    -${Math.abs(lastResult.loss)}
                  </span>
                </>
              )}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isZh ? "选择一副牌抽一张..." : "Pick a deck to draw a card..."}
          </p>
        )}
      </div>

      {/* Decks */}
      <div className="grid grid-cols-4 gap-3 w-full">
        {DECK_IDS.map((deck) => {
          const s = DECK_STYLES[deck];
          const isFlipping = flippingDeck === deck;
          return (
            <button
              key={deck}
              onClick={() => pickDeck(deck)}
              disabled={phase !== "playing"}
              aria-label={isZh ? `抽牌堆 ${deck}` : `Draw from deck ${deck}`}
              className={`relative aspect-[3/4] rounded-xl border-2 ${s.border} ${s.bg} ${s.text} font-bold text-3xl flex items-center justify-center transition-all duration-300 disabled:cursor-not-allowed ${
                isFlipping ? "scale-110 -translate-y-2 shadow-2xl" : ""
              } ${phase !== "playing" && !isFlipping ? "opacity-60" : ""}`}
            >
              <span className="drop-shadow">{s.label}</span>
              <span className="absolute bottom-1 text-[10px] font-normal opacity-70">
                {isZh ? "牌堆" : "Deck"}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {isZh
          ? "点击牌堆或按 A / B / C / D 抽牌"
          : "Click a deck or press A / B / C / D to draw"}
      </p>

      <button
        onClick={onAbort}
        className="text-sm text-muted-foreground hover:text-foreground mt-2"
      >
        {isZh ? "放弃测试" : "Abort Test"}
      </button>
    </div>
  );
}
