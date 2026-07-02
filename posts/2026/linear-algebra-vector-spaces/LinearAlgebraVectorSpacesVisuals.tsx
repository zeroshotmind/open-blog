'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import React from 'react'

// ─── SubspaceViz ──────────────────────────────────────────────────────────────

export function SubspaceViz() {
  const svgRef = useRef<SVGSVGElement | null>(null) as React.RefObject<SVGSVGElement | null>
  const [dragging, setDragging] = useState(false)
  const [point, setPoint] = useState([3, 1.5])
  const [showClosure, setShowClosure] = useState(false)

  const cx = 200, cy = 200, scale = 45
  // Subspace: line in direction [2,1]
  const dir = [2, 1]
  const dirLen = Math.sqrt(dir[0]**2 + dir[1]**2)
  const dirUnit = [dir[0]/dirLen, dir[1]/dirLen]

  const toSVG = (v: number[]) => [cx + v[0]*scale, cy - v[1]*scale]
  const fromSVG = (x: number, y: number) => [(x-cx)/scale, (cy-y)/scale]

  // Project point onto subspace line
  const projectOnto = (p: number[]) => {
    const t = p[0]*dirUnit[0] + p[1]*dirUnit[1]
    return [t*dirUnit[0], t*dirUnit[1]]
  }

  const proj = projectOnto(point)
  const dist = Math.sqrt((point[0]-proj[0])**2 + (point[1]-proj[1])**2)
  const inSubspace = dist < 0.15

  // Fixed point on subspace
  const fixed = [2, 1]
  // Point 2 on subspace (project point if dragged near, else use proj)
  const p2 = proj
  const sum = [fixed[0]+p2[0], fixed[1]+p2[1]]
  const sumProj = projectOnto(sum)
  const sumInSubspace = Math.sqrt((sum[0]-sumProj[0])**2+(sum[1]-sumProj[1])**2) < 0.01

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging) return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const [x, y] = fromSVG(e.clientX-rect.left, e.clientY-rect.top)
    setPoint([x, y])
  }, [dragging])

  const [px, py] = toSVG(point)
  const [fx, fy] = toSVG(fixed)
  const [p2x, p2y] = toSVG(p2)
  const [sx, sy] = toSVG(sum)

  return (
    <div className="my-6 flex flex-col items-center gap-3">
      <svg ref={svgRef} width={400} height={400}
        style={{ background: '#0f172a', borderRadius: 10, cursor: dragging ? 'grabbing' : 'default' }}
        onMouseMove={handleMouseMove} onMouseUp={() => setDragging(false)} onMouseLeave={() => setDragging(false)}>
        {/* Grid */}
        {[-3,-2,-1,1,2,3].map(i => (
          <g key={i}>
            <line x1={cx+i*scale} y1={20} x2={cx+i*scale} y2={380} stroke="#1e293b" strokeWidth={1}/>
            <line x1={20} y1={cy-i*scale} x2={380} y2={cy-i*scale} stroke="#1e293b" strokeWidth={1}/>
          </g>
        ))}
        <line x1={20} y1={cy} x2={380} y2={cy} stroke="#334155" strokeWidth={1}/>
        <line x1={cx} y1={20} x2={cx} y2={380} stroke="#334155" strokeWidth={1}/>

        {/* Subspace line */}
        {(() => {
          const t = 4
          const [x1,y1] = toSVG([-t*dirUnit[0],-t*dirUnit[1]])
          const [x2,y2] = toSVG([t*dirUnit[0],t*dirUnit[1]])
          return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c084fc" strokeWidth={2}/>
        })()}
        <text x={cx+3*dirUnit[0]*scale+10} y={cy-3*dirUnit[1]*scale} fill="#c084fc" fontSize={12}>Subspace W</text>

        {/* Closure example */}
        {showClosure && (
          <>
            <circle cx={fx} cy={fy} r={6} fill="#4ade80"/>
            <text x={fx+8} y={fy-8} fill="#4ade80" fontSize={11}>w₁=[2,1]</text>
            <circle cx={p2x} cy={p2y} r={6} fill="#60a5fa"/>
            <text x={p2x+8} y={p2y-8} fill="#60a5fa" fontSize={11}>w₂=proj</text>
            <circle cx={sx} cy={sy} r={6} fill={sumInSubspace ? '#fbbf24' : '#f87171'}/>
            <text x={sx+8} y={sy+4} fill={sumInSubspace ? '#fbbf24' : '#f87171'} fontSize={11}>
              w₁+w₂ {sumInSubspace ? '∈ W ✓' : '∉ W?'}
            </text>
          </>
        )}

        {/* Draggable point */}
        <circle cx={px} cy={py} r={8} fill={inSubspace ? '#4ade80' : '#f87171'}
          style={{ cursor: 'grab' }} onMouseDown={() => setDragging(true)}/>
        <text x={px+10} y={py-8} fill={inSubspace ? '#4ade80' : '#f87171'} fontSize={12}>
          {inSubspace ? 'In W ✓' : 'Not in W'}
        </text>

        <circle cx={cx} cy={cy} r={3} fill="#94a3b8"/>
      </svg>

      <div className="flex gap-3">
        <button onClick={() => setShowClosure(s => !s)}
          style={{ padding: '6px 16px', borderRadius: 6, background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', cursor: 'pointer' }}>
          {showClosure ? 'Hide' : 'Show'} Closure Example
        </button>
      </div>
      <p style={{ color: '#64748b', fontSize: 12 }}>Drag the point to see if it's in the subspace W (line through origin, direction [2,1])</p>
    </div>
  )
}

// ─── ColumnNullspaceViz ───────────────────────────────────────────────────────

export function ColumnNullspaceViz() {
  const [view, setView] = useState<'col' | 'null'>('col')
  const cx = 200, cy = 200, scale = 55

  // A = [[1,2,0],[0,0,1]]
  // Columns: a1=[1,0], a2=[2,0], a3=[0,1] (in R²)
  // Col(A) = span{[1,0],[0,1]} = all of R²
  // Null space: x1+2x2=0, x3=0 → x=t[-2,1,0]

  const cols = [[1,0],[2,0],[0,1]]
  const colColors = ['#60a5fa','#34d399','#f472b6']
  const colLabels = ['a₁=[1,0]','a₂=[2,0]','a₃=[0,1]']

  const toSVG = (v: number[]) => [cx + v[0]*scale, cy - v[1]*scale]

  const Arrow = ({vec, color, label}:{vec:number[];color:string;label:string}) => {
    const [x2,y2] = toSVG(vec)
    const dx=x2-cx,dy=y2-cy,len=Math.sqrt(dx*dx+dy*dy)
    if(len<2) return null
    const ux=dx/len,uy=dy/len
    const hx=x2-ux*8,hy=y2-uy*8
    return <g>
      <line x1={cx} y1={cy} x2={x2} y2={y2} stroke={color} strokeWidth={2.5}/>
      <polygon points={`${x2},${y2} ${hx-uy*5},${hy+ux*5} ${hx+uy*5},${hy-ux*5}`} fill={color}/>
      <text x={x2+ux*14} y={y2+uy*14} fill={color} fontSize={12} textAnchor="middle">{label}</text>
    </g>
  }

  return (
    <div className="my-6 flex flex-col items-center gap-3">
      <div className="flex gap-3 mb-2">
        <button onClick={() => setView('col')}
          style={{ padding: '6px 16px', borderRadius: 6, background: view==='col'?'#1d4ed8':'#1e293b', color: '#e2e8f0', border: '1px solid #334155', cursor: 'pointer' }}>
          Column Space
        </button>
        <button onClick={() => setView('null')}
          style={{ padding: '6px 16px', borderRadius: 6, background: view==='null'?'#7e22ce':'#1e293b', color: '#e2e8f0', border: '1px solid #334155', cursor: 'pointer' }}>
          Null Space
        </button>
      </div>

      <svg width={400} height={400} style={{ background: '#0f172a', borderRadius: 10 }}>
        {[-3,-2,-1,1,2,3].map(i => (
          <g key={i}>
            <line x1={cx+i*scale} y1={20} x2={cx+i*scale} y2={380} stroke="#1e293b" strokeWidth={1}/>
            <line x1={20} y1={cy-i*scale} x2={380} y2={cy-i*scale} stroke="#1e293b" strokeWidth={1}/>
          </g>
        ))}
        <line x1={20} y1={cy} x2={380} y2={cy} stroke="#334155" strokeWidth={1}/>
        <line x1={cx} y1={20} x2={cx} y2={380} stroke="#334155" strokeWidth={1}/>

        {view === 'col' ? (
          <>
            {/* Col A = all of R², shade the whole plane lightly */}
            <rect x={20} y={20} width={360} height={360} fill="#1d4ed8" fillOpacity={0.08}/>
            <text x={310} y={50} fill="#60a5fa" fontSize={12}>col(A) = ℝ²</text>
            {cols.map((c,i) => <Arrow key={i} vec={c} color={colColors[i]} label={colLabels[i]}/>)}
          </>
        ) : (
          <>
            {/* Null space: direction [-2,1,0] (shown as [-2,1] in 2D) */}
            {(() => {
              const nd = [-2,1], ndLen = Math.sqrt(5)
              const ndu = [nd[0]/ndLen, nd[1]/ndLen]
              const t = 3
              const [x1,y1] = toSVG([-t*ndu[0],-t*ndu[1]])
              const [x2,y2] = toSVG([t*ndu[0],t*ndu[1]])
              return <>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c084fc" strokeWidth={2}/>
                <text x={x2+10} y={y2} fill="#c084fc" fontSize={12}>null(A)</text>
                <Arrow vec={nd} color="#a78bfa" label="[-2,1,0]"/>
              </>
            })()}
            <text x={25} y={40} fill="#64748b" fontSize={11}>null(A) = span&#123;[-2,1,0]&#125; in ℝ³</text>
            <text x={25} y={56} fill="#64748b" fontSize={11}>(shown: x₁-x₂ plane, x₃=0)</text>
          </>
        )}
        <circle cx={cx} cy={cy} r={3} fill="#94a3b8"/>
      </svg>
      <p style={{ color: '#64748b', fontSize: 12 }}>Matrix A = [[1,2,0],[0,0,1]] ∈ ℝ²ˣ³</p>
    </div>
  )
}

// ─── RankNullityViz ───────────────────────────────────────────────────────────

export function RankNullityViz() {
  const [rank, setRank] = useState(2)
  const n = 3
  const nullity = n - rank

  const examples = [
    { rank: 0, matrix: '[[0,0,0],[0,0,0]]', desc: 'Zero matrix — maps everything to zero' },
    { rank: 1, matrix: '[[1,2,3],[2,4,6]]', desc: 'All rows proportional — 1D column space' },
    { rank: 2, matrix: '[[1,0,1],[0,1,1]]', desc: '2 pivots — 2D column space, 1D null space' },
    { rank: 3, matrix: '[[1,0,0],[0,1,0],[0,0,1]]', desc: 'Full column rank — trivial null space' },
  ]

  const ex = examples[rank]

  return (
    <div className="my-6 flex flex-col items-center gap-4">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ color: '#94a3b8', fontSize: 13 }}>rank = {rank}</label>
        <input type="range" min={0} max={3} step={1} value={rank}
          onChange={e => setRank(Number(e.target.value))}
          style={{ width: 180 }}/>
      </div>

      {/* Stacked bar */}
      <div style={{ width: 300, height: 40, display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #334155' }}>
        <div style={{ width: `${(rank/n)*100}%`, background: '#3b82f6', transition: 'width 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {rank > 0 && <span style={{ color: '#fff', fontSize: 13 }}>rank={rank}</span>}
        </div>
        <div style={{ flex: 1, background: '#7c3aed', transition: 'flex 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {nullity > 0 && <span style={{ color: '#fff', fontSize: 13 }}>nullity={nullity}</span>}
        </div>
      </div>

      <div style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center' }}>
        <span style={{ color: '#60a5fa' }}>rank({rank})</span>
        <span> + </span>
        <span style={{ color: '#a78bfa' }}>nullity({nullity})</span>
        <span> = n = {n}</span>
      </div>

      <div style={{ background: '#1e293b', borderRadius: 8, padding: '12px 20px', maxWidth: 360, textAlign: 'center' }}>
        <p style={{ color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace', marginBottom: 6 }}>{ex.matrix}</p>
        <p style={{ color: '#94a3b8', fontSize: 12 }}>{ex.desc}</p>
      </div>
    </div>
  )
}
