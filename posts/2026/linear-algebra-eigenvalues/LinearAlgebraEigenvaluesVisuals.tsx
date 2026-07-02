'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Shared math helpers ───────────────────────────────────────────────────────

function matMul2(A: number[][], v: number[]): number[] {
  return [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]]
}

function norm2(v: number[]): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1])
}

function normalize2(v: number[]): number[] {
  const n = norm2(v)
  return n < 1e-10 ? [1, 0] : [v[0] / n, v[1] / n]
}

/** Eigenvalues of 2x2 matrix [[a,b],[c,d]] */
function eigenvalues2x2(a: number, b: number, c: number, d: number): { l1: number; l2: number; real: boolean } {
  const tr = a + d
  const det = a * d - b * c
  const disc = tr * tr - 4 * det
  if (disc < 0) return { l1: NaN, l2: NaN, real: false }
  const sqrtDisc = Math.sqrt(disc)
  return { l1: (tr + sqrtDisc) / 2, l2: (tr - sqrtDisc) / 2, real: true }
}

/** Eigenvector of [[a,b],[c,d]] for eigenvalue l */
function eigenvector2x2(a: number, b: number, c: number, d: number, l: number): number[] {
  // Solve (A - lI)v = 0
  const r0 = [a - l, b]
  const r1 = [c, d - l]
  if (Math.abs(r0[0]) > 1e-9 || Math.abs(r0[1]) > 1e-9) {
    if (Math.abs(r0[1]) > 1e-9) return normalize2([-r0[1], r0[0]])
    if (Math.abs(r0[0]) > 1e-9) return normalize2([r0[1], -r0[0]])
  }
  if (Math.abs(r1[0]) > 1e-9 || Math.abs(r1[1]) > 1e-9) {
    if (Math.abs(r1[1]) > 1e-9) return normalize2([-r1[1], r1[0]])
    if (Math.abs(r1[0]) > 1e-9) return normalize2([r1[1], -r1[0]])
  }
  return [1, 0]
}

// ─── Colour palette ────────────────────────────────────────────────────────────

const C = {
  bg: 'var(--background, #0f172a)',
  grid: 'rgba(100,116,139,0.25)',
  axis: 'rgba(100,116,139,0.6)',
  arrow: 'rgba(148,163,184,0.55)',
  arrowMapped: 'rgba(56,189,248,0.75)',
  eigen: '#f59e0b',
  eigenMapped: '#fbbf24',
  text: '#94a3b8',
  highlight: '#38bdf8',
  poly: '#818cf8',
  root: '#f59e0b',
  iter: '#34d399',
}

// ─── SVG arrow helper ──────────────────────────────────────────────────────────

function Arrow({
  x1, y1, x2, y2, color, width = 1.5, dashed = false,
}: { x1: number; y1: number; x2: number; y2: number; color: string; width?: number; dashed?: boolean }) {
  const id = `ah-${Math.round(x2 * 100)}-${Math.round(y2 * 100)}`
  const dx = x2 - x1; const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 2) return null
  const ux = dx / len; const uy = dy / len
  const tipX = x2; const tipY = y2
  const baseX = x2 - ux * 8; const baseY = y2 - uy * 8
  const perpX = -uy * 4; const perpY = ux * 4
  return (
    <g>
      <defs>
        <marker id={id} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill={color} opacity="0.9" />
        </marker>
      </defs>
      <line
        x1={x1} y1={y1} x2={tipX} y2={tipY}
        stroke={color} strokeWidth={width}
        strokeDasharray={dashed ? '4 3' : undefined}
        markerEnd={`url(#${id})`}
      />
    </g>
  )
}

// ─── EigenvectorViz ────────────────────────────────────────────────────────────

type Preset = { label: string; A: number[][] }

