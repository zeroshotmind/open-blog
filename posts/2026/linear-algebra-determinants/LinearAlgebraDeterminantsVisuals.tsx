'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Shared helpers ──────────────────────────────────────────────────────────

const W = 400
const H = 400
const CX = W / 2
const CY = H / 2
const SCALE = 60 // pixels per unit

function toSvg(x: number, y: number): [number, number] {
  return [CX + x * SCALE, CY - y * SCALE]
}

function fromSvg(sx: number, sy: number): [number, number] {
  return [(sx - CX) / SCALE, (CY - sy) / SCALE]
}

function GridLines() {
  const lines: React.ReactElement[] = []
  for (let i = -3; i <= 3; i++) {
    const [x0, y0] = toSvg(i, -3.5)
    const [x1, y1] = toSvg(i, 3.5)
    lines.push(<line key={`v${i}`} x1={x0} y1={y0} x2={x1} y2={y1} stroke="#e5e7eb" strokeWidth="1" />)
    const [x2, y2] = toSvg(-3.5, i)
    const [x3, y3] = toSvg(3.5, i)
    lines.push(<line key={`h${i}`} x1={x2} y1={y2} x2={x3} y2={y3} stroke="#e5e7eb" strokeWidth="1" />)
  }
  const [ax0, ay0] = toSvg(-3.5, 0)
  const [ax1, ay1] = toSvg(3.5, 0)
  const [bx0, by0] = toSvg(0, -3.5)
  const [bx1, by1] = toSvg(0, 3.5)
  return (
    <g>
      {lines}
      <line x1={ax0} y1={ay0} x2={ax1} y2={ay1} stroke="#9ca3af" strokeWidth="1.5" />
      <line x1={bx0} y1={by0} x2={bx1} y2={by1} stroke="#9ca3af" strokeWidth="1.5" />
    </g>
  )
}

function Arrow({
  x1, y1, x2, y2, color, label,
}: { x1: number; y1: number; x2: number; y2: number; color: string; label?: string }) {
  const [sx1, sy1] = toSvg(x1, y1)
  const [sx2, sy2] = toSvg(x2, y2)
  const id = `arrowhead-${color.replace('#', '')}`
  const angle = Math.atan2(sy2 - sy1, sx2 - sx1) * (180 / Math.PI)
  const len = Math.sqrt((sx2 - sx1) ** 2 + (sy2 - sy1) ** 2)
  const lx = sx1 + (sx2 - sx1) * 0.6 + Math.cos(angle * Math.PI / 180 - Math.PI / 2) * 12
  const ly = sy1 + (sy2 - sy1) * 0.6 + Math.sin(angle * Math.PI / 180 - Math.PI / 2) * 12
  return (
    <g>
      <defs>
        <marker id={id} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={color} />
        </marker>
      </defs>
      {len > 4 && (
        <line
          x1={sx1} y1={sy1} x2={sx2} y2={sy2}
          stroke={color} strokeWidth="2.5"
          markerEnd={`url(#${id})`}
        />
      )}
      {label && <text x={lx} y={ly} fill={color} fontSize="13" fontWeight="bold" textAnchor="middle">{label}</text>}
    </g>
  )
}

// ─── DeterminantViz ──────────────────────────────────────────────────────────

interface Vec2 { x: number; y: number }

