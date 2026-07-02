'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ─── LinearLayerViz ──────────────────────────────────────────────────────────

export function LinearLayerViz() {
  const [w11, setW11] = useState(1.5)
  const [w12, setW12] = useState(0.5)
  const [w21, setW21] = useState(-0.5)
  const [w22, setW22] = useState(1.2)
  const [bx, setBx] = useState(0)
  const [by, setBy] = useState(0)
  const [showBias, setShowBias] = useState(false)
  const [px, setPx] = useState(0.8)
  const [py, setPy] = useState(0.6)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragging = useRef(false)

  const W2 = 350; const H2 = 280
  const cx = W2 / 2; const cy = H2 / 2; const sc = 70

  const toS = (x: number, y: number): [number, number] => [cx + x * sc, cy - y * sc]

  // Output
  const ox = w11 * px + w12 * py + (showBias ? bx : 0)
  const oy = w21 * px + w22 * py + (showBias ? by : 0)

  // Unit circle transformed
  const N = 60
  const ellipsePts = Array.from({ length: N }, (_, i) => {
    const t = (2 * Math.PI * i) / N
    const ix = Math.cos(t); const iy = Math.sin(t)
    return [w11 * ix + w12 * iy + (showBias ? bx : 0), w21 * ix + w22 * iy + (showBias ? by : 0)] as [number, number]
  })
  const pathD = ellipsePts.map(([x, y], i) => {
    const [sx, sy] = toS(x, y)
    return `${i === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`
  }).join(' ') + ' Z'

  const handleMouseDown = useCallback(() => { dragging.current = true }, [])
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging.current || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W2
    const y = ((e.clientY - rect.top) / rect.height) * H2
    setPx(parseFloat(((x - cx) / sc).toFixed(2)))
    setPy(parseFloat(((cy - y) / sc).toFixed(2)))
  }, [cx, cy, sc])
  const handleMouseUp = useCallback(() => { dragging.current = false }, [])

  const [ipx, ipy] = toS(px, py)
  const [opx, opy] = toS(ox, oy)
  const [ox0, oy0] = toS(0, 0)

  return (
    <div className="my-8 rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
        Linear Layer: y = Wx + b — Drag the blue point
      </h3>
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-600 dark:text-gray-400">
        {[['W[1,1]', w11, setW11], ['W[1,2]', w12, setW12], ['W[2,1]', w21, setW21], ['W[2,2]', w22, setW22]].map(([label, val, setter]: any) => (
          <label key={label} className="flex flex-col gap-1">
            <span>{label} = {(val as number).toFixed(1)}</span>
            <input type="range" min={-2} max={2} step={0.1} value={val as number}
              onChange={e => (setter as Function)(parseFloat(e.target.value))} className="w-full" />
          </label>
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
        <input type="checkbox" checked={showBias} onChange={e => setShowBias(e.target.checked)} />
        Show bias b = ({bx.toFixed(1)}, {by.toFixed(1)})
      </label>
      {showBias && (
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-600 dark:text-gray-400">
          {[['bx', bx, setBx], ['by', by, setBy]].map(([label, val, setter]: any) => (
            <label key={label} className="flex flex-col gap-1">
              <span>{label} = {(val as number).toFixed(1)}</span>
              <input type="range" min={-1.5} max={1.5} step={0.1} value={val as number}
                onChange={e => (setter as Function)(parseFloat(e.target.value))} className="w-full" />
            </label>
          ))}
        </div>
      )}
      <svg ref={svgRef} viewBox={`0 0 ${W2} ${H2}`}
        className="w-full rounded bg-gray-50 dark:bg-gray-800 cursor-crosshair"
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <line x1={0} y1={cy} x2={W2} y2={cy} stroke="#cbd5e1" strokeWidth={1} />
        <line x1={cx} y1={0} x2={cx} y2={H2} stroke="#cbd5e1" strokeWidth={1} />
        {/* Unit circle */}
        <circle cx={cx} cy={cy} r={sc} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" fill="none" />
        {/* Transformed ellipse */}
        <path d={pathD} fill="rgba(99,102,241,0.1)" stroke="#6366f1" strokeWidth={1.5} />
        {/* Input vector */}
        <line x1={ox0} y1={oy0} x2={ipx} y2={ipy} stroke="#3b82f6" strokeWidth={2} />
        <circle cx={ipx} cy={ipy} r={7} fill="#3b82f6" stroke="white" strokeWidth={2} />
        {/* Output vector */}
        <line x1={ox0} y1={oy0} x2={opx} y2={opy} stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 3" />
        <circle cx={opx} cy={opy} r={7} fill="#f59e0b" stroke="white" strokeWidth={2} />
        <text x={10} y={20} fontSize={11} fill="#3b82f6">x = ({px.toFixed(2)}, {py.toFixed(2)})</text>
        <text x={10} y={34} fontSize={11} fill="#f59e0b">Wx+b = ({ox.toFixed(2)}, {oy.toFixed(2)})</text>
      </svg>
    </div>
  )
}

// ─── AttentionViz ─────────────────────────────────────────────────────────────

const TOKENS = ['cat', 'sat', 'mat']

// Fixed Q, K, V for 3 tokens, 2D
const Q_MAT = [[0.8, 0.2], [0.1, 0.9], [0.5, 0.5]]
const K_MAT = [[0.9, 0.1], [0.2, 0.8], [0.6, 0.4]]
const V_MAT = [[1.0, 0.0], [0.0, 1.0], [0.5, 0.5]]

function softmax(row: number[]): number[] {
  const max = Math.max(...row)
  const exps = row.map(x => Math.exp(x - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map(e => e / sum)
}

function dot(a: number[], b: number[]): number {
  return a.reduce((s, v, i) => s + v * b[i], 0)
}

export function AttentionViz() {
  const [selected, setSelected] = useState(0)

  // QKᵀ scores (3×3)
  const scores = Q_MAT.map(q => K_MAT.map(k => dot(q, k) / Math.sqrt(2)))
  const attn = scores.map(row => softmax(row))

  // Output: A × V
  const output = attn.map(row => [
    row.reduce((s, a, j) => s + a * V_MAT[j][0], 0),
    row.reduce((s, a, j) => s + a * V_MAT[j][1], 0),
  ])

  const cellSize = 56
  const W = 540; const H = 340

  const colorCell = (v: number) => {
    const t = Math.min(1, Math.max(0, v))
    const r = Math.round(59 + (239 - 59) * t)
    const g = Math.round(130 + (68 - 130) * t)
    const b = Math.round(246 + (68 - 246) * t)
    return `rgb(${r},${g},${b})`
  }

  return (
    <div className="my-8 rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
        Attention Mechanism — Click a token
      </h3>
      <div className="flex gap-2 mb-4">
        {TOKENS.map((t, i) => (
          <button key={i} onClick={() => setSelected(i)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selected === i ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'}`}>
            "{t}"
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 text-xs text-gray-600 dark:text-gray-400">
        <div>
          <div className="font-semibold mb-1 text-gray-700 dark:text-gray-300">Attention weights for "{TOKENS[selected]}"</div>
          <div className="flex gap-2">
            {TOKENS.map((t, j) => (
              <div key={j} className="flex-1 text-center">
                <div className="rounded py-2 text-white text-sm font-medium mb-1"
                  style={{ background: colorCell(attn[selected][j]) }}>
                  {attn[selected][j].toFixed(3)}
                </div>
                <div>"{t}"</div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="font-semibold mb-1 text-gray-700 dark:text-gray-300">Q (queries)</div>
            {Q_MAT.map((row, i) => (
              <div key={i} className={`text-xs py-0.5 px-1 rounded mb-0.5 ${i === selected ? 'bg-blue-50 dark:bg-blue-900/30 font-medium' : ''}`}>
                "{TOKENS[i]}": [{row.map(v => v.toFixed(2)).join(', ')}]
              </div>
            ))}
          </div>
          <div>
            <div className="font-semibold mb-1 text-gray-700 dark:text-gray-300">K (keys)</div>
            {K_MAT.map((row, i) => (
              <div key={i} className="text-xs py-0.5 px-1 rounded mb-0.5">
                "{TOKENS[i]}": [{row.map(v => v.toFixed(2)).join(', ')}]
              </div>
            ))}
          </div>
          <div>
            <div className="font-semibold mb-1 text-gray-700 dark:text-gray-300">Output for "{TOKENS[selected]}"</div>
            <div className="text-xs py-0.5 px-1 rounded bg-amber-50 dark:bg-amber-900/30">
              [{output[selected].map(v => v.toFixed(3)).join(', ')}]
            </div>
            <div className="mt-1 text-gray-400 dark:text-gray-500">= weighted sum of V rows</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── LoRAViz ─────────────────────────────────────────────────────────────────

export function LoRAViz() {
  const [rank, setRank] = useState(2)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const M = 12; const N = 16
  const maxRank = Math.min(M, N)

  // Generate a fixed "pretrained" weight matrix W0 and a low-rank update
  const W0 = useRef<number[][]>([])
  const Utrue = useRef<number[][]>([])
  const Vtrue = useRef<number[][]>([])

  useEffect(() => {
    // Deterministic pseudo-random fill
    const lcg = (s: number) => { let x = s; return () => { x = (x * 1664525 + 1013904223) & 0xffffffff; return (x >>> 0) / 0xffffffff } }
    const rand = lcg(42)
    W0.current = Array.from({ length: M }, () => Array.from({ length: N }, () => (rand() - 0.5) * 0.5))
    Utrue.current = Array.from({ length: M }, () => Array.from({ length: 4 }, () => (rand() - 0.5)))
    Vtrue.current = Array.from({ length: 4 }, () => Array.from({ length: N }, () => (rand() - 0.5)))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cellW = 8; const cellH = 8
    const gap = 16
    const sections = [
      { label: 'W₀ (frozen)', mat: W0.current, x: 10 },
      { label: 'A (tall)', mat: Utrue.current.map(row => row.slice(0, rank)), x: 10 + N * cellW + gap },
      { label: 'B (wide)', mat: Vtrue.current.slice(0, rank), x: 10 + N * cellW + gap + rank * cellW + gap },
    ]

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const sec of sections) {
      const rows = sec.mat.length; const cols = sec.mat[0]?.length ?? 0
      ctx.fillStyle = '#64748b'
      ctx.font = '10px sans-serif'
      ctx.fillText(sec.label, sec.x, 12)
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const v = Math.min(1, Math.max(-1, sec.mat[i][j]))
          const t = (v + 1) / 2
          const r = Math.round(59 + (239 - 59) * t)
          const g = Math.round(130 + (68 - 130) * t)
          const b = Math.round(246 + (68 - 246) * t)
          ctx.fillStyle = `rgb(${r},${g},${b})`
          ctx.fillRect(sec.x + j * cellW, 18 + i * cellH, cellW - 1, cellH - 1)
        }
      }
    }
  }, [rank])

  const fullParams = M * N
  const loraParams = rank * (M + N)
  const savings = ((1 - loraParams / fullParams) * 100).toFixed(0)

  return (
    <div className="my-8 rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
        LoRA: W ≈ W₀ + AB (low-rank update)
      </h3>
      <label className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
        <span>Rank r = {rank}</span>
        <input type="range" min={1} max={4} step={1} value={rank}
          onChange={e => setRank(parseInt(e.target.value))} className="flex-1" />
      </label>
      <canvas ref={canvasRef} width={480} height={130} className="w-full rounded" style={{ imageRendering: 'pixelated' }} />
      <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs text-gray-600 dark:text-gray-400">
        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
          <div className="font-semibold text-gray-800 dark:text-gray-200">{fullParams}</div>
          <div>Full W params ({M}×{N})</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
          <div className="font-semibold text-blue-700 dark:text-blue-300">{loraParams}</div>
          <div>LoRA params (r={rank})</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded p-2">
          <div className="font-semibold text-green-700 dark:text-green-300">{savings}%</div>
          <div>Parameter savings</div>
        </div>
      </div>
    </div>
  )
}
