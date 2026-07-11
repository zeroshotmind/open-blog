'use client'

import { useState } from 'react'

// ─── FeatureStoreViz ────────────────────────────────────────────────────────

export function FeatureStoreViz() {
  const [path, setPath] = useState<'train' | 'serve'>('serve')
  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
        One feature definition, two read paths — toggle
      </p>
      <div className="flex gap-2 mb-4">
        {(['serve', 'train'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPath(p)}
            className={`text-xs rounded-lg px-3 py-1.5 border transition-colors ${
              path === p ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'
            }`}
          >
            {p === 'serve' ? 'Serving read' : 'Training read'}
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="rounded-lg bg-slate-800 text-white text-center text-xs px-4 py-2 w-full max-w-xs">
          Feature definition (written once)
        </div>
        <div className="text-slate-400">↓ materialized to both ↓</div>
        <div className="flex gap-3 w-full">
          <div className={`flex-1 rounded-lg border-2 p-3 transition-all ${path === 'serve' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-slate-200 dark:border-slate-700 opacity-60'}`}>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Online store</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Redis / DynamoDB · latest value per entity · ~1ms reads</p>
          </div>
          <div className={`flex-1 rounded-lg border-2 p-3 transition-all ${path === 'train' ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-slate-200 dark:border-slate-700 opacity-60'}`}>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Offline store</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Warehouse · full history · point-in-time-correct joins</p>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-600 dark:text-slate-300">
        {path === 'serve'
          ? 'Serving reads the latest feature value under a millisecond budget. The model gets exactly what training saw — no skew.'
          : 'Training reads the value as it was at label time (point-in-time correctness). Using the current value would leak the future.'}
      </div>
    </div>
  )
}

// ─── TrainingParallelismViz ─────────────────────────────────────────────────

export function TrainingParallelismViz() {
  const [mode, setMode] = useState<'data' | 'model'>('data')
  const gpus = [0, 1, 2, 3]
  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <div className="flex gap-2 mb-4">
        {(['data', 'model'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`text-xs rounded-lg px-3 py-1.5 border transition-colors ${
              mode === m ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'
            }`}
          >
            {m === 'data' ? 'Data parallelism' : 'Model parallelism'}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {gpus.map((g) => (
          <div key={g} className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-center">
            <p className="text-[10px] text-slate-400 mb-1">GPU {g}</p>
            {mode === 'data' ? (
              <>
                <div className="rounded bg-emerald-500 text-white text-[10px] py-1 mb-1">full model</div>
                <div className="rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] py-1">batch shard {g}</div>
              </>
            ) : (
              <>
                <div className="rounded bg-violet-500 text-white text-[10px] py-1 mb-1">layers {g * 2}–{g * 2 + 1}</div>
                <div className="rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] py-1">same batch</div>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-600 dark:text-slate-300">
        {mode === 'data'
          ? 'Every GPU holds the full model, processes a different batch shard; gradients are all-reduced each step. Default choice — needs the model to fit on one GPU.'
          : 'The model is split across GPUs (tensor/pipeline). Use only when the model does not fit on a single device; more communication, pipeline "bubbles" to manage.'}
      </div>
    </div>
  )
}

// ─── Quiz ───────────────────────────────────────────────────────────────────

type QItem = { q: string; options: string[]; answer: number; explanation: string }

export function Quiz() {
  const questions: QItem[] = [
    {
      q: 'The primary problem a feature store solves is:',
      options: [
        'A. Faster GPUs',
        'B. Training/serving skew — one feature definition materialized to online and offline stores',
        'C. Model compression',
        'D. Hyperparameter tuning',
      ],
      answer: 1,
      explanation: 'A feature store makes training and serving read the same feature logic from a single source of truth.',
    },
    {
      q: 'Point-in-time-correct joins in the offline store prevent:',
      options: [
        'A. Slow reads',
        'B. Leaking future feature values into training labels',
        'C. Class imbalance',
        'D. GPU out-of-memory',
      ],
      answer: 1,
      explanation: 'You must join the feature value as it was at label time; using the current value leaks the future and inflates offline metrics.',
    },
    {
      q: 'Which should you reach for first when scaling training?',
      options: [
        'A. Model parallelism',
        'B. Data parallelism (if the model fits on one GPU)',
        'C. Quantization',
        'D. Pipeline parallelism',
      ],
      answer: 1,
      explanation: 'Data parallelism is simpler and scales throughput near-linearly; model parallelism is only needed when the model won’t fit on a device.',
    },
    {
      q: 'Why do social/marketplace ML A/B tests often need cluster or geo randomization?',
      options: [
        'A. To reduce compute cost',
        'B. Treating some users changes control users’ experience (interference), breaking independence',
        'C. Users lie about their behavior',
        'D. It speeds up the test',
      ],
      answer: 1,
      explanation: 'Network effects mean treatment leaks into control under user-level randomization; clustering isolates the effect.',
    },
    {
      q: 'What does a long-term holdout group guard against?',
      options: [
        'A. Server crashes',
        'B. Short-term metric gains that erode long-term outcomes like retention',
        'C. Label noise',
        'D. Cold start',
      ],
      answer: 1,
      explanation: 'A months-long holdout measures cumulative effect, catching models that lift clicks now but hurt retention later.',
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
                  let cls = 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                  if (chosen !== undefined && isChosen && isCorrect) cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                  else if (chosen !== undefined && isChosen && !isCorrect) cls = 'border-red-500 bg-red-50 dark:bg-red-950/40'
                  else if (chosen !== undefined && isCorrect) cls = 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
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
