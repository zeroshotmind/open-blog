'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ─── MLPipelineViz ────────────────────────────────────────────────────────────

const PIPELINE_NODES = [
  { id: 'data', label: 'Raw Data', x: 60, y: 140, color: '#6366f1', concept: 'Vectors in ℝⁿ', post: 1 },
  { id: 'embed', label: 'Embed', x: 170, y: 80, color: '#8b5cf6', concept: 'Linear map: ℝⁿ → ℝᵈ', post: 3 },
  { id: 'pca', label: 'PCA / SVD', x: 280, y: 80, color: '#3b82f6', concept: 'Eigenvectors of covariance matrix', post: 9 },
  { id: 'linear', label: 'Linear Layer', x: 280, y: 200, color: '#10b981', concept: 'y = Wx + b (matrix mult)', post: 12 },
  { id: 'attn', label: 'Attention', x: 390, y: 140, color: '#f59e0b', concept: 'QKᵀ/√d inner products + softmax', post: 12 },
  { id: 'out', label: 'Output', x: 490, y: 140, color: '#ef4444', concept: 'Classification / generation head', post: 13 },
]

const PIPELINE_EDGES = [
  ['data', 'embed'], ['data', 'pca'], ['embed', 'pca'],
  ['embed', 'linear'], ['pca', 'linear'], ['linear', 'attn'], ['attn', 'out'],
]

