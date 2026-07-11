'use client'

import { useState } from 'react'

// ─── ModerationPipelineViz ──────────────────────────────────────────────────

export function ModerationPipelineViz() {
  const tiers = [
    { name: 'Cheap filters', share: 92, detail: 'Fast classifiers auto-clear/auto-remove the obvious cases', color: 'bg-blue-600' },
    { name: 'Heavy multimodal models', share: 7, detail: 'Uncertain content escalates to larger text+image+video models', color: 'bg-violet-600' },
    { name: 'Human review', share: 1, detail: 'Only genuinely ambiguous cases — the scarce, expensive resource', color: 'bg-amber-600' },
  ]
  const [hover, setHover] = useState<number | null>(null)
  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
        Tiered moderation — route scarce human review deliberately
      </p>
      <div className="flex flex-col gap-2">
        {tiers.map((t, i) => (
          <div
            key={t.name}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className={`${t.color} text-white rounded-lg px-4 py-3 transition-transform ${hover === i ? 'scale-[1.01]' : ''}`}
            style={{ width: `${t.share}%`, minWidth: '180px' }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold">{t.name}</span>
              <span className="text-xs font-mono opacity-90">~{t.share}% of traffic</span>
            </div>
            {hover === i && <p className="text-xs mt-1 opacity-95">{t.detail}</p>}
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-3">
        The objective is not raw accuracy — it is spending limited human review where it changes outcomes most.
      </p>
    </div>
  )
}

// ─── EmbeddingSearchViz ─────────────────────────────────────────────────────

export function EmbeddingSearchViz() {
  const [query, setQuery] = useState({ x: 50, y: 45 })
  // scattered catalog points
  const points = [
    { x: 20, y: 30 }, { x: 35, y: 55 }, { x: 48, y: 40 }, { x: 55, y: 52 },
    { x: 62, y: 38 }, { x: 70, y: 60 }, { x: 30, y: 70 }, { x: 80, y: 25 },
    { x: 45, y: 48 }, { x: 58, y: 44 }, { x: 25, y: 50 }, { x: 75, y: 45 },
  ]
  const dist = (p: { x: number; y: number }) => Math.hypot(p.x - query.x, p.y - query.y)
  const nearest = [...points].sort((a, b) => dist(a) - dist(b)).slice(0, 3)
  const isNear = (p: { x: number; y: number }) => nearest.includes(p)

  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
        ANN in embedding space — click to move the query image
      </p>
      <svg
        viewBox="0 0 100 90"
        className="w-full rounded-lg bg-slate-50 dark:bg-slate-800 cursor-crosshair"
        onClick={(e) => {
          const r = (e.target as SVGElement).closest('svg')!.getBoundingClientRect()
          setQuery({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 90 })
        }}
      >
        {nearest.map((p, i) => (
          <line key={i} x1={query.x} y1={query.y} x2={p.x} y2={p.y} stroke="#10b981" strokeWidth={0.4} strokeDasharray="1 1" />
        ))}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={isNear(p) ? 2.2 : 1.6} fill={isNear(p) ? '#10b981' : '#94a3b8'} />
        ))}
        <circle cx={query.x} cy={query.y} r={2.6} fill="#3b82f6" stroke="white" strokeWidth={0.5} />
      </svg>
      <p className="text-xs text-slate-400 mt-3">
        The model gives the embedding; the <strong>index</strong> (HNSW / IVF-PQ) is the actual system — sub-second search over billions, quantized to fit memory.
      </p>
    </div>
  )
}

// ─── Quiz ───────────────────────────────────────────────────────────────────

type QItem = { q: string; options: string[]; answer: number; explanation: string }

export function Quiz() {
  const questions: QItem[] = [
    {
      q: 'Why is content moderation built as a tiered pipeline rather than one classifier?',
      options: [
        'A. One classifier is too slow to train',
        'B. Error costs are asymmetric and human review is scarce — route only ambiguous cases to it',
        'C. Multimodal models cannot be trained',
        'D. To avoid using embeddings',
      ],
      answer: 1,
      explanation: 'Tiering spends expensive human review only where it changes outcomes, with cheap models clearing the obvious firehose.',
    },
    {
      q: 'The strong framing of Uber ETA prediction is:',
      options: [
        'A. Regress trip time from opaque features',
        'B. Predict per-segment times over the road graph and compose, output a distribution',
        'C. Use a fixed speed limit lookup',
        'D. Classify trips as short or long',
      ],
      answer: 1,
      explanation: 'A trip is a path of graph segments; per-segment prediction plus a calibrated distribution beats a single opaque point estimate.',
    },
    {
      q: 'In visual similarity search, what is the actual system challenge?',
      options: [
        'A. Choosing the vision model',
        'B. The ANN index — sub-second search over billions of embeddings, quantized and kept fresh',
        'C. Labeling images',
        'D. Resizing images',
      ],
      answer: 1,
      explanation: 'The embedding model is the easy part; retrieval infrastructure (HNSW/IVF-PQ, quantization, freshness) is where the design lives.',
    },
    {
      q: 'Why do document-extraction systems need calibrated confidence and abstention?',
      options: [
        'A. To speed up OCR',
        'B. Output feeds automation, so a confidently wrong field is worse than routing it to human review',
        'C. Confidence reduces model size',
        'D. It removes the need for layout features',
      ],
      answer: 1,
      explanation: 'Downstream automation (payments, records) makes silent errors costly; low-confidence fields should abstain and escalate.',
    },
    {
      q: 'The defining decision in multimodal search is:',
      options: [
        'A. Which GPU to use',
        'B. Where fusion happens — shared embedding space vs late fusion',
        'C. The image resolution',
        'D. The number of shards',
      ],
      answer: 1,
      explanation: 'Shared space (CLIP-style) enables direct cross-modal retrieval; late fusion preserves modality detail. The tradeoff is the answer.',
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
