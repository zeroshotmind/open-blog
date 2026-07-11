'use client'

import { useState } from 'react'

// ─── QuestionExplorerViz ────────────────────────────────────────────────────

type Cat = 'Products' | 'Infrastructure' | 'LLM' | 'Real-time'
type Q = { n: number; title: string; cat: Cat; hard: string; anchor: string; strong: string }

const QUESTIONS: Q[] = [
  { n: 1, title: "YouTube recommendations", cat: 'Products', hard: 'Billions of items, tens of ms — you cannot score them all.', anchor: 'The candidate-gen → rank → rerank funnel.', strong: 'Two-tower retrieval with precomputed item embeddings + ANN; multi-task ranker; reranking for diversity; cold start as exploration.' },
  { n: 2, title: 'Real-time fraud detection', cat: 'Real-time', hard: 'Tight SLA + concept drift + extreme class imbalance, all at once.', anchor: 'Precompute + cheap tiered model; PR-AUC not accuracy.', strong: 'Streaming features, threshold tuned on business cost, continuous retraining for drift, async escalation for hard cases.' },
  { n: 3, title: 'Google Search ranking', cat: 'Products', hard: 'Understand an explicit query, then rank at web scale under latency.', anchor: 'Two-stage: cheap retrieval, expensive cross-encoder rerank.', strong: 'BM25 + bi-encoder recall, BERT query understanding, learning-to-rank (LambdaMART/pairwise), real-time vs precomputed signals.' },
  { n: 4, title: 'Feed ranking', cat: 'Products', hard: 'No query — intent is latent; must not amplify bad content.', anchor: 'Predict a weighted blend of engagement signals.', strong: 'Multi-task engagement model, negative signals (hide/report), diversity + integrity reranking, weights tuned by A/B.' },
  { n: 5, title: 'Content moderation at scale', cat: 'Products', hard: 'Asymmetric, category-dependent error costs; adversarial evasion.', anchor: 'Tiered pipeline routing scarce human review.', strong: 'Cheap filters → multimodal models → human loop; per-category thresholds; continuous retraining against evasion.' },
  { n: 6, title: 'Uber ETA prediction', cat: 'Products', hard: 'A trip is a path of road segments, not one opaque point.', anchor: 'Per-segment prediction over the road graph; output a distribution.', strong: 'GNN over road network, live traffic as segment features, quantile/interval output for downstream dispatch.' },
  { n: 7, title: 'Feature store', cat: 'Infrastructure', hard: 'Training and serving compute features differently — skew.', anchor: 'One definition materialized to online + offline stores.', strong: 'Point-in-time-correct offline joins, low-latency online reads, per-feature freshness SLAs.' },
  { n: 8, title: 'LLM serving infrastructure', cat: 'LLM', hard: 'Autoregressive decode is memory-bound; KV cache dwarfs weights.', anchor: 'KV cache + continuous batching + paged memory.', strong: 'PagedAttention, continuous batching for utilization, speculative decoding, TTFT vs TPOT tradeoff.' },
  { n: 9, title: 'Enterprise RAG', cat: 'LLM', hard: 'Retrieval quality — not generation — caps the answer.', anchor: 'Chunking + hybrid retrieval + rerank.', strong: 'Structure-aware chunking, dense+BM25 fusion (RRF), cross-encoder rerank, retrieval and faithfulness evaluated separately.' },
  { n: 10, title: 'Distributed training', cat: 'Infrastructure', hard: 'Model or data outgrows one GPU.', anchor: 'Data parallelism first; model parallelism only if it won’t fit.', strong: 'All-reduce data parallel, tensor + pipeline parallel for giant models, 3D parallelism, communication overhead.' },
  { n: 11, title: 'A/B testing for ML', cat: 'Infrastructure', hard: 'Small effects, interference, long-term erosion.', anchor: 'Long-term holdout + correct randomization unit.', strong: 'Metric sensitivity/power, cluster/geo randomization for network effects, counterfactual logging, retention guardrails.' },
  { n: 12, title: 'Model monitoring & alerting', cat: 'Infrastructure', hard: 'ML fails silently — no exception is thrown.', anchor: 'Separate model-quality metrics from system metrics.', strong: 'Prediction + feature drift, null-rate alerts, training/serving skew checks, delayed-label handling, staleness.' },
  { n: 13, title: 'Spotify recommendations', cat: 'Products', hard: 'Small catalog but heavy repeat consumption.', anchor: 'Same funnel; sequence models over sessions.', strong: 'Audio-content embeddings for the long tail, session sequence modeling, objectives like completion/saves.' },
  { n: 14, title: 'Real-time anomaly detection', cat: 'Real-time', hard: 'Unlabeled, rare, drifting "normal".', anchor: 'Unsupervised/semi-supervised baseline of normal.', strong: 'Streaming aggregates, forecasting residuals or density models, adaptive thresholds, alert fatigue management.' },
  { n: 15, title: 'Visual similarity search', cat: 'Products', hard: 'Billions of embeddings, sub-second, always growing.', anchor: 'The ANN index is the system.', strong: 'HNSW/IVF-PQ, quantization to fit memory, recall/latency tuning, index freshness as catalog grows.' },
  { n: 16, title: 'LLM fine-tuning pipeline', cat: 'LLM', hard: 'It’s a data + eval problem, not a training run.', anchor: 'Data curation quality; LoRA by default.', strong: 'Clean deduped data, LoRA vs full FT justified, held-out + LLM-judge eval, regression guard on general capability.' },
  { n: 17, title: 'Real-time bidding', cat: 'Real-time', hard: '~10ms total budget including network.', anchor: 'Precomputed features + a very cheap model.', strong: 'CTR/CVR prediction, calibration for bid pricing, budget pacing, cached features, hard latency wall.' },
  { n: 18, title: 'Document information extraction', cat: 'Products', hard: 'Spatial layout is signal; downstream automation is unforgiving.', anchor: 'Layout-aware model + calibrated abstention.', strong: 'LayoutLM-style fusion of text/position/image, confidence calibration, human-in-loop for low-confidence fields.' },
  { n: 19, title: 'Multimodal search', cat: 'Products', hard: 'Where does fusion of modalities happen?', anchor: 'Shared embedding space vs late fusion.', strong: 'CLIP-style shared space for cross-modal queries vs per-modality retrieval + late fusion; state the tradeoff.' },
  { n: 20, title: 'Sub-100ms model serving', cat: 'Real-time', hard: 'Every component of the latency budget counts.', anchor: 'Precompute + model optimization + caching.', strong: 'Quantization/distillation, feature caching, batching vs latency, p99 not mean, graceful-degradation fallback.' },
]

