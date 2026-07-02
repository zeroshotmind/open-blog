'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ─── SpectralDecompositionViz ───────────────────────────────────────────────

type Preset = 'identity' | 'posdef' | 'indefinite'

interface Matrix2x2 { a: number; b: number; c: number; d: number }

function matMul2(A: Matrix2x2, B: Matrix2x2): Matrix2x2 {
  return {
    a: A.a * B.a + A.b * B.c,
    b: A.a * B.b + A.b * B.d,
    c: A.c * B.a + A.d * B.c,
    d: A.c * B.b + A.d * B.d,
  }
}

function applyMatrix(M: Matrix2x2, x: number, y: number): [number, number] {
  return [M.a * x + M.b * y, M.c * x + M.d * y]
}

function eigenSymm(a: number, b: number, d: number): { lam1: number; lam2: number; v1: [number, number]; v2: [number, number] } {
  const tr = a + d
  const det = a * d - b * b
  const disc = Math.sqrt(Math.max(0, ((a - d) / 2) ** 2 + b * b))
  const lam1 = tr / 2 + disc
  const lam2 = tr / 2 - disc
  let v1: [number, number], v2: [number, number]
  if (Math.abs(b) > 1e-9) {
    const n1 = Math.sqrt((lam1 - d) ** 2 + b * b)
    v1 = [(lam1 - d) / n1, b / n1]
    const n2 = Math.sqrt((lam2 - d) ** 2 + b * b)
    v2 = [(lam2 - d) / n2, b / n2]
  } else {
    v1 = a >= d ? [1, 0] : [0, 1]
    v2 = a >= d ? [0, 1] : [1, 0]
  }
  return { lam1, lam2, v1, v2 }
}

const PRESETS: Record<Preset, { a: number; b: number; d: number; label: string }> = {
  identity: { a: 1, b: 0, d: 1, label: 'Identity' },
  posdef: { a: 3, b: 1, d: 2, label: 'Positive Definite' },
  indefinite: { a: 2, b: 1.5, d: -1, label: 'Indefinite' },
}

function toSVG(x: number, y: number, cx: number, cy: number, scale: number): [number, number] {
  return [cx + x * scale, cy - y * scale]
}

