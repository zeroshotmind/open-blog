'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import React from 'react'

// ─── SVDGeometryViz ───────────────────────────────────────────────────────────

export function SVDGeometryViz() {
  const [stage, setStage] = useState(0)

  // A = [[2, 1], [0.5, 1.5]]
  // AᵀA = [[2,0.5],[1,1.5]]ᵀ [[2,1],[0.5,1.5]] = [[4.25,2.75],[2.75,3.25]]
  // trace = 7.5, det = 4.25*3.25 - 2.75^2 = 13.8125 - 7.5625 = 6.25
  // eigenvalues: (7.5 ± sqrt(56.25 - 25)) / 2 = (7.5 ± sqrt(31.25)) / 2
  // sqrt(31.25) ≈ 5.5902
  // λ₁ = (7.5 + 5.5902)/2 ≈ 6.5451, λ₂ = (7.5 - 5.5902)/2 ≈ 0.9549
  // σ₁ = sqrt(6.5451) ≈ 2.558, σ₂ = sqrt(0.9549) ≈ 0.977

  const sigma1 = 2.558, sigma2 = 0.977
  const cx = 200, cy = 200, scale = 55

  const stages = [
    { label: 'Input: unit circle in ℝ²', color: '#60a5fa' },
    { label: 'After Vᵀ: rotated (still a circle)', color: '#a78bfa' },
    { label: 'After Σ: stretched to ellipse (σ₁, σ₂)', color: '#fb923c' },
    { label: 'After U: final ellipse (output of A)', color: '#4ade80' },
  ]

  // Rotation angle for V (approximate, based on eigenvector of AᵀA)
  // eigenvector for λ₁: [2.75, λ₁-4.25] ≈ [2.75, 2.2951] → angle ≈ 39.8°
  const vAngle = 39.8 * Math.PI / 180
  // U rotation: for a 2x2, U rotation determined by AV/σ
  const uAngle = 25 * Math.PI / 180 // approximate

  const renderEllipse = (rx: number, ry: number, angle: number, color: string, fill = false) => {
    // Draw ellipse rotated by angle using path approximation
    const N = 60
    const pts = Array.from({length: N}, (_, i) => {
      const t = (i / N) * 2 * Math.PI
      const ex = rx * Math.cos(t), ey = ry * Math.sin(t)
      const x = cx + scale * (ex * Math.cos(angle) - ey * Math.sin(angle))
      const y = cy - scale * (ex * Math.sin(angle) + ey * Math.cos(angle))
      return `${x},${y}`
    }).join(' ')
    return <polygon points={pts} fill={fill ? color : 'none'} fillOpacity={fill ? 0.1 : 0} stroke={color} strokeWidth={2} />
  }

  return (
    <div className="my-6 flex flex-col items-center gap-3">
      <svg width={400} height={400} style={{ background: '#0f172a', borderRadius: 10 }}>
        {[-3,-2,-1,1,2,3].map(i => (
          <g key={i}>
            <line x1={cx+i*scale} y1={30} x2={cx+i*scale} y2={370} stroke="#1e293b" strokeWidth={1}/>
            <line x1={30} y1={cy-i*scale} x2={370} y2={cy-i*scale} stroke="#1e293b" strokeWidth={1}/>
          </g>
        ))}
        <line x1={30} y1={cy} x2={370} y2={cy} stroke="#334155" strokeWidth={1}/>
        <line x1={cx} y1={30} x2={cx} y2={370} stroke="#334155" strokeWidth={1}/>

        {/* Stage 0: unit circle */}
        {renderEllipse(1, 1, 0, '#60a5fa', stage === 0)}

        {/* Stage 1: after Vᵀ rotation (still unit circle, just rotated label) */}
        {stage >= 1 && renderEllipse(1, 1, vAngle, '#a78bfa', stage === 1)}

        {/* Stage 2: after Σ stretch */}
        {stage >= 2 && renderEllipse(sigma1, sigma2, vAngle, '#fb923c', stage === 2)}

        {/* Stage 3: after U rotation */}
        {stage >= 3 && renderEllipse(sigma1, sigma2, uAngle, '#4ade80', stage === 3)}

        {/* Semi-axis indicators at stage 2+ */}
        {stage >= 2 && (
          <>
            <line x1={cx} y1={cy}
              x2={cx + scale*sigma1*Math.cos(vAngle)}
              y2={cy - scale*sigma1*Math.sin(vAngle)}
              stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="4,3"/>
            <text x={cx + scale*sigma1*Math.cos(vAngle)/2 + 8}
              y={cy - scale*sigma1*Math.sin(vAngle)/2}
              fill="#fbbf24" fontSize={12}>σ₁={sigma1.toFixed(2)}</text>
          </>
        )}

        <circle cx={cx} cy={cy} r={3} fill="#94a3b8"/>
      </svg>

      <p style={{ color: stages[stage].color, fontSize: 14, textAlign: 'center', maxWidth: 360 }}>
        {stages[stage].label}
      </p>

      <div style={{ color: '#64748b', fontSize: 12, textAlign: 'center' }}>
        A = [[2, 1], [0.5, 1.5]] &nbsp;|&nbsp; σ₁ ≈ {sigma1} &nbsp;|&nbsp; σ₂ ≈ {sigma2}
      </div>

      <div className="flex gap-3">
        <button onClick={() => setStage(s => Math.max(0, s-1))} disabled={stage === 0}
          style={{ padding: '6px 16px', borderRadius: 6, background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', cursor: stage===0?'not-allowed':'pointer' }}>
          ← Prev
        </button>
        <span style={{ color: '#64748b', lineHeight: '32px' }}>{stage+1}/4</span>
        <button onClick={() => setStage(s => Math.min(3, s+1))} disabled={stage === 3}
          style={{ padding: '6px 16px', borderRadius: 6, background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', cursor: stage===3?'not-allowed':'pointer' }}>
          Next →
        </button>
      </div>
    </div>
  )
}

// ─── LowRankApproxViz ─────────────────────────────────────────────────────────

export function LowRankApproxViz() {
  const [k, setK] = useState(1)

  // 5x5 matrix with structure (sum of rank-1 terms)
  // Define 5 singular triplets
  const sigma = [8, 4, 2, 1, 0.5]

  // u vectors (5 cols, each 5 elements) — orthonormal basis
  const U = [
    [0.5774, 0.5774, 0.5774, 0, 0],
    [0.7071, -0.7071, 0, 0, 0],
    [0.4082, 0.4082, -0.8165, 0, 0],
    [0, 0, 0, 0.7071, 0.7071],
    [0, 0, 0, 0.7071, -0.7071],
  ]

  const V = [
    [0.5774, 0.5774, 0, 0.5774, 0],
    [0.7071, -0.7071, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0.4082, 0.4082, 0, -0.8165, 0],
    [0, 0, 0, 0, 1],
  ]

  // Compute rank-k approximation
  const computeApprox = (rank: number) => {
    const mat = Array.from({length:5}, () => Array(5).fill(0))
    for (let t = 0; t < rank; t++) {
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          mat[i][j] += sigma[t] * U[t][i] * V[t][j]
        }
      }
    }
    return mat
  }

  const full = computeApprox(5)
  const approx = computeApprox(k)

  const frobNorm = (A: number[][], B: number[][]) => {
    let s = 0
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) s += (A[i][j]-B[i][j])**2
    return Math.sqrt(s)
  }
  const err = frobNorm(full, approx)

  const getColor = (v: number, min: number, max: number) => {
    const t = (v - min) / (max - min + 0.001)
    if (t < 0.5) {
      const s = t * 2
      return `rgb(${Math.round(59+s*136)},${Math.round(130+s*(-50))},${Math.round(246+s*(-220))})`
    } else {
      const s = (t - 0.5) * 2
      return `rgb(${Math.round(195+s*60)},${Math.round(80-s*60)},${Math.round(26-s*10)})`
    }
  }

  const allVals = full.flat()
  const minV = Math.min(...allVals), maxV = Math.max(...allVals)

  const Heatmap = ({ mat, title }: { mat: number[][]; title: string }) => (
    <div>
      <p style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', marginBottom: 6 }}>{title}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 36px)', gap: 3 }}>
        {mat.map((row, i) => row.map((v, j) => (
          <div key={`${i}-${j}`} style={{
            width: 36, height: 36, borderRadius: 4,
            background: getColor(v, minV, maxV),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: '#fff', fontFamily: 'monospace',
          }}>{v.toFixed(1)}</div>
        )))}
      </div>
    </div>
  )

  return (
    <div className="my-6 flex flex-col items-center gap-4">
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Heatmap mat={full} title="Original (rank 5)" />
        <Heatmap mat={approx} title={`Rank-${k} Approximation`} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ color: '#94a3b8', fontSize: 13 }}>k = {k}</label>
        <input type="range" min={1} max={5} value={k} onChange={e => setK(Number(e.target.value))}
          style={{ width: 160 }} />
      </div>
      <div style={{ color: '#64748b', fontSize: 13 }}>
        Frobenius error: {err.toFixed(3)} &nbsp;|&nbsp;
        Variance captured: {(100 * sigma.slice(0,k).reduce((a,s)=>a+s*s,0) / sigma.reduce((a,s)=>a+s*s,0)).toFixed(1)}%
      </div>
    </div>
  )
}

