'use client'

import { useState } from 'react'

// ─── ArenaEloViz ─────────────────────────────────────────────────────────────
// LMArena (Chatbot Arena) top-10 Elo scores, July 2026.

const ARENA_MODELS = [
  { name: 'Claude Opus 4.6', score: 1500, lab: 'Anthropic' },
  { name: 'Claude Fable 5', score: 1494, lab: 'Anthropic' },
  { name: 'Claude Opus 4.7', score: 1489, lab: 'Anthropic' },
  { name: 'Gemini 3.5 Flash', score: 1480, lab: 'Google' },
  { name: 'Gemini 3.1 Pro', score: 1480, lab: 'Google' },
  { name: 'Gemini 3 Pro', score: 1479, lab: 'Google' },
  { name: 'Qwen3.7 Max Thinking', score: 1475, lab: 'Alibaba' },
  { name: 'GPT-5.4', score: 1470, lab: 'OpenAI' },
  { name: 'GLM-5.1', score: 1468, lab: 'Z.ai' },
  { name: 'GPT-5.5', score: 1468, lab: 'OpenAI' },
]

const LAB_COLORS: Record<string, string> = {
  Anthropic: 'bg-amber-400 dark:bg-amber-500',
  Google: 'bg-blue-400 dark:bg-blue-500',
  OpenAI: 'bg-emerald-400 dark:bg-emerald-500',
  Alibaba: 'bg-violet-400 dark:bg-violet-500',
  'Z.ai': 'bg-slate-400 dark:bg-slate-500',
}

const TOP10_ELO_SPREAD = 1500 - 1468

