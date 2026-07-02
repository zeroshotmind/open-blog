'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// ─────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────

const W = 500
const H = 400
const CX = W / 2
const CY = H / 2
const SCALE = 70 // px per unit

function toSVG(x: number, y: number) {
  return { sx: CX + x * SCALE, sy: CY - y * SCALE }
}

function fromSVG(sx: number, sy: number) {
  return { x: (sx - CX) / SCALE, y: (CY - sy) / SCALE }
}

function Grid({ w = W, h = H, cx = CX, cy = CY, scale = SCALE }) {
  const xs = Math.floor(cx / scale)
  const ys = Math.floor(cy / scale)
  return (
    <g>
      {/* grid lines */}
      {Array.from({ length: xs * 2 + 1 }, (_, i) => i - xs).map((n) => (
        <line
          key={`v${n}`}
          x1={cx + n * scale}
          y1={0}
          x2={cx + n * scale}
          y2={h}
          stroke="currentColor"
          strokeWidth={n === 0 ? 1.5 : 0.5}
          opacity={n === 0 ? 0.4 : 0.15}
        />
      ))}
      {Array.from({ length: ys * 2 + 1 }, (_, i) => i - ys).map((n) => (
        <line
          key={`h${n}`}
          x1={0}
          y1={cy + n * scale}
          x2={w}
          y2={cy + n * scale}
          stroke="currentColor"
          strokeWidth={n === 0 ? 1.5 : 0.5}
          opacity={n === 0 ? 0.4 : 0.15}
        />
      ))}
      {/* axis arrows */}
      <defs>
        <marker id="arrowAxis" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="currentColor" opacity={0.4} />
        </marker>
      </defs>
      <line x1={0} y1={cy} x2={w - 4} y2={cy} stroke="currentColor" strokeWidth={1} opacity={0.4} markerEnd="url(#arrowAxis)" />
      <line x1={cx} y1={h} x2={cx} y2={4} stroke="currentColor" strokeWidth={1} opacity={0.4} markerEnd="url(#arrowAxis)" />
      <text x={w - 8} y={cy - 6} fontSize={11} fill="currentColor" opacity={0.5} textAnchor="end">x</text>
      <text x={cx + 6} y={10} fontSize={11} fill="currentColor" opacity={0.5}>y</text>
    </g>
  )
}

function Arrow({
  x1, y1, x2, y2, color, id, dashed = false, strokeWidth = 2.5,
}: {
  x1: number; y1: number; x2: number; y2: number
  color: string; id: string; dashed?: boolean; strokeWidth?: number
}) {
  const markerId = `arrow-${id}`
  return (
    <g>
      <defs>
        <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={color} />
        </marker>
      </defs>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={dashed ? '5,4' : undefined}
        markerEnd={`url(#${markerId})`}
      />
    </g>
  )
}

// ─────────────────────────────────────────────
// VectorAdditionViz
// ─────────────────────────────────────────────

