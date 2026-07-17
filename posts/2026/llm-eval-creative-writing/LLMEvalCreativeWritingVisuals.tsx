'use client'

import { useState } from 'react'

// ─── SaturationViz ───────────────────────────────────────────────────────────
// Shows CW v3 rubric scores (out of 20). Top-10 spread = 0.35 → SATURATED.

const CW_MODELS = [
  { name: 'gpt-5.5', score: 17.01 },
  { name: 'claude-fable-5', score: 16.81 },
  { name: 'gpt-5.6-sol', score: 16.78 },
  { name: 'claude-opus-4-8', score: 16.66 },
  { name: 'claude-opus-4-7', score: 16.57 },
  { name: 'claude-sonnet-4-6', score: 16.50 },
  { name: 'o3', score: 16.28 },
  { name: 'DeepSeek-R1', score: 15.68 },
]

const TOP10_SPREAD = 0.35
const THRESHOLD = 1.0

export function SaturationViz() {
  const saturated = TOP10_SPREAD < THRESHOLD
  const minBar = 14.8
  const maxBar = 17.4
  const range = maxBar - minBar

  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          EQ-Bench CW v3 · Rubric Score (/20)
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
        judge = Claude Sonnet 4.6 · n = 111 · top-10 spread = {TOP10_SPREAD} pts (threshold {THRESHOLD})
      </p>
      <div className="flex flex-col gap-2.5">
        {CW_MODELS.map((m) => {
          const pct = ((m.score - minBar) / range) * 100
          return (
            <div key={m.name} className="flex items-center gap-3">
              <div className="w-36 text-xs text-slate-600 dark:text-slate-300 truncate text-right font-mono">
                {m.name}
              </div>
              <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 dark:bg-amber-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-10 text-xs text-right text-slate-700 dark:text-slate-200 font-mono">
                {m.score.toFixed(2)}
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
        The rubric can't separate the top cluster — all sit within 0.35 points. Elo spread
        (313 pts) still discriminates. The judge can no longer rank by rubric alone.
      </p>
    </div>
  )
}

// ─── EloVsRubricTable ────────────────────────────────────────────────────────

export function EloVsRubricTable() {
  const rows = [
    { model: 'gpt-5.6-sol', elo: 2208, rubric: 16.78, slop: 11.68 },
    { model: 'claude-fable-5', elo: 2156, rubric: 16.81, slop: 10.28 },
    { model: 'claude-opus-4-7', elo: 2083, rubric: 16.57, slop: 11.09 },
    { model: 'gpt-5.5', elo: 1954, rubric: 17.01, slop: 13.10 },
    { model: 'claude-opus-4-8', elo: 1944, rubric: 16.66, slop: 13.16 },
    { model: 'claude-sonnet-4-6', elo: 1895, rubric: 16.50, slop: 9.90 },
    { model: 'o3', elo: 1732, rubric: 16.28, slop: 17.33 },
    { model: 'DeepSeek-R1', elo: 1500, rubric: 15.68, slop: 31.21 },
  ]

  return (
    <div className="my-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <th className="text-left px-4 py-2.5 font-medium">Model</th>
            <th className="text-right px-4 py-2.5 font-medium">Elo</th>
            <th className="text-right px-4 py-2.5 font-medium">Rubric/20</th>
            <th className="text-right px-4 py-2.5 font-medium">Slop/1k</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.model}
              className={`border-t border-slate-100 dark:border-slate-800 ${
                r.model === 'gpt-5.5'
                  ? 'bg-amber-50/50 dark:bg-amber-900/10'
                  : ''
              }`}
            >
              <td className="px-4 py-2 text-slate-700 dark:text-slate-200 font-mono">{r.model}</td>
              <td className="px-4 py-2 text-right text-slate-700 dark:text-slate-200">{r.elo}</td>
              <td className={`px-4 py-2 text-right font-medium ${r.model === 'gpt-5.5' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'}`}>
                {r.rubric.toFixed(2)}
              </td>
              <td className={`px-4 py-2 text-right ${r.slop > 20 ? 'text-red-500 dark:text-red-400 font-medium' : 'text-slate-600 dark:text-slate-300'}`}>
                {r.slop.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-slate-400 dark:text-slate-500 px-4 py-2 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800">
        Amber row: highest rubric score ≠ highest Elo. Red slop: above 20/1k words.
      </p>
    </div>
  )
}

// ─── Quiz ────────────────────────────────────────────────────────────────────

type QItem = { q: string; options: string[]; answer: number; explanation: string }

export function Quiz() {
  const questions: QItem[] = [
    {
      q: 'EQ-Bench CW v3 has a top-10 rubric spread of 0.35 pts and a top-10 Elo spread of 313 pts. What does this tell you?',
      options: [
        'A. The rubric is wrong and Elo should replace it',
        'B. The rubric is saturated — it cannot distinguish top models — but Elo still can',
        'C. Elo is inflated because of bot voting',
        'D. The benchmark needs a higher maximum score',
      ],
      answer: 1,
      explanation:
        'Rubric scores cluster within 0.35 pts, below the saturation threshold. Elo, derived from pairwise comparisons, still separates models by 313 pts — they measure different signal.',
    },
    {
      q: 'Why did EQ-Bench redesign CW from v2 to v3?',
      options: [
        'A. The judge model was deprecated',
        'B. A 9B community fine-tune tied GPT-4o in v2, signalling the benchmark could no longer separate top models',
        'C. The dataset was leaked',
        'D. v2 used human judges who were too slow',
      ],
      answer: 1,
      explanation:
        'v2 top-10 spread was 3.83 pts and a small fine-tune matched a frontier model. The maintainer explicitly cited saturation as the redesign motivation.',
    },
    {
      q: 'What does the "slop" metric measure, and why does it matter?',
      options: [
        'A. Grammar errors per thousand words',
        'B. Overused LLM phrases and formulaic patterns — a signal of generic, non-distinctive prose',
        'C. The number of hallucinated facts in creative text',
        'D. Token count relative to prompt length',
      ],
      answer: 1,
      explanation:
        'Slop counts clichéd phrases (e.g., "tapestry of", "not X but Y") per 1k words. Human baseline is 6.90; most LLMs score 10–40, with DeepSeek-R1 at 31.21.',
    },
    {
      q: 'The self-preference bias paper (arXiv 2410.21819) found that LLM judges prefer texts "more familiar to them, regardless of whether outputs were self-generated." Why does this matter for creative writing evaluation?',
      options: [
        'A. It means self-hosted judges are cheaper but less biased',
        'B. A model judging its own style will systematically overrate stylistically similar outputs, distorting leaderboard rankings',
        'C. It shows LLMs can accurately rank creative writing without human feedback',
        'D. It implies all creative writing benchmarks should use n-gram metrics instead',
      ],
      answer: 1,
      explanation:
        'If the judge has stylistic affinities, it scores familiar prose higher — not necessarily better prose. EQ-Bench does not control for this.',
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
