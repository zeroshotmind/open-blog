'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ─── QuadraticFormViz ────────────────────────────────────────────────────────

export function QuadraticFormViz() {
  const [a, setA] = useState(2)
  const [b, setB] = useState(0.5)
  const [d, setD] = useState(1.5)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const det = a * d - b * b
  const tr = a + d
  const disc = Math.sqrt(Math.max(0, ((a - d) / 2) ** 2 + b * b))
  const lam1 = tr / 2 + disc
  const lam2 = tr / 2 - disc

  const classify = () => {
    if (lam1 > 0 && lam2 > 0) return { label: 'Positive Definite', color: '#3b82f6' }
    if (lam1 >= 0 && lam2 >= 0) return { label: 'Positive Semidefinite', color: '#10b981' }
    if (lam1 > 0 && lam2 < 0) return { label: 'Indefinite (Saddle)', color: '#ef4444' }
    if (lam1 < 0 && lam2 < 0) return { label: 'Negative Definite', color: '#8b5cf6' }
    return { label: 'Indefinite', color: '#f59e0b' }
  }

  const { label, color } = classify()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width; const H = canvas.height
    const N = W

    const img = ctx.createImageData(W, H)
    let minVal = Infinity; let maxVal = -Infinity

    const vals: number[] = []
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const x = (px / W - 0.5) * 4
        const y = (0.5 - py / H) * 4
        const v = a * x * x + 2 * b * x * y + d * y * y
        vals.push(v)
        if (v < minVal) minVal = v
        if (v > maxVal) maxVal = v
      }
    }

    const range = maxVal - minVal || 1
    for (let i = 0; i < vals.length; i++) {
      const t = (vals[i] - minVal) / range
      // Blue to red colormap
      const r = Math.round(Math.min(255, t * 2 * 255))
      const g = Math.round(Math.max(0, 255 - Math.abs(t - 0.5) * 2 * 255))
      const bl = Math.round(Math.min(255, (1 - t) * 2 * 255))
      img.data[i * 4] = r
      img.data[i * 4 + 1] = g
      img.data[i * 4 + 2] = bl
      img.data[i * 4 + 3] = 255
    }
    ctx.putImageData(img, 0, 0)

    // Draw axes
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke()

    // Mark minimum if PD
    if (lam1 > 0 && lam2 > 0) {
      ctx.beginPath()
      ctx.arc(W / 2, H / 2, 5, 0, 2 * Math.PI)
      ctx.fillStyle = 'white'
      ctx.fill()
    }
  }, [a, b, d, lam1, lam2])

  return (
    <div className="my-8 rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
        Quadratic Form f(x,y) = ax² + 2bxy + dy²
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-3 text-xs text-gray-600 dark:text-gray-400">
        {[['a', a, setA, 0.1, 4], ['b', b, setB, -2, 2], ['d', d, setD, 0.1, 4]].map(([label, val, setter, min, max]: any) => (
          <label key={label} className="flex flex-col gap-1">
            <span>{label as string} = {(val as number).toFixed(1)}</span>
            <input type="range" min={min} max={max} step={0.1} value={val as number}
              onChange={e => (setter as Function)(parseFloat(e.target.value))} className="w-full" />
          </label>
        ))}
      </div>
      <canvas ref={canvasRef} width={300} height={200}
        className="w-full rounded" style={{ imageRendering: 'pixelated' }} />
      <div className="mt-2 flex items-center gap-3 text-sm">
        <span className="font-semibold" style={{ color }}>{label}</span>
        <span className="text-gray-500 dark:text-gray-400 text-xs">λ₁={lam1.toFixed(2)}, λ₂={lam2.toFixed(2)}, det={det.toFixed(2)}</span>
      </div>
      <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">Blue = low, Red = high. White dot = minimum (PD only).</div>
    </div>
  )
}

// ─── PDeigenvalueViz ─────────────────────────────────────────────────────────

