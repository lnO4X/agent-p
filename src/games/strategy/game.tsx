"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameComponentProps } from "@/types/game";

const GRID = 8;
const TOTAL_ROUNDS = 3;
const SIM_TICK_MS = 250;

interface RoundConfig {
  towersAllowed: number;
  enemyCount: number;
  enemyHp: number;
  enemySpeed: number;
  towerDamage: number;
  towerRange: number;
  path: [number, number][];
}

const ROUNDS: RoundConfig[] = [
  {
    towersAllowed: 3,
    enemyCount: 6,
    enemyHp: 100,
    enemySpeed: 1,
    towerDamage: 20,
    towerRange: 1.5,
    path: [
      [0, 2], [1, 2], [2, 2], [3, 2], [3, 3], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4],
    ],
  },
  {
    towersAllowed: 4,
    enemyCount: 10,
    enemyHp: 150,
    enemySpeed: 1,
    towerDamage: 18,
    towerRange: 1.4,
    path: [
      [0, 1], [1, 1], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5],
      [3, 5], [4, 5], [4, 4], [4, 3], [4, 2], [4, 1],
      [5, 1], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6], [7, 6],
    ],
  },
  {
    towersAllowed: 3,
    enemyCount: 12,
    enemyHp: 150,
    enemySpeed: 2,
    towerDamage: 25,
    towerRange: 1.5,
    path: [
      [0, 4], [1, 4], [1, 3], [1, 2], [1, 1],
      [2, 1], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6],
      [4, 6], [5, 6], [5, 5], [5, 4], [5, 3], [5, 2], [5, 1],
      [6, 1], [7, 1],
    ],
  },
];

type CellType = "empty" | "path" | "tower";

interface Enemy {
  id: number;
  hp: number;
  maxHp: number;
  pathIndex: number;
  alive: boolean;
  escaped: boolean;
}

function getAdjacentToPath(pathCells: [number, number][]): Set<string> {
  const pathSet = new Set(pathCells.map(([r, c]) => `${r},${c}`));
  const adjacent = new Set<string>();
  for (const [r, c] of pathCells) {
    const neighbors: [number, number][] = [
      [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
    ];
    for (const [nr, nc] of neighbors) {
      if (nr >= 0 && nr < GRID && nc >= 0 && nc < GRID) {
        const key = `${nr},${nc}`;
        if (!pathSet.has(key)) adjacent.add(key);
      }
    }
  }
  return adjacent;
}

function GridCell({
  type,
  isHighlight,
  isEnemyHere,
  enemyHpPct,
  onClick,
  disabled,
}: {
  type: CellType;
  isHighlight: boolean;
  isEnemyHere: boolean;
  enemyHpPct: number;
  onClick: () => void;
  disabled: boolean;
}) {
  let bg = "bg-slate-700/50";
  if (type === "path") bg = "bg-amber-900/40";
  if (type === "tower") bg = "bg-blue-600";
  if (isHighlight && type === "empty") bg = "bg-slate-600 hover:bg-slate-500 active:bg-slate-400";

  return (
    <button
      onClick={onClick}
      disabled={disabled || (!isHighlight && type !== "tower")}
      className={`aspect-square rounded-sm relative flex items-center justify-center text-xs font-bold transition-all ${bg} ${
        isHighlight && !disabled ? "cursor-pointer ring-1 ring-primary/50" : "cursor-default"
      }`}
    >
      {type === "tower" && <span className="text-base md:text-lg">🗼</span>}
      {isEnemyHere && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs md:text-sm">👾</span>
          <div className="w-4/5 h-1 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all"
              style={{ width: `${Math.max(0, enemyHpPct)}%` }}
            />
          </div>
        </div>
      )}
      {type === "path" && !isEnemyHere && (
        <span className="text-muted-foreground/20 text-[8px]">·</span>
      )}
    </button>
  );
}

