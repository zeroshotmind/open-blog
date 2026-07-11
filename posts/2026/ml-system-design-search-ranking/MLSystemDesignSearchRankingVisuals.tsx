'use client'

import { useState } from 'react'

// ─── LearningToRankViz ──────────────────────────────────────────────────────

export function LearningToRankViz() {
  const modes = {
    pointwise: {
      title: 'Pointwise',
      unit: 'one item',
      loss: 'regress/classify each item to a relevance score, then sort',
      pro: 'Simple, reusable scores, per-item labels',
      con: 'Loss ignores that ranking is relative',
      color: 'blue',
    },
    pairwise: {
      title: 'Pairwise',
      unit: 'a pair (A, B)',
      loss: 'penalize when B outscores A given A should rank higher',
      pro: 'Directly optimizes relative order (RankNet, LambdaRank)',
      con: 'More pairs to form; still not the full-list metric',
      color: 'violet',
    },
    listwise: {
      title: 'Listwise',
      unit: 'the whole list',
      loss: 'optimize NDCG / MAP over the full ordering (LambdaMART)',
      pro: 'Most faithful to the ranking metric',
      con: 'Expensive, finicky to train',
      color: 'emerald',
    },
  }
  type K = keyof typeof modes
  const [mode, setMode] = useState<K>('pairwise')
  const m = modes[mode]
  const activeBg: Record<K, string> = { pointwise: 'bg-blue-600', pairwise: 'bg-violet-600', listwise: 'bg-emerald-600' }

  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
        Three flavors of learning to rank
      </p>
      <div className="flex gap-2 mb-4">
        {(Object.keys(modes) as K[]).map((k) => (
          <button
            key={k}
            onClick={() => setMode(k)}
            className={`text-xs rounded-lg px-3 py-1.5 border transition-colors ${
              mode === k ? `text-white ${activeBg[k]} border-transparent` : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'
            }`}
          >
            {modes[k].title}
          </button>
        ))}
      </div>
      <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 text-sm">
        <div className="grid grid-cols-[90px_1fr] gap-y-2 gap-x-3">
          <span className="text-slate-400 text-xs">Learns from</span>
          <span className="text-slate-800 dark:text-slate-100 font-mono text-xs">{m.unit}</span>
          <span className="text-slate-400 text-xs">Objective</span>
          <span className="text-slate-700 dark:text-slate-200">{m.loss}</span>
          <span className="text-slate-400 text-xs">Pro</span>
          <span className="text-emerald-600 dark:text-emerald-400">{m.pro}</span>
          <span className="text-slate-400 text-xs">Con</span>
          <span className="text-red-500 dark:text-red-400">{m.con}</span>
        </div>
      </div>
    </div>
  )
}

// ─── FeedRankingViz ─────────────────────────────────────────────────────────

export function FeedRankingViz() {
  const signals = [
    { name: 'P(click)', w: 1, tone: 'pos' },
    { name: 'P(like)', w: 2, tone: 'pos' },
    { name: 'P(comment)', w: 4, tone: 'pos' },
    { name: 'P(reshare)', w: 6, tone: 'pos' },
    { name: 'dwell time', w: 3, tone: 'pos' },
    { name: 'P(hide)', w: -8, tone: 'neg' },
    { name: 'P(report)', w: -12, tone: 'neg' },
  ]
  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
        Feed score = weighted blend of engagement signals
      </p>
      <p className="text-xs text-slate-400 mb-4">Weights are a product decision tuned by A/B tests — not model constants.</p>
      <div className="flex flex-col gap-1.5">
        {signals.map((s) => {
          const mag = Math.min(Math.abs(s.w) * 6, 72)
          return (
            <div key={s.name} className="flex items-center gap-3">
              <span className="w-24 text-xs font-mono text-slate-600 dark:text-slate-300 text-right">{s.name}</span>
              <div className="flex-1 flex items-center">
                <div className="w-1/2 flex justify-end">
                  {s.tone === 'neg' && <div className="h-4 rounded-l bg-red-500" style={{ width: `${mag}%` }} />}
                </div>
                <div className="w-px h-5 bg-slate-300 dark:bg-slate-600" />
                <div className="w-1/2">
                  {s.tone === 'pos' && <div className="h-4 rounded-r bg-emerald-500" style={{ width: `${mag}%` }} />}
                </div>
              </div>
              <span className="w-8 text-xs font-mono text-slate-400">{s.w > 0 ? `+${s.w}` : s.w}</span>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-slate-400 mt-3">
        Negatives (hide, report) carry large weights so the ranker learns to avoid outrage bait, not just chase clicks.
      </p>
    </div>
  )
}

// ─── Quiz ───────────────────────────────────────────────────────────────────

type QItem = { q: string; options: string[]; answer: number; explanation: string }

export function Quiz() {
  const questions: QItem[] = [
    {
      q: 'The single biggest structural difference between search and feed ranking is:',
      options: [
        'A. Feeds use bigger models',
        'B. Search has an explicit query; a feed has only latent intent from history/context',
        'C. Search cannot be personalized',
        'D. Feeds do not use learning to rank',
      ],
      answer: 1,
      explanation: 'A query states intent you must match; a feed replaces it with predicted engagement over the user’s history and context.',
    },
    {
      q: 'Which learning-to-rank flavor directly optimizes relative order between items?',
      options: ['A. Pointwise', 'B. Pairwise', 'C. Neither', 'D. Only listwise'],
      answer: 1,
      explanation: 'Pairwise (RankNet/LambdaRank) penalizes mis-ordered pairs, targeting relative order rather than absolute scores.',
    },
    {
      q: 'Why not run a large BERT cross-encoder over every candidate document at query time?',
      options: [
        'A. BERT cannot rank',
        'B. It is too expensive; use cheap retrieval then rerank the top few dozen with the cross-encoder',
        'C. Cross-encoders need no candidates',
        'D. BM25 is more accurate',
      ],
      answer: 1,
      explanation: 'Cross-encoders are costly, so retrieval (BM25 + bi-encoder) narrows the set and the cross-encoder reranks only the top-k.',
    },
    {
      q: 'Ranking a feed on P(click) alone tends to produce:',
      options: [
        'A. Perfectly diverse feeds',
        'B. Clickbait / outrage bait',
        'C. Lower engagement',
        'D. Better integrity',
      ],
      answer: 1,
      explanation: 'Single-signal click optimization rewards sensational content; a weighted blend with negative signals is more defensible.',
    },
    {
      q: 'What is the reranking pass in a feed primarily responsible for?',
      options: [
        'A. Training the model',
        'B. Diversity, freshness decay, and integrity/policy filtering',
        'C. Computing embeddings',
        'D. Query spell correction',
      ],
      answer: 1,
      explanation: 'The ranker scores items independently; reranking imposes list-level diversity and the integrity constraints that govern feeds.',
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