export function PDeigenvalueViz() {
  const [mode, setMode] = useState<'pd' | 'indef'>('pd')
  const svgRef = useRef<SVGSVGElement | null>(null)

  const W = 400; const H = 300
  const cx = W / 2; const cy = H / 2; const scale = 60

  const toS = (x: number, y: number): [number, number] => [cx + x * scale, cy - y * scale]

  // PD: λ₁=3, λ₂=1, rotated 30°; Indefinite: λ₁=2, λ₂=-1
  const theta = Math.PI / 6
  const cos = Math.cos(theta); const sin = Math.sin(theta)

  const configs = {
    pd: { lam1: 3, lam2: 1, color1: '#3b82f6', color2: '#10b981', label: 'Positive Definite — Ellipse level sets' },
    indef: { lam1: 2, lam2: -1, color1: '#ef4444', color2: '#f59e0b', label: 'Indefinite — Hyperbola level sets (no min)' },
  }

  const cfg = configs[mode]

  // Draw ellipse level set at c=2: x²/lam1 + y²/lam2 = 2 in eigenbasis → transform
  function ellipsePoints(c: number) {
    if (cfg.lam1 <= 0 || cfg.lam2 <= 0) return []
    return Array.from({ length: 64 }, (_, i) => {
      const t = (2 * Math.PI * i) / 64
      const ex = Math.cos(t) * Math.sqrt(c / cfg.lam1)
      const ey = Math.sin(t) * Math.sqrt(c / cfg.lam2)
      // Rotate by theta
      const x = cos * ex - sin * ey
      const y = sin * ex + cos * ey
      return toS(x, y)
    })
  }

  const ellipses = mode === 'pd' ? [1, 2, 3].map(c => ellipsePoints(c)) : []

  // For indefinite, draw hyperbola branches
  function hyperbolaPoints(c: number, branch: 1 | -1) {
    return Array.from({ length: 40 }, (_, i) => {
      const t = -2 + i * 0.1
      const ex = branch * Math.cosh(t) * Math.sqrt(c / Math.abs(cfg.lam1))
      const ey = Math.sinh(t) * Math.sqrt(c / Math.abs(cfg.lam2))
      const x = cos * ex - sin * ey
      const y = sin * ex + cos * ey
      return toS(x, y)
    })
  }

  const [ex1, ey1] = toS(cos * 2, sin * 2)
  const [ex2, ey2] = toS(-sin * 2, cos * 2)
  const [ox, oy] = toS(0, 0)

  return (
    <div className="my-8 rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
        Level Sets and Eigenvectors
      </h3>
      <div className="flex gap-2 mb-3">
        {(['pd', 'indef'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${mode === m ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'}`}>
            {m === 'pd' ? 'Positive Definite' : 'Indefinite'}
          </button>
        ))}
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full rounded bg-gray-50 dark:bg-gray-800">
        <line x1={0} y1={cy} x2={W} y2={cy} stroke="#cbd5e1" strokeWidth={1} />
        <line x1={cx} y1={0} x2={cx} y2={H} stroke="#cbd5e1" strokeWidth={1} />

        {/* Ellipses */}
        {ellipses.map((pts, j) => {
          const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') + ' Z'
          return <path key={j} d={d} fill="none" stroke="#3b82f6" strokeWidth={1.5} opacity={0.4 + j * 0.2} />
        })}

        {/* Hyperbolas for indefinite */}
        {mode === 'indef' && [1, -1].map(branch => {
          const pts1 = hyperbolaPoints(2, branch as 1 | -1)
          const d = pts1.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
          return <path key={branch} d={d} fill="none" stroke="#ef4444" strokeWidth={1.5} opacity={0.7} />
        })}

        {/* Eigenvectors */}
        <line x1={ox} y1={oy} x2={ex1} y2={ey1} stroke={cfg.color1} strokeWidth={2} />
        <line x1={ox} y1={oy} x2={ex2} y2={ey2} stroke={cfg.color2} strokeWidth={2} />
        <text x={ex1 + 4} y={ey1 - 4} fontSize={11} fill={cfg.color1}>q₁ (λ={cfg.lam1})</text>
        <text x={ex2 + 4} y={ey2 - 4} fontSize={11} fill={cfg.color2}>q₂ (λ={cfg.lam2})</text>
        <text x={10} y={H - 10} fontSize={11} fill="#64748b">{cfg.label}</text>
      </svg>
    </div>
  )
}

// ─── CholeskyViz ──────────────────────────────────────────────────────────────

export function CholeskyViz() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  // Fixed 3×3 PD matrix
  const A = [[4, 2, 1], [2, 3, 0.5], [1, 0.5, 2]]

  // Compute Cholesky
  const L: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  for (let j = 0; j < 3; j++) {
    let s = A[j][j] - L[j].slice(0, j).reduce((acc, v) => acc + v * v, 0)
    L[j][j] = Math.sqrt(Math.max(0, s))
    for (let i = j + 1; i < 3; i++) {
      let si = A[i][j] - L[i].slice(0, j).reduce((acc, v, k) => acc + v * L[j][k], 0)
      L[i][j] = si / L[j][j]
    }
  }

  const [highlight, setHighlight] = useState<[number, number] | null>(null)

  const cellSize = 60
  const pad = 20

  function MatGrid({ mat, label, color, cx }: { mat: number[][], label: string, color: string, cx: number }) {
    return (
      <g>
        <text x={cx + cellSize * 1.5} y={pad - 5} textAnchor="middle" fontSize={13} fontWeight="bold" fill={color}>{label}</text>
        {mat.map((row, i) => row.map((val, j) => {
          const x = cx + j * cellSize
          const y = pad + i * cellSize
          const isHL = highlight && highlight[0] === i && highlight[1] === j
          const isLower = j <= i
          return (
            <g key={`${i}-${j}`}
              onMouseEnter={() => setHighlight([i, j])}
              onMouseLeave={() => setHighlight(null)}
              style={{ cursor: 'pointer' }}>
              <rect x={x} y={y} width={cellSize - 2} height={cellSize - 2} rx={4}
                fill={isHL ? color + '33' : (isLower ? '#f8fafc' : '#f1f5f9')}
                stroke={isHL ? color : '#e2e8f0'} strokeWidth={isHL ? 2 : 1} />
              <text x={x + cellSize / 2 - 1} y={y + cellSize / 2 + 5}
                textAnchor="middle" fontSize={12}
                fill={isLower ? '#1e293b' : '#94a3b8'}>
                {isLower ? val.toFixed(2) : '0'}
              </text>
            </g>
          )
        }))}
      </g>
    )
  }

  const W = 560; const H = 240

  return (
    <div className="my-8 rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
        Cholesky Decomposition: A = LLᵀ
      </h3>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xl mx-auto">
          <MatGrid mat={A} label="A" color="#6366f1" cx={10} />
          <text x={220} y={H / 2} textAnchor="middle" fontSize={20} fill="#64748b">=</text>
          <MatGrid mat={L} label="L" color="#10b981" cx={240} />
          <text x={435} y={H / 2} textAnchor="middle" fontSize={20} fill="#64748b">×</text>
          <MatGrid mat={L[0].map((_, j) => L.map(row => row[j]))} label="Lᵀ" color="#f59e0b" cx={460} />
        </svg>
      </div>
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Hover cells to highlight. L is lower triangular. Zero entries in Lᵀ shown in gray.
      </div>
      {highlight && (
        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
          L[{highlight[0]+1},{highlight[1]+1}] = {highlight[1] <= highlight[0] ? L[highlight[0]][highlight[1]].toFixed(4) : '0 (upper triangle)'}
        </div>
      )}
    </div>
  )
}
