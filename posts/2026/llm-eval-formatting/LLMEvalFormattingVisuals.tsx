'use client'

import { useState } from 'react'

// ─── IFEvalVsIFBenchViz ──────────────────────────────────────────────────────
// Shows the generalization gap between IFEval and IFBench scores.

const IFEVAL_MODELS = [
  { name: 'Qwen3.5-27B', ifeval: 0.950, ifbench: null },
  { name: 'Qwen3.7-Plus', ifeval: 0.946, ifbench: null },
  { name: 'Qwen3.6 Plus', ifeval: 0.943, ifbench: null },
  { name: 'o3-mini', ifeval: 0.939, ifbench: null },
  { name: 'Claude 3.7 Sonnet', ifeval: 0.932, ifbench: null },
]

const IFBENCH_MODELS = [
  { name: 'Grok 4.3', score: 0.833 },
  { name: 'Grok 4.20 (Reasoning)', score: 0.829 },
  { name: 'MiniMax-M3', score: 0.829 },
  { name: 'Gemini 3 Flash (R)', score: 0.780 },
  { name: 'GPT-5.5 (xhigh)', score: 0.759 },
  { name: 'Claude Opus 4.7', score: 0.586 },
  { name: 'Claude Sonnet 4.6', score: 0.558 },
  { name: 'Claude 4.5 Haiku', score: 0.543 },
]

