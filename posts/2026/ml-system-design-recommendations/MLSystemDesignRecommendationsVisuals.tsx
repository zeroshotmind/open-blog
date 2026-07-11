'use client'

import { useState } from 'react'

// ─── RecommendationPipelineViz ──────────────────────────────────────────────

export function RecommendationPipelineViz() {
  const stages = [
    { name: 'Corpus', count: '~1B', latency: '', model: 'All items', color: 'bg-slate-700' },
    { name: 'Candidate Generation', count: '~1000', latency: '~10ms', model: 'Two-tower + ANN, multiple sources', color: 'bg-blue-600' },
    { name: 'Ranking', count: '~100', latency: '~50ms', model: 'Heavy multi-task DNN', color: 'bg-violet-600' },
    { name: 'Reranking', count: '~10', latency: '~5ms', model: 'Diversity, freshness, policy', color: 'bg-emerald-600' },
  ]
  const [active, setActive] = useState<number | null>(null)

  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
        The recommendation funnel — hover a stage
      </p>
      <div className="flex flex-col gap-2">
        {stages.map((s, i) => {
          const widthPct = [100, 62, 38, 20][i]
          return (
            <div key={s.name} className="flex items-center gap-3">
              <div
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className={`${s.color} text-white rounded-lg px-4 py-3 cursor-default transition-all duration-200 ${active === i ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-blue-400 scale-[1.01]' : ''}`}
                style={{ width: `${widthPct}%` }}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold text-sm">{s.name}</span>
                  <span className="font-mono text-xs opacity-90">{s.count}{s.latency && ` · ${s.latency}`}</span>
                </div>
                {active === i && (
                  <div className="text-xs mt-1 opacity-95">{s.model}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-slate-400 mt-3">
        Each stage cuts the item count ~10×, buying the next stage a heavier model per item.
      </p>
    </div>
  )
}

// ─── TwoTowerViz ────────────────────────────────────────────────────────────

export function TwoTowerViz() {
  const [hover, setHover] = useState<'user' | 'item' | null>(null)

  const Tower = ({
    side,
    title,
    feats,
    color,
    id,
  }: {
    side: 'user' | 'item'
    title: string
    feats: string[]
    color: string
    id: string
  }) => (
    <div
      onMouseEnter={() => setHover(side)}
      onMouseLeave={() => setHover(null)}
      className={`flex-1 rounded-xl border-2 p-3 transition-all ${hover === side ? color : 'border-slate-200 dark:border-slate-700'}`}
    >
      <p className="text-center font-semibold text-sm mb-2 text-slate-700 dark:text-slate-200">{title}</p>
      <div className="flex flex-col gap-1 mb-2">
        {feats.map((f) => (
          <div key={f} className="text-[11px] text-center rounded bg-slate-100 dark:bg-slate-800 px-2 py-1 text-slate-600 dark:text-slate-300">
            {f}
          </div>
        ))}
      </div>
      <div className="text-center text-[11px] text-slate-400">↓ MLP ↓</div>
      <div className="mt-2 rounded bg-slate-800 dark:bg-slate-700 text-white text-center text-[11px] font-mono py-1">
        {id} embedding
      </div>
    </div>
  )

  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
        Two-tower retrieval — the towers never share weights or features
      </p>
      <div className="flex gap-4 items-stretch">
        <Tower
          side="user"
          title="User Tower (online)"
          feats={['watch history', 'session context', 'demographics']}
          color="border-blue-500"
          id="u"
        />
        <div className="flex flex-col items-center justify-center px-1">
          <div className="text-2xl text-slate-400">·</div>
          <div className="text-[11px] font-mono text-slate-500 rotate-90 whitespace-nowrap my-4">dot product</div>
          <div className="text-2xl text-slate-400">·</div>
        </div>
        <Tower
          side="item"
          title="Item Tower (offline)"
          feats={['content features', 'item ID embedding', 'metadata']}
          color="border-violet-500"
          id="v"
        />
      </div>
      <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
        {hover === 'item'
          ? 'Item embeddings are computed offline for the whole catalog and loaded into an ANN index. The item tower never runs at request time.'
          : hover === 'user'
            ? 'Only the user tower runs online: one forward pass produces one query vector, then ANN retrieves nearest items.'
            : 'score(u, v) = u · v. Independence is the whole point — it lets you precompute one side.'}
      </div>
    </div>
  )
}

// ─── Quiz ───────────────────────────────────────────────────────────────────

type QItem = { q: string; options: string[]; answer: number; explanation: string }

export function Quiz() {
  const questions: QItem[] = [
    {
      q: "Why can't a single deep model just score every item per request?",
      options: [
        'A. Deep models are inaccurate at scale',
        'B. There are billions of items and only tens of ms — no model scans them all',
        'C. Embeddings are too large to store',
        'D. GPUs cannot run inference online',
      ],
      answer: 1,
      explanation: 'The funnel exists because you cannot score a billion items in tens of milliseconds; each stage shrinks the set for the next.',
    },
    {
      q: 'What makes the two-tower architecture cheap to serve for retrieval?',
      options: [
        'A. The towers share weights',
        'B. Item embeddings can be precomputed offline and indexed for ANN',
        'C. It uses a smaller model than ranking',
        'D. It skips negative sampling',
      ],
      answer: 1,
      explanation: 'Because the towers are independent, all item embeddings are computed offline; only one user embedding is computed online, then ANN does the lookup.',
    },
    {
      q: 'In candidate generation, which metric matters most?',
      options: ['A. Precision', 'B. Recall', 'C. Calibration', 'D. Latency variance'],
      answer: 1,
      explanation: 'A good item missed at retrieval can never be recommended; false positives get filtered downstream. So recall dominates here.',
    },
    {
      q: 'Why do mature rankers predict multiple engagement signals instead of just click probability?',
      options: [
        'A. Clicks are hard to log',
        'B. Optimizing click alone rewards clickbait; watch time/shares/etc. capture real value',
        'C. Multi-task models train faster',
        'D. It reduces the item space',
      ],
      answer: 1,
      explanation: 'Single-objective click prediction optimizes for clickbait; a weighted combination of watch time, completion, shares and negatives aligns with actual value.',
    },
    {
      q: 'The most accurate framing of cold start is that it is primarily a problem of…',
      options: [
        'A. exploration (surfacing uncertain items to gather signal)',
        'B. bigger models',
        'C. more training epochs',
        'D. larger ANN indexes',
      ],
      answer: 0,
      explanation: 'Content features make new items retrievable, but without an exploration budget the reranker never surfaces them — cold start is fundamentally exploration.',
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
