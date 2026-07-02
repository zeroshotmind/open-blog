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
      {Array.from({ length: xs * 2 + 1 }, (_, i) => i - xs).map((n) => (
        <line
          key={`v${n}`}
          x1={cx + n * scale} y1={0}
          x2={cx + n * scale} y2={h}
          stroke="currentColor"
          strokeWidth={n === 0 ? 1.5 : 0.5}
          opacity={n === 0 ? 0.4 : 0.15}
        />
      ))}
      {Array.from({ length: ys * 2 + 1 }, (_, i) => i - ys).map((n) => (
        <line
          key={`h${n}`}
          x1={0} y1={cy + n * scale}
          x2={w} y2={cy + n * scale}
          stroke="currentColor"
          strokeWidth={n === 0 ? 1.5 : 0.5}
          opacity={n === 0 ? 0.4 : 0.15}
        />
      ))}
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

function useDrag(svgRef: React.RefObject<SVGSVGElement>, w = W, h = H) {
  const getPoint = useCallback((e: MouseEvent | TouchEvent) => {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const svgX = ((clientX - rect.left) / rect.width) * w
    const svgY = ((clientY - rect.top) / rect.height) * h
    return fromSVG(svgX, svgY)
  }, [svgRef, w, h])
  return getPoint
}

// ─────────────────────────────────────────────
// DotProductViz
// ─────────────────────────────────────────────