const PRESETS: Preset[] = [
  { label: 'Scaling', A: [[2, 0], [0, 0.5]] },
  { label: 'Shear', A: [[1, 1.5], [0, 1]] },
  { label: 'Symmetric', A: [[2, 1], [1, 2]] },
  { label: 'Rotation-like', A: [[1, -1], [1, 1]] },
]

const W = 480; const H = 340; const CX = W / 2; const CY = H / 2; const SCALE = 60

function toSvg(x: number, y: number) { return [CX + x * SCALE, CY - y * SCALE] }

function isEigenDir(A: number[][], angle: number, tol = 0.04): boolean {
  const v = [Math.cos(angle), Math.sin(angle)]
  const Av = matMul2(A, v)
  const nv = normalize2(v)
  const nAv = normalize2(Av)
  const cross = nv[0] * nAv[1] - nv[1] * nAv[0]
  return Math.abs(cross) < tol
}

export function EigenvectorViz() {
  const [preset, setPreset] = useState(0)
  const [hoverAngle, setHoverAngle] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const A = PRESETS[preset].A
  const { l1, l2, real } = eigenvalues2x2(A[0][0], A[0][1], A[1][0], A[1][1])

  const NUM_RAYS = 24
  const rays = Array.from({ length: NUM_RAYS }, (_, i) => (i * 2 * Math.PI) / NUM_RAYS)

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left - CX
    const my = -(e.clientY - rect.top - CY)
    setHoverAngle(Math.atan2(my, mx))
  }, [])

  const handleMouseLeave = useCallback(() => setHoverAngle(null), [])

  const hoverV = hoverAngle !== null ? [Math.cos(hoverAngle), Math.sin(hoverAngle)] : null
  const hoverAv = hoverV ? matMul2(A, hoverV) : null

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: W }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => setPreset(i)}
            style={{
              padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: i === preset ? C.eigen : 'rgba(100,116,139,0.2)',
              color: i === preset ? '#0f172a' : C.text, fontWeight: i === preset ? 700 : 400,
              fontSize: 13,
            }}
          >{p.label}</button>
        ))}
      </div>
      <svg
        ref={svgRef}
        width={W} height={H}
        style={{ borderRadius: 10, background: C.bg, cursor: 'crosshair', display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Grid */}
        {[-3, -2, -1, 0, 1, 2, 3].map(g => {
          const [gx1, gy1] = toSvg(g, -3); const [gx2, gy2] = toSvg(g, 3)
          const [hx1, hy1] = toSvg(-3, g); const [hx2, hy2] = toSvg(3, g)
          return (
            <g key={g}>
              <line x1={gx1} y1={gy1} x2={gx2} y2={gy2} stroke={g === 0 ? C.axis : C.grid} strokeWidth={g === 0 ? 1.5 : 0.7} />
              <line x1={hx1} y1={hy1} x2={hx2} y2={hy2} stroke={g === 0 ? C.axis : C.grid} strokeWidth={g === 0 ? 1.5 : 0.7} />
            </g>
          )
        })}

        {/* Fan of input vectors */}
        {rays.map((angle, i) => {
          const v = [Math.cos(angle), Math.sin(angle)]
          const [ox, oy] = toSvg(0, 0)
          const [vx, vy] = toSvg(v[0], v[1])
          const isEigen = isEigenDir(A, angle)
          return (
            <Arrow key={i} x1={ox} y1={oy} x2={vx} y2={vy}
              color={isEigen ? C.eigen : C.arrow} width={isEigen ? 2.5 : 1} />
          )
        })}

        {/* Mapped vectors (faint) */}
        {rays.map((angle, i) => {
          const v = [Math.cos(angle), Math.sin(angle)]
          const Av = matMul2(A, v)
          const [ox, oy] = toSvg(0, 0)
          const avLen = norm2(Av)
          if (avLen > 3.5) return null
          const [avx, avy] = toSvg(Av[0], Av[1])
          const isEigen = isEigenDir(A, angle)
          return (
            <Arrow key={`m${i}`} x1={ox} y1={oy} x2={avx} y2={avy}
              color={isEigen ? C.eigenMapped : C.arrowMapped} width={isEigen ? 2 : 0.8} dashed={!isEigen} />
          )
        })}

        {/* Hover vector */}
        {hoverV && hoverAv && (() => {
          const [ox, oy] = toSvg(0, 0)
          const [vx, vy] = toSvg(hoverV[0], hoverV[1])
          const avLen = norm2(hoverAv)
          const clampedAv = avLen > 3.5 ? [hoverAv[0] / avLen * 3.5, hoverAv[1] / avLen * 3.5] : hoverAv
          const [avx, avy] = toSvg(clampedAv[0], clampedAv[1])
          const isEigen = isEigenDir(A, hoverAngle!)
          const ratio = avLen.toFixed(2)
          return (
            <>
              <Arrow x1={ox} y1={oy} x2={vx} y2={vy} color="#ffffff" width={2} />
              <Arrow x1={ox} y1={oy} x2={avx} y2={avy} color={isEigen ? C.eigen : C.highlight} width={2.5} />
              <text x={avx + 8} y={avy - 8} fill={isEigen ? C.eigen : C.highlight} fontSize={12}>
                {isEigen ? `λ = ${ratio}` : `|Av| = ${ratio}`}
              </text>
            </>
          )
        })()}

        {/* Legend */}
        <g transform="translate(12,12)">
          <rect width={180} height={56} rx={6} fill="rgba(15,23,42,0.8)" />
          <line x1={8} y1={16} x2={28} y2={16} stroke={C.eigen} strokeWidth={2.5} />
          <text x={34} y={20} fill={C.eigen} fontSize={11}>Eigenvector direction</text>
          <line x1={8} y1={36} x2={28} y2={36} stroke={C.arrowMapped} strokeWidth={1} strokeDasharray="4 3" />
          <text x={34} y={40} fill={C.text} fontSize={11}>Mapped vector (Av)</text>
        </g>

        {/* Eigenvalue info */}
        <g transform={`translate(${W - 160}, 12)`}>
          <rect width={148} height={real ? 60 : 40} rx={6} fill="rgba(15,23,42,0.8)" />
          <text x={8} y={20} fill={C.text} fontSize={11}>Matrix: [{A[0].join(', ')}; {A[1].join(', ')}]</text>
          {real
            ? <>
              <text x={8} y={38} fill={C.eigen} fontSize={11}>λ₁ = {l1.toFixed(3)}</text>
              <text x={80} y={38} fill={C.eigen} fontSize={11}>λ₂ = {l2.toFixed(3)}</text>
            </>
            : <text x={8} y={38} fill={C.text} fontSize={11}>Complex eigenvalues</text>
          }
        </g>
      </svg>
      <p style={{ color: C.text, fontSize: 12, marginTop: 6 }}>
        Move your cursor over the diagram — white vector is your direction, colored vector is where A maps it. Gold = eigenvector.
      </p>
    </div>
  )
}

