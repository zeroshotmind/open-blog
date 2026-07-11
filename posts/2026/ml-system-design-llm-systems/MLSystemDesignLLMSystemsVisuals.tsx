'use client'

import { useState } from 'react'

// ─── KVCacheViz ─────────────────────────────────────────────────────────────

export function KVCacheViz() {
  const tokens = ['The', 'KV', 'cache', 'stores', 'past', 'keys']
  const [step, setStep] = useState(2)
  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
        Decoding token by token — cached vs recomputed
      </p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {tokens.map((t, i) => {
          let cls = 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          if (i < step) cls = 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
          else if (i === step) cls = 'bg-emerald-500 text-white'
          return (
            <div key={i} className={`rounded px-2.5 py-1.5 text-sm font-mono ${cls}`}>
              {t}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className="text-xs rounded border border-slate-300 dark:border-slate-600 px-2 py-1 text-slate-600 dark:text-slate-300"
        >
          ◂ prev
        </button>
        <button
          onClick={() => setStep((s) => Math.min(tokens.length - 1, s + 1))}
          className="text-xs rounded border border-slate-300 dark:border-slate-600 px-2 py-1 text-slate-600 dark:text-slate-300"
        >
          next token ▸
        </button>
      </div>
      <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-xs">
        <p className="text-slate-700 dark:text-slate-200">
          Generating token <span className="text-emerald-600 dark:text-emerald-400 font-mono">"{tokens[step]}"</span>:
        </p>
        <p className="text-blue-600 dark:text-blue-400 mt-1">
          ● {step} previous tokens' K/V read from cache (no recompute)
        </p>
        <p className="text-slate-500 dark:text-slate-400 mt-0.5">
          ● only 1 new K/V computed this step
        </p>
        <p className="text-slate-400 mt-2">
          Without the cache, each step re-computes attention over all prior tokens — O(N²) wasted work.
        </p>
      </div>
    </div>
  )
}

// ─── RAGPipelineViz ─────────────────────────────────────────────────────────

export function RAGPipelineViz() {
  const stages = [
    { name: 'Query', detail: 'user question', color: 'bg-slate-600' },
    { name: 'Hybrid retrieval', detail: 'dense (semantic) + BM25 (exact) fused with RRF → top ~50', color: 'bg-blue-600' },
    { name: 'Rerank', detail: 'cross-encoder reorders top candidates for precision → top ~5', color: 'bg-violet-600' },
    { name: 'Generate', detail: 'LLM answers grounded in the retrieved chunks + citations', color: 'bg-emerald-600' },
  ]
  const [active, setActive] = useState(1)
  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
        RAG pipeline — click a stage. Retrieval quality caps answer quality.
      </p>
      <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-3">
        {stages.map((s, i) => (
          <div key={s.name} className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setActive(i)}
              className={`${s.color} text-white rounded-lg px-3 py-2 text-xs font-semibold transition-transform ${active === i ? 'scale-105 ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-900 ring-blue-400' : 'opacity-85'}`}
            >
              {s.name}
            </button>
            {i < stages.length - 1 && <span className="text-slate-400">→</span>}
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-600 dark:text-slate-300">
        {stages[active].detail}
      </div>
    </div>
  )
}

// ─── Quiz ───────────────────────────────────────────────────────────────────

type QItem = { q: string; options: string[]; answer: number; explanation: string }

export function Quiz() {
  const questions: QItem[] = [
    {
      q: 'What does the KV cache eliminate during decoding?',
      options: [
        'A. The need for a GPU',
        'B. Recomputing attention over all previous tokens at every generation step',
        'C. The prefill phase',
        'D. Tokenization',
      ],
      answer: 1,
      explanation: 'Storing past keys/values lets each new token attend to the cache instead of redoing O(N²) attention every step.',
    },
    {
      q: 'The single biggest throughput lever in production LLM serving is:',
      options: [
        'A. Larger batch sizes only',
        'B. Continuous batching — swapping sequences in/out at the token level',
        'C. Using FP64',
        'D. Disabling the KV cache',
      ],
      answer: 1,
      explanation: 'Requests have different output lengths; continuous batching keeps the GPU busy instead of waiting for the slowest sequence.',
    },
    {
      q: 'Speculative decoding speeds up generation by:',
      options: [
        'A. Skipping tokens',
        'B. Having a small draft model propose tokens the big model verifies in one parallel pass',
        'C. Lowering precision',
        'D. Caching prompts',
      ],
      answer: 1,
      explanation: 'The target model verifies several drafted tokens at once, yielding multiple tokens per expensive pass with identical output.',
    },
    {
      q: 'Why does enterprise RAG use hybrid (dense + sparse) retrieval?',
      options: [
        'A. To reduce cost',
        'B. Dense captures paraphrase but misses exact terms (part numbers, codes); BM25 catches those',
        'C. Sparse retrieval is always better',
        'D. To avoid chunking',
      ],
      answer: 1,
      explanation: 'Real queries mix fuzzy intent with exact identifiers; dense and sparse cover each other’s blind spots when fused.',
    },
    {
      q: 'When fine-tuning, what determines the outcome most?',
      options: [
        'A. The learning-rate schedule',
        'B. Data curation quality (clean, deduplicated, well-formatted examples)',
        'C. The GPU vendor',
        'D. The number of adapters',
      ],
      answer: 1,
      explanation: 'A few thousand high-quality examples beat a large noisy set; data and evaluation dominate the method choice.',
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
