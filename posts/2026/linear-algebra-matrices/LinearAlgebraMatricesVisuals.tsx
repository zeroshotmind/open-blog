'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ─────────────────────────────────────────────
// Shared constants & helpers
// ─────────────────────────────────────────────

const W = 520
const H = 420
const CX = W / 2
const CY = H / 2
const SCALE = 80 // px per unit

function toSVG(x: number, y: number) {
  return { sx: CX + x * SCALE, sy: CY - y * SCALE }
}

function Grid() {
  const cols = Math.floor(CX / SCALE)
  const rows = Math.floor(CY / SCALE)
  return (
    <g>
      {Array.from({ length: cols * 2 + 1 }, (_, i) => i - cols).map((n) => (
        <line
          key={`v${n}`}
          x1={CX + n * SCALE} y1={0}
          x2={CX + n * SCALE} y2={H}
          stroke="var(--color-border, #e5e7eb)"
          strokeWidth={n === 0 ? 1.5 : 0.5}
        />
      ))}
      {Array.from({ length: rows * 2 + 1 }, (_, i) => i - rows).map((n) => (
        <line
          key={`h${n}`}
          x1={0} y1={CY + n * SCALE}
          x2={W} y2={CY + n * SCALE}
          stroke="var(--color-border, #e5e7eb)"
          strokeWidth={n === 0 ? 1.5 : 0.5}
        />
      ))}
    </g>
  )
}

function Arrow({ x1, y1, x2, y2, color, width = 2, label = '' }: {
  x1: number; y1: number; x2: number; y2: number
  color: string; width?: number; label?: string
}) {
  const id = `arrow-${color.replace(/[^a-z0-9]/gi, '')}-${Math.random().toString(36).slice(2, 6)}`
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 2) return null
  return (
    <g>
      <defs>
        <marker id={id} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={color} />
        </marker>
      </defs>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth={width}
        markerEnd={`url(#${id})`}
      />
      {label && (
        <text x={x2 + 6} y={y2 - 4} fill={color} fontSize="12" fontFamily="monospace">{label}</text>
      )}
    </g>
  )
}

function applyMatrix(a: number, b: number, c: number, d: number, x: number, y: number) {
  return { x: a * x + b * y, y: c * x + d * y }
}

// ─────────────────────────────────────────────
// 1. LinearMapViz
// ─────────────────────────────────────────────