export function DeterminantViz() {
  const [a, setA] = useState<Vec2>({ x: 2, y: 0.5 })
  const [b, setB] = useState<Vec2>({ x: 0.5, y: 2 })
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragging = useRef<'a' | 'b' | null>(null)

  const det = a.x * b.y - a.y * b.x
  const absDet = Math.abs(det)
  const isZero = absDet < 0.05

  const fillColor = isZero ? '#9ca3af' : det > 0 ? '#22c55e' : '#ef4444'
  const fillOpacity = isZero ? 0.3 : 0.35

  const [ox, oy] = toSvg(0, 0)
  const [ax, ay] = toSvg(a.x, a.y)
  const [bx, by] = toSvg(b.x, b.y)
  const [cx, cy] = toSvg(a.x + b.x, a.y + b.y)

  const clamp = (v: number) => Math.max(-3.5, Math.min(3.5, v))

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const [wx, wy] = fromSvg(sx, sy)
    const clamped = { x: clamp(wx), y: clamp(wy) }
    if (dragging.current === 'a') setA(clamped)
    else setB(clamped)
  }, [])

  const onMouseUp = useCallback(() => { dragging.current = null }, [])
  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!dragging.current || !svgRef.current) return
    const touch = e.touches[0]
    const rect = svgRef.current.getBoundingClientRect()
    const sx = touch.clientX - rect.left
    const sy = touch.clientY - rect.top
    const [wx, wy] = fromSvg(sx, sy)
    const clamped = { x: clamp(wx), y: clamp(wy) }
    if (dragging.current === 'a') setA(clamped)
    else setB(clamped)
    e.preventDefault()
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onMouseUp)
    }
  }, [onMouseMove, onMouseUp, onTouchMove])

  const startDrag = (which: 'a' | 'b') => () => { dragging.current = which }

  return (
    <div className="my-8 flex flex-col items-center gap-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">Drag the vector tips to explore the determinant</p>
      <svg
        ref={svgRef}
        width={W} height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 touch-none"
        style={{ maxWidth: '100%' }}
      >
        <GridLines />
        {/* Parallelogram */}
        <polygon
          points={`${ox},${oy} ${ax},${ay} ${cx},${cy} ${bx},${by}`}
          fill={fillColor}
          fillOpacity={fillOpacity}
          stroke={fillColor}
          strokeWidth="1.5"
          strokeOpacity="0.6"
        />
        <Arrow x1={0} y1={0} x2={a.x} y2={a.y} color="#3b82f6" label="a" />
        <Arrow x1={0} y1={0} x2={b.x} y2={b.y} color="#f59e0b" label="b" />
        {/* Drag handles */}
        <circle
          cx={ax} cy={ay} r={10} fill="#3b82f6" fillOpacity={0.2} stroke="#3b82f6" strokeWidth="2"
          style={{ cursor: 'grab' }}
          onMouseDown={startDrag('a')}
          onTouchStart={startDrag('a')}
        />
        <circle
          cx={bx} cy={by} r={10} fill="#f59e0b" fillOpacity={0.2} stroke="#f59e0b" strokeWidth="2"
          style={{ cursor: 'grab' }}
          onMouseDown={startDrag('b')}
          onTouchStart={startDrag('b')}
        />
      </svg>

      <div className="w-full max-w-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-5 py-4 space-y-1.5 font-mono text-sm">
        <div>
          <span className="text-blue-500">a</span> = ({a.x.toFixed(2)}, {a.y.toFixed(2)}) &nbsp;
          <span className="text-amber-500">b</span> = ({b.x.toFixed(2)}, {b.y.toFixed(2)})
        </div>
        <div>
          det = {a.x.toFixed(2)}·{b.y.toFixed(2)} − {a.y.toFixed(2)}·{b.x.toFixed(2)} ={' '}
          <span style={{ color: fillColor }} className="font-bold">{det.toFixed(3)}</span>
        </div>
        <div>Area = |det| = <strong>{absDet.toFixed(3)}</strong></div>
        {!isZero && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {det > 0 ? '↻ Orientation preserved' : '↺ Orientation flipped'}
          </div>
        )}
        {isZero && (
          <div className="text-xs font-semibold text-red-500">
            ⚠ Singular! Columns are linearly dependent.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── InvertibilityViz ────────────────────────────────────────────────────────

export function InvertibilityViz() {
  const [theta, setTheta] = useState(30)
  const [s, setS] = useState(1)

  const rad = (theta * Math.PI) / 180
  const cosT = Math.cos(rad)
  const sinT = Math.sin(rad)

  // Matrix: [[s·cosθ, -sinθ], [s·sinθ, cosθ]]
  const m00 = s * cosT; const m01 = -sinT
  const m10 = s * sinT; const m11 = cosT

  const det = m00 * m11 - m01 * m10  // s·cos²θ + s·sin²θ = s
  const isCollapsed = Math.abs(det) < 0.02

  // Transform unit square corners: (0,0),(1,0),(1,1),(0,1)
  const corners: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const transformed = corners.map(([x, y]): [number, number] => [
    m00 * x + m01 * y,
    m10 * x + m11 * y,
  ])

  const polyPoints = (pts: [number, number][]) =>
    pts.map(([x, y]) => toSvg(x, y).join(',')).join(' ')

  return (
    <div className="my-8 flex flex-col items-center gap-4">
      <div className="flex flex-wrap gap-6 w-full max-w-lg justify-center">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Rotation θ = {theta}°</span>
          <input type="range" min={0} max={360} value={theta} onChange={e => setTheta(+e.target.value)} className="w-40" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Squish s = {s.toFixed(2)}</span>
          <input type="range" min={0} max={2} step={0.01} value={s} onChange={e => setS(+e.target.value)} className="w-40" />
        </label>
      </div>

      <svg
        width={W} height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
        style={{ maxWidth: '100%' }}
      >
        <GridLines />
        {/* Original unit square (faint) */}
        <polygon
          points={polyPoints(corners)}
          fill="#6366f1"
          fillOpacity={0.12}
          stroke="#6366f1"
          strokeWidth="1"
          strokeDasharray="4 3"
        />
        {/* Transformed square */}
        <polygon
          points={polyPoints(transformed)}
          fill={isCollapsed ? '#9ca3af' : '#6366f1'}
          fillOpacity={isCollapsed ? 0.2 : 0.35}
          stroke={isCollapsed ? '#9ca3af' : '#6366f1'}
          strokeWidth="2"
        />
      </svg>

      <div className="w-full max-w-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-5 py-4 space-y-1.5 font-mono text-sm">
        <div>
          M = [[{m00.toFixed(2)}, {m01.toFixed(2)}], [{m10.toFixed(2)}, {m11.toFixed(2)}]]
        </div>
        <div>
          det(M) = s·cos²θ + s·sin²θ = s = <strong style={{ color: isCollapsed ? '#ef4444' : '#22c55e' }}>{det.toFixed(3)}</strong>
        </div>
        {isCollapsed && (
          <div className="text-xs font-semibold text-red-500">⚠ Square collapsed — not invertible!</div>
        )}
        {!isCollapsed && (
          <div className="text-xs text-gray-500 dark:text-gray-400">Area scales by |s| = {Math.abs(s).toFixed(2)}</div>
        )}
      </div>
    </div>
  )
}

// ─── InverseViz ──────────────────────────────────────────────────────────────

type Preset = { label: string; m: [number, number, number, number] }

const PRESETS: Preset[] = [
  { label: 'Shear', m: [1, 1, 0, 1] },
  { label: 'Scale+Rotate', m: [1.5, -0.5, 0.5, 1.5] },
  { label: 'Reflection', m: [0, 1, 1, 0] },
]

function applyMat(m: [number, number, number, number], x: number, y: number): [number, number] {
  return [m[0] * x + m[1] * y, m[2] * x + m[3] * y]
}

function invertMat(m: [number, number, number, number]): [number, number, number, number] | null {
  const d = m[0] * m[3] - m[1] * m[2]
  if (Math.abs(d) < 1e-9) return null
  return [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d]
}

export function InverseViz() {
  const [presetIdx, setPresetIdx] = useState(0)
  // 0 = original, 1 = forward (A applied), 2 = backward (A⁻¹ applied)
  const [phase, setPhase] = useState<0 | 1 | 2>(0)
  const [t, setT] = useState(0)
  const animRef = useRef<number | null>(null)

  const preset = PRESETS[presetIdx]
  const M = preset.m
  const Minv = invertMat(M)

  const det = M[0] * M[3] - M[1] * M[2]

  // Grid points
  const gridPts: [number, number][] = []
  for (let gx = -2; gx <= 2; gx++) {
    for (let gy = -2; gy <= 2; gy++) {
      gridPts.push([gx, gy])
    }
  }

  // Interpolated transform
  function interp(x: number, y: number): [number, number] {
    if (phase === 0) return [x, y]
    if (phase === 1) {
      const [tx, ty] = applyMat(M, x, y)
      return [x + (tx - x) * t, y + (ty - y) * t]
    }
    // phase 2: undo forward, then apply Minv to get back to identity
    const [fx, fy] = applyMat(M, x, y)
    if (!Minv) return [fx, fy]
    const [bx, by] = applyMat(Minv, fx, fy)
    return [fx + (bx - fx) * t, fy + (by - fy) * t]
  }

  const animate = useCallback((targetPhase: 1 | 2) => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    setPhase(targetPhase)
    setT(0)
    const start = performance.now()
    const dur = 900
    const step = (now: number) => {
      const frac = Math.min((now - start) / dur, 1)
      const eased = frac < 0.5 ? 2 * frac * frac : -1 + (4 - 2 * frac) * frac
      setT(eased)
      if (frac < 1) {
        animRef.current = requestAnimationFrame(step)
      } else {
        animRef.current = null
      }
    }
    animRef.current = requestAnimationFrame(step)
  }, [])

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current) }, [])

  const handleForward = () => {
    setPhase(0); setT(0)
    setTimeout(() => animate(1), 30)
  }
  const handleBackward = () => {
    // ensure we start from A·x state
    setPhase(1); setT(1)
    setTimeout(() => animate(2), 30)
  }
  const handleReset = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    setPhase(0); setT(0)
  }

  const [svgW, svgH] = [W, H]

  return (
    <div className="my-8 flex flex-col items-center gap-4">
      <div className="flex flex-wrap gap-3 justify-center">
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => { setPresetIdx(i); handleReset() }}
            className={`px-3 py-1 rounded-lg text-sm font-medium border transition-colors ${i === presetIdx ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <svg
        width={svgW} height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
        style={{ maxWidth: '100%' }}
      >
        <GridLines />
        {gridPts.map(([x, y], i) => {
          const [px, py] = interp(x, y)
          const [sx, sy] = toSvg(px, py)
          return <circle key={i} cx={sx} cy={sy} r={4} fill="#6366f1" fillOpacity={0.7} />
        })}
      </svg>

      <div className="flex gap-3">
        <button
          onClick={handleForward}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Apply A →
        </button>
        <button
          onClick={handleBackward}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          Apply A⁻¹ ←
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-5 py-4 space-y-1.5 font-mono text-sm">
        <div>A = [[{M[0]}, {M[1]}], [{M[2]}, {M[3]}]]</div>
        <div>det(A) = <strong>{det.toFixed(3)}</strong></div>
        {Minv && (
          <div>A⁻¹ = [[{Minv[0].toFixed(2)}, {Minv[1].toFixed(2)}], [{Minv[2].toFixed(2)}, {Minv[3].toFixed(2)}]]</div>
        )}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {phase === 0 && 'Original grid'}
          {phase === 1 && t < 1 && 'Applying A…'}
          {phase === 1 && t >= 1 && 'A applied — grid transformed'}
          {phase === 2 && t < 1 && 'Applying A⁻¹…'}
          {phase === 2 && t >= 1 && 'Back to start — A⁻¹·(A·x) = x ✓'}
        </div>
      </div>
    </div>
  )
}