// ─── CharacteristicPolyViz ─────────────────────────────────────────────────────

const PW = 480; const PH = 300

export function CharacteristicPolyViz() {
  const [a, setA] = useState(3)
  const [b, setB] = useState(1)
  const [d, setD] = useState(2)

  const tr = a + d
  const det = a * d - b * b
  const disc = tr * tr - 4 * det

  // p(λ) = λ² - tr·λ + det
  const poly = (l: number) => l * l - tr * l + det

  // Plot range
  const lMin = -1; const lMax = 6
  const yRange = 12
  const toPlot = (l: number, y: number): [number, number] => {
    const px = ((l - lMin) / (lMax - lMin)) * (PW - 40) + 20
    const py = PH / 2 - (y / yRange) * (PH / 2 - 20)
    return [px, py]
  }

  const { l1, l2, real } = eigenvalues2x2(a, b, b, d)

  // Build polyline points
  const steps = 200
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const l = lMin + (i / steps) * (lMax - lMin)
    const y = poly(l)
    const [px, py] = toPlot(l, Math.max(-yRange, Math.min(yRange, y)))
    return `${px},${py}`
  }).join(' ')

  // Axis positions
  const [ax0] = toPlot(0, 0); const [, ay0] = toPlot(0, 0)
  const [axL] = toPlot(lMin, 0); const [axR] = toPlot(lMax, 0)
  const [, ayT] = toPlot(0, yRange); const [, ayB] = toPlot(0, -yRange)

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: PW }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        {[
          { label: 'a', val: a, set: setA, min: -3, max: 5 },
          { label: 'b', val: b, set: setB, min: -3, max: 3 },
          { label: 'd', val: d, set: setD, min: -3, max: 5 },
        ].map(({ label, val, set, min, max }) => (
          <label key={label} style={{ color: C.text, fontSize: 13 }}>
            {label} = {val.toFixed(1)}
            <input
              type="range" min={min} max={max} step={0.1}
              value={val}
              onChange={e => set(parseFloat(e.target.value))}
              style={{ display: 'block', width: '100%', marginTop: 4 }}
            />
          </label>
        ))}
      </div>
      <svg width={PW} height={PH} style={{ borderRadius: 10, background: C.bg, display: 'block' }}>
        {/* x-axis */}
        <line x1={axL} y1={ay0} x2={axR} y2={ay0} stroke={C.axis} strokeWidth={1.5} />
        {/* y-axis */}
        <line x1={ax0} y1={ayT} x2={ax0} y2={ayB} stroke={C.axis} strokeWidth={1.5} />

        {/* Axis labels */}
        <text x={axR - 10} y={ay0 - 6} fill={C.text} fontSize={11}>λ</text>
        <text x={ax0 + 6} y={ayT + 12} fill={C.text} fontSize={11}>p(λ)</text>

        {/* x tick marks */}
        {[-1, 0, 1, 2, 3, 4, 5, 6].map(t => {
          const [tx] = toPlot(t, 0)
          return (
            <g key={t}>
              <line x1={tx} y1={ay0 - 3} x2={tx} y2={ay0 + 3} stroke={C.axis} strokeWidth={1} />
              <text x={tx} y={ay0 + 14} fill={C.text} fontSize={10} textAnchor="middle">{t}</text>
            </g>
          )
        })}

        {/* Zero line (y=0) */}
        <line x1={axL} y1={ay0} x2={axR} y2={ay0} stroke={C.grid} strokeWidth={0.5} strokeDasharray="4 4" />

        {/* Polynomial curve */}
        <polyline points={points} fill="none" stroke={C.poly} strokeWidth={2.5} />

        {/* Eigenvalue roots */}
        {real && (
          <>
            {[l1, l2].map((lv, i) => {
              if (lv < lMin || lv > lMax) return null
              const [rx, ry] = toPlot(lv, 0)
              return (
                <g key={i}>
                  <circle cx={rx} cy={ry} r={5} fill={C.root} stroke={C.bg} strokeWidth={1.5} />
                  <text x={rx} y={ry - 10} fill={C.root} fontSize={11} textAnchor="middle">λ{i + 1}={lv.toFixed(2)}</text>
                </g>
              )
            })}
          </>
        )}

        {/* Info box */}
        <g transform={`translate(${PW - 200}, 10)`}>
          <rect width={188} height={70} rx={6} fill="rgba(15,23,42,0.85)" />
          <text x={8} y={18} fill={C.text} fontSize={11}>tr = {tr.toFixed(2)}, det = {det.toFixed(2)}</text>
          <text x={8} y={34} fill={C.text} fontSize={11}>disc = {disc.toFixed(2)}</text>
          <text x={8} y={50} fill={real ? C.root : '#f87171'} fontSize={11}>
            {real ? `λ = ${l1.toFixed(3)}, ${l2.toFixed(3)}` : 'Complex eigenvalues'}
          </text>
          <text x={8} y={64} fill={C.text} fontSize={10}>p(λ) = λ² − {tr.toFixed(1)}λ + {det.toFixed(1)}</text>
        </g>
      </svg>
      <p style={{ color: C.text, fontSize: 12, marginTop: 6 }}>
        Matrix: [[{a.toFixed(1)}, {b.toFixed(1)}], [{b.toFixed(1)}, {d.toFixed(1)}]]. Gold dots are eigenvalue roots of the characteristic polynomial.
      </p>
    </div>
  )
}

