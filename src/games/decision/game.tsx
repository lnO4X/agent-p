"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";

interface CardItem {
  emoji: string;
  name: string;
  categories: Record<string, string>; // ruleKey -> category value
}

interface Rule {
  key: string;
  label: string;
  leftLabel: string;
  rightLabel: string;
  classify: (item: CardItem) => "left" | "right";
}

const ITEMS: CardItem[] = [
  { emoji: "🍎", name: "苹果", categories: { bio: "生物", color: "红色", type: "水果" } },
  { emoji: "🍌", name: "香蕉", categories: { bio: "生物", color: "非红色", type: "水果" } },
  { emoji: "🍇", name: "葡萄", categories: { bio: "生物", color: "非红色", type: "水果" } },
  { emoji: "🍒", name: "樱桃", categories: { bio: "生物", color: "红色", type: "水果" } },
  { emoji: "🐕", name: "狗", categories: { bio: "生物", color: "非红色", type: "动物" } },
  { emoji: "🐈", name: "猫", categories: { bio: "生物", color: "非红色", type: "动物" } },
  { emoji: "🐟", name: "鱼", categories: { bio: "生物", color: "非红色", type: "动物" } },
  { emoji: "🦊", name: "狐狸", categories: { bio: "生物", color: "红色", type: "动物" } },
  { emoji: "🚗", name: "汽车", categories: { bio: "非生物", color: "红色", type: "载具" } },
  { emoji: "🚌", name: "公交", categories: { bio: "非生物", color: "非红色", type: "载具" } },
  { emoji: "✈️", name: "飞机", categories: { bio: "非生物", color: "非红色", type: "载具" } },
  { emoji: "🚂", name: "火车", categories: { bio: "非生物", color: "非红色", type: "载具" } },
  { emoji: "🔨", name: "锤子", categories: { bio: "非生物", color: "非红色", type: "工具" } },
  { emoji: "🔧", name: "扳手", categories: { bio: "非生物", color: "非红色", type: "工具" } },
  { emoji: "✂️", name: "剪刀", categories: { bio: "非生物", color: "红色", type: "工具" } },
  { emoji: "📎", name: "回形针", categories: { bio: "非生物", color: "非红色", type: "工具" } },
];

const RULES: Rule[] = [
  {
    key: "bio",
    label: "生物 / 非生物",
    leftLabel: "生物",
    rightLabel: "非生物",
    classify: (item) => (item.categories.bio === "生物" ? "left" : "right"),
  },
  {
    key: "color",
    label: "红色 / 非红色",
    leftLabel: "红色",
    rightLabel: "非红色",
    classify: (item) => (item.categories.color === "红色" ? "left" : "right"),
  },
  {
    key: "type_fruit",
    label: "水果 / 非水果",
    leftLabel: "水果",
    rightLabel: "非水果",
    classify: (item) => (item.categories.type === "水果" ? "left" : "right"),
  },
  {
    key: "type_animal",
    label: "动物 / 非动物",
    leftLabel: "动物",
    rightLabel: "非动物",
    classify: (item) => (item.categories.type === "动物" ? "left" : "right"),
  },
];