export function ArenaEloViz() {
  const minBar = 1460
  const maxBar = 1510
  const range = maxBar - minBar

  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          LMArena (arena.ai) · Overall Elo — Top 10
        </p>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          not saturated
        </span>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
        source: metatext.io · 192 models · top-10 spread = {TOP10_ELO_SPREAD} Elo · full range = 528 Elo
      </p>
      <div className="flex flex-col gap-2.5">
        {ARENA_MODELS.map((m) => {
          const pct = ((m.score - minBar) / range) * 100
          const barColor = LAB_COLORS[m.lab] ?? 'bg-slate-400'
          return (
            <div key={m.name} className="flex items-center gap-3">
              <div className="w-36 text-xs text-slate-600 dark:text-slate-300 truncate text-right font-mono">
                {m.name}
              </div>
              <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-12 text-xs text-right text-slate-700 dark:text-slate-200 font-mono">
                {m.score}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-3">
        {Object.entries(LAB_COLORS).map(([lab, cls]) => (
          <div key={lab} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${cls}`} />
            <span className="text-xs text-slate-500 dark:text-slate-400">{lab}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
        Top-3 are all Anthropic. Top-10 span 32 Elo — tight but statistically meaningful with
        millions of votes. The full leaderboard spans 528 Elo, showing the benchmark still
        separates good models from bad ones.
      </p>
    </div>
  )
}

// ─── BenchmarkStatusTable ────────────────────────────────────────────────────
// Saturation states across the four chat/arena benchmarks.

type BRow = {
  name: string
  type: string
  topScore: string
  spread: string
  saturated: boolean
  notes: string
}

const BENCH_ROWS: BRow[] = [
  {
    name: 'LMArena Elo',
    type: 'Human pairwise voting',
    topScore: '1500',
    spread: '528 (full) / 32 (top-10)',
    saturated: false,
    notes: 'Grows with votes; still discriminates broadly',
  },
  {
    name: 'MT-Bench',
    type: 'GPT-4 judge, 1–10 scale',
    topScore: '≥9.0',
    spread: '<1.0 at frontier',
    saturated: true,
    notes: 'Top frontier models cluster; useful for ≤7B models only',
  },
  {
    name: 'AlpacaEval 2.0',
    type: 'LC win rate vs reference',
    topScore: '>95%',
    spread: '<5pp at frontier',
    saturated: true,
    notes: 'Frontier models all above 95%; superseded by Arena-Hard-Auto',
  },
  {
    name: 'WildBench',
    type: 'Task-checklist, WB-Score',
    topScore: '68.5%',
    spread: '~10pp top-10',
    saturated: false,
    notes: 'Real user prompts; still discriminates at the frontier',
  },
]

export function BenchmarkStatusTable() {
  return (
    <div className="my-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <th className="text-left px-4 py-2.5 font-medium">Benchmark</th>
            <th className="text-left px-4 py-2.5 font-medium">Method</th>
            <th className="text-right px-4 py-2.5 font-medium">Top score</th>
            <th className="text-center px-4 py-2.5 font-medium">Saturated?</th>
            <th className="text-left px-4 py-2.5 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {BENCH_ROWS.map((r) => (
            <tr
              key={r.name}
              className="border-t border-slate-100 dark:border-slate-800"
            >
              <td className="px-4 py-2.5 font-mono text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap">
                {r.name}
              </td>
              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{r.type}</td>
              <td className="px-4 py-2.5 text-right font-mono text-slate-700 dark:text-slate-200">
                {r.topScore}
              </td>
              <td className="px-4 py-2.5 text-center">
                <span
                  className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                    r.saturated
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  }`}
                >
                  {r.saturated ? 'yes' : 'no'}
                </span>
              </td>
              <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Quiz ────────────────────────────────────────────────────────────────────

type QItem = { q: string; options: string[]; answer: number; explanation: string }

export function Quiz() {
  const questions: QItem[] = [
    {
      q: 'LMArena derives model rankings using Bradley-Terry Elo from pairwise human votes. What is the key property that makes this more sensitive than a rubric score?',
      options: [
        'A. Humans are more consistent than LLM judges',
        'B. Each pairwise comparison contributes a small signal; with millions of votes, consistent quality differences accumulate into statistically significant Elo gaps even when absolute quality differences are small',
        'C. Elo normalizes for model length, preventing verbose models from winning',
        'D. Pairwise voting eliminates the need for a reference answer',
      ],
      answer: 1,
      explanation:
        'A rubric score hits a ceiling when all models score near-maximum. Elo has no ceiling — it keeps spreading models out as long as one consistently beats another in pairwise comparisons, with vote volume tightening confidence intervals.',
    },
    {
      q: 'MT-Bench uses GPT-4 as a judge on an 8-category, 2-turn format. Why is it now more useful for evaluating small open-source models than frontier ones?',
      options: [
        'A. MT-Bench only evaluates open-source models by design',
        'B. Frontier models have converged above 9.0/10, where remaining variance is judge noise rather than real quality differences; smaller models still score 7–8.5 where the scale discriminates',
        'C. GPT-4 is biased toward open-source models as the judge',
        'D. Frontier models refuse some MT-Bench questions for safety reasons',
      ],
      answer: 1,
      explanation:
        'When top closed models cluster above 9/10, the residual spread is dominated by GPT-4\'s scoring inconsistency, not genuine quality differences. The benchmark is saturated at the frontier but still meaningful for models with more headroom below that ceiling.',
    },
    {
      q: 'AlpacaEval 2.0 uses length-controlled (LC) win rates to address a known bias. What bias does LC win rate fix?',
      options: [
        'A. Models that generate shorter responses are unfairly penalized by human evaluators',
        'B. GPT-4 Turbo systematically prefers longer responses as the judge, even when they\'re not higher quality — LC win rate statistically removes the length effect from the preference score',
        'C. Shorter context windows bias results toward certain model families',
        'D. Multilingual models are penalized for writing in English',
      ],
      answer: 1,
      explanation:
        'LLM judges (including GPT-4 Turbo) have a length bias — longer is often rated as better regardless of content quality. AlpacaEval 2.0\'s LC metric regresses out length, producing a score that reflects quality independent of verbosity.',
    },
    {
      q: 'WildBench sources tasks from real user conversations rather than synthetic prompts. What advantage does this provide over MT-Bench-style synthetic evaluations?',
      options: [
        'A. Real prompts are always harder than synthetic ones',
        'B. It reduces the risk that models are trained on the exact prompts in the benchmark, and the task distribution reflects actual user intent rather than the evaluator\'s assumptions about what matters',
        'C. Real prompts can be automatically verified without a judge',
        'D. User-sourced prompts are shorter and faster to evaluate',
      ],
      answer: 1,
      explanation:
        'Synthetic benchmarks risk contamination — models may train on similar prompts. Real user prompts also cover the long tail of actual use cases, including the messy, underspecified requests that synthetic benchmarks tend to omit.',
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