// ─── SingularValueDecayViz ────────────────────────────────────────────────────

export function SingularValueDecayViz() {
  const [hovered, setHovered] = useState<number | null>(null)

  const sigmas = [12, 7, 4, 2.5, 1.5, 0.8, 0.4, 0.2]
  const totalVar = sigmas.reduce((a,s) => a + s*s, 0)
  const cumVar = sigmas.map((_, i) => sigmas.slice(0,i+1).reduce((a,s)=>a+s*s,0) / totalVar)

  const W = 400, H = 300
  const padL = 40, padR = 20, padT = 20, padB = 50
  const plotW = W - padL - padR, plotH = H - padT - padB
  const barW = plotW / sigmas.length
  const maxS = sigmas[0]

  const barX = (i: number) => padL + i * barW + barW * 0.1
  const barH = (s: number) => (s / maxS) * plotH
  const lineX = (i: number) => padL + (i + 0.5) * barW
  const lineY = (v: number) => padT + (1 - v) * plotH

  return (
    <div className="my-6 flex flex-col items-center gap-3">
      <svg width={W} height={H} style={{ background: '#0f172a', borderRadius: 10 }}>
        {/* Y axis gridlines */}
        {[0.25, 0.5, 0.75, 1.0].map(v => (
          <g key={v}>
            <line x1={padL} y1={lineY(v)} x2={W-padR} y2={lineY(v)} stroke="#1e293b" strokeWidth={1}/>
            <text x={padL-6} y={lineY(v)+4} fill="#475569" fontSize={10} textAnchor="end">{(v*maxS).toFixed(0)}</text>
          </g>
        ))}
        {/* Bars */}
        {sigmas.map((s, i) => (
          <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <rect x={barX(i)} y={padT + plotH - barH(s)} width={barW*0.8} height={barH(s)}
              fill={hovered === i ? '#93c5fd' : '#3b82f6'} rx={3}
              style={{ cursor: 'pointer', transition: 'fill 0.15s' }}/>
            <text x={barX(i) + barW*0.4} y={H - padB + 16} fill="#64748b" fontSize={11} textAnchor="middle">
              σ{i+1}
            </text>
            {hovered === i && (
              <text x={barX(i)+barW*0.4} y={padT+plotH-barH(s)-6} fill="#93c5fd" fontSize={11} textAnchor="middle">
                {s}
              </text>
            )}
          </g>
        ))}
        {/* Cumulative variance line */}
        <polyline
          points={cumVar.map((v, i) => `${lineX(i)},${lineY(v)}`).join(' ')}
          fill="none" stroke="#fb923c" strokeWidth={2}/>
        {cumVar.map((v, i) => (
          <circle key={i} cx={lineX(i)} cy={lineY(v)} r={4} fill="#fb923c"/>
        ))}
        {/* Axes */}
        <line x1={padL} y1={padT} x2={padL} y2={padT+plotH} stroke="#475569" strokeWidth={1}/>
        <line x1={padL} y1={padT+plotH} x2={W-padR} y2={padT+plotH} stroke="#475569" strokeWidth={1}/>
        {/* Legend */}
        <rect x={W-padR-120} y={padT} width={12} height={12} fill="#3b82f6" rx={2}/>
        <text x={W-padR-104} y={padT+10} fill="#94a3b8" fontSize={11}>Singular values</text>
        <line x1={W-padR-120} y1={padT+26} x2={W-padR-108} y2={padT+26} stroke="#fb923c" strokeWidth={2}/>
        <text x={W-padR-104} y={padT+30} fill="#94a3b8" fontSize={11}>Cumul. variance</text>
      </svg>
      {hovered !== null && (
        <p style={{ color: '#94a3b8', fontSize: 13 }}>
          σ{hovered+1} = {sigmas[hovered]} &nbsp;|&nbsp; Cumulative variance: {(cumVar[hovered]*100).toFixed(1)}%
        </p>
      )}
    </div>
  )
}
