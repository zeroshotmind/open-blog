'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import React from 'react'

// ─── GramSchmidtViz ───────────────────────────────────────────────────────────

export function GramSchmidtViz() {
  const [step, setStep] = useState(0)
  const cx = 200, cy = 200, scale = 45

  const v1 = [3, 1]
  const v2 = [1, 3]

  // u1 = v1
  const u1 = v1
  const u1Len = Math.sqrt(u1[0] ** 2 + u1[1] ** 2)
  const q1 = [u1[0] / u1Len, u1[1] / u1Len]

  // proj of v2 onto q1
  const dot_v2_q1 = v2[0] * q1[0] + v2[1] * q1[1]
  const proj = [dot_v2_q1 * q1[0], dot_v2_q1 * q1[1]]

  // u2 = v2 - proj
  const u2 = [v2[0] - proj[0], v2[1] - proj[1]]
  const u2Len = Math.sqrt(u2[0] ** 2 + u2[1] ** 2)
  const q2 = [u2[0] / u2Len, u2[1] / u2Len]

  const toSVG = (v: number[]) => [cx + v[0] * scale, cy - v[1] * scale]

  const Arrow = ({ vec, color, dashed = false, label = '' }: { vec: number[]; color: string; dashed?: boolean; label?: string }) => {
    const [x2, y2] = toSVG(vec)
    const dx = x2 - cx, dy = y2 - cy
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 1) return null
    const ux = dx / len, uy = dy / len
    const hx = x2 - ux * 8, hy = y2 - uy * 8
    return (
      <g>
        <line x1={cx} y1={cy} x2={x2} y2={y2} stroke={color} strokeWidth={2}
          strokeDasharray={dashed ? '5,4' : undefined} />
        <polygon points={`${x2},${y2} ${hx - uy * 4},${hy + ux * 4} ${hx + uy * 4},${hy - ux * 4}`} fill={color} />
        {label && <text x={x2 + ux * 12} y={y2 + uy * 12} fill={color} fontSize={13} textAnchor="middle">{label}</text>}
      </g>
    )
  }

  const steps = [
    { desc: 'Original vectors v₁ and v₂ (linearly independent)' },
    { desc: 'Step 1: Compute projection of v₂ onto u₁ (= v₁)' },
    { desc: 'Step 2: u₂ = v₂ − proj(v₂ onto q₁), the perpendicular component' },
    { desc: 'Step 3: Normalize to get q₁ = u₁/‖u₁‖ and q₂ = u₂/‖u₂‖' },
  ]

  return (
    <div className="my-6 flex flex-col items-center gap-3">
      <svg width={400} height={400} style={{ background: '#0f172a', borderRadius: 10 }}>
        {/* axes */}
        <line x1={40} y1={cy} x2={360} y2={cy} stroke="#334155" strokeWidth={1} />
        <line x1={cx} y1={40} x2={cx} y2={360} stroke="#334155" strokeWidth={1} />
        {/* grid */}
        {[-3,-2,-1,1,2,3].map(i => (
          <g key={i}>
            <line x1={cx + i*scale} y1={40} x2={cx + i*scale} y2={360} stroke="#1e293b" strokeWidth={1} />
            <line x1={40} y1={cy - i*scale} x2={360} y2={cy - i*scale} stroke="#1e293b" strokeWidth={1} />
          </g>
        ))}
        {/* step 0: v1, v2 */}
        <Arrow vec={v1} color="#60a5fa" label="v₁" />
        <Arrow vec={v2} color="#4ade80" label="v₂" />
        {/* step 1+: projection */}
        {step >= 1 && <Arrow vec={proj} color="#fb923c" dashed label="proj" />}
        {/* step 2+: u2 */}
        {step >= 2 && (
          <>
            {(() => {
              const [px, py] = toSVG(proj)
              const [vx, vy] = toSVG(v2)
              const dx = vx - px, dy = vy - py
              const len = Math.sqrt(dx*dx+dy*dy)
              const ux = dx/len, uy = dy/len
              const hx = vx - ux*8, hy = vy - uy*8
              return (
                <g>
                  <line x1={px} y1={py} x2={vx} y2={vy} stroke="#f87171" strokeWidth={2} />
                  <polygon points={`${vx},${vy} ${hx-uy*4},${hy+ux*4} ${hx+uy*4},${hy-ux*4}`} fill="#f87171" />
                  <text x={vx+12} y={vy-8} fill="#f87171" fontSize={13}>u₂</text>
                </g>
              )
            })()}
          </>
        )}
        {/* step 3: q1, q2 */}
        {step >= 3 && (
          <>
            <Arrow vec={q1} color="#c084fc" label="q₁" />
            <Arrow vec={q2} color="#e879f9" label="q₂" />
          </>
        )}
        {/* origin dot */}
        <circle cx={cx} cy={cy} r={3} fill="#94a3b8" />
      </svg>
      <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', maxWidth: 360 }}>{steps[step].desc}</p>
      <div className="flex gap-3">
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          style={{ padding: '6px 16px', borderRadius: 6, background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', cursor: step === 0 ? 'not-allowed' : 'pointer' }}>
          ← Prev
        </button>
        <span style={{ color: '#64748b', lineHeight: '32px' }}>{step + 1} / {steps.length}</span>
        <button onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} disabled={step === steps.length - 1}
          style={{ padding: '6px 16px', borderRadius: 6, background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', cursor: step === steps.length - 1 ? 'not-allowed' : 'pointer' }}>
          Next →
        </button>
      </div>
    </div>
  )
}

// ─── LUStepsViz ───────────────────────────────────────────────────────────────

export function LUStepsViz() {
  const [step, setStep] = useState(0)

  const A0 = [[2,1,1],[4,3,3],[8,7,9]]
  const A1 = [[2,1,1],[0,1,1],[0,3,5]]
  const A2 = [[2,1,1],[0,1,1],[0,0,2]]
  const U  = [[2,1,1],[0,1,1],[0,0,2]]

  const L0 = [[1,0,0],[0,1,0],[0,0,1]]
  const L1 = [[1,0,0],[2,1,0],[4,0,1]]
  const L2 = [[1,0,0],[2,1,0],[4,3,1]]

  const states = [
    { mat: A0, L: L0, pivots: [[0,0]], desc: 'Original matrix A. First pivot is A[0,0] = 2.' },
    { mat: A1, L: L1, pivots: [[0,0],[1,1]], desc: 'Eliminate below pivot 1: R₂ ← R₂ − 2·R₁ (m₂₁=2), R₃ ← R₃ − 4·R₁ (m₃₁=4). Multipliers stored in L.' },
    { mat: A2, L: L2, pivots: [[0,0],[1,1],[2,2]], desc: 'Eliminate below pivot 2: R₃ ← R₃ − 3·R₂ (m₃₂=3). L is now complete.' },
    { mat: U,  L: L2, pivots: [[0,0],[1,1],[2,2]], desc: 'Factorization complete: A = LU. L lower triangular with 1s on diagonal, U upper triangular.' },
  ]

  const s = states[step]

  const Cell = ({ val, isPivot, isZero }: { val: number; isPivot: boolean; isZero: boolean }) => (
    <div style={{
      width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: isPivot ? '#854d0e' : isZero ? '#0f172a' : '#1e293b',
      border: `1px solid ${isPivot ? '#ca8a04' : '#334155'}`,
      color: isPivot ? '#fde68a' : isZero ? '#475569' : '#e2e8f0',
      fontFamily: 'monospace', fontSize: 15, borderRadius: 4,
    }}>{val}</div>
  )

  return (
    <div className="my-6 flex flex-col items-center gap-4">
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginBottom: 8 }}>
            {step < 3 ? 'Matrix (in progress)' : 'U (upper triangular)'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 40px)', gap: 4 }}>
            {s.mat.map((row, i) => row.map((val, j) => (
              <Cell key={`${i}-${j}`} val={val}
                isPivot={s.pivots.some(([pi,pj]) => pi === i && pj === j)}
                isZero={val === 0} />
            )))}
          </div>
        </div>
        <div>
          <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginBottom: 8 }}>L (lower triangular)</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 40px)', gap: 4 }}>
            {s.L.map((row, i) => row.map((val, j) => (
              <Cell key={`${i}-${j}`} val={val}
                isPivot={i === j}
                isZero={val === 0 && i !== j} />
            )))}
          </div>
        </div>
      </div>
      <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', maxWidth: 400 }}>{s.desc}</p>
      <div className="flex gap-3">
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          style={{ padding: '6px 16px', borderRadius: 6, background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', cursor: step === 0 ? 'not-allowed' : 'pointer' }}>
          ← Prev
        </button>
        <span style={{ color: '#64748b', lineHeight: '32px' }}>{step + 1} / {states.length}</span>
        <button onClick={() => setStep(s => Math.min(states.length - 1, s + 1))} disabled={step === states.length - 1}
          style={{ padding: '6px 16px', borderRadius: 6, background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', cursor: step === states.length - 1 ? 'not-allowed' : 'pointer' }}>
          Next →
        </button>
      </div>
    </div>
  )
}

// ─── QRGeometryViz ────────────────────────────────────────────────────────────

export function QRGeometryViz() {
  const svgRef = useRef<SVGSVGElement | null>(null) as React.RefObject<SVGSVGElement | null>
  const [a1, setA1] = useState([3, 1])
  const [a2, setA2] = useState([1, 3])
  const [dragging, setDragging] = useState<'a1' | 'a2' | null>(null)
  const cx = 200, cy = 200, scale = 45

  const toSVG = (v: number[]) => [cx + v[0] * scale, cy - v[1] * scale]
  const fromSVG = (x: number, y: number) => [(x - cx) / scale, (cy - y) / scale]

  // Gram-Schmidt
  const a1Len = Math.sqrt(a1[0]**2 + a1[1]**2)
  const q1 = a1Len > 0.01 ? [a1[0]/a1Len, a1[1]/a1Len] : [1, 0]
  const r12 = a2[0]*q1[0] + a2[1]*q1[1]
  const u2 = [a2[0] - r12*q1[0], a2[1] - r12*q1[1]]
  const u2Len = Math.sqrt(u2[0]**2 + u2[1]**2)
  const q2 = u2Len > 0.01 ? [u2[0]/u2Len, u2[1]/u2Len] : [-q1[1], q1[0]]
  const r11 = a1Len
  const r22 = u2Len

  const getPos = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return [0, 0]
    const rect = svg.getBoundingClientRect()
    return fromSVG(e.clientX - rect.left, e.clientY - rect.top)
  }, [])

  const handleMouseDown = (which: 'a1' | 'a2') => (e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(which)
  }

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging) return
    const [x, y] = getPos(e)
    if (dragging === 'a1') setA1([x, y])
    else setA2([x, y])
  }, [dragging, getPos])

  const handleMouseUp = useCallback(() => setDragging(null), [])

  const Arrow = ({ vec, color, label }: { vec: number[]; color: string; label: string }) => {
    const [x2, y2] = toSVG(vec)
    const dx = x2 - cx, dy = y2 - cy
    const len = Math.sqrt(dx*dx+dy*dy)
    if (len < 2) return null
    const ux = dx/len, uy = dy/len
    const hx = x2 - ux*8, hy = y2 - uy*8
    return (
      <g>
        <line x1={cx} y1={cy} x2={x2} y2={y2} stroke={color} strokeWidth={2.5} />
        <polygon points={`${x2},${y2} ${hx-uy*5},${hy+ux*5} ${hx+uy*5},${hy-ux*5}`} fill={color} />
        <text x={x2+ux*14} y={y2+uy*14} fill={color} fontSize={14} textAnchor="middle">{label}</text>
      </g>
    )
  }

  const [a1x, a1y] = toSVG(a1)
  const [a2x, a2y] = toSVG(a2)

  return (
    <div className="my-6 flex flex-col items-center gap-3">
      <svg ref={svgRef} width={400} height={400}
        style={{ background: '#0f172a', borderRadius: 10, cursor: dragging ? 'grabbing' : 'default' }}
        onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        {[-3,-2,-1,1,2,3].map(i => (
          <g key={i}>
            <line x1={cx+i*scale} y1={40} x2={cx+i*scale} y2={360} stroke="#1e293b" strokeWidth={1}/>
            <line x1={40} y1={cy-i*scale} x2={360} y2={cy-i*scale} stroke="#1e293b" strokeWidth={1}/>
          </g>
        ))}
        <line x1={40} y1={cy} x2={360} y2={cy} stroke="#334155" strokeWidth={1}/>
        <line x1={cx} y1={40} x2={cx} y2={360} stroke="#334155" strokeWidth={1}/>
        <Arrow vec={a1} color="#60a5fa" label="a₁" />
        <Arrow vec={a2} color="#4ade80" label="a₂" />
        <Arrow vec={q1} color="#c084fc" label="q₁" />
        <Arrow vec={q2} color="#e879f9" label="q₂" />
        <circle cx={a1x} cy={a1y} r={7} fill="#60a5fa" opacity={0.8} style={{ cursor: 'grab' }}
          onMouseDown={handleMouseDown('a1')} />
        <circle cx={a2x} cy={a2y} r={7} fill="#4ade80" opacity={0.8} style={{ cursor: 'grab' }}
          onMouseDown={handleMouseDown('a2')} />
        <circle cx={cx} cy={cy} r={3} fill="#94a3b8" />
      </svg>
      <div style={{ background: '#1e293b', borderRadius: 8, padding: '10px 20px', fontFamily: 'monospace', fontSize: 13, color: '#e2e8f0' }}>
        <span style={{ color: '#94a3b8' }}>R = </span>
        <span>[[{r11.toFixed(2)}, {r12.toFixed(2)}], [0, {r22.toFixed(2)}]]</span>
      </div>
      <p style={{ color: '#64748b', fontSize: 12 }}>Drag the vector tips (circles) to explore QR decomposition</p>
    </div>
  )
}
