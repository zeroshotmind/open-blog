'use client'

import { useState } from 'react'

// ─── SaturationViz ───────────────────────────────────────────────────────────
// Shows RewardBench v1 top models. Top-6 spread = 5.7 pts → SATURATED
// (models with <10B params dominate a benchmark designed for alignment quality).

const RB1_MODELS = [
  { name: 'Skywork-V2-Llama-8B-40M', score: 97.8 },
  { name: 'Skywork-V2-Llama-8B', score: 96.4 },
  { name: 'EvalPlanner-Llama-70B', score: 93.9 },
  { name: 'Skywork-V2-Qwen3-8B', score: 93.7 },
  { name: 'RM-R1-Qwen-32B', score: 92.9 },
  { name: 'INF-ORM-Llama3.1-70B', score: 92.1 },
]

const TOP6_SPREAD = 5.7
const THRESHOLD = 8.0

export function SaturationViz() {
  const saturated = TOP6_SPREAD < THRESHOLD
  const minBar = 88
  const maxBar = 100
  const range = maxBar - minBar

  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          RewardBench v1 · Top Models
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
        arXiv 2403.13787 · Allen AI · top-6 spread = {TOP6_SPREAD} pts (threshold {THRESHOLD})
      </p>
      <div className="flex flex-col gap-2.5">
        {RB1_MODELS.map((m) => {
          const pct = ((m.score - minBar) / range) * 100
          const isSmall = m.name.includes('8B') || m.name.includes('3B')
          return (
            <div key={m.name} className="flex items-center gap-3">
              <div className="w-44 text-xs text-slate-600 dark:text-slate-300 truncate text-right font-mono">
                {m.name}
              </div>
              <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isSmall
                      ? 'bg-amber-400 dark:bg-amber-500'
                      : 'bg-blue-400 dark:bg-blue-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-10 text-xs text-right text-slate-700 dark:text-slate-200 font-mono">
                  {m.score.toFixed(1)}
                </div>
                {isSmall && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">≤8B</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
        Amber bars = models with ≤8B parameters. 16 of the top 20 models share the same base model
        (per Skywork-V2 paper). Progress stagnated; the benchmark lost signal.
      </p>
    </div>
  )
}

// ─── RB2Viz ──────────────────────────────────────────────────────────────────
// Shows RewardBench 2 top scores. Not saturated — spread is real.

const RB2_MODELS = [
  { name: 'Skywork-V2-Llama-8B', score: 84.1 },
  { name: 'LMUnit-qwen2.5-72b', score: 82.1 },
  { name: 'LMUnit-llama3.1-70b', score: 80.5 },
  { name: 'Gemini-2.5-Flash', score: 77.2 },
  { name: 'Claude-Opus-4', score: 76.5 },
  { name: 'Skywork-Reward-Gemma-2-27B', score: 75.8 },
]

export function RB2Viz() {
  const spread = RB2_MODELS[0].score - RB2_MODELS[RB2_MODELS.length - 1].score
  const minBar = 70
  const maxBar = 90
  const range = maxBar - minBar

  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          RewardBench 2 · Top Models
        </p>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          not saturated
        </span>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
        arXiv 2506.01937 · ICLR 2026 · top-6 spread = {spread.toFixed(1)} pts
      </p>
      <div className="flex flex-col gap-2.5">
        {RB2_MODELS.map((m) => {
          const pct = ((m.score - minBar) / range) * 100
          return (
            <div key={m.name} className="flex items-center gap-3">
              <div className="w-44 text-xs text-slate-600 dark:text-slate-300 truncate text-right font-mono">
                {m.name}
              </div>
              <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 dark:bg-blue-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-10 text-xs text-right text-slate-700 dark:text-slate-200 font-mono">
                {m.score.toFixed(1)}
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
        Models score ~20 points lower than on v1. The 8.3-point spread across top 6 is real signal.
        Benchmark correlates with downstream BoN and RLHF performance (Pearson r ≈ 0.87).
      </p>
    </div>
  )
}

// ─── Quiz ────────────────────────────────────────────────────────────────────

type QItem = { q: string; options: string[]; answer: number; explanation: string }

export function Quiz() {
  const questions: QItem[] = [
    {
      q: 'The Skywork-V2-Llama-8B-40M model scores 97.8 on RewardBench v1. What does this reveal about the benchmark?',
      options: [
        'A. 8B reward models are better than 70B models for alignment',
        'B. v1 has saturated — small specialist models can game its pairwise format, signalling the benchmark no longer tracks real alignment quality',
        'C. The model was trained on the RewardBench test set',
        'D. Llama 3.1 is fundamentally superior for reward modeling',
      ],
      answer: 1,
      explanation:
        'When a small specialist model tops a leaderboard with a 5.7-point spread, and 16 of the top 20 models share the same base model, the benchmark has stopped discriminating on the dimension it was designed to measure.',
    },
    {
      q: 'RewardBench 2 models score ~20 points lower than on v1. Why?',
      options: [
        'A. v2 uses a different scoring scale',
        'B. v2 uses unseen human prompts and a best-of-4 format instead of best-of-2, making it harder to exploit by pattern-matching',
        'C. v2 only evaluates safety, a harder domain',
        'D. v2 penalises models for generating long responses',
      ],
      answer: 1,
      explanation:
        'v2 sources new prompts from WildChat (not recycled from downstream evals), adds three new domains (factuality, instruction following, ties), and requires the RM to identify the best response from 4 candidates rather than 2.',
    },
    {
      q: 'RM-Bench found that SOTA models drop below 50% accuracy when facing style bias interference. Why is 50% the critical threshold?',
      options: [
        'A. Human preference agreement averages 50%',
        'B. 50% is random-chance performance on a binary choice — falling below it means the model is actively choosing the worse response',
        'C. 50% is the RM-Bench passing grade set by the authors',
        'D. Models are randomly failing half the safety test cases',
      ],
      answer: 1,
      explanation:
        'RM-Bench tests whether an RM can identify the better response when the worse response is stylistically longer or more polished. Scoring below 50% means style bias overrides content quality — worse than a coin flip.',
    },
    {
      q: 'Why does RewardBench 2 include a "Ties" domain where both responses are equivalently valid?',
      options: [
        'A. To test whether reward models can abstain from scoring',
        'B. To measure calibration — an RM should assign similar scores to genuinely equivalent outputs, not confidently pick one',
        'C. To create a control group for statistical significance',
        'D. To evaluate models on ambiguous safety scenarios',
      ],
      answer: 1,
      explanation:
        'If an RM confidently prefers "red" over "green" when both are valid colors of the rainbow, it is miscalibrated. The Ties domain catches RMs that rank by superficial features rather than genuine quality differences.',
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
