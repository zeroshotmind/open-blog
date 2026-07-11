'use client'

import { useState } from 'react'

// ─── LatencyTradeoffViz ─────────────────────────────────────────────────────

export function LatencyTradeoffViz() {
  const [budget, setBudget] = useState(10)
  // model tiers unlocked by latency budget
  const tiers = [
    { max: 5, name: 'Linear / GBDT on cached features', acc: 82, note: 'Precomputed features + one cheap pass' },
    { max: 20, name: 'Shallow DNN + a few real-time features', acc: 90, note: 'Room for a small model and fresh signals' },
    { max: 60, name: 'Deep model + rich cross features', acc: 94, note: 'Heavier network, more feature assembly' },
    { max: 999, name: 'Ensemble / async deep check', acc: 96, note: 'Only viable off the synchronous path' },
  ]
  const active = tiers.find((t) => budget <= t.max) ?? tiers[tiers.length - 1]

  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
        Latency budget dictates the model you can afford
      </p>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-slate-400 w-16">1ms</span>
        <input
          type="range"
          min={1}
          max={120}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="flex-1 accent-blue-600"
        />
        <span className="text-xs text-slate-400 w-16 text-right">120ms</span>
      </div>
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-mono text-sm text-blue-600 dark:text-blue-400">budget = {budget}ms</span>
        <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">~{active.acc}% of ceiling accuracy</span>
      </div>
      <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{active.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{active.note}</p>
      </div>
      <p className="text-xs text-slate-400 mt-3">
        Below ~10ms (real-time bidding) you are forced onto cached features + a cheap model; accuracy gains beyond that need an async path.
      </p>
    </div>
  )
}

// ─── StreamProcessingViz ────────────────────────────────────────────────────

export function StreamProcessingViz() {
  const stages = [
    { name: 'Event', sub: 'transaction / bid request / metric', color: 'bg-slate-600' },
    { name: 'Kafka', sub: 'durable event log', color: 'bg-orange-600' },
    { name: 'Stream processor', sub: 'Flink / Spark — windowed aggregates', color: 'bg-blue-600' },
    { name: 'Online feature store', sub: 'low-latency reads', color: 'bg-violet-600' },
    { name: 'Model', sub: 'one forward pass → action', color: 'bg-emerald-600' },
  ]
  const [hover, setHover] = useState<number | null>(2)
  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
        The streaming feature path — hover a stage
      </p>
      <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
        {stages.map((s, i) => (
          <div key={s.name} className="flex items-center gap-1 shrink-0">
            <div
              onMouseEnter={() => setHover(i)}
              className={`${s.color} text-white rounded-lg px-3 py-2 min-w-[110px] transition-transform ${hover === i ? 'scale-105' : 'opacity-90'}`}
            >
              <div className="text-xs font-semibold">{s.name}</div>
              <div className="text-[10px] opacity-90 mt-0.5">{s.sub}</div>
            </div>
            {i < stages.length - 1 && <span className="text-slate-400">→</span>}
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3">
        <p className="text-xs text-amber-800 dark:text-amber-300">
          <strong>Training/serving skew risk:</strong> the offline batch job and this streaming job must compute the same
          feature identically. A single feature-definition layer that generates both paths prevents silent drift.
        </p>
      </div>
    </div>
  )
}

// ─── Quiz ───────────────────────────────────────────────────────────────────

type QItem = { q: string; options: string[]; answer: number; explanation: string }

export function Quiz() {
  const questions: QItem[] = [
    {
      q: 'Why is accuracy a poor metric for fraud detection?',
      options: [
        'A. It is hard to compute',
        'B. With ~0.1% fraud, always predicting "not fraud" scores 99.9% yet catches nothing',
        'C. It requires labeled data',
        'D. It penalizes recall',
      ],
      answer: 1,
      explanation: 'Extreme class imbalance makes accuracy meaningless; you evaluate on precision/recall and PR-AUC with asymmetric error costs.',
    },
    {
      q: 'Concept drift in fraud is largely driven by:',
      options: [
        'A. Hardware failures',
        'B. Adversaries actively adapting to your model',
        'C. Floating-point error',
        'D. Larger datasets',
      ],
      answer: 1,
      explanation: 'Fraudsters change tactics in response to your defenses, so a static model degrades even with perfect code.',
    },
    {
      q: 'What is the standard way to meet a ~10ms bidding SLA while keeping accuracy?',
      options: [
        'A. Use a bigger synchronous model',
        'B. Precompute features + cheap model, escalate ambiguous cases to a heavier/async path',
        'C. Skip feature engineering',
        'D. Raise the decision threshold',
      ],
      answer: 1,
      explanation: 'Precomputation and tiered/async models keep the synchronous path cheap while still handling hard cases well.',
    },
    {
      q: 'Training/serving skew in a streaming system usually comes from:',
      options: [
        'A. Using GPUs in training but CPUs in serving',
        'B. Offline batch and online streaming computing the same feature differently',
        'C. Too many training epochs',
        'D. A large embedding table',
      ],
      answer: 1,
      explanation: 'When batch and streaming code paths compute a feature slightly differently, the model sees mismatched distributions.',
    },
    {
      q: 'Why tune the decision threshold instead of leaving it at 0.5?',
      options: [
        'A. 0.5 is numerically unstable',
        'B. The cost of a false positive vs false negative is highly asymmetric and product-specific',
        'C. It speeds up inference',
        'D. It fixes class imbalance in training',
      ],
      answer: 1,
      explanation: 'A declined legit purchase and a missed fraud have very different costs, so the operating threshold is a business decision.',
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
