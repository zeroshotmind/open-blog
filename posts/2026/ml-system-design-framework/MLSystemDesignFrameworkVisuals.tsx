'use client'

import { useState } from 'react'

// ─── FrameworkFlowViz ───────────────────────────────────────────────────────

export function FrameworkFlowViz() {
  const steps = [
    { name: 'Requirements', detail: 'Functional (what, for whom, scale) + non-functional (latency, cost, availability). This shapes the design more than any model choice.' },
    { name: 'ML Task', detail: 'Turn the product goal into input → label → prediction. Name the proxy label and where it diverges from what you actually want.' },
    { name: 'Data', detail: 'Label source and volume. Explicit vs implicit feedback, and the biases you inherit — position bias, feedback loops.' },
    { name: 'Features', detail: 'User / item / context / cross. Mark each real-time vs batch — that decision reaches all the way into serving.' },
    { name: 'Model', detail: 'Baseline first (GBDT / logistic regression), then justify complexity against it. A progression, not a single choice.' },
    { name: 'Serving', detail: 'Batch vs real-time inference, feature assembly under budget, funnel split, and the fallback when the model service is down.' },
    { name: 'Monitoring', detail: 'Drift, feature null-rates, training/serving skew, staleness. Separate model-quality from system metrics; define alerts.' },
  ]
  const [active, setActive] = useState(0)

  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
        The seven steps — click one
      </p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {steps.map((s, i) => (
          <button
            key={s.name}
            onClick={() => setActive(i)}
            className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
              active === i
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-400'
            }`}
          >
            {i + 1}. {s.name}
          </button>
        ))}
      </div>
      <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">
          {active + 1}. {steps[active].name}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">{steps[active].detail}</p>
      </div>
    </div>
  )
}

// ─── RequirementsViz ────────────────────────────────────────────────────────

export function RequirementsViz() {
  const [tab, setTab] = useState<'func' | 'nonfunc'>('func')
  const data = {
    func: [
      'What is predicted, for whom, and when?',
      'Scale: QPS, item count, user count',
      'How fresh must predictions be?',
      'What is the true objective (not the proxy)?',
      'What does the surface look like — feed, single item, ranked list?',
    ],
    nonfunc: [
      'Latency budget (10ms rules out model classes)',
      'Throughput / peak QPS',
      'Availability & graceful degradation',
      'Cost ceiling (training + serving)',
      'Freshness/consistency guarantees',
    ],
  }
  return (
    <div className="my-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
      <div className="flex gap-2 mb-4">
        {(['func', 'nonfunc'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs rounded-lg px-3 py-1.5 border transition-colors ${
              tab === t
                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-800 dark:border-slate-200'
                : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'
            }`}
          >
            {t === 'func' ? 'Functional' : 'Non-functional'}
          </button>
        ))}
      </div>
      <ul className="flex flex-col gap-2">
        {data[tab].map((d) => (
          <li key={d} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
            <span className={tab === 'func' ? 'text-blue-500' : 'text-violet-500'}>▸</span>
            {d}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Quiz ───────────────────────────────────────────────────────────────────

type QItem = { q: string; options: string[]; answer: number; explanation: string }

export function Quiz() {
  const questions: QItem[] = [
    {
      q: 'What should you do in the first minutes of an ML design interview?',
      options: [
        'A. Propose a model architecture',
        'B. Clarify functional and non-functional requirements',
        'C. Describe the training pipeline',
        'D. List candidate loss functions',
      ],
      answer: 1,
      explanation: 'Requirements — especially latency and scale — constrain the design more than any modeling choice, so scope first.',
    },
    {
      q: 'Why is choosing a proxy label a high-stakes decision?',
      options: [
        'A. Proxies are expensive to compute',
        'B. A cheap-to-log proxy can be misaligned with the true goal, e.g. clicks vs satisfaction',
        'C. Proxies require more data',
        'D. They slow down serving',
      ],
      answer: 1,
      explanation: 'You train on what you can log; a proxy misaligned with the real objective (click ≠ satisfaction) builds the wrong system.',
    },
    {
      q: 'Which serving concern do candidates most often skip?',
      options: [
        'A. The fallback when the model service is down',
        'B. The choice of activation function',
        'C. The number of training epochs',
        'D. The embedding dimension',
      ],
      answer: 0,
      explanation: 'A graceful-degradation path (cache, popularity baseline, previous model) is core systems design and frequently omitted.',
    },
    {
      q: 'Why start with a simple baseline model?',
      options: [
        'A. Baselines are more accurate',
        'B. It ships a full pipeline and gives you something to justify complexity against',
        'C. Interviewers forbid complex models',
        'D. GBDTs cannot overfit',
      ],
      answer: 1,
      explanation: 'A baseline gets an end-to-end pipeline working and forces every added complexity to earn its place.',
    },
    {
      q: 'Which failure is unique to ML systems and needs explicit monitoring?',
      options: [
        'A. Disk running out of space',
        'B. Training/serving skew and feature drift',
        'C. Expired TLS certificates',
        'D. Load balancer misconfiguration',
      ],
      answer: 1,
      explanation: 'Silent ML failures — drift, skew, a feature going all-null — degrade quality without any system alarm firing.',
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