// ─── PowerIterationViz ─────────────────────────────────────────────────────────

const IW = 480; const IH = 360; const ICX = IW / 2; const ICY = IH / 2; const ISCALE = 80

function toISvg(x: number, y: number) { return [ICX + x * ISCALE, ICY - y * ISCALE] }

const ITER_PRESETS = [
  { label: '[[2,1],[1,2]]', A: [[2, 1], [1, 2]] as number[][] },
  { label: '[[3,0],[0,1]]', A: [[3, 0], [0, 1]] as number[][] },
  { label: '[[1,2],[0,3]]', A: [[1, 2], [0, 3]] as number[][] },
]

export function PowerIterationViz() {
  const [presetIdx, setPresetIdx] = useState(0)
  const [iterCount, setIterCount] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [history, setHistory] = useState<number[][]>([[0.6, 0.8]])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const A = ITER_PRESETS[presetIdx].A
  const { l1, l2, real } = eigenvalues2x2(A[0][0], A[0][1], A[1][0], A[1][1])
  const domEigVec = real ? eigenvector2x2(A[0][0], A[0][1], A[1][0], A[1][1], l1) : [1, 0]

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsRunning(false)
    setIterCount(0)
    setHistory([[0.6, 0.8]])
  }, [])

  useEffect(() => { reset() }, [presetIdx, reset])

  const step = useCallback(() => {
    setHistory(prev => {
      const last = prev[prev.length - 1]
      const next = matMul2(A, last)
      const n = norm2(next)
      const normalized = n < 1e-10 ? next : [next[0] / n, next[1] / n]
      return [...prev.slice(-30), normalized]
    })
    setIterCount(c => c + 1)
  }, [A])

  const toggle = useCallback(() => {
    if (isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setIsRunning(false)
    } else {
      intervalRef.current = setInterval(step, 300)
      setIsRunning(true)
    }
  }, [isRunning, step])

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  const current = history[history.length - 1]
  const angle = Math.atan2(current[1], current[0]) * (180 / Math.PI)
  const eigenAngle = Math.atan2(domEigVec[1], domEigVec[0]) * (180 / Math.PI)
  const angleDiff = Math.abs(((angle - eigenAngle + 180) % 360) - 180)
  const converged = angleDiff < 1 || Math.abs(angleDiff - 180) < 1

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: IW }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {ITER_PRESETS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => setPresetIdx(i)}
            style={{
              padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: i === presetIdx ? C.eigen : 'rgba(100,116,139,0.2)',
              color: i === presetIdx ? '#0f172a' : C.text, fontWeight: i === presetIdx ? 700 : 400,
              fontSize: 12,
            }}
          >{p.label}</button>
        ))}
      </div>
      <svg width={IW} height={IH} style={{ borderRadius: 10, background: C.bg, display: 'block' }}>
        {/* Grid */}
        {[-3, -2, -1, 0, 1, 2, 3].map(g => {
          const [gx1, gy1] = toISvg(g, -2); const [gx2, gy2] = toISvg(g, 2)
          const [hx1, hy1] = toISvg(-3, g); const [hx2, hy2] = toISvg(3, g)
          return (
            <g key={g}>
              <line x1={gx1} y1={gy1} x2={gx2} y2={gy2} stroke={g === 0 ? C.axis : C.grid} strokeWidth={g === 0 ? 1.5 : 0.7} />
              <line x1={hx1} y1={hy1} x2={hx2} y2={hy2} stroke={g === 0 ? C.axis : C.grid} strokeWidth={g === 0 ? 1.5 : 0.7} />
            </g>
          )
        })}

        {/* Dominant eigenvector */}
        {real && (() => {
          const [ox, oy] = toISvg(0, 0)
          const [ex, ey] = toISvg(domEigVec[0], domEigVec[1])
          const [enx, eny] = toISvg(-domEigVec[0], -domEigVec[1])
          return (
            <>
              <line x1={enx} y1={eny} x2={ex} y2={ey} stroke={C.eigen} strokeWidth={1.5} strokeDasharray="6 3" opacity={0.6} />
              <circle cx={ex} cy={ey} r={5} fill={C.eigen} />
              <text x={ex + 8} y={ey - 6} fill={C.eigen} fontSize={11}>dominant eigenvec</text>
            </>
          )
        })()}

        {/* History trail */}
        {history.map((v, i) => {
          const alpha = (i + 1) / history.length
          const [ox, oy] = toISvg(0, 0)
          const [vx, vy] = toISvg(v[0], v[1])
          if (i === history.length - 1) return null
          return (
            <line key={i} x1={ox} y1={oy} x2={vx} y2={vy}
              stroke={C.iter} strokeWidth={1} opacity={alpha * 0.5} />
          )
        })}

        {/* Current vector */}
        {(() => {
          const [ox, oy] = toISvg(0, 0)
          const [vx, vy] = toISvg(current[0], current[1])
          return <Arrow x1={ox} y1={oy} x2={vx} y2={vy} color={C.iter} width={2.5} />
        })()}

        {/* Info overlay */}
        <g transform="translate(12, 12)">
          <rect width={200} height={78} rx={6} fill="rgba(15,23,42,0.85)" />
          <text x={8} y={18} fill={C.text} fontSize={11}>Iteration: {iterCount}</text>
          <text x={8} y={34} fill={C.iter} fontSize={11}>
            v = [{current[0].toFixed(3)}, {current[1].toFixed(3)}]
          </text>
          {real && (
            <text x={8} y={50} fill={C.eigen} fontSize={11}>
              eigvec = [{domEigVec[0].toFixed(3)}, {domEigVec[1].toFixed(3)}]
            </text>
          )}
          <text x={8} y={66} fill={converged ? '#34d399' : C.text} fontSize={11}>
            {converged ? '✓ Converged!' : `Angle diff: ${angleDiff.toFixed(1)}°`}
          </text>
        </g>

        {/* λ info */}
        {real && (
          <g transform={`translate(${IW - 150}, 12)`}>
            <rect width={138} height={44} rx={6} fill="rgba(15,23,42,0.85)" />
            <text x={8} y={18} fill={C.eigen} fontSize={11}>λ₁ = {l1.toFixed(3)}</text>
            <text x={8} y={34} fill={C.eigen} fontSize={11}>λ₂ = {l2.toFixed(3)}</text>
          </g>
        )}
      </svg>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button
          onClick={toggle}
          style={{
            padding: '6px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: isRunning ? '#f87171' : C.iter, color: '#0f172a', fontWeight: 700, fontSize: 13,
          }}
        >{isRunning ? 'Pause' : 'Run'}</button>
        <button
          onClick={step}
          style={{
            padding: '6px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: 'rgba(100,116,139,0.25)', color: C.text, fontSize: 13,
          }}
        >Step</button>
        <button
          onClick={reset}
          style={{
            padding: '6px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: 'rgba(100,116,139,0.25)', color: C.text, fontSize: 13,
          }}
        >Reset</button>
      </div>
      <p style={{ color: C.text, fontSize: 12, marginTop: 6 }}>
        Power iteration: repeatedly apply A and normalize. The vector (green) converges to the dominant eigenvector (gold dashed line).
      </p>
    </div>
  )
}
