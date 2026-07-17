'use client'

import { useState } from 'react'

// ─── SaturationViz ───────────────────────────────────────────────────────────
// IFEval top-10 models. Top-10 spread = 2.9pp → SATURATED.

const IFEVAL_MODELS = [
  { name: 'Qwen3.5-27B', score: 95.0 },
  { name: 'Qwen3.7-Plus', score: 94.6 },
  { name: 'Qwen3.6 Plus', score: 94.3 },
  { name: 'Qwen3.7 Max', score: 94.3 },
  { name: 'o3-mini', score: 93.9 },
  { name: 'Qwen3.5-122B', score: 93.4 },
  { name: 'Claude 3.7 Sonnet', score: 93.2 },
  { name: 'Qwen3.5-397B', score: 92.6 },
  { name: 'Nova Pro', score: 92.1 },
  { name: 'Llama 3.3 70B', score: 92.1 },
]

const TOP10_SPREAD = 2.9
const THRESHOLD = 5.0

export function SaturationViz() {
  const saturated = TOP10_SPREAD < THRESHOLD
  const minBar = 90.5
  const maxBar = 96.0
  const range = maxBar - minBar

  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          IFEval · Prompt-Level Strict Accuracy (%)
        </p>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            saturated
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
          }`}
        >
          {saturated ? 'SATURATED' : 'not saturated'}
        </span>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
        source: llm-stats.com · 65 models · top-10 spread = {TOP10_SPREAD}pp (threshold {THRESHOLD}pp)
      </p>
      <div className="flex flex-col gap-2.5">
        {IFEVAL_MODELS.map((m) => {
          const pct = ((m.score - minBar) / range) * 100
          const isQwen = m.name.startsWith('Qwen')
          return (
            <div key={m.name} className="flex items-center gap-3">
              <div className="w-36 text-xs text-slate-600 dark:text-slate-300 truncate text-right font-mono">
                {m.name}
              </div>
              <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isQwen
                      ? 'bg-orange-400 dark:bg-orange-500'
                      : 'bg-blue-400 dark:bg-blue-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-12 text-xs text-right text-slate-700 dark:text-slate-200 font-mono">
                {m.score.toFixed(1)}%
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-orange-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400">Qwen family</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400">Other</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
        The top-10 clusters within 2.9pp — well below the saturation threshold. Six of the top 12
        are Qwen3.5 variants. Noise from prompt sampling dominates any real signal between adjacent ranks.
      </p>
    </div>
  )
}

// ─── IFBenchLeaderboard ──────────────────────────────────────────────────────
// OOD generalization gap: IFEval high scorers vs IFBench scores.

const IFBENCH_ROWS = [
  { model: 'Grok 4.3', ifeval: null, ifbench: 83.3, reasoning: true },
  { model: 'Grok 4.20', ifeval: null, ifbench: 82.9, reasoning: true },
  { model: 'MiniMax-M3', ifeval: null, ifbench: 82.9, reasoning: false },
  { model: 'Gemini 3 Flash (R)', ifeval: null, ifbench: 78.0, reasoning: true },
  { model: 'GPT-5.5', ifeval: null, ifbench: 75.9, reasoning: false },
  { model: 'Claude Opus 4.7', ifeval: null, ifbench: 58.6, reasoning: false },
  { model: 'Claude Sonnet 4.6', ifeval: null, ifbench: 55.8, reasoning: false },
  { model: 'Claude 4.5 Haiku', ifeval: null, ifbench: 54.3, reasoning: false },
]

const IFBENCH_MAX = 83.3
const IFBENCH_MIN = 54.3

export function IFBenchLeaderboard() {
  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          IFBench · Out-of-Distribution Constraint Following (%)
        </p>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          not saturated
        </span>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
        source: Artificial Analysis · 58 OOD verifiable constraints · spread = {(IFBENCH_MAX - IFBENCH_MIN).toFixed(1)}pp
      </p>
      <div className="flex flex-col gap-2.5">
        {IFBENCH_ROWS.map((m) => {
          const pct = ((m.ifbench - 45) / (IFBENCH_MAX - 45 + 5)) * 100
          const isReasoning = m.reasoning
          return (
            <div key={m.model} className="flex items-center gap-3">
              <div className="w-36 text-xs text-slate-600 dark:text-slate-300 truncate text-right font-mono">
                {m.model}
                {isReasoning && (
                  <span className="ml-1 text-indigo-500 dark:text-indigo-400">★</span>
                )}
              </div>
              <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    m.ifbench >= 75
                      ? 'bg-emerald-400 dark:bg-emerald-500'
                      : 'bg-red-400 dark:bg-red-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-12 text-xs text-right text-slate-700 dark:text-slate-200 font-mono">
                {m.ifbench.toFixed(1)}%
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400">≥75%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400">&lt;75%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-indigo-500 text-xs">★</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">reasoning model</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
        29pp gap between top and bottom of this table. Reasoning models dominate. Claude scores
        53–59% — capable models that look strong on IFEval, but only half-right on OOD constraints.
      </p>
    </div>
  )
}

// ─── Quiz ────────────────────────────────────────────────────────────────────

type QItem = { q: string; options: string[]; answer: number; explanation: string }

export function Quiz() {
  const questions: QItem[] = [
    {
      q: 'IFEval evaluates "verifiable instructions." What makes an instruction verifiable in IFEval\'s sense?',
      options: [
        'A. A human judge confirms the instruction was followed correctly',
        'B. A rule-based program can check compliance without any model judge — word counts, keyword frequency, JSON validity, etc.',
        'C. The model self-reports whether it followed the instruction',
        'D. A separate LLM rates compliance on a 1–5 scale',
      ],
      answer: 1,
      explanation:
        'IFEval constraints are mechanically checkable: count words, check if a forbidden word appears, validate JSON syntax. No human or LLM judge is needed — that is why it is reproducible and cheap to run.',
    },
    {
      q: 'The IFEval top-10 spread is 2.9pp. The top models are all Qwen3.5 variants. What is the most likely explanation?',
      options: [
        'A. Qwen models have fundamentally superior instruction-following architecture',
        'B. Deliberate optimization against IFEval\'s fixed 25-constraint vocabulary pushes Qwen scores up without generalizing to novel constraints',
        'C. Other labs simply have not submitted their models to the leaderboard yet',
        'D. IFEval recently added harder constraints that only Qwen handles',
      ],
      answer: 1,
      explanation:
        'When six of the top 12 spots belong to one family and the spread is 2.9pp, benchmark overfitting is the most parsimonious explanation. IFBench, which uses OOD constraints, shows a completely different order.',
    },
    {
      q: 'FollowBench\'s Hard Satisfaction Rate (HSR) scores 1 only when ALL constraints in a prompt are satisfied simultaneously. Why does this matter?',
      options: [
        'A. HSR punishes models that are good at following only some constraint types',
        'B. It measures constraint conjunction — the exponential hardening that occurs when instructions combine, exposing constraint forgetting that per-constraint metrics hide',
        'C. It converts multi-constraint scores to single-constraint equivalents for easier comparison',
        'D. It rewards partial compliance, which IFEval does not',
      ],
      answer: 1,
      explanation:
        'Models satisfying 4 of 5 constraints score 0 on HSR. This captures constraint forgetting: models that look good per-constraint but quietly drop earlier requirements when the stack grows.',
    },
    {
      q: 'On IFBench, reasoning-augmented models like Grok 4.x score 82–83%; Claude models score 54–59%. What does this suggest?',
      options: [
        'A. Grok has been specifically fine-tuned against IFBench\'s 58 constraints',
        'B. Explicit reasoning at inference time helps models figure out how to satisfy novel, unfamiliar constraints that standard instruction-tuning never memorized',
        'C. Claude intentionally refuses to follow unusual constraint types for safety reasons',
        'D. The gap is explained by context window size differences',
      ],
      answer: 1,
      explanation:
        'IFBench constraints are OOD by design — no fine-tuning pipeline targeted them. The advantage of reasoning models suggests thinking-time constraint interpretation fills the gap that memorization cannot.',
    },
  ]

  return <QuizRenderer questions={questions} />
}

function QuizRenderer({ questions }: { questions: QItem[] }) {
  const [picked, setPicked] = useState<Record<number, number>>({})
  return (
    <div className="my-8 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-900">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Check yourself</p>
      <div className="flex flex-col gap-6">
        {questions.map((item, qi) => {
          const chosen = picked[qi]
          return (
            <div key={qi}>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-2">
                {qi + 1}. {item.q}
              </p>
              <div className="flex flex-col gap-1.5">
                {item.options.map((opt, oi) => {
                  const isChosen = chosen === oi
                  const isCorrect = oi === item.answer
                  let cls =
                    'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                  if (chosen !== undefined && isChosen && isCorrect)
                    cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                  else if (chosen !== undefined && isChosen && !isCorrect)
                    cls = 'border-red-500 bg-red-50 dark:bg-red-950/40'
                  else if (chosen !== undefined && isCorrect)
                    cls = 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                  return (
                    <button
                      key={oi}
                      onClick={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                      className={`text-left text-sm rounded-lg border px-3 py-2 transition-colors text-slate-700 dark:text-slate-200 ${cls}`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
              {chosen !== undefined && (
                <p className="text-xs mt-2 text-slate-600 dark:text-slate-400">
                  {chosen === item.answer ? '✓ ' : '✗ '}
                  {item.explanation}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