export function VectorAdditionViz() {
  const [a, setA] = useState({ x: 2, y: 1 })
  const [b, setB] = useState({ x: 1, y: 2 })
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef<'a' | 'b' | null>(null)

  const clamp = (v: { x: number; y: number }) => ({
    x: Math.max(-3, Math.min(3, Math.round(v.x * 4) / 4)),
    y: Math.max(-3, Math.min(3, Math.round(v.y * 4) / 4)),
  })

  const getPoint = useCallback((e: MouseEvent | TouchEvent) => {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const svgX = ((clientX - rect.left) / rect.width) * W
    const svgY = ((clientY - rect.top) / rect.height) * H
    return fromSVG(svgX, svgY)
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return
      const p = getPoint(e)
      if (!p) return
      const clamped = clamp(p)
      if (dragging.current === 'a') setA(clamped)
      if (dragging.current === 'b') setB(clamped)
    }
    const onUp = () => { dragging.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove)
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [getPoint])

  const sum = { x: a.x + b.x, y: a.y + b.y }

  const pa = toSVG(a.x, a.y)
  const pb = toSVG(b.x, b.y)
  const ps = toSVG(sum.x, sum.y)
  const o = toSVG(0, 0)

  // Parallelogram: origin → a → a+b → b → origin
  const paraPoints = [
    o,
    pa,
    ps,
    pb,
  ].map(p => `${p.sx},${p.sy}`).join(' ')

  const fmt = (n: number) => n.toFixed(2)

  return (
    <div className="my-8 rounded-xl border border-ink-200 bg-ink-50 p-4 dark:border-ink-700 dark:bg-ink-900">
      <p className="mb-2 text-center text-sm font-semibold text-ink-600 dark:text-ink-300">
        Vector Addition — drag the tips of <span className="text-blue-500">a</span> and <span className="text-orange-500">b</span>
      </p>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full cursor-crosshair touch-none select-none rounded-lg bg-white dark:bg-ink-950"
        style={{ maxHeight: 360 }}
      >
        <Grid />
        {/* Parallelogram dashed sides */}
        <polygon
          points={paraPoints}
          fill="none"
          stroke="#a855f7"
          strokeWidth={1}
          strokeDasharray="5,4"
          opacity={0.5}
        />
        {/* a+b vector */}
        <Arrow x1={o.sx} y1={o.sy} x2={ps.sx} y2={ps.sy} color="#a855f7" id="sum" strokeWidth={2.5} />
        {/* b vector */}
        <Arrow x1={o.sx} y1={o.sy} x2={pb.sx} y2={pb.sy} color="#f97316" id="b" strokeWidth={2.5} />
        {/* a vector */}
        <Arrow x1={o.sx} y1={o.sy} x2={pa.sx} y2={pa.sy} color="#3b82f6" id="a" strokeWidth={2.5} />
        {/* labels */}
        <text x={pa.sx + 8} y={pa.sy - 8} fontSize={13} fontWeight={700} fill="#3b82f6">a</text>
        <text x={pb.sx + 8} y={pb.sy - 8} fontSize={13} fontWeight={700} fill="#f97316">b</text>
        <text x={ps.sx + 8} y={ps.sy - 8} fontSize={13} fontWeight={700} fill="#a855f7">a+b</text>
        {/* Drag handles */}
        <circle
          cx={pa.sx} cy={pa.sy} r={9} fill="#3b82f6" opacity={0.85} cursor="grab"
          onMouseDown={() => { dragging.current = 'a' }}
          onTouchStart={() => { dragging.current = 'a' }}
        />
        <circle
          cx={pb.sx} cy={pb.sy} r={9} fill="#f97316" opacity={0.85} cursor="grab"
          onMouseDown={() => { dragging.current = 'b' }}
          onTouchStart={() => { dragging.current = 'b' }}
        />
      </svg>
      <div className="mt-3 flex flex-wrap justify-center gap-6 text-sm font-mono">
        <span><span className="font-bold text-blue-500">a</span> = [{fmt(a.x)}, {fmt(a.y)}]</span>
        <span><span className="font-bold text-orange-500">b</span> = [{fmt(b.x)}, {fmt(b.y)}]</span>
        <span><span className="font-bold text-purple-500">a+b</span> = [{fmt(sum.x)}, {fmt(sum.y)}]</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// ScalarMultViz
// ─────────────────────────────────────────────

export function ScalarMultViz() {
  const [lambda, setLambda] = useState(1.5)

  const v = { x: 2, y: 1 }
  const scaled = { x: lambda * v.x, y: lambda * v.y }

  const o = toSVG(0, 0)
  const ps = toSVG(scaled.x, scaled.y)
  const pv = toSVG(v.x, v.y)

  const color = lambda > 0 ? '#22c55e' : lambda < 0 ? '#ef4444' : '#94a3b8'
  const fmt = (n: number) => n.toFixed(2)

  return (
    <div className="my-8 rounded-xl border border-ink-200 bg-ink-50 p-4 dark:border-ink-700 dark:bg-ink-900">
      <p className="mb-2 text-center text-sm font-semibold text-ink-600 dark:text-ink-300">
        Scalar Multiplication — adjust λ
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-lg bg-white dark:bg-ink-950"
        style={{ maxHeight: 360 }}
      >
        <Grid />
        {/* Original v ghost */}
        <Arrow x1={o.sx} y1={o.sy} x2={pv.sx} y2={pv.sy} color="#94a3b8" id="v-ghost" strokeWidth={1.5} />
        <text x={pv.sx + 6} y={pv.sy - 6} fontSize={12} fill="#94a3b8">v</text>
        {/* Scaled vector */}
        {(Math.abs(scaled.x) > 0.05 || Math.abs(scaled.y) > 0.05) && (
          <Arrow x1={o.sx} y1={o.sy} x2={ps.sx} y2={ps.sy} color={color} id="scaled" strokeWidth={3} />
        )}
        <text x={ps.sx + 6} y={ps.sy - 6} fontSize={13} fontWeight={700} fill={color}>λv</text>
      </svg>
      <div className="mt-4 flex flex-col items-center gap-3">
        <input
          type="range" min={-3} max={3} step={0.1}
          value={lambda}
          onChange={e => setLambda(parseFloat(e.target.value))}
          className="w-64 accent-accent-500"
        />
        <div className="text-sm font-mono">
          <span className="text-ink-500">λ = </span>
          <span className="font-bold" style={{ color }}>{fmt(lambda)}</span>
          <span className="ml-4 text-ink-500">λ·v = </span>
          <span className="font-bold" style={{ color }}>[{fmt(scaled.x)}, {fmt(scaled.y)}]</span>
        </div>
        {lambda < 0 && (
          <p className="text-xs text-red-500">Negative λ flips the direction</p>
        )}
        {lambda === 0 && (
          <p className="text-xs text-slate-400">λ = 0 collapses to the zero vector</p>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// NormViz
// ─────────────────────────────────────────────

type NormType = 'L1' | 'L2' | 'Linf'

function computeNorms(x: number, y: number) {
  return {
    L1: Math.abs(x) + Math.abs(y),
    L2: Math.sqrt(x * x + y * y),
    Linf: Math.max(Math.abs(x), Math.abs(y)),
  }
}

const NORM_W = 360
const NORM_H = 360
const NCX = NORM_W / 2
const NCY = NORM_H / 2
const NSCALE = 80

function toNSVG(x: number, y: number) {
  return { sx: NCX + x * NSCALE, sy: NCY - y * NSCALE }
}

function fromNSVG(sx: number, sy: number) {
  return { x: (sx - NCX) / NSCALE, y: (NCY - sy) / NSCALE }
}

export function NormViz() {
  const [norm, setNorm] = useState<NormType>('L2')
  const [point, setPoint] = useState({ x: 1.2, y: 0.8 })
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  const norms = computeNorms(point.x, point.y)
  const fmt = (n: number) => n.toFixed(3)

  const getPoint = useCallback((e: MouseEvent | TouchEvent) => {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const svgX = ((clientX - rect.left) / rect.width) * NORM_W
    const svgY = ((clientY - rect.top) / rect.height) * NORM_H
    const p = fromNSVG(svgX, svgY)
    return {
      x: Math.max(-2, Math.min(2, p.x)),
      y: Math.max(-2, Math.min(2, p.y)),
    }
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return
      const p = getPoint(e)
      if (p) setPoint(p)
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove)
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [getPoint])

  // Unit ball at radius=1 in the selected norm
  const unitBall = () => {
    const r = NSCALE // 1 unit in px
    const cx = NCX, cy = NCY
    if (norm === 'L2') {
      return <circle cx={cx} cy={cy} r={r} fill="#06b6d4" fillOpacity={0.12} stroke="#06b6d4" strokeWidth={2} />
    }
    if (norm === 'L1') {
      // diamond: (1,0) (0,1) (-1,0) (0,-1)
      const pts = [
        toNSVG(1, 0), toNSVG(0, 1), toNSVG(-1, 0), toNSVG(0, -1),
      ].map(p => `${p.sx},${p.sy}`).join(' ')
      return <polygon points={pts} fill="#f59e0b" fillOpacity={0.15} stroke="#f59e0b" strokeWidth={2} />
    }
    // Linf: square [-1,1]×[-1,1]
    const tl = toNSVG(-1, 1)
    return (
      <rect
        x={tl.sx} y={tl.sy}
        width={2 * NSCALE} height={2 * NSCALE}
        fill="#a855f7" fillOpacity={0.12} stroke="#a855f7" strokeWidth={2}
      />
    )
  }

  const normColor: Record<NormType, string> = {
    L1: '#f59e0b',
    L2: '#06b6d4',
    Linf: '#a855f7',
  }

  const pp = toNSVG(point.x, point.y)
  const origin = toNSVG(0, 0)

  // Grid for NormViz
  const gridLines = () => {
    const lines = []
    for (let n = -2; n <= 2; n++) {
      lines.push(
        <line key={`v${n}`} x1={NCX + n * NSCALE} y1={0} x2={NCX + n * NSCALE} y2={NORM_H}
          stroke="currentColor" strokeWidth={n === 0 ? 1.5 : 0.5} opacity={n === 0 ? 0.4 : 0.15} />,
        <line key={`h${n}`} x1={0} y1={NCY + n * NSCALE} x2={NORM_W} y2={NCY + n * NSCALE}
          stroke="currentColor" strokeWidth={n === 0 ? 1.5 : 0.5} opacity={n === 0 ? 0.4 : 0.15} />,
      )
    }
    return lines
  }

  return (
    <div className="my-8 rounded-xl border border-ink-200 bg-ink-50 p-4 dark:border-ink-700 dark:bg-ink-900">
      <p className="mb-3 text-center text-sm font-semibold text-ink-600 dark:text-ink-300">
        Unit Ball &amp; Norms — drag the point, toggle the norm
      </p>
      <div className="mb-3 flex justify-center gap-2">
        {(['L1', 'L2', 'Linf'] as NormType[]).map(n => (
          <button
            key={n}
            onClick={() => setNorm(n)}
            className={`rounded-full px-4 py-1 text-sm font-semibold transition-colors ${
              norm === n
                ? 'text-white'
                : 'bg-ink-200 text-ink-600 dark:bg-ink-700 dark:text-ink-300'
            }`}
            style={norm === n ? { backgroundColor: normColor[n] } : {}}
          >
            {n === 'Linf' ? 'L∞' : n}
          </button>
        ))}
      </div>
      <div className="flex justify-center">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${NORM_W} ${NORM_H}`}
          className="w-full max-w-xs cursor-crosshair touch-none select-none rounded-lg bg-white dark:bg-ink-950"
        >
          <g>{gridLines()}</g>
          {unitBall()}
          {/* vector to point */}
          <line
            x1={origin.sx} y1={origin.sy} x2={pp.sx} y2={pp.sy}
            stroke={normColor[norm]} strokeWidth={2} opacity={0.7}
            strokeDasharray="4,3"
          />
          {/* draggable point */}
          <circle
            cx={pp.sx} cy={pp.sy} r={8}
            fill={normColor[norm]} cursor="grab" opacity={0.9}
            onMouseDown={() => { dragging.current = true }}
            onTouchStart={() => { dragging.current = true }}
          />
          {/* origin dot */}
          <circle cx={origin.sx} cy={origin.sy} r={3} fill="currentColor" opacity={0.5} />
        </svg>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm font-mono">
        <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950/30">
          <div className="text-xs text-amber-600 dark:text-amber-400">L1 (Manhattan)</div>
          <div className="font-bold text-amber-600 dark:text-amber-400">{fmt(norms.L1)}</div>
        </div>
        <div className="rounded-lg bg-cyan-50 p-2 dark:bg-cyan-950/30">
          <div className="text-xs text-cyan-600 dark:text-cyan-400">L2 (Euclidean)</div>
          <div className="font-bold text-cyan-600 dark:text-cyan-400">{fmt(norms.L2)}</div>
        </div>
        <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-950/30">
          <div className="text-xs text-purple-600 dark:text-purple-400">L∞ (Chebyshev)</div>
          <div className="font-bold text-purple-600 dark:text-purple-400">{fmt(norms.Linf)}</div>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-ink-400">
        Point p = [{point.x.toFixed(2)}, {point.y.toFixed(2)}]
      </p>
    </div>
  )
}
