"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";
import { useI18n } from "@/i18n/context";

interface CardItem {
  emoji: string;
  name: string;
  nameEn: string;
  categories: Record<string, string>; // ruleKey -> category value
}

interface Rule {
  key: string;
  label: string;
  labelEn: string;
  leftLabel: string;
  leftLabelEn: string;
  rightLabel: string;
  rightLabelEn: string;
  classify: (item: CardItem) => "left" | "right";
}

const ITEMS: CardItem[] = [
  { emoji: "🍎", name: "苹果", nameEn: "Apple", categories: { bio: "生物", color: "红色", type: "水果" } },
  { emoji: "🍌", name: "香蕉", nameEn: "Banana", categories: { bio: "生物", color: "非红色", type: "水果" } },
  { emoji: "🍇", name: "葡萄", nameEn: "Grape", categories: { bio: "生物", color: "非红色", type: "水果" } },
  { emoji: "🍒", name: "樱桃", nameEn: "Cherry", categories: { bio: "生物", color: "红色", type: "水果" } },
  { emoji: "🐕", name: "狗", nameEn: "Dog", categories: { bio: "生物", color: "非红色", type: "动物" } },
  { emoji: "🐈", name: "猫", nameEn: "Cat", categories: { bio: "生物", color: "非红色", type: "动物" } },
  { emoji: "🐟", name: "鱼", nameEn: "Fish", categories: { bio: "生物", color: "非红色", type: "动物" } },
  { emoji: "🦊", name: "狐狸", nameEn: "Fox", categories: { bio: "生物", color: "红色", type: "动物" } },
  { emoji: "🚗", name: "汽车", nameEn: "Car", categories: { bio: "非生物", color: "红色", type: "载具" } },
  { emoji: "🚌", name: "公交", nameEn: "Bus", categories: { bio: "非生物", color: "非红色", type: "载具" } },
  { emoji: "✈️", name: "飞机", nameEn: "Plane", categories: { bio: "非生物", color: "非红色", type: "载具" } },
  { emoji: "🚂", name: "火车", nameEn: "Train", categories: { bio: "非生物", color: "非红色", type: "载具" } },
  { emoji: "🔨", name: "锤子", nameEn: "Hammer", categories: { bio: "非生物", color: "非红色", type: "工具" } },
  { emoji: "🔧", name: "扳手", nameEn: "Wrench", categories: { bio: "非生物", color: "非红色", type: "工具" } },
  { emoji: "✂️", name: "剪刀", nameEn: "Scissors", categories: { bio: "非生物", color: "红色", type: "工具" } },
  { emoji: "📎", name: "回形针", nameEn: "Paperclip", categories: { bio: "非生物", color: "非红色", type: "工具" } },
];

const RULES: Rule[] = [
  {
    key: "bio",
    label: "生物 / 非生物",
    labelEn: "Living / Non-living",
    leftLabel: "生物",
    leftLabelEn: "Living",
    rightLabel: "非生物",
    rightLabelEn: "Non-living",
    classify: (item) => (item.categories.bio === "生物" ? "left" : "right"),
  },
  {
    key: "color",
    label: "红色 / 非红色",
    labelEn: "Red / Non-red",
    leftLabel: "红色",
    leftLabelEn: "Red",
    rightLabel: "非红色",
    rightLabelEn: "Non-red",
    classify: (item) => (item.categories.color === "红色" ? "left" : "right"),
  },
  {
    key: "type_fruit",
    label: "水果 / 非水果",
    labelEn: "Fruit / Not Fruit",
    leftLabel: "水果",
    leftLabelEn: "Fruit",
    rightLabel: "非水果",
    rightLabelEn: "Not Fruit",
    classify: (item) => (item.categories.type === "水果" ? "left" : "right"),
  },
  {
    key: "type_animal",
    label: "动物 / 非动物",
    labelEn: "Animal / Not Animal",
    leftLabel: "动物",
    leftLabelEn: "Animal",
    rightLabel: "非动物",
    rightLabelEn: "Not Animal",
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
  const { locale } = useI18n();
  const isZh = locale === "zh";
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
          <h3 className="text-lg font-bold">{isZh ? "快速分类 - 操作说明" : "Quick Sort - Instructions"}</h3>
          <p className="text-sm text-muted-foreground">
            {isZh ? "根据当前规则将卡片分到左边或右边" : "Sort cards left or right based on the current rule"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isZh ? "使用 ← → 键或点击按钮进行分类" : "Use ← → keys or click buttons to sort"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isZh ? "注意: 每8张卡片规则会变化！" : "Note: The rule changes every 8 cards!"}
          </p>
          <p className="text-sm text-muted-foreground">{isZh ? `共 ${TOTAL_CARDS} 张卡片` : `${TOTAL_CARDS} cards total`}</p>
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

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex justify-between w-full text-sm text-muted-foreground px-1">
        <span>
          {isZh ? "卡片" : "Card"} {cardIndex + 1}/{TOTAL_CARDS}
        </span>
        <span>
          {isZh ? "正确:" : "Correct:"} {correct}/{cardIndex + 1}
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
        {ruleChangeAlert && <span className="mr-2">{isZh ? "规则变更!" : "Rule Changed!"}</span>}
        {isZh ? "当前规则:" : "Current Rule:"} {isZh ? currentRule.label : currentRule.labelEn}
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
        <span className="text-sm text-muted-foreground">{isZh ? currentItem.name : currentItem.nameEn}</span>
      </div>

      {/* Buttons */}
      <div className="flex gap-6 w-full">
        <button
          onClick={() => handleChoice("left")}
          disabled={phase !== "playing"}
          className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-lg transition"
        >
          ← {isZh ? currentRule.leftLabel : currentRule.leftLabelEn}
        </button>
        <button
          onClick={() => handleChoice("right")}
          disabled={phase !== "playing"}
          className="flex-1 py-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl font-bold text-lg transition"
        >
          {isZh ? currentRule.rightLabel : currentRule.rightLabelEn} →
        </button>
      </div>

      <p className="text-xs text-muted-foreground">{isZh ? "← → 键或 A/D 键快速选择" : "← → or A/D keys for quick selection"}</p>

      <button
        onClick={onAbort}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        {isZh ? "放弃测试" : "Abort Test"}
      </button>
    </div>
  );
}