export function IFBenchViz() {
  const [show, setShow] = useState<'ifeval' | 'ifbench'>('ifbench')

  const ifbenchSpread = IFBENCH_MODELS[0].score - IFBENCH_MODELS[IFBENCH_MODELS.length - 1].score
  const ifevalSpread = IFEVAL_MODELS[0].ifeval - IFEVAL_MODELS[IFEVAL_MODELS.length - 1].ifeval

  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Instruction Following: {show === 'ifeval' ? 'IFEval (in-distribution)' : 'IFBench (out-of-distribution)'}
        </p>
        <div className="flex gap-1.5">
          {(['ifeval', 'ifbench'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setShow(t)}
              className={`text-xs rounded-lg px-3 py-1 border transition-colors ${
                show === t
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'
              }`}
            >
              {t === 'ifeval' ? 'IFEval' : 'IFBench'}
            </button>
          ))}
        </div>
      </div>

      {show === 'ifeval' ? (
        <>
          <div className="flex flex-col gap-2.5">
            {IFEVAL_MODELS.map((m) => (
              <div key={m.name} className="flex items-center gap-3">
                <div className="w-36 text-xs text-slate-600 dark:text-slate-300 truncate text-right font-mono">
                  {m.name}
                </div>
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 dark:bg-amber-500"
                    style={{ width: `${m.ifeval * 100}%` }}
                  />
                </div>
                <div className="w-12 text-xs text-right text-slate-700 dark:text-slate-200 font-mono">
                  {(m.ifeval * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            Top-5 spread: <span className="font-semibold">{(ifevalSpread * 100).toFixed(1)}pp</span> — models are
            clustered near the ceiling.{' '}
            <span className="font-semibold text-amber-600 dark:text-amber-400">SATURATED</span>
          </p>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            {IFBENCH_MODELS.map((m) => (
              <div key={m.name} className="flex items-center gap-3">
                <div className="w-40 text-xs text-slate-600 dark:text-slate-300 truncate text-right font-mono">
                  {m.name}
                </div>
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 dark:bg-blue-400"
                    style={{ width: `${m.score * 100}%` }}
                  />
                </div>
                <div className="w-12 text-xs text-right text-slate-700 dark:text-slate-200 font-mono">
                  {(m.score * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            Top-to-bottom spread:{' '}
            <span className="font-semibold">{(ifbenchSpread * 100).toFixed(1)}pp</span> — Grok leads at 83.3%; Claude
            models cluster at 54–59%. Not saturated.
          </p>
        </>
      )}
    </div>
  )
}

// ─── SOBViz ──────────────────────────────────────────────────────────────────
// Shows the JSON Pass Rate vs Value Accuracy gap (SOB benchmark, arXiv 2604.25359)

const SOB_MODELS = [
  { name: 'GPT-5.4', jsonPass: 0.993, valAcc: 0.798 },
  { name: 'Gemini-2.5-Flash', jsonPass: 0.972, valAcc: 0.796 },
  { name: 'Claude-Sonnet-4.6', jsonPass: 0.979, valAcc: 0.779 },
  { name: 'GPT-4.1', jsonPass: 0.969, valAcc: 0.783 },
  { name: 'GPT-5', jsonPass: 0.983, valAcc: 0.769 },
  { name: 'GPT-5-Mini', jsonPass: 0.972, valAcc: 0.751 },
  { name: 'Gemini-3-Flash', jsonPass: 0.939, valAcc: 0.773 },
]

export function SOBViz() {
  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
        SOB: JSON Pass Rate vs Value Accuracy
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
        arXiv 2604.25359 · 21 models · text modality
      </p>
      <div className="flex flex-col gap-3">
        {SOB_MODELS.map((m) => (
          <div key={m.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-300">{m.name}</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs w-24 text-slate-400 dark:text-slate-500">JSON Pass</span>
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400 dark:bg-emerald-500"
                    style={{ width: `${m.jsonPass * 100}%` }}
                  />
                </div>
                <span className="text-xs w-10 text-right font-mono text-slate-600 dark:text-slate-300">
                  {(m.jsonPass * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs w-24 text-slate-400 dark:text-slate-500">Val. Acc.</span>
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500 dark:bg-violet-400"
                    style={{ width: `${m.valAcc * 100}%` }}
                  />
                </div>
                <span className="text-xs w-10 text-right font-mono text-slate-600 dark:text-slate-300">
                  {(m.valAcc * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
        Every model exceeds 84% JSON pass rate. No model exceeds 80.4% value accuracy. The gap is
        structured-output hallucination — JSON that validates but contains wrong field values.
      </p>
    </div>
  )
}

// ─── SampleTasks ─────────────────────────────────────────────────────────────
// Real IFEval prompts (formatting-focused) from google-research/instruction_following_eval

const FORMAT_SAMPLES = [
  {
    key: '1075',
    prompt:
      "Can you help me make an advertisement for a new product? It's a diaper that's designed to be more comfortable for babies and I want the entire output in JSON format.",
    constraints: ['detectable_format:json_format'],
    note: 'The entire response must be valid JSON — no surrounding text allowed.',
  },
  {
    key: '1021',
    prompt:
      'Write a 2 paragraph critique of the following sentence in all capital letters, no lowercase letters allowed: "If the law is bad, you should not follow it". Label each paragraph with PARAGRAPH X.',
    constraints: [
      'change_case:english_capital',
      'detectable_format:multiple_sections (PARAGRAPH, 2)',
    ],
  },
  {
    key: '1219',
    prompt:
      'Which one is a better brand for sneakers: Prada or Nike? Your entire response should be in English, and in all capital letters. At the end of your response, please explicitly add a postscript starting with P.S. The word sneaker should appear 10 or more times in your response.',
    constraints: [
      'change_case:english_capital',
      'detectable_content:postscript (marker=P.S.)',
      'keywords:frequency (sneaker ≥10)',
    ],
  },
  {
    key: '1132',
    prompt:
      'Write the lyrics to a hit song by the rock band \'The Gifted and The Not Gifted\'. To make it rocky, the response should be in all capital letters. The word "rock" should not appear in your response.',
    constraints: [
      'change_case:english_capital',
      'keywords:forbidden_words (rock)',
    ],
    note: 'Three simultaneously verifiable constraints: case, format, and forbidden word.',
  },
]

export function SampleTasks() {
  return (
    <div className="my-6 flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          What IFEval constraints actually look like
        </p>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          — 4 real prompts from the dataset (google-research/instruction_following_eval)
        </span>
      </div>
      {FORMAT_SAMPLES.map((task) => (
        <div
          key={task.key}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4"
        >
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">
            key {task.key}
          </div>
          <pre className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap font-mono bg-slate-50 dark:bg-slate-800 rounded-lg p-3 overflow-x-auto leading-relaxed">
            {task.prompt}
          </pre>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {task.constraints.map((c, ci) => (
              <span
                key={ci}
                className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded px-2 py-0.5 font-mono"
              >
                {c}
              </span>
            ))}
          </div>
          {task.note && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">{task.note}</p>
          )}
        </div>
      ))}
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Source:{' '}
        <a
          href="https://github.com/google-research/google-research/tree/master/instruction_following_eval"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          google-research/instruction_following_eval
        </a>{' '}
        · input_data.jsonl · Apache 2.0
      </p>
    </div>
  )
}

// ─── Quiz ────────────────────────────────────────────────────────────────────

type QItem = { q: string; options: string[]; answer: number; explanation: string }

export function Quiz() {
  const questions: QItem[] = [
    {
      q: 'IFEval top-5 models all score above 93%. What does this mean for using IFEval to compare frontier models?',
      options: [
        'A. All frontier models have solved instruction following',
        'B. IFEval is saturated at the top — it cannot discriminate between these models',
        'C. The benchmark is incorrectly graded',
        'D. Models with smaller parameter counts are catching up',
      ],
      answer: 1,
      explanation:
        'A 1.8pp spread across the top 5 is within measurement noise. IFEval still separates capable from weak models, but loses resolution at the frontier.',
    },
    {
      q: 'GPT-4.1 scored above 87% on IFEval but below 50% on IFBench. What explains this?',
      options: [
        'A. GPT-4.1 was updated between the two evaluations',
        'B. Models strongly overfit to the fixed constraint types in IFEval and cannot generalize to out-of-distribution constraints',
        'C. IFBench is adversarial and therefore not a valid benchmark',
        'D. Human annotators gave different scores on the two benchmarks',
      ],
      answer: 1,
      explanation:
        'IFBench uses 58 novel, unseen constraint types. Models that memorized IFEval-style constraints cannot generalize — this is the core finding of arXiv 2507.02833.',
    },
    {
      q: 'What does the SOB benchmark reveal that schema-only validation misses?',
      options: [
        'A. Models cannot parse JSON reliably',
        'B. JSON can be structurally valid but contain wrong leaf values — value accuracy and schema compliance are separate problems',
        'C. Constrained decoding hurts reasoning quality',
        'D. Models are slower when forced to output JSON',
      ],
      answer: 1,
      explanation:
        'Every model in SOB exceeded 84% JSON pass rate. No model exceeded 80.4% value accuracy. The gap — valid structure, wrong values — is invisible to schema-only benchmarks.',
    },
    {
      q: 'What does FollowBench\'s Hard Satisfaction Rate (HSR) measure, and why is it stricter than per-constraint accuracy?',
      options: [
        'A. The fraction of prompts where at least one constraint is satisfied',
        'B. The fraction of prompts where ALL constraints are simultaneously satisfied — partial credit for missing one counts as failure',
        'C. Constraint accuracy weighted by constraint difficulty',
        'D. Human satisfaction scores on a 1–5 scale',
      ],
      answer: 1,
      explanation:
        'HSR is all-or-nothing: if a model satisfies 4 of 5 constraints, it scores 0 on that prompt. This penalizes models that do well on individual constraints but drift on multi-constraint prompts.',
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