const TOTAL_CARDS = 32;
const RULE_CHANGE_INTERVAL = 8;

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function DecisionGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const [phase, setPhase] = useState<"idle" | "playing" | "feedback" | "done">("idle");
  const [cardIndex, setCardIndex] = useState(0);
  const [currentRule, setCurrentRule] = useState<Rule>(RULES[0]);
  const [currentItem, setCurrentItem] = useState<CardItem>(ITEMS[0]);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [ruleChangeAlert, setRuleChangeAlert] = useState(false);
  const [animateOut, setAnimateOut] = useState<"left" | "right" | null>(null);

  const startTimeRef = useRef(0);
  const deckRef = useRef<CardItem[]>([]);
  const rulesRef = useRef<Rule[]>([]);
  const correctRef = useRef(0);
  const cardTimesRef = useRef<number[]>([]);
  const cardStartRef = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const buildDeck = useCallback(() => {
    const deck: CardItem[] = [];
    while (deck.length < TOTAL_CARDS) {
      const shuffled = shuffle(ITEMS);
      deck.push(...shuffled);
    }
    return deck.slice(0, TOTAL_CARDS);
  }, []);

  const buildRuleSequence = useCallback(() => {
    const numRules = Math.ceil(TOTAL_CARDS / RULE_CHANGE_INTERVAL);
    const seq: Rule[] = [];
    const shuffled = shuffle(RULES);
    for (let i = 0; i < numRules; i++) {
      seq.push(shuffled[i % shuffled.length]);
    }
    return seq;
  }, []);

  const getRuleForCard = useCallback((index: number): Rule => {
    const ruleIdx = Math.floor(index / RULE_CHANGE_INTERVAL);
    return rulesRef.current[ruleIdx] || RULES[0];
  }, []);

  const startGame = useCallback(() => {
    deckRef.current = buildDeck();
    rulesRef.current = buildRuleSequence();
    correctRef.current = 0;
    cardTimesRef.current = [];
    startTimeRef.current = Date.now();
    cardStartRef.current = Date.now();

    const firstRule = getRuleForCard(0);
    setCurrentRule(firstRule);
    setCurrentItem(deckRef.current[0]);
    setCardIndex(0);
    setCorrect(0);
    setPhase("playing");
    setFeedback(null);
    setRuleChangeAlert(false);
  }, [buildDeck, buildRuleSequence, getRuleForCard]);

  const advanceCard = useCallback(
    (nextIndex: number) => {
      if (nextIndex >= TOTAL_CARDS) {
        setPhase("done");
        const totalTimeMs = Date.now() - startTimeRef.current;
        const totalTimeSec = totalTimeMs / 1000;
        const rawScore = totalTimeSec > 0 ? correctRef.current / totalTimeSec : 0;

        onComplete({
          rawScore: Math.round(rawScore * 1000) / 1000,
          durationMs: totalTimeMs,
          metadata: {
            correct: correctRef.current,
            total: TOTAL_CARDS,
            accuracy: Math.round((correctRef.current / TOTAL_CARDS) * 1000) / 10,
            cardTimes: cardTimesRef.current,
          },
        });
        return;
      }

      const newRule = getRuleForCard(nextIndex);
      const prevRule = getRuleForCard(nextIndex - 1);

      if (newRule.key !== prevRule.key) {
        setRuleChangeAlert(true);
        timeoutsRef.current.push(setTimeout(() => setRuleChangeAlert(false), 1200));
      }

      setCurrentRule(newRule);
      setCurrentItem(deckRef.current[nextIndex]);
      setCardIndex(nextIndex);
      cardStartRef.current = Date.now();
      setAnimateOut(null);
    },
    [getRuleForCard, onComplete]
  );

  const handleChoice = useCallback(
    (choice: "left" | "right") => {
      if (phase !== "playing") return;

      const cardTime = Date.now() - cardStartRef.current;
      cardTimesRef.current.push(cardTime);

      const correctAnswer = currentRule.classify(currentItem);
      const isCorrect = choice === correctAnswer;

      if (isCorrect) {
        correctRef.current++;
        setCorrect(correctRef.current);
      }

      setFeedback(isCorrect ? "correct" : "wrong");
      setAnimateOut(choice);
      setPhase("feedback");

      timeoutsRef.current.push(setTimeout(() => {
        setFeedback(null);
        setPhase("playing");
        advanceCard(cardIndex + 1);
      }, 400));
    },
    [phase, currentRule, currentItem, cardIndex, advanceCard]
  );

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (phase !== "playing") return;
      if (e.key === "ArrowLeft" || e.key === "a") handleChoice("left");
      if (e.key === "ArrowRight" || e.key === "d") handleChoice("right");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, handleChoice]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
        <div className="text-center space-y-3 p-6 bg-muted/30 rounded-xl">
          <h3 className="text-lg font-bold">快速分类 - 操作说明</h3>
          <p className="text-sm text-muted-foreground">
            根据当前规则将卡片分到左边或右边
          </p>
          <p className="text-sm text-muted-foreground">
            使用 ← → 键或点击按钮进行分类
          </p>
          <p className="text-sm text-muted-foreground">
            注意: 每8张卡片规则会变化！
          </p>
          <p className="text-sm text-muted-foreground">共 {TOTAL_CARDS} 张卡片</p>
        </div>
        <button
          onClick={startGame}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold text-lg hover:opacity-90 transition"
        >
          开始游戏
        </button>
        <button
          onClick={onAbort}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          放弃测试
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex justify-between w-full text-sm text-muted-foreground px-1">
        <span>
          卡片 {cardIndex + 1}/{TOTAL_CARDS}
        </span>
        <span>
          正确: {correct}/{cardIndex + (phase === "done" ? 0 : 0)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(cardIndex / TOTAL_CARDS) * 100}%` }}
        />
      </div>

      {/* Rule banner */}
      <div
        className={`w-full text-center py-2 rounded-lg font-bold transition-all ${
          ruleChangeAlert
            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 scale-105"
            : "bg-muted/30 text-muted-foreground"
        }`}
      >
        {ruleChangeAlert && <span className="mr-2">规则变更!</span>}
        当前规则: {currentRule.label}
      </div>

      {/* Card */}
      <div
        className={`relative w-40 h-48 bg-slate-800 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
          feedback === "correct"
            ? "border-green-500"
            : feedback === "wrong"
              ? "border-red-500"
              : "border-slate-600"
        } ${
          animateOut === "left"
            ? "-translate-x-32 opacity-0 rotate-[-15deg]"
            : animateOut === "right"
              ? "translate-x-32 opacity-0 rotate-[15deg]"
              : ""
        }`}
      >
        <span className="text-6xl">{currentItem.emoji}</span>
        <span className="text-sm text-muted-foreground">{currentItem.name}</span>
      </div>

      {/* Buttons */}
      <div className="flex gap-6 w-full">
        <button
          onClick={() => handleChoice("left")}
          disabled={phase !== "playing"}
          className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-lg transition"
        >
          ← {currentRule.leftLabel}
        </button>
        <button
          onClick={() => handleChoice("right")}
          disabled={phase !== "playing"}
          className="flex-1 py-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl font-bold text-lg transition"
        >
          {currentRule.rightLabel} →
        </button>
      </div>

      <p className="text-xs text-muted-foreground">← → 键或 A/D 键快速选择</p>

      <button
        onClick={onAbort}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        放弃测试
      </button>
    </div>
  );
}