export default function StrategyGame({
  onComplete,
  onAbort,
}: GameComponentProps) {
  const [phase, setPhase] = useState<
    "idle" | "placing" | "simulating" | "roundResult" | "done"
  >("idle");
  const [roundIdx, setRoundIdx] = useState(0);
  const [towers, setTowers] = useState<[number, number][]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [totalKilled, setTotalKilled] = useState(0);
  const [totalEnemies, setTotalEnemies] = useState(0);
  const [roundKilled, setRoundKilled] = useState(0);

  const startTimeRef = useRef(0);
  const simTimerRef = useRef<ReturnType<typeof setInterval>>(null!);
  const roundResultsRef = useRef<{ killed: number; total: number }[]>([]);

  const roundConfig = ROUNDS[roundIdx];
  const currentPath = roundConfig.path;
  const pathSet = new Set(currentPath.map(([r, c]) => `${r},${c}`));
  const adjacentCells = getAdjacentToPath(currentPath);
  const towerSet = new Set(towers.map(([r, c]) => `${r},${c}`));

  const startGame = useCallback(() => {
    startTimeRef.current = Date.now();
    setRoundIdx(0);
    setTowers([]);
    setTotalKilled(0);
    setTotalEnemies(0);
    setRoundKilled(0);
    roundResultsRef.current = [];
    setPhase("placing");
  }, []);

  const placeTower = useCallback(
    (row: number, col: number) => {
      if (phase !== "placing") return;
      if (towers.length >= roundConfig.towersAllowed) return;
      const key = `${row},${col}`;
      if (towerSet.has(key) || pathSet.has(key)) return;
      if (!adjacentCells.has(key)) return;

      const newTowers = [...towers, [row, col] as [number, number]];
      setTowers(newTowers);

      if (newTowers.length >= roundConfig.towersAllowed) {
        setTimeout(() => runSimulation(newTowers), 400);
      }
    },
    [phase, towers, towerSet, pathSet, adjacentCells, roundConfig.towersAllowed]
  );

  const runSimulation = useCallback(
    (placedTowers: [number, number][]) => {
      setPhase("simulating");

      const config = ROUNDS[roundIdx];
      const simEnemies: Enemy[] = Array.from(
        { length: config.enemyCount },
        (_, i) => ({
          id: i,
          hp: config.enemyHp,
          maxHp: config.enemyHp,
          pathIndex: -1 - i * 3,
          alive: true,
          escaped: false,
        })
      );

      setEnemies([...simEnemies]);
      const path = config.path;

      simTimerRef.current = setInterval(() => {
        let anyActive = false;

        for (const enemy of simEnemies) {
          if (!enemy.alive || enemy.escaped) continue;

          enemy.pathIndex += config.enemySpeed;

          if (enemy.pathIndex < 0) {
            anyActive = true;
            continue;
          }

          if (enemy.pathIndex >= path.length) {
            enemy.escaped = true;
            continue;
          }

          anyActive = true;

          const [er, ec] = path[Math.min(enemy.pathIndex, path.length - 1)];
          for (const [tr, tc] of placedTowers) {
            const dist = Math.sqrt((er - tr) ** 2 + (ec - tc) ** 2);
            if (dist <= config.towerRange) {
              enemy.hp -= config.towerDamage;
            }
          }

          if (enemy.hp <= 0) {
            enemy.alive = false;
          }
        }

        setEnemies([...simEnemies]);

        if (!anyActive) {
          clearInterval(simTimerRef.current);
          const killed = simEnemies.filter((e) => !e.alive && !e.escaped).length;
          setRoundKilled(killed);

          roundResultsRef.current.push({
            killed,
            total: config.enemyCount,
          });

          setTotalKilled((prev) => prev + killed);
          setTotalEnemies((prev) => prev + config.enemyCount);
          setPhase("roundResult");
        }
      }, SIM_TICK_MS);
    },
    [roundIdx]
  );

  const nextRound = useCallback(() => {
    const nextIdx = roundIdx + 1;
    if (nextIdx >= TOTAL_ROUNDS) {
      const allKilled = roundResultsRef.current.reduce((a, r) => a + r.killed, 0);
      const allTotal = roundResultsRef.current.reduce((a, r) => a + r.total, 0);
      const pct = allTotal > 0 ? Math.round((allKilled / allTotal) * 100) : 0;

      setPhase("done");
      onComplete({
        rawScore: pct,
        durationMs: Date.now() - startTimeRef.current,
        metadata: {
          rounds: roundResultsRef.current,
          totalKilled: allKilled,
          totalEnemies: allTotal,
        },
      });
    } else {
      setRoundIdx(nextIdx);
      setTowers([]);
      setEnemies([]);
      setRoundKilled(0);
      setPhase("placing");
    }
  }, [roundIdx, onComplete]);

  useEffect(() => {
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, []);

  const enemyMap = new Map<string, Enemy>();
  if (phase === "simulating") {
    for (const e of enemies) {
      if (e.alive && e.pathIndex >= 0 && e.pathIndex < currentPath.length) {
        const [r, c] = currentPath[e.pathIndex];
        enemyMap.set(`${r},${c}`, e);
      }
    }
  }

  const getCellType = (r: number, c: number): CellType => {
    const key = `${r},${c}`;
    if (towerSet.has(key)) return "tower";
    if (pathSet.has(key)) return "path";
    return "empty";
  };

  const overallPct = totalEnemies > 0 ? Math.round((totalKilled / totalEnemies) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-3 md:gap-4 w-full">
      <div className="flex justify-between w-full max-w-xs md:max-w-sm text-xs md:text-sm text-muted-foreground px-2">
        <span>第 {roundIdx + 1}/{TOTAL_ROUNDS} 轮</span>
        {phase === "placing" && (
          <span>放塔: {towers.length}/{roundConfig.towersAllowed}</span>
        )}
        {totalEnemies > 0 && <span>击杀: {overallPct}%</span>}
      </div>

      {phase === "idle" && (
        <div className="w-full max-w-sm bg-slate-800 rounded-xl p-6 text-center">
          <p className="text-lg mb-3">塔防谜题</p>
          <div className="text-sm text-muted-foreground mb-4 space-y-1">
            <p>敌人沿路径移动，在路径旁放塔消灭敌人</p>
            <p>共3轮，难度递增：敌人更多更快更强</p>
            <p>塔攻击范围有限，布局是关键</p>
          </div>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-500 active:bg-orange-400 text-white rounded-lg font-bold text-lg transition-colors"
          >
            开始测试
          </button>
        </div>
      )}

      {phase !== "idle" && phase !== "done" && (
        <>
          {phase === "placing" && (
            <p className="text-xs md:text-sm text-yellow-400 text-center">
              点击路径旁高亮格放置塔
            </p>
          )}
          {phase === "simulating" && (
            <p className="text-xs md:text-sm text-blue-400">模拟中...</p>
          )}

          <div
            className="grid gap-0.5 w-full max-w-[280px] md:max-w-sm mx-auto"
            style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}
          >
            {Array.from({ length: GRID * GRID }, (_, idx) => {
              const r = Math.floor(idx / GRID);
              const c = idx % GRID;
              const key = `${r},${c}`;
              const cellType = getCellType(r, c);
              const isAdj = adjacentCells.has(key) && !towerSet.has(key) && !pathSet.has(key);
              const isHighlight =
                phase === "placing" && isAdj && towers.length < roundConfig.towersAllowed;
              const enemy = enemyMap.get(key);

              return (
                <GridCell
                  key={key}
                  type={cellType}
                  isHighlight={isHighlight}
                  isEnemyHere={!!enemy}
                  enemyHpPct={enemy ? (enemy.hp / enemy.maxHp) * 100 : 0}
                  onClick={() => placeTower(r, c)}
                  disabled={phase !== "placing"}
                />
              );
            })}
          </div>
        </>
      )}

      {phase === "roundResult" && (
        <div className="w-full max-w-sm bg-slate-800 rounded-xl p-5 text-center mt-2">
          <p className="text-lg font-bold mb-1">第 {roundIdx + 1} 轮</p>
          <p className="text-3xl font-bold text-orange-400">
            {roundKilled}/{roundConfig.enemyCount}
          </p>
          <p className="text-sm text-muted-foreground mt-1">敌人被消灭</p>
          <button
            onClick={nextRound}
            className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-500 active:bg-orange-400 text-white rounded-lg font-bold transition-colors"
          >
            {roundIdx + 1 < TOTAL_ROUNDS ? "下一轮" : "查看结果"}
          </button>
        </div>
      )}

      {phase === "done" && (
        <div className="w-full max-w-sm bg-slate-800 rounded-xl p-6 text-center">
          <p className="text-2xl font-bold mb-2">测试完成!</p>
          <p className="text-4xl font-bold text-orange-400">{overallPct}%</p>
          <p className="text-sm text-muted-foreground mt-2">总击杀率</p>
        </div>
      )}

      <button
        onClick={onAbort}
        className="text-xs md:text-sm text-muted-foreground hover:text-foreground"
      >
        放弃测试
      </button>
    </div>
  );
}