export function DotProductViz() {
  const [a, setA] = useState({ x: 2, y: 1 })
  const [b, setB] = useState({ x: 1, y: 2 })
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef<'a' | 'b' | null>(null)

  const clamp = (v: { x: number; y: number }) => ({
    x: Math.max(-3, Math.min(3, Math.round(v.x * 4) / 4)),
    y: Math.max(-3, Math.min(3, Math.round(v.y * 4) / 4)),
  })

  const getPoint = useDrag(svgRef)

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

  const dot = a.x * b.x + a.y * b.y
  const magA = Math.sqrt(a.x * a.x + a.y * a.y)
  const magB = Math.sqrt(b.x * b.x + b.y * b.y)
  const cosTheta = magA > 0.001 && magB > 0.001 ? dot / (magA * magB) : 0
  const thetaDeg = Math.acos(Math.max(-1, Math.min(1, cosTheta))) * (180 / Math.PI)

  // Color: green positive, gray orthogonal, red negative
  const dotColor = Math.abs(dot) < 0.15
    ? '#94a3b8'
    : dot > 0
    ? '#22c55e'
    : '#ef4444'

  const pa = toSVG(a.x, a.y)
  const pb = toSVG(b.x, b.y)
  const o = toSVG(0, 0)

  // Arc to show angle
  const arcRadius = 40
  const angleA = Math.atan2(-a.y, a.x) // SVG y-flipped
  const angleB = Math.atan2(-b.y, b.x)
  const arcX1 = o.sx + arcRadius * Math.cos(angleA)
  const arcY1 = o.sy + arcRadius * Math.sin(angleA)
  const arcX2 = o.sx + arcRadius * Math.cos(angleB)
  const arcY2 = o.sy + arcRadius * Math.sin(angleB)
  const largeArc = Math.abs(thetaDeg) > 180 ? 1 : 0
  // Determine sweep direction
  const cross = a.x * b.y - a.y * b.x
  const sweep = cross > 0 ? 0 : 1

  const fmt = (n: number) => n.toFixed(2)

  return (
    <div className="my-8 rounded-xl border border-ink-200 bg-ink-50 p-4 dark:border-ink-700 dark:bg-ink-900">
      <p className="mb-2 text-center text-sm font-semibold text-ink-600 dark:text-ink-300">
        Dot Product — drag the tips of{' '}
        <span className="text-blue-500">a</span> and{' '}
        <span className="text-orange-500">b</span>
      </p>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full cursor-crosshair touch-none select-none rounded-lg bg-white dark:bg-ink-950"
        style={{ maxHeight: 360 }}
      >
        <Grid />
        {/* Angle arc */}
        {magA > 0.1 && magB > 0.1 && (
          <path
            d={`M ${arcX1} ${arcY1} A ${arcRadius} ${arcRadius} 0 ${largeArc} ${sweep} ${arcX2} ${arcY2}`}
            fill="none"
            stroke={dotColor}
            strokeWidth={2}
            opacity={0.7}
          />
        )}
        {/* Vectors */}
        <Arrow x1={o.sx} y1={o.sy} x2={pb.sx} y2={pb.sy} color="#f97316" id="dp-b" strokeWidth={2.5} />
        <Arrow x1={o.sx} y1={o.sy} x2={pa.sx} y2={pa.sy} color="#3b82f6" id="dp-a" strokeWidth={2.5} />
        {/* Labels */}
        <text x={pa.sx + 8} y={pa.sy - 8} fontSize={13} fontWeight={700} fill="#3b82f6">a</text>
        <text x={pb.sx + 8} y={pb.sy - 8} fontSize={13} fontWeight={700} fill="#f97316">b</text>
        {/* θ label near arc midpoint */}
        {magA > 0.1 && magB > 0.1 && (
          <text
            x={o.sx + 56 * Math.cos((angleA + angleB) / 2)}
            y={o.sy + 56 * Math.sin((angleA + angleB) / 2)}
            fontSize={12}
            fill={dotColor}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            θ
          </text>
        )}
        {/* Drag handles */}
        <circle cx={pa.sx} cy={pa.sy} r={9} fill="#3b82f6" opacity={0.85} cursor="grab"
          onMouseDown={() => { dragging.current = 'a' }}
          onTouchStart={() => { dragging.current = 'a' }}
        />
        <circle cx={pb.sx} cy={pb.sy} r={9} fill="#f97316" opacity={0.85} cursor="grab"
          onMouseDown={() => { dragging.current = 'b' }}
          onTouchStart={() => { dragging.current = 'b' }}
        />
      </svg>
      <div className="mt-3 flex flex-wrap justify-center gap-6 text-sm font-mono">
        <span><span className="font-bold text-blue-500">a</span> = [{fmt(a.x)}, {fmt(a.y)}]</span>
        <span><span className="font-bold text-orange-500">b</span> = [{fmt(b.x)}, {fmt(b.y)}]</span>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-6 text-sm font-mono">
        <span>
          <span className="text-ink-500">a·b = </span>
          <span className="font-bold text-lg" style={{ color: dotColor }}>{fmt(dot)}</span>
        </span>
        <span>
          <span className="text-ink-500">θ = </span>
          <span className="font-bold" style={{ color: dotColor }}>{thetaDeg.toFixed(1)}°</span>
        </span>
        <span>
          <span className="text-ink-500">cos θ = </span>
          <span className="font-bold" style={{ color: dotColor }}>{fmt(cosTheta)}</span>
        </span>
      </div>
      <p className="mt-2 text-center text-xs" style={{ color: dotColor }}>
        {Math.abs(dot) < 0.15
          ? 'Orthogonal — vectors are perpendicular (dot product ≈ 0)'
          : dot > 0
          ? 'Positive — vectors point in similar directions (θ < 90°)'
          : 'Negative — vectors point in opposite directions (θ > 90°)'}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────
// ProjectionViz
// ─────────────────────────────────────────────

export function ProjectionViz() {
  const [b, setB] = useState({ x: 1.5, y: 2 })
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const a = { x: 3, y: 0 } // fixed horizontal a vector

  const getPoint = useDrag(svgRef)

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return
      const p = getPoint(e)
      if (!p) return
      setB({
        x: Math.max(-3, Math.min(3, p.x)),
        y: Math.max(-3, Math.min(3, p.y)),
      })
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

  // proj_a(b) = (a·b / a·a) * a
  const dot_ab = a.x * b.x + a.y * b.y
  const dot_aa = a.x * a.x + a.y * a.y
  const scalar = dot_aa > 0 ? dot_ab / dot_aa : 0
  const proj = { x: scalar * a.x, y: scalar * a.y }

  const o = toSVG(0, 0)
  const pa = toSVG(a.x, a.y)
  const pb = toSVG(b.x, b.y)
  const pp = toSVG(proj.x, proj.y)

  const fmt = (n: number) => n.toFixed(2)

  return (
    <div className="my-8 rounded-xl border border-ink-200 bg-ink-50 p-4 dark:border-ink-700 dark:bg-ink-900">
      <p className="mb-2 text-center text-sm font-semibold text-ink-600 dark:text-ink-300">
        Projection — drag <span className="text-orange-500">b</span>; see its shadow onto{' '}
        <span className="text-blue-500">a</span>
      </p>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full cursor-crosshair touch-none select-none rounded-lg bg-white dark:bg-ink-950"
        style={{ maxHeight: 360 }}
      >
        <Grid />
        {/* Line extending a's direction (dashed) */}
        <line
          x1={toSVG(-4, 0).sx} y1={toSVG(-4, 0).sy}
          x2={toSVG(4, 0).sx} y2={toSVG(4, 0).sy}
          stroke="#3b82f6" strokeWidth={1} strokeDasharray="4,4" opacity={0.3}
        />
        {/* Perpendicular drop from b to projection */}
        <line
          x1={pb.sx} y1={pb.sy}
          x2={pp.sx} y2={pp.sy}
          stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4,3"
        />
        {/* Right-angle mark at foot of perpendicular */}
        {Math.abs(b.y) > 0.1 && (
          <g>
            <line x1={pp.sx} y1={pp.sy - 10} x2={pp.sx + 10} y2={pp.sy - 10} stroke="#94a3b8" strokeWidth={1} opacity={0.7} />
            <line x1={pp.sx + 10} y1={pp.sy - 10} x2={pp.sx + 10} y2={pp.sy} stroke="#94a3b8" strokeWidth={1} opacity={0.7} />
          </g>
        )}
        {/* Projection vector */}
        {Math.abs(scalar) > 0.05 && (
          <Arrow x1={o.sx} y1={o.sy} x2={pp.sx} y2={pp.sy} color="#22c55e" id="proj" strokeWidth={3} />
        )}
        {/* a vector */}
        <Arrow x1={o.sx} y1={o.sy} x2={pa.sx} y2={pa.sy} color="#3b82f6" id="prj-a" strokeWidth={2.5} />
        {/* b vector */}
        <Arrow x1={o.sx} y1={o.sy} x2={pb.sx} y2={pb.sy} color="#f97316" id="prj-b" strokeWidth={2.5} />
        {/* Labels */}
        <text x={pa.sx + 8} y={pa.sy + 4} fontSize={13} fontWeight={700} fill="#3b82f6">a</text>
        <text x={pb.sx + 8} y={pb.sy - 8} fontSize={13} fontWeight={700} fill="#f97316">b</text>
        <text x={pp.sx + 6} y={pp.sy - 16} fontSize={12} fontWeight={700} fill="#22c55e">proj</text>
        {/* Drag handle for b */}
        <circle cx={pb.sx} cy={pb.sy} r={9} fill="#f97316" opacity={0.85} cursor="grab"
          onMouseDown={() => { dragging.current = true }}
          onTouchStart={() => { dragging.current = true }}
        />
      </svg>
      <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm font-mono">
        <span><span className="text-ink-500">a·b = </span><span className="font-bold text-blue-400">{fmt(dot_ab)}</span></span>
        <span><span className="text-ink-500">a·a = </span><span className="font-bold text-blue-400">{fmt(dot_aa)}</span></span>
        <span><span className="text-ink-500">scalar = </span><span className="font-bold text-green-500">{fmt(scalar)}</span></span>
      </div>
      <div className="mt-1 text-center text-sm font-mono">
        <span className="text-ink-500">proj = </span>
        <span className="font-bold text-green-500">[{fmt(proj.x)}, {fmt(proj.y)}]</span>
      </div>
      <div className="mt-2 rounded-lg bg-ink-100 px-4 py-2 text-center text-xs font-mono text-ink-500 dark:bg-ink-800">
        proj_a(b) = (a·b / a·a) × a = {fmt(scalar)} × [{fmt(a.x)}, {fmt(a.y)}]
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// CosineSimilarityViz
// ─────────────────────────────────────────────

type Preset = 'parallel' | 'orthogonal' | 'opposite' | '45deg' | 'custom'

const PRESETS: Record<Exclude<Preset, 'custom'>, { a: { x: number; y: number }; b: { x: number; y: number }; label: string }> = {
  parallel:   { a: { x: 2, y: 1 },    b: { x: 2, y: 1 },    label: 'Parallel (cos = 1)' },
  orthogonal: { a: { x: 2, y: 0 },    b: { x: 0, y: 2 },    label: 'Orthogonal (cos = 0)' },
  opposite:   { a: { x: 2, y: 1 },    b: { x: -2, y: -1 },  label: 'Opposite (cos = −1)' },
  '45deg':    { a: { x: 2, y: 0 },    b: { x: 2, y: 2 },    label: '45° (cos ≈ 0.71)' },
}

export function CosineSimilarityViz() {
  const [a, setA] = useState({ x: 2, y: 1 })
  const [b, setB] = useState({ x: 1, y: 2 })
  const [preset, setPreset] = useState<Preset>('custom')
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef<'a' | 'b' | null>(null)

  const clamp = (v: { x: number; y: number }) => ({
    x: Math.max(-3, Math.min(3, v.x)),
    y: Math.max(-3, Math.min(3, v.y)),
  })

  const getPoint = useDrag(svgRef)

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return
      const p = getPoint(e)
      if (!p) return
      const clamped = clamp(p)
      if (dragging.current === 'a') { setA(clamped); setPreset('custom') }
      if (dragging.current === 'b') { setB(clamped); setPreset('custom') }
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

  const applyPreset = (key: Exclude<Preset, 'custom'>) => {
    const p = PRESETS[key]
    setA(p.a)
    setB(p.b)
    setPreset(key)
  }

  const dot = a.x * b.x + a.y * b.y
  const magA = Math.sqrt(a.x * a.x + a.y * a.y)
  const magB = Math.sqrt(b.x * b.x + b.y * b.y)
  const cosine = magA > 0.001 && magB > 0.001 ? dot / (magA * magB) : 0
  const thetaDeg = Math.acos(Math.max(-1, Math.min(1, cosine))) * (180 / Math.PI)

  // Color ramp: red (-1) → gray (0) → green (1)
  const cosColor = cosine > 0.1 ? '#22c55e' : cosine < -0.1 ? '#ef4444' : '#94a3b8'

  // Unit vectors
  const aHat = magA > 0.001 ? { x: a.x / magA, y: a.y / magA } : { x: 0, y: 0 }
  const bHat = magB > 0.001 ? { x: b.x / magB, y: b.y / magB } : { x: 0, y: 0 }

  const o = toSVG(0, 0)
  const pa = toSVG(a.x, a.y)
  const pb = toSVG(b.x, b.y)
  const paHat = toSVG(aHat.x, aHat.y)
  const pbHat = toSVG(bHat.x, bHat.y)

  const fmt = (n: number) => n.toFixed(3)

  return (
    <div className="my-8 rounded-xl border border-ink-200 bg-ink-50 p-4 dark:border-ink-700 dark:bg-ink-900">
      <p className="mb-2 text-center text-sm font-semibold text-ink-600 dark:text-ink-300">
        Cosine Similarity — drag vectors or pick a preset
      </p>
      {/* Preset buttons */}
      <div className="mb-3 flex flex-wrap justify-center gap-2">
        {(Object.keys(PRESETS) as Exclude<Preset, 'custom'>[]).map((key) => (
          <button
            key={key}
            onClick={() => applyPreset(key)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              preset === key
                ? 'bg-accent-500 text-white'
                : 'bg-ink-200 text-ink-600 dark:bg-ink-700 dark:text-ink-300'
            }`}
          >
            {PRESETS[key].label}
          </button>
        ))}
        {preset === 'custom' && (
          <span className="rounded-full bg-ink-200 px-3 py-1 text-xs font-semibold text-ink-500 dark:bg-ink-700">
            custom
          </span>
        )}
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full cursor-crosshair touch-none select-none rounded-lg bg-white dark:bg-ink-950"
        style={{ maxHeight: 360 }}
      >
        <Grid />
        {/* Unit vectors (dashed, shorter) */}
        <Arrow x1={o.sx} y1={o.sy} x2={paHat.sx} y2={paHat.sy} color="#93c5fd" id="cs-ahat" strokeWidth={1.5} dashed />
        <Arrow x1={o.sx} y1={o.sy} x2={pbHat.sx} y2={pbHat.sy} color="#fdba74" id="cs-bhat" strokeWidth={1.5} dashed />
        {/* Full vectors */}
        <Arrow x1={o.sx} y1={o.sy} x2={pb.sx} y2={pb.sy} color="#f97316" id="cs-b" strokeWidth={2.5} />
        <Arrow x1={o.sx} y1={o.sy} x2={pa.sx} y2={pa.sy} color="#3b82f6" id="cs-a" strokeWidth={2.5} />
        {/* Labels */}
        <text x={pa.sx + 8} y={pa.sy - 8} fontSize={13} fontWeight={700} fill="#3b82f6">a</text>
        <text x={pb.sx + 8} y={pb.sy - 8} fontSize={13} fontWeight={700} fill="#f97316">b</text>
        <text x={paHat.sx + 6} y={paHat.sy + 4} fontSize={10} fill="#93c5fd">â</text>
        <text x={pbHat.sx + 6} y={pbHat.sy + 4} fontSize={10} fill="#fdba74">b̂</text>
        {/* Cosine label in center */}
        <text x={CX} y={CY - 20} fontSize={22} fontWeight={800} fill={cosColor} textAnchor="middle" opacity={0.85}>
          {fmt(cosine)}
        </text>
        <text x={CX} y={CY - 4} fontSize={10} fill={cosColor} textAnchor="middle" opacity={0.6}>
          cos θ
        </text>
        {/* Drag handles */}
        <circle cx={pa.sx} cy={pa.sy} r={9} fill="#3b82f6" opacity={0.85} cursor="grab"
          onMouseDown={() => { dragging.current = 'a' }}
          onTouchStart={() => { dragging.current = 'a' }}
        />
        <circle cx={pb.sx} cy={pb.sy} r={9} fill="#f97316" opacity={0.85} cursor="grab"
          onMouseDown={() => { dragging.current = 'b' }}
          onTouchStart={() => { dragging.current = 'b' }}
        />
      </svg>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm font-mono">
        <div className="rounded-lg bg-ink-100 p-2 dark:bg-ink-800">
          <div className="text-xs text-ink-500">a·b</div>
          <div className="font-bold text-ink-700 dark:text-ink-200">{fmt(dot)}</div>
        </div>
        <div className="rounded-lg p-2" style={{ background: `${cosColor}20` }}>
          <div className="text-xs text-ink-500">cos similarity</div>
          <div className="text-lg font-bold" style={{ color: cosColor }}>{fmt(cosine)}</div>
        </div>
        <div className="rounded-lg bg-ink-100 p-2 dark:bg-ink-800">
          <div className="text-xs text-ink-500">angle θ</div>
          <div className="font-bold text-ink-700 dark:text-ink-200">{thetaDeg.toFixed(1)}°</div>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-ink-400">
        Dashed vectors (â, b̂) are the unit versions — cosine similarity is just â·b̂
      </p>
    </div>
  )
}