const CATS: (Cat | 'All')[] = ['All', 'Products', 'Infrastructure', 'LLM', 'Real-time']
const catColor: Record<Cat, string> = {
  Products: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  Infrastructure: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
  LLM: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  'Real-time': 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
}

export function QuestionExplorerViz() {
  const [cat, setCat] = useState<Cat | 'All'>('All')
  const [open, setOpen] = useState<number | null>(null)
  const shown = QUESTIONS.filter((q) => cat === 'All' || q.cat === cat)

  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <div className="flex flex-wrap gap-1.5 mb-4">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
              cat === c ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-transparent' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {shown.map((q) => (
          <div key={q.n} className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => setOpen(open === q.n ? null : q.n)}
              className="w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                <span className="text-slate-400 font-mono text-xs mr-1.5">Q{q.n}</span>
                {q.title}
              </span>
              <span className={`text-[10px] rounded px-1.5 py-0.5 shrink-0 ${catColor[q.cat]}`}>{q.cat}</span>
            </button>
            {open === q.n && (
              <div className="px-3 pb-3 pt-1 text-xs space-y-2 border-t border-slate-100 dark:border-slate-800">
                <p><span className="font-semibold text-red-500">Hard:</span> <span className="text-slate-600 dark:text-slate-300">{q.hard}</span></p>
                <p><span className="font-semibold text-blue-500">Anchor:</span> <span className="text-slate-600 dark:text-slate-300">{q.anchor}</span></p>
                <p><span className="font-semibold text-emerald-500">Strong answer:</span> <span className="text-slate-600 dark:text-slate-300">{q.strong}</span></p>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-3">
        {shown.length} question{shown.length === 1 ? '' : 's'} — name the anchor decision yourself before expanding each card.
      </p>
    </div>
  )
}