export function LinearMapViz() {
  const [a, setA] = useState(1)
  const [b, setB] = useState(0)
  const [c, setC] = useState(0)
  const [d, setD] = useState(1)

  // Unit square corners: (0,0),(1,0),(1,1),(0,1)
  const origCorners = [[0,0],[1,0],[1,1],[0,1]] as [number,number][]
  const transCorners = origCorners.map(([x,y]) => {
    const t = applyMatrix(a, b, c, d, x, y)
    return [t.x, t.y] as [number,number]
  })

  function polyPoints(corners: [number,number][]) {
    return corners.map(([x,y]) => {
      const s = toSVG(x, y)
      return `${s.sx},${s.sy}`
    }).join(' ')
  }

  // Where basis vectors land
  const e1t = applyMatrix(a, b, c, d, 1, 0)
  const e2t = applyMatrix(a, b, c, d, 0, 1)
  const origin = toSVG(0, 0)
  const e1tSVG = toSVG(e1t.x, e1t.y)
  const e2tSVG = toSVG(e2t.x, e2t.y)
  const e1SVG = toSVG(1, 0)
  const e2SVG = toSVG(0, 1)

  const sliderStyle: React.CSSProperties = {
    width: '100%', accentColor: 'var(--color-accent, #6366f1)'
  }

  return (
    <div style={{ fontFamily: 'sans-serif', marginBottom: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
        {[
          { label: 'a', val: a, set: setA },
          { label: 'b', val: b, set: setB },
          { label: 'c', val: c, set: setC },
          { label: 'd', val: d, set: setD },
        ].map(({ label, val, set }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{label}</span>
              <span style={{ color: 'var(--color-muted, #6b7280)' }}>{val.toFixed(1)}</span>
            </div>
            <input
              type="range" min={-2} max={2} step={0.1}
              value={val}
              onChange={e => set(parseFloat(e.target.value))}
              style={sliderStyle}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', fontSize: '0.82rem' }}>
        <div style={{ background: 'var(--color-surface, #f9fafb)', border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 8, padding: '0.5rem 1rem', fontFamily: 'monospace' }}>
          <div style={{ color: 'var(--color-muted, #6b7280)', fontSize: '0.75rem', marginBottom: 2 }}>Matrix A</div>
          <div>[ {a.toFixed(1)} &nbsp; {b.toFixed(1)} ]</div>
          <div>[ {c.toFixed(1)} &nbsp; {d.toFixed(1)} ]</div>
        </div>
        <div style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
          <div><span style={{ color: '#ef4444' }}>●</span> e₁ = (1,0) → (<span style={{ color: '#ef4444' }}>{e1t.x.toFixed(2)}, {e1t.y.toFixed(2)}</span>) &nbsp;<em>col 1</em></div>
          <div><span style={{ color: '#3b82f6' }}>●</span> e₂ = (0,1) → (<span style={{ color: '#3b82f6' }}>{e2t.x.toFixed(2)}, {e2t.y.toFixed(2)}</span>) &nbsp;<em>col 2</em></div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', borderRadius: 10, border: '1px solid var(--color-border, #e5e7eb)', background: 'var(--color-canvas, #fff)' }}>
        <Grid />
        {/* Original unit square */}
        <polygon
          points={polyPoints(origCorners)}
          fill="rgba(150,150,150,0.1)"
          stroke="#9ca3af"
          strokeWidth={1.5}
          strokeDasharray="5,4"
        />
        {/* Transformed square */}
        <polygon
          points={polyPoints(transCorners)}
          fill="rgba(99,102,241,0.12)"
          stroke="#6366f1"
          strokeWidth={2}
        />
        {/* Original basis arrows (dashed) */}
        <Arrow x1={origin.sx} y1={origin.sy} x2={e1SVG.sx} y2={e1SVG.sy} color="#fca5a5" width={1.5} />
        <Arrow x1={origin.sx} y1={origin.sy} x2={e2SVG.sx} y2={e2SVG.sy} color="#93c5fd" width={1.5} />
        {/* Transformed basis arrows */}
        <Arrow x1={origin.sx} y1={origin.sy} x2={e1tSVG.sx} y2={e1tSVG.sy} color="#ef4444" width={2.5} label="Ae₁" />
        <Arrow x1={origin.sx} y1={origin.sy} x2={e2tSVG.sx} y2={e2tSVG.sy} color="#3b82f6" width={2.5} label="Ae₂" />
        {/* Origin dot */}
        <circle cx={origin.sx} cy={origin.sy} r={3} fill="#374151" />
      </svg>
      <p style={{ fontSize: '0.78rem', color: 'var(--color-muted, #6b7280)', marginTop: '0.5rem' }}>
        Dashed gray = original unit square. Purple = transformed square. Red/blue arrows show where basis vectors land — these are exactly the columns of the matrix.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────
// 2. TransformGallery
// ─────────────────────────────────────────────

const PRESETS = [
  {
    label: 'Rotate 45°',
    matrix: [Math.cos(Math.PI/4), -Math.sin(Math.PI/4), Math.sin(Math.PI/4), Math.cos(Math.PI/4)] as [number,number,number,number],
    matrixStr: '[ cos45° −sin45° ]\n[ sin45°  cos45° ]',
    color: '#8b5cf6',
  },
  {
    label: 'Scale 2×',
    matrix: [2, 0, 0, 2] as [number,number,number,number],
    matrixStr: '[ 2  0 ]\n[ 0  2 ]',
    color: '#10b981',
  },
  {
    label: 'Shear',
    matrix: [1, 1, 0, 1] as [number,number,number,number],
    matrixStr: '[ 1  1 ]\n[ 0  1 ]',
    color: '#f59e0b',
  },
  {
    label: 'Reflect Y',
    matrix: [-1, 0, 0, 1] as [number,number,number,number],
    matrixStr: '[ −1  0 ]\n[  0  1 ]',
    color: '#ef4444',
  },
]

export function TransformGallery() {
  const [activeIdx, setActiveIdx] = useState(0)
  const [t, setT] = useState(1) // animation progress 0..1
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function activate(idx: number) {
    setActiveIdx(idx)
    setT(0)
    if (animRef.current) clearInterval(animRef.current)
    const start = Date.now()
    const dur = 500
    animRef.current = setInterval(() => {
      const elapsed = Date.now() - start
      const prog = Math.min(elapsed / dur, 1)
      // ease-in-out
      const ease = prog < 0.5 ? 2 * prog * prog : -1 + (4 - 2 * prog) * prog
      setT(ease)
      if (prog >= 1 && animRef.current) clearInterval(animRef.current)
    }, 16)
  }

  useEffect(() => { return () => { if (animRef.current) clearInterval(animRef.current) } }, [])

  const preset = PRESETS[activeIdx]
  const [a, b, c, d] = preset.matrix

  const origCorners = [[0,0],[1,0],[1,1],[0,1]] as [number,number][]
  const transCorners = origCorners.map(([x,y]) => {
    const tx = a * x + b * y
    const ty = c * x + d * y
    // interpolate
    return [x + (tx - x) * t, y + (ty - y) * t] as [number,number]
  })

  function polyPoints(corners: [number,number][]) {
    return corners.map(([x,y]) => {
      const s = toSVG(x, y)
      return `${s.sx},${s.sy}`
    }).join(' ')
  }

  const origin = toSVG(0, 0)

  return (
    <div style={{ fontFamily: 'sans-serif', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => activate(i)}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: 20,
              border: `2px solid ${i === activeIdx ? p.color : 'var(--color-border, #e5e7eb)'}`,
              background: i === activeIdx ? `${p.color}18` : 'transparent',
              color: i === activeIdx ? p.color : 'var(--color-muted, #6b7280)',
              fontWeight: i === activeIdx ? 700 : 400,
              cursor: 'pointer',
              fontSize: '0.85rem',
              transition: 'all 0.2s',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ flex: '1 1 300px', borderRadius: 10, border: '1px solid var(--color-border, #e5e7eb)', background: 'var(--color-canvas, #fff)' }}>
          <Grid />
          <polygon
            points={polyPoints([[0,0],[1,0],[1,1],[0,1]])}
            fill="rgba(150,150,150,0.08)"
            stroke="#9ca3af"
            strokeWidth={1.5}
            strokeDasharray="5,4"
          />
          <polygon
            points={polyPoints(transCorners)}
            fill={`${preset.color}20`}
            stroke={preset.color}
            strokeWidth={2.5}
          />
          <circle cx={origin.sx} cy={origin.sy} r={3} fill="#374151" />
        </svg>

        <div style={{
          background: 'var(--color-surface, #f9fafb)',
          border: '1px solid var(--color-border, #e5e7eb)',
          borderRadius: 8, padding: '1rem',
          fontFamily: 'monospace', fontSize: '0.85rem',
          whiteSpace: 'pre-line', lineHeight: 1.8,
          color: preset.color,
          minWidth: 150,
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-muted, #6b7280)', marginBottom: 4, fontFamily: 'sans-serif' }}>{preset.label}</div>
          {preset.matrixStr}
        </div>
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--color-muted, #6b7280)', marginTop: '0.5rem' }}>
        Click each preset to animate the unit square transforming. Dashed gray = original.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────
// 3. MatrixCompositionViz
// ─────────────────────────────────────────────

// A = rotate 45°, B = scale 2×
const cos45 = Math.cos(Math.PI / 4)
const sin45 = Math.sin(Math.PI / 4)
const A = { a: cos45, b: -sin45, c: sin45, d: cos45 }  // rotate 45°
const B = { a: 2, b: 0, c: 0, d: 2 }                   // scale 2×

function matMul(
  A: { a: number; b: number; c: number; d: number },
  B: { a: number; b: number; c: number; d: number }
) {
  return {
    a: A.a * B.a + A.b * B.c,
    b: A.a * B.b + A.b * B.d,
    c: A.c * B.a + A.d * B.c,
    d: A.c * B.b + A.d * B.d,
  }
}

const AB = matMul(A, B)  // rotate then scale... wait, B acts first
// AB·x = A(Bx): first B (scale), then A (rotate)
// BA·x = B(Ax): first A (rotate), then B (scale)
const BA = matMul(B, A)

function MiniGrid({ cx, cy, scale }: { cx: number; cy: number; scale: number }) {
  const cols = Math.floor(cx / scale)
  const rows = Math.floor(cy / scale)
  return (
    <g>
      {Array.from({ length: cols * 2 + 1 }, (_, i) => i - cols).map((n) => (
        <line key={`v${n}`} x1={cx + n * scale} y1={0} x2={cx + n * scale} y2={cy * 2}
          stroke="var(--color-border, #e5e7eb)" strokeWidth={n === 0 ? 1.5 : 0.5} />
      ))}
      {Array.from({ length: rows * 2 + 1 }, (_, i) => i - rows).map((n) => (
        <line key={`h${n}`} x1={0} y1={cy + n * scale} x2={cx * 2} y2={cy + n * scale}
          stroke="var(--color-border, #e5e7eb)" strokeWidth={n === 0 ? 1.5 : 0.5} />
      ))}
    </g>
  )
}

function TransformedSquare({
  m, cx, cy, scale, color, label
}: {
  m: { a: number; b: number; c: number; d: number }
  cx: number; cy: number; scale: number; color: string; label: string
}) {
  const origCorners = [[0,0],[1,0],[1,1],[0,1]] as [number,number][]
  const trans = origCorners.map(([x, y]) => {
    const tx = m.a * x + m.b * y
    const ty = m.c * x + m.d * y
    return [cx + tx * scale, cy - ty * scale] as [number, number]
  })
  const points = trans.map(([sx,sy]) => `${sx},${sy}`).join(' ')
  const origPoints = origCorners.map(([x,y]) => `${cx + x*scale},${cy - y*scale}`).join(' ')
  return (
    <g>
      <polygon points={origPoints} fill="none" stroke="#9ca3af" strokeWidth={1} strokeDasharray="4,3" />
      <polygon points={points} fill={`${color}18`} stroke={color} strokeWidth={2} />
      <text x={cx + 5} y={16} fill={color} fontSize="13" fontWeight="700" fontFamily="monospace">{label}</text>
      <circle cx={cx} cy={cy} r={3} fill="#374151" />
    </g>
  )
}

export function MatrixCompositionViz() {
  const PW = W
  const PH = 240
  const scale = 55
  const cx1 = PW * 0.25
  const cx2 = PW * 0.75
  const cy = PH / 2

  function fmtM(m: { a: number; b: number; c: number; d: number }) {
    const f = (n: number) => n.toFixed(2)
    return `[${f(m.a)}, ${f(m.b)}]\n[${f(m.c)}, ${f(m.d)}]`
  }

  return (
    <div style={{ fontFamily: 'sans-serif', marginBottom: '2rem' }}>
      <div style={{ fontSize: '0.82rem', marginBottom: '0.75rem', lineHeight: 1.6 }}>
        <strong>A</strong> = Rotate 45° &nbsp;|&nbsp; <strong>B</strong> = Scale 2×
        <br />
        <span style={{ color: '#8b5cf6' }}>Left: <strong>AB</strong>·x = A(Bx) — scale first, then rotate</span>
        &nbsp;&nbsp;
        <span style={{ color: '#f59e0b' }}>Right: <strong>BA</strong>·x = B(Ax) — rotate first, then scale</span>
      </div>

      <svg viewBox={`0 0 ${PW} ${PH}`} style={{ width: '100%', borderRadius: 10, border: '1px solid var(--color-border, #e5e7eb)', background: 'var(--color-canvas, #fff)' }}>
        <MiniGrid cx={cx1} cy={cy} scale={scale} />
        <MiniGrid cx={cx2} cy={cy} scale={scale} />
        {/* divider */}
        <line x1={PW/2} y1={0} x2={PW/2} y2={PH} stroke="var(--color-border, #e5e7eb)" strokeWidth={1} strokeDasharray="4,4" />

        <TransformedSquare m={AB} cx={cx1} cy={cy} scale={scale} color="#8b5cf6" label="AB" />
        <TransformedSquare m={BA} cx={cx2} cy={cy} scale={scale} color="#f59e0b" label="BA" />
      </svg>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.78rem' }}>
        <div style={{ background: 'var(--color-surface, #f9fafb)', border: '1px solid #8b5cf640', borderRadius: 6, padding: '0.5rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#8b5cf6' }}>
          AB ≈{'\n'}{fmtM(AB)}
        </div>
        <div style={{ background: 'var(--color-surface, #f9fafb)', border: '1px solid #f59e0b40', borderRadius: 6, padding: '0.5rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#f59e0b' }}>
          BA ≈{'\n'}{fmtM(BA)}
        </div>
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--color-muted, #6b7280)', marginTop: '0.5rem' }}>
        AB ≠ BA: the two transformed squares land in different positions. Order of composition matters.
      </p>
    </div>
  )
}