export function MLPipelineViz() {
  const [hovered, setHovered] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const W = 560; const H = 280

  const nodeById = (id: string) => PIPELINE_NODES.find(n => n.id === id)!

  const hNode = hovered ? PIPELINE_NODES.find(n => n.id === hovered) : null

  return (
    <div className="my-8 rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
        The ML Pipeline — Hover a node
      </h3>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full rounded bg-gray-50 dark:bg-gray-800">
        <defs>
          <marker id="pipe-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,1 L7,4 L0,7 Z" fill="#94a3b8" />
          </marker>
        </defs>
        {/* Edges */}
        {PIPELINE_EDGES.map(([from, to]) => {
          const n1 = nodeById(from); const n2 = nodeById(to)
          return (
            <line key={`${from}-${to}`}
              x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
              stroke="#cbd5e1" strokeWidth={1.5} markerEnd="url(#pipe-arrow)" />
          )
        })}
        {/* Nodes */}
        {PIPELINE_NODES.map(node => {
          const isHL = hovered === node.id
          return (
            <g key={node.id}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}>
              <circle cx={node.x} cy={node.y} r={isHL ? 34 : 28}
                fill={node.color + (isHL ? 'ff' : '33')}
                stroke={node.color} strokeWidth={isHL ? 3 : 1.5}
                style={{ transition: 'r 0.15s, fill 0.15s' }} />
              <text x={node.x} y={node.y + 4}
                textAnchor="middle" fontSize={10} fontWeight={isHL ? 'bold' : 'normal'}
                fill={isHL ? 'white' : node.color}>
                {node.label}
              </text>
            </g>
          )
        })}
        {/* Tooltip */}
        {hNode && (
          <g>
            <rect x={hNode.x - 90} y={hNode.y + 38} width={180} height={44} rx={6}
              fill="white" stroke={hNode.color} strokeWidth={1.5}
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
            <text x={hNode.x} y={hNode.y + 54} textAnchor="middle" fontSize={10} fill="#374151">
              {hNode.concept}
            </text>
            <text x={hNode.x} y={hNode.y + 70} textAnchor="middle" fontSize={9} fill={hNode.color}>
              → Post {hNode.post}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}

// ─── ConceptMapViz ────────────────────────────────────────────────────────────

const CONCEPTS = [
  { id: 'vec', label: 'Vectors', x: 100, y: 60, post: 1 },
  { id: 'vs', label: 'Vector Spaces', x: 240, y: 30, post: 2 },
  { id: 'mat', label: 'Matrices', x: 370, y: 60, post: 3 },
  { id: 'ip', label: 'Inner Products', x: 100, y: 160, post: 4 },
  { id: 'eig', label: 'Eigenvalues', x: 240, y: 130, post: 5 },
  { id: 'det', label: 'Determinants', x: 370, y: 160, post: 6 },
  { id: 'lu', label: 'LU / QR', x: 460, y: 100, post: 7 },
  { id: 'ls', label: 'Least Squares', x: 460, y: 200, post: 8 },
  { id: 'svd', label: 'SVD', x: 240, y: 230, post: 9 },
  { id: 'spec', label: 'Spectral Thm', x: 100, y: 260, post: 10 },
  { id: 'pd', label: 'PD Matrices', x: 370, y: 260, post: 11 },
  { id: 'nn', label: 'Neural Nets', x: 200, y: 330, post: 12 },
  { id: 'synth', label: 'Synthesis', x: 350, y: 330, post: 13 },
]

const CONCEPT_EDGES: [string, string][] = [
  ['vec', 'vs'], ['vec', 'ip'], ['vec', 'mat'],
  ['vs', 'mat'], ['vs', 'eig'],
  ['mat', 'det'], ['mat', 'eig'], ['mat', 'lu'],
  ['ip', 'eig'], ['ip', 'svd'],
  ['eig', 'spec'], ['eig', 'svd'],
  ['det', 'ls'], ['lu', 'ls'],
  ['svd', 'ls'], ['svd', 'nn'],
  ['spec', 'pd'], ['spec', 'nn'],
  ['pd', 'ls'], ['pd', 'nn'],
  ['nn', 'synth'], ['svd', 'synth'], ['ls', 'synth'],
]

export function ConceptMapViz() {
  const [active, setActive] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const W = 560; const H = 380

  const nodeById = (id: string) => CONCEPTS.find(n => n.id === id)!

  const connectedTo = (id: string) => new Set([
    ...CONCEPT_EDGES.filter(([a]) => a === id).map(([, b]) => b),
    ...CONCEPT_EDGES.filter(([, b]) => b === id).map(([a]) => a),
  ])

  const connected = active ? connectedTo(active) : new Set<string>()

  return (
    <div className="my-8 rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
        Concept Map — Click a node to see connections
      </h3>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full rounded bg-gray-50 dark:bg-gray-800">
        {/* Edges */}
        {CONCEPT_EDGES.map(([a, b]) => {
          const n1 = nodeById(a); const n2 = nodeById(b)
          const isActive = active && (a === active || b === active)
          return (
            <line key={`${a}-${b}`}
              x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
              stroke={isActive ? '#3b82f6' : '#e2e8f0'}
              strokeWidth={isActive ? 2 : 1}
              opacity={active ? (isActive ? 1 : 0.2) : 0.7} />
          )
        })}
        {/* Nodes */}
        {CONCEPTS.map(node => {
          const isActive = active === node.id
          const isConn = connected.has(node.id)
          const dim = active && !isActive && !isConn
          return (
            <g key={node.id} style={{ cursor: 'pointer' }}
              onClick={() => setActive(active === node.id ? null : node.id)}>
              <circle cx={node.x} cy={node.y} r={isActive ? 30 : 22}
                fill={isActive ? '#3b82f6' : isConn ? '#dbeafe' : 'white'}
                stroke={isActive ? '#1d4ed8' : isConn ? '#3b82f6' : '#cbd5e1'}
                strokeWidth={isActive ? 2.5 : 1.5}
                opacity={dim ? 0.25 : 1}
                style={{ transition: 'all 0.2s' }} />
              <text x={node.x} y={node.y - 2}
                textAnchor="middle" fontSize={9} fontWeight={isActive ? 'bold' : 'normal'}
                fill={isActive ? 'white' : dim ? '#94a3b8' : '#374151'}>
                {node.label}
              </text>
              <text x={node.x} y={node.y + 10}
                textAnchor="middle" fontSize={8}
                fill={isActive ? 'rgba(255,255,255,0.8)' : '#94a3b8'}>
                Post {node.post}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── ReviewQuizViz ────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    q: 'What does the spectral theorem say about a real symmetric matrix A?',
    options: [
      'A = LU (LU decomposition)',
      'A = QΛQᵀ where Q is orthogonal and Λ is diagonal',
      'A always has complex eigenvalues',
      'A is always invertible',
    ],
    correct: 1,
    explanation: 'The spectral theorem (Post 10) says every real symmetric matrix decomposes as A = QΛQᵀ, with orthogonal Q (eigenvectors as columns) and real diagonal Λ (eigenvalues).',
  },
  {
    q: 'A matrix is positive definite if and only if:',
    options: [
      'Its trace is positive',
      'Its determinant is positive',
      'All its eigenvalues are strictly positive',
      'It is symmetric',
    ],
    correct: 2,
    explanation: 'Positive definite (Post 11) means xᵀAx > 0 for all x ≠ 0, which is equivalent to all eigenvalues being strictly positive.',
  },
  {
    q: 'In the attention mechanism, what does QKᵀ compute?',
    options: [
      'The output embeddings for each token',
      'A matrix of inner products between queries and keys',
      'The softmax of the value vectors',
      'The gradient of the loss',
    ],
    correct: 1,
    explanation: 'QKᵀ is a matrix of dot products (inner products) between every query-key pair. Entry (i,j) measures how much token i attends to token j. (Post 12)',
  },
  {
    q: 'Why does LoRA work for fine-tuning large models?',
    options: [
      'It trains the full weight matrix faster using GPUs',
      'Fine-tuning updates tend to be low-rank, so W ≈ W₀ + AB captures most of the adaptation',
      'It avoids backpropagation entirely',
      'Attention heads are always rank-1',
    ],
    correct: 1,
    explanation: 'LoRA (Post 12) exploits that fine-tuning updates live in a low-dimensional subspace. W = W₀ + AB with small rank r captures most adaptation with far fewer parameters.',
  },
  {
    q: 'The singular values of a matrix X are related to eigenvalues of:',
    options: [
      'X itself',
      'X + Xᵀ',
      'XᵀX (or XXᵀ)',
      'X⁻¹',
    ],
    correct: 2,
    explanation: 'Singular values σᵢ = √λᵢ where λᵢ are eigenvalues of XᵀX. This is the link between SVD (Post 9) and eigendecomposition (Post 5).',
  },
]

export function ReviewQuizViz() {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUESTIONS.length).fill(null))

  const q = QUESTIONS[current]

  const handleSelect = (idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    const newAnswers = [...answers]
    newAnswers[current] = idx
    setAnswers(newAnswers)
    if (idx === q.correct) setScore(s => s + 1)
  }

  const handleNext = () => {
    if (current < QUESTIONS.length - 1) {
      setCurrent(c => c + 1)
      setSelected(answers[current + 1])
    } else {
      setDone(true)
    }
  }

  const handleReset = () => {
    setCurrent(0); setSelected(null); setScore(0)
    setDone(false); setAnswers(Array(QUESTIONS.length).fill(null))
  }

  if (done) {
    return (
      <div className="my-8 rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900 text-center">
        <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{score} / {QUESTIONS.length}</div>
        <div className="text-gray-600 dark:text-gray-400 mb-4">
          {score === QUESTIONS.length ? '🎯 Perfect score!' : score >= 3 ? 'Good understanding!' : 'Review the earlier posts and try again.'}
        </div>
        <button onClick={handleReset}
          className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="my-8 rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Quick Review Quiz
        </h3>
        <span className="text-xs text-gray-400 dark:text-gray-500">{current + 1} / {QUESTIONS.length}</span>
      </div>
      {/* Progress */}
      <div className="flex gap-1 mb-4">
        {QUESTIONS.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < current ? (answers[i] === QUESTIONS[i].correct ? 'bg-green-500' : 'bg-red-400') : i === current ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
        ))}
      </div>
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-4">{q.q}</p>
      <div className="flex flex-col gap-2 mb-4">
        {q.options.map((opt, i) => {
          const isSelected = selected === i
          const isCorrect = i === q.correct
          const showResult = selected !== null
          let cls = 'border rounded-lg px-3 py-2 text-sm text-left transition-colors '
          if (!showResult) {
            cls += 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer'
          } else if (isCorrect) {
            cls += 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
          } else if (isSelected && !isCorrect) {
            cls += 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
          } else {
            cls += 'border-gray-200 dark:border-gray-700 opacity-50'
          }
          return (
            <button key={i} className={cls} onClick={() => handleSelect(i)} disabled={selected !== null}>
              <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
            </button>
          )
        })}
      </div>
      {selected !== null && (
        <div className={`rounded-lg p-3 text-sm mb-4 ${selected === q.correct ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
          <span className="font-semibold">{selected === q.correct ? 'Correct! ' : 'Not quite. '}</span>
          {q.explanation}
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-gray-500">Score: {score}</span>
        <button
          onClick={handleNext}
          disabled={selected === null}
          className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {current < QUESTIONS.length - 1 ? 'Next →' : 'See Results'}
        </button>
      </div>
    </div>
  )
}