export function SpectralDecompositionViz() {
  const [preset, setPreset] = useState<Preset>('posdef')
  const [step, setStep] = useState(0)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const { a, b, d } = PRESETS[preset]
  const { lam1, lam2, v1, v2 } = eigenSymm(a, b, d)

  const W = 500; const H = 300
  const cx = W / 2; const cy = H / 2; const scale = 80

  // Unit circle points
  const N = 64
  const circle = Array.from({ length: N }, (_, i) => {
    const theta = (2 * Math.PI * i) / N
    return [Math.cos(theta), Math.sin(theta)] as [number, number]
  })

  // Q matrix (columns = eigenvectors)
  const Q: Matrix2x2 = { a: v1[0], b: v2[0], c: v1[1], d: v2[1] }
  const Qt: Matrix2x2 = { a: v1[0], b: v1[1], c: v2[0], d: v2[1] }
  const Lam: Matrix2x2 = { a: lam1, b: 0, c: 0, d: lam2 }
  const A: Matrix2x2 = { a, b, c: b, d }

  function getPoints(pts: [number, number][], M: Matrix2x2) {
    return pts.map(([x, y]) => applyMatrix(M, x, y))
  }

  // Interpolate between two point sets
  function lerp(t: number, from: [number, number][], to: [number, number][]): [number, number][] {
    return from.map(([x, y], i) => [x + t * (to[i][0] - x), y + t * (to[i][1] - y)] as [number, number])
  }

  const stepData = [
    { label: 'Start: unit circle', points: circle },
    { label: 'Step 1: Qᵀ rotates into eigenbasis', points: getPoints(circle, Qt) },
    { label: 'Step 2: Λ scales along eigen-axes', points: getPoints(getPoints(circle, Qt), Lam) },
    { label: 'Step 3: Q rotates back → A applied', points: getPoints(circle, A) },
  ]

  const current = stepData[step]
  const pathD = current.points.map(([x, y], i) => {
    const [sx, sy] = toSVG(x, y, cx, cy, scale)
    return `${i === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`
  }).join(' ') + ' Z'

  return (
    <div className="my-8 rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
        Spectral Decomposition: A = QΛQᵀ
      </h3>

      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(PRESETS) as Preset[]).map(p => (
          <button
            key={p}
            onClick={() => { setPreset(p); setStep(0) }}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${preset === p ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            {PRESETS[p].label}
          </button>
        ))}
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full rounded bg-gray-50 dark:bg-gray-800">
        {/* Axes */}
        <line x1={0} y1={cy} x2={W} y2={cy} stroke="#cbd5e1" strokeWidth={1} />
        <line x1={cx} y1={0} x2={cx} y2={H} stroke="#cbd5e1" strokeWidth={1} />
        {/* Unit circle reference */}
        <circle cx={cx} cy={cy} r={scale} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 4" fill="none" />
        {/* Transformed ellipse */}
        <path d={pathD} fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth={2} />
        {/* Eigenvectors */}
        {[v1, v2].map((v, i) => {
          const lam = i === 0 ? lam1 : lam2
          const [x2, y2] = toSVG(v[0] * Math.abs(lam), v[1] * Math.abs(lam), cx, cy, scale)
          const [x1, y1] = toSVG(0, 0, cx, cy, scale)
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={i === 0 ? '#f59e0b' : '#10b981'} strokeWidth={2}
                markerEnd={`url(#arr${i})`} />
            </g>
          )
        })}
        <defs>
          <marker id="arr0" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#f59e0b" />
          </marker>
          <marker id="arr1" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#10b981" />
          </marker>
        </defs>
        {/* Labels */}
        <text x={12} y={20} fontSize={12} fill="#64748b">{current.label}</text>
        <text x={12} y={H - 12} fontSize={11} fill="#f59e0b">λ₁ = {lam1.toFixed(2)}</text>
        <text x={120} y={H - 12} fontSize={11} fill="#10b981">λ₂ = {lam2.toFixed(2)}</text>
      </svg>

      <div className="flex gap-2 mt-3">
        {stepData.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${step === i ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}
          >
            Step {i}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── EigenbasisViz ───────────────────────────────────────────────────────────

export function EigenbasisViz() {
  const [a, setA] = useState(3)
  const [b, setB] = useState(1)
  const [d, setD] = useState(2)
  const [vx, setVx] = useState(1.2)
  const [vy, setVy] = useState(0.8)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragging = useRef(false)

  const W = 400; const H = 300
  const cx = W / 2; const cy = H / 2; const scale = 70

  const { lam1, lam2, v1, v2 } = eigenSymm(a, b, d)

  // Express [vx, vy] in eigenbasis
  const c1 = v1[0] * vx + v1[1] * vy
  const c2 = v2[0] * vx + v2[1] * vy

  const toS = (x: number, y: number) => toSVG(x, y, cx, cy, scale)

  const handleSVGMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    dragging.current = true
  }, [])

  const handleSVGMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging.current || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    const y = ((e.clientY - rect.top) / rect.height) * H
    setVx(parseFloat(((x - cx) / scale).toFixed(2)))
    setVy(parseFloat(((cy - y) / scale).toFixed(2)))
  }, [cx, cy, scale])

  const handleSVGMouseUp = useCallback(() => { dragging.current = false }, [])

  const [ox, oy] = toS(0, 0)
  const [vsx, vsy] = toS(vx, vy)
  const [e1x, e1y] = toS(v1[0] * 1.5, v1[1] * 1.5)
  const [e2x, e2y] = toS(v2[0] * 1.5, v2[1] * 1.5)

  return (
    <div className="my-8 rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
        Eigenbasis — Drag the vector
      </h3>
      <div className="grid grid-cols-3 gap-2 mb-3 text-xs text-gray-600 dark:text-gray-400">
        {[['a', a, setA, 0.5, 4], ['b', b, setB, -2, 2], ['d', d, setD, 0.5, 4]].map(([label, val, setter, min, max]: any) => (
          <label key={label} className="flex flex-col gap-1">
            <span>A[{label === 'a' ? '1,1' : label === 'b' ? '1,2=2,1' : '2,2'}] = {val.toFixed(1)}</span>
            <input type="range" min={min} max={max} step={0.1} value={val}
              onChange={e => setter(parseFloat(e.target.value))}
              className="w-full" />
          </label>
        ))}
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded bg-gray-50 dark:bg-gray-800 cursor-crosshair"
        onMouseDown={handleSVGMouseDown} onMouseMove={handleSVGMouseMove}
        onMouseUp={handleSVGMouseUp} onMouseLeave={handleSVGMouseUp}>
        <line x1={0} y1={cy} x2={W} y2={cy} stroke="#cbd5e1" strokeWidth={1} />
        <line x1={cx} y1={0} x2={cx} y2={H} stroke="#cbd5e1" strokeWidth={1} />
        {/* Eigenvector axes */}
        <line x1={cx} y1={cy} x2={e1x} y2={e1y} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="6 3" />
        <line x1={cx} y1={cy} x2={2*cx-e1x} y2={2*cy-e1y} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="6 3" />
        <line x1={cx} y1={cy} x2={e2x} y2={e2y} stroke="#10b981" strokeWidth={1.5} strokeDasharray="6 3" />
        <line x1={cx} y1={cy} x2={2*cx-e2x} y2={2*cy-e2y} stroke="#10b981" strokeWidth={1.5} strokeDasharray="6 3" />
        {/* Vector */}
        <line x1={ox} y1={oy} x2={vsx} y2={vsy} stroke="#3b82f6" strokeWidth={2.5} />
        <circle cx={vsx} cy={vsy} r={6} fill="#3b82f6" stroke="white" strokeWidth={2} />
        {/* Labels */}
        <text x={e1x + 4} y={e1y - 4} fontSize={11} fill="#f59e0b">q₁ (λ={lam1.toFixed(1)})</text>
        <text x={e2x + 4} y={e2y - 4} fontSize={11} fill="#10b981">q₂ (λ={lam2.toFixed(1)})</text>
      </svg>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-400">
        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
          <div className="font-medium mb-1">Standard basis</div>
          <div>x = ({vx.toFixed(2)}, {vy.toFixed(2)})</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
          <div className="font-medium mb-1">Eigenbasis coords</div>
          <div>c₁ = {c1.toFixed(2)}, c₂ = {c2.toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}

// ─── MatrixPowerViz ──────────────────────────────────────────────────────────

export function MatrixPowerViz() {
  const [n, setN] = useState(1)
  const svgRef = useRef<SVGSVGElement | null>(null)

  // Fixed example: λ₁=2, λ₂=0.5, eigenvectors at 30°
  const theta = Math.PI / 6
  const lam1 = 2; const lam2 = 0.5
  const v1: [number, number] = [Math.cos(theta), Math.sin(theta)]
  const v2: [number, number] = [-Math.sin(theta), Math.cos(theta)]

  const W = 400; const H = 300
  const cx = W / 2; const cy = H / 2; const scale = 60

  const toS = (x: number, y: number) => toSVG(x, y, cx, cy, scale)

  // Aⁿ = Q Λⁿ Qᵀ — apply to a set of initial vectors
  const initVecs: [number, number][] = [
    [1, 0], [0, 1], [-1, 0], [0, -1],
    [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7],
  ]

  function applyAn(x: number, y: number): [number, number] {
    const c1 = v1[0] * x + v1[1] * y
    const c2 = v2[0] * x + v2[1] * y
    const scale1 = Math.pow(lam1, n) * c1
    const scale2 = Math.pow(lam2, n) * c2
    return [scale1 * v1[0] + scale2 * v2[0], scale1 * v1[1] + scale2 * v2[1]]
  }

  const transformed = initVecs.map(([x, y]) => applyAn(x, y))

  return (
    <div className="my-8 rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
        Matrix Powers: Aⁿ = QΛⁿQᵀ (λ₁=2, λ₂=0.5)
      </h3>
      <label className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
        <span>n = {n}</span>
        <input type="range" min={1} max={8} step={1} value={n}
          onChange={e => setN(parseInt(e.target.value))}
          className="flex-1" />
      </label>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full rounded bg-gray-50 dark:bg-gray-800">
        <line x1={0} y1={cy} x2={W} y2={cy} stroke="#cbd5e1" strokeWidth={1} />
        <line x1={cx} y1={0} x2={cx} y2={H} stroke="#cbd5e1" strokeWidth={1} />
        {/* Original vectors (faded) */}
        {initVecs.map(([x, y], i) => {
          const [x2, y2] = toS(x, y)
          const [x1, y1] = toS(0, 0)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth={1.5} />
        })}
        {/* Transformed vectors */}
        {transformed.map(([x, y], i) => {
          const MAX = 3
          const len = Math.sqrt(x * x + y * y)
          const clamp = len > MAX ? MAX / len : 1
          const [x2, y2] = toS(x * clamp, y * clamp)
          const [x1, y1] = toS(0, 0)
          const clipped = len > MAX
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#3b82f6" strokeWidth={2} opacity={clipped ? 0.5 : 1} />
              <circle cx={x2} cy={y2} r={4} fill="#3b82f6" opacity={clipped ? 0.5 : 1} />
            </g>
          )
        })}
        {/* Dominant eigenvector */}
        {(() => {
          const [ex, ey] = toS(v1[0] * 2, v1[1] * 2)
          const [ox, oy] = toS(0, 0)
          return <line x1={ox} y1={oy} x2={ex} y2={ey} stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" />
        })()}
        <text x={12} y={20} fontSize={11} fill="#64748b">
          Dominant direction (q₁) grows by {Math.pow(lam1, n).toFixed(0)}×; q₂ shrinks by {Math.pow(lam2, n).toFixed(3)}×
        </text>
      </svg>
    </div>
  )
}