// ─── AnswerFrameworkViz ─────────────────────────────────────────────────────

export function AnswerFrameworkViz() {
  const fields = [
    { key: 'problem', label: 'Restate the problem', hint: 'e.g. Recommend home-feed videos for logged-in users, optimizing long-term watch time' },
    { key: 'clarify', label: 'Top clarifying questions', hint: 'Scale (QPS, item count)? Latency budget? What is the true objective?' },
    { key: 'task', label: 'ML task + proxy label', hint: 'Predict P(engagement) per item; proxy = watch time, diverges from satisfaction because…' },
    { key: 'model', label: 'Baseline → target model', hint: 'Start GBDT; move to two-tower once retrieval scale demands it' },
    { key: 'serving', label: 'Serving + fallback', hint: 'ANN retrieval, feature assembly under budget, fallback to popularity when model is down' },
    { key: 'monitor', label: 'Monitoring', hint: 'Prediction drift, feature null-rates, training/serving skew, feedback loop' },
  ]
  const [vals, setVals] = useState<Record<string, string>>({})
  const filled = fields.filter((f) => (vals[f.key] ?? '').trim().length > 0).length

  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Draft your answer template</p>
        <span className="text-xs font-mono text-slate-400">{filled}/{fields.length}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 overflow-hidden">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(filled / fields.length) * 100}%` }} />
      </div>
      <div className="flex flex-col gap-3">
        {fields.map((f, i) => (
          <div key={f.key}>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {i + 1}. {f.label}
            </label>
            <textarea
              value={vals[f.key] ?? ''}
              onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
              placeholder={f.hint}
              rows={2}
              className="mt-1 w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 resize-y"
            />
          </div>
        ))}
      </div>
      {filled === fields.length && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3">
          ✓ Every dimension addressed — this is the shape of a hire-signal answer.
        </p>
      )}
    </div>
  )
}

// ─── Quiz ───────────────────────────────────────────────────────────────────

type QItem = { q: string; options: string[]; answer: number; explanation: string }

export function Quiz() {
  const questions: QItem[] = [
    {
      q: 'Why memorize anchor decisions rather than full solutions?',
      options: [
        'A. Solutions are too long',
        'B. A memorized solution collapses when the interviewer changes a constraint; the anchor instinct transfers',
        'C. Interviewers forbid solutions',
        'D. Anchors are easier to say',
      ],
      answer: 1,
      explanation: 'Interviewers move constraints on purpose; what generalizes is finding the hard part and building outward, not a canned design.',
    },
    {
      q: 'Where are most candidates weakest, and therefore where prep pays off most?',
      options: [
        'A. Model architecture',
        'B. Serving and monitoring',
        'C. Naming datasets',
        'D. Drawing diagrams',
      ],
      answer: 1,
      explanation: 'Most people over-index on modeling and go vague on serving and monitoring — exactly the differentiators.',
    },
    {
      q: 'A strong opening to any ML design question is:',
      options: [
        'A. Immediately draw the model',
        'B. Restate the problem, ask the few clarifying questions that most change the design, state assumptions',
        'C. List every model you know',
        'D. Ask about team size',
      ],
      answer: 1,
      explanation: 'Scoping first (scale, latency, true objective) prevents the most common failure: confidently designing the wrong system.',
    },
    {
      q: 'Which habit most reads as senior?',
      options: [
        'A. Opening with the fanciest architecture',
        'B. Proposing a baseline first and justifying complexity against it',
        'C. Avoiding tradeoff talk',
        'D. Skipping monitoring',
      ],
      answer: 1,
      explanation: 'Baseline-first shows judgment and gets a pipeline working; it forces every added complexity to earn its place.',
    },
    {
      q: 'Stating tradeoffs explicitly (e.g. shared embedding space vs late fusion) signals:',
      options: [
        'A. Indecision',
        'B. Judgment — versus memorization when you pick silently',
        'C. Lack of knowledge',
        'D. Wasted time',
      ],
      answer: 1,
      explanation: 'Naming the tradeoff and choosing with a reason demonstrates real understanding; a silent pick looks memorized.',
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
