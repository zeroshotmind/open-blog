'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import React from 'react'

// ─── LeastSquaresViz ──────────────────────────────────────────────────────────

export function LeastSquaresViz() {
  const svgRef = useRef<SVGSVGElement | null>(null) as React.RefObject<SVGSVGElement | null>
  const [points, setPoints] = useState([
    [1, 2.1], [3, 3.9], [5, 5.2], [7, 6.8], [9, 8.9]
  ])
  const [dragging, setDragging] = useState<number | null>(null)

  const padL = 50, padR = 20, padT = 20, padB = 50
  const W = 400, H = 400
  const plotW = W - padL - padR, plotH = H - padT - padB
  const xMin = 0, xMax = 10, yMin = 0, yMax = 12

  const toSVG = (x: number, y: number): [number, number] => [
    padL + (x - xMin) / (xMax - xMin) * plotW,
    padT + (1 - (y - yMin) / (yMax - yMin)) * plotH
  ]
  const fromSVG = (sx: number, sy: number): [number, number] => [
    xMin + (sx - padL) / plotW * (xMax - xMin),
    yMin + (1 - (sy - padT) / plotH) * (yMax - yMin)
  ]

  // Least squares: y = b0 + b1*x
  const n = points.length
  const sumX = points.reduce((a, p) => a + p[0], 0)
  const sumY = points.reduce((a, p) => a + p[1], 0)
  const sumXY = points.reduce((a, p) => a + p[0]*p[1], 0)
  const sumX2 = points.reduce((a, p) => a + p[0]*p[0], 0)
  const denom = n*sumX2 - sumX*sumX
  const b1 = denom !== 0 ? (n*sumXY - sumX*sumY) / denom : 0
  const b0 = (sumY - b1*sumX) / n

  const predict = (x: number) => b0 + b1*x
  const ssr = points.reduce((a, p) => a + (p[1] - predict(p[0]))**2, 0)

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (dragging === null) return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const [x, y] = fromSVG(e.clientX - rect.left, e.clientY - rect.top)
    setPoints(pts => pts.map((p, i) => i === dragging ? [
      Math.max(xMin, Math.min(xMax, x)),
      Math.max(yMin, Math.min(yMax, y))
    ] : p))
  }, [dragging])

  // Line endpoints
  const [lx1, ly1] = toSVG(xMin, predict(xMin))
  const [lx2, ly2] = toSVG(xMax, predict(xMax))

  return (
    <div className="my-6 flex flex-col items-center gap-3">
      <svg ref={svgRef} width={W} height={H}
        style={{ background: '#0f172a', borderRadius: 10, cursor: dragging !== null ? 'grabbing' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setDragging(null)}
        onMouseLeave={() => setDragging(null)}>
        {/* Grid */}
        {[2,4,6,8,10].map(v => {
          const [sx] = toSVG(v, 0)
          const [,sy] = toSVG(0, v)
          return <g key={v}>
            <line x1={sx} y1={padT} x2={sx} y2={padT+plotH} stroke="#1e293b" strokeWidth={1}/>
            <line x1={padL} y1={sy} x2={padL+plotW} y2={sy} stroke="#1e293b" strokeWidth={1}/>
            <text x={sx} y={padT+plotH+16} fill="#475569" fontSize={11} textAnchor="middle">{v}</text>
            <text x={padL-8} y={sy+4} fill="#475569" fontSize={11} textAnchor="end">{v}</text>
          </g>
        })}
        <line x1={padL} y1={padT+plotH} x2={padL+plotW} y2={padT+plotH} stroke="#334155" strokeWidth={1}/>
        <line x1={padL} y1={padT} x2={padL} y2={padT+plotH} stroke="#334155" strokeWidth={1}/>

        {/* Fitted line */}
        <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke="#60a5fa" strokeWidth={2}/>

        {/* Residuals */}
        {points.map((p, i) => {
          const [sx, sy] = toSVG(p[0], p[1])
          const [, spy] = toSVG(p[0], predict(p[0]))
          return <line key={i} x1={sx} y1={sy} x2={sx} y2={spy}
            stroke="#f87171" strokeWidth={1.5} strokeDasharray="4,3"/>
        })}

        {/* Points */}
        {points.map((p, i) => {
          const [sx, sy] = toSVG(p[0], p[1])
          return <circle key={i} cx={sx} cy={sy} r={7} fill="#4ade80"
            style={{ cursor: 'grab' }}
            onMouseDown={() => setDragging(i)}/>
        })}
      </svg>
      <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>
        ŷ = {b0.toFixed(2)} + {b1.toFixed(2)}x &nbsp;|&nbsp; SSR = {ssr.toFixed(2)}
      </div>
      <p style={{ color: '#64748b', fontSize: 12 }}>Drag points to see the least squares fit update in real time</p>
    </div>
  )
}

// ─── ProjectionLeastSquaresViz ────────────────────────────────────────────────

export function ProjectionLeastSquaresViz() {
  const [viewIdx, setViewIdx] = useState(0)

  const W = 400, H = 360
  const cx = 200, cy = 220

  // Isometric-ish views: rotate the 3D scene around y axis
  // We show: column space plane, b vector, projection Ax_hat, residual
  // Using a simple isometric projection

  // 3D points, projected with different yaw angles
  const yaws = [20, 50, 80] // degrees
  const yaw = yaws[viewIdx] * Math.PI / 180

  const project3D = (x: number, y: number, z: number): [number, number] => {
    // Rotate around Y axis by yaw
    const rx = x * Math.cos(yaw) + z * Math.sin(yaw)
    const ry = y
    const rz = -x * Math.sin(yaw) + z * Math.cos(yaw)
    // Simple isometric: tilt forward slightly
    const pitch = 30 * Math.PI / 180
    const screenX = rx
    const screenY = -ry * Math.cos(pitch) + rz * Math.sin(pitch)
    return [cx + screenX * 60, cy + screenY * 60]
  }

  // Plane corners (col A in R³)
  const planeCorners = [
    [2, 0, 2], [-2, 0, 2], [-2, 0, -2], [2, 0, -2]
  ] as [number,number,number][]

  // b vector (above the plane)
  const b = [1, 2.5, 0.5]
  // Projection Ax_hat = [1, 0, 0.5] (on the plane, y=0)
  const Axhat = [1, 0, 0.5]
  // Residual = b - Axhat = [0, 2.5, 0]
  const res = [b[0]-Axhat[0], b[1]-Axhat[1], b[2]-Axhat[2]]

  const [bx, by] = project3D(b[0], b[1], b[2])
  const [ax, ay] = project3D(Axhat[0], Axhat[1], Axhat[2])
  const [ox, oy] = project3D(0, 0, 0)

  // Right angle marker between residual and plane
  const ra = 0.15
  const [rx1, ry1] = project3D(Axhat[0]+ra, Axhat[1], Axhat[2])
  const [rx2, ry2] = project3D(Axhat[0]+ra, Axhat[1]+ra, Axhat[2])
  const [rx3, ry3] = project3D(Axhat[0], Axhat[1]+ra, Axhat[2])

  return (
    <div className="my-6 flex flex-col items-center gap-3">
      <svg width={W} height={H} style={{ background: '#0f172a', borderRadius: 10 }}>
        {/* Plane */}
        {(() => {
          const pts = planeCorners.map(([x,y,z]) => project3D(x,y,z))
          return <polygon
            points={pts.map(([px,py]) => `${px},${py}`).join(' ')}
            fill="#1e3a5f" fillOpacity={0.6} stroke="#3b82f6" strokeWidth={1}/>
        })()}
        <text x={project3D(2.3,0,-1.5)[0]} y={project3D(2.3,0,-1.5)[1]}
          fill="#60a5fa" fontSize={12}>col(A)</text>

        {/* Origin */}
        <circle cx={ox} cy={oy} r={3} fill="#94a3b8"/>

        {/* Arrow: origin to Axhat */}
        {(() => {
          const dx=ax-ox, dy=ay-oy, len=Math.sqrt(dx*dx+dy*dy)
          const ux=dx/len, uy=dy/len
          const hx=ax-ux*8, hy=ay-uy*8
          return <g>
            <line x1={ox} y1={oy} x2={ax} y2={ay} stroke="#60a5fa" strokeWidth={2}/>
            <polygon points={`${ax},${ay} ${hx-uy*4},${hy+ux*4} ${hx+uy*4},${hy-ux*4}`} fill="#60a5fa"/>
            <text x={ax+8} y={ay+4} fill="#60a5fa" fontSize={11}>Ax̂</text>
          </g>
        })()}

        {/* Arrow: origin to b */}
        {(() => {
          const dx=bx-ox, dy=by-oy, len=Math.sqrt(dx*dx+dy*dy)
          const ux=dx/len, uy=dy/len
          const hx=bx-ux*8, hy=by-uy*8
          return <g>
            <line x1={ox} y1={oy} x2={bx} y2={by} stroke="#4ade80" strokeWidth={2}/>
            <polygon points={`${bx},${by} ${hx-uy*4},${hy+ux*4} ${hx+uy*4},${hy-ux*4}`} fill="#4ade80"/>
            <text x={bx+8} y={by} fill="#4ade80" fontSize={11}>b</text>
          </g>
        })()}

        {/* Residual: Axhat to b (dashed) */}
        <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#fb923c" strokeWidth={2} strokeDasharray="5,3"/>
        <text x={(ax+bx)/2+8} y={(ay+by)/2} fill="#fb923c" fontSize={11}>r = b−Ax̂</text>

        {/* Right angle marker */}
        <polyline points={`${rx1},${ry1} ${rx2},${ry2} ${rx3},${ry3}`}
          fill="none" stroke="#fbbf24" strokeWidth={1.5}/>
      </svg>

      <div className="flex gap-3">
        {yaws.map((_, i) => (
          <button key={i} onClick={() => setViewIdx(i)}
            style={{ padding: '6px 14px', borderRadius: 6,
              background: viewIdx===i ? '#1d4ed8' : '#1e293b',
              color: '#e2e8f0', border: '1px solid #334155', cursor: 'pointer' }}>
            View {i+1}
          </button>
        ))}
      </div>
      <p style={{ color: '#64748b', fontSize: 12 }}>
        The residual r = b − Ax̂ is perpendicular to col(A). Switch views to see the geometry.
      </p>
    </div>
  )
}

// ─── NormalEquationsViz ───────────────────────────────────────────────────────

export function NormalEquationsViz() {
  // Model: y = β·x (through origin, 1 parameter)
  const data = [[1, 1.8], [2, 4.2], [3, 5.9], [4, 8.1], [5, 9.7]]

  // β̂ = Σ(xᵢyᵢ) / Σ(xᵢ²)
  const betaHat = data.reduce((a,[x,y])=>a+x*y,0) / data.reduce((a,[x])=>a+x*x,0)

  const [beta, setBeta] = useState(betaHat)

  const rss = (b: number) => data.reduce((a,[x,y])=>a+(y-b*x)**2,0)
  const betaHatVal = betaHat

  // Parabola plot region
  const W = 400, H_top = 200, H_bot = 220, H = H_top + H_bot
  const padL = 50, padR = 20, padT = 20, padB = 30
  const bMin = 0.5, bMax = 3.0
  const rssMin = rss(betaHatVal)
  const rssMax = Math.max(...[bMin, bMax].map(rss)) * 1.05

  const toParabolaX = (b: number) => padL + (b-bMin)/(bMax-bMin)*(W-padL-padR)
  const toParabolaY = (r: number) => padT + (1-(r-rssMin)/(rssMax-rssMin))*(H_top-padT-padB)

  // Scatter plot
  const spPadL=50, spPadR=20, spPadT=H_top+20, spPadB=20
  const spW=W-spPadL-spPadR, spH=H_bot-40
  const xMin=0,xMax=6,yMin=0,yMax=12
  const toScatter = (x:number,y:number):[number,number] => [
    spPadL+(x-xMin)/(xMax-xMin)*spW,
    spPadT+(1-(y-yMin)/(yMax-yMin))*spH
  ]

  // Parabola points
  const parabola = Array.from({length:80},(_,i)=>{
    const b = bMin + (i/79)*(bMax-bMin)
    return [toParabolaX(b), toParabolaY(rss(b))]
  })

  const betaX = toParabolaX(beta)
  const betaY = toParabolaY(rss(beta))
  const betaHatX = toParabolaX(betaHatVal)
  const betaHatY = toParabolaY(rssMin)

  return (
    <div className="my-6 flex flex-col items-center gap-3">
      <svg width={W} height={H} style={{ background: '#0f172a', borderRadius: 10 }}>
        {/* ── Parabola panel ── */}
        {/* Grid lines */}
        {[0.5,1,1.5,2,2.5].map(b => {
          const x = toParabolaX(b)
          return <g key={b}>
            <line x1={x} y1={padT} x2={x} y2={H_top-padB} stroke="#1e293b" strokeWidth={1}/>
            <text x={x} y={H_top-padB+14} fill="#475569" fontSize={10} textAnchor="middle">{b}</text>
          </g>
        })}
        <line x1={padL} y1={padT} x2={padL} y2={H_top-padB} stroke="#334155" strokeWidth={1}/>
        <line x1={padL} y1={H_top-padB} x2={W-padR} y2={H_top-padB} stroke="#334155" strokeWidth={1}/>
        <text x={W/2} y={H_top-padB+28} fill="#64748b" fontSize={11} textAnchor="middle">β</text>
        <text x={padL-8} y={padT+6} fill="#64748b" fontSize={10} textAnchor="end">RSS</text>

        {/* Parabola */}
        <polyline points={parabola.map(([x,y])=>`${x},${y}`).join(' ')}
          fill="none" stroke="#4ade80" strokeWidth={2}/>

        {/* Minimum marker */}
        <line x1={betaHatX} y1={padT} x2={betaHatX} y2={H_top-padB}
          stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="4,3"/>
        <circle cx={betaHatX} cy={betaHatY} r={5} fill="#fbbf24"/>
        <text x={betaHatX+6} y={betaHatY-6} fill="#fbbf24" fontSize={11}>β̂={betaHatVal.toFixed(2)}</text>

        {/* Current beta marker */}
        <circle cx={betaX} cy={betaY} r={6} fill="#f87171" stroke="#fff" strokeWidth={1.5}/>
        <line x1={betaX} y1={betaY} x2={betaX} y2={H_top-padB}
          stroke="#f87171" strokeWidth={1} strokeDasharray="3,3"/>

        {/* ── Scatter plot panel ── */}
        {[2,4,6,8,10].map(v=>{
          const [sx]=toScatter(v/2,0); const [,sy]=toScatter(0,v)
          return <g key={v}>
            <line x1={sx} y1={spPadT} x2={sx} y2={spPadT+spH} stroke="#1e293b" strokeWidth={1}/>
            <line x1={spPadL} y1={sy} x2={spPadL+spW} y2={sy} stroke="#1e293b" strokeWidth={1}/>
          </g>
        })}
        <line x1={spPadL} y1={spPadT} x2={spPadL} y2={spPadT+spH} stroke="#334155" strokeWidth={1}/>
        <line x1={spPadL} y1={spPadT+spH} x2={spPadL+spW} y2={spPadT+spH} stroke="#334155" strokeWidth={1}/>

        {/* Fitted line */}
        {(()=>{
          const [lx1,ly1]=toScatter(xMin, beta*xMin)
          const [lx2,ly2]=toScatter(xMax, beta*xMax)
          return <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke="#f87171" strokeWidth={2}/>
        })()}
        {/* Optimal line */}
        {(()=>{
          const [lx1,ly1]=toScatter(xMin, betaHatVal*xMin)
          const [lx2,ly2]=toScatter(xMax, betaHatVal*xMax)
          return <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="5,3"/>
        })()}

        {/* Data points + residuals */}
        {data.map(([x,y],i)=>{
          const [sx,sy]=toScatter(x,y)
          const [,spy]=toScatter(x,beta*x)
          return <g key={i}>
            <line x1={sx} y1={sy} x2={sx} y2={spy} stroke="#fb923c" strokeWidth={1.5} strokeDasharray="3,2"/>
            <circle cx={sx} cy={sy} r={5} fill="#4ade80"/>
          </g>
        })}

        <text x={W/2} y={H-6} fill="#64748b" fontSize={11} textAnchor="middle">
          β={beta.toFixed(2)} | RSS={rss(beta).toFixed(2)}
        </text>
      </svg>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ color: '#94a3b8', fontSize: 13 }}>β = {beta.toFixed(2)}</label>
        <input type="range" min={bMin} max={bMax} step={0.01} value={beta}
          onChange={e => setBeta(Number(e.target.value))}
          style={{ width: 200 }}/>
      </div>
      <p style={{ color: '#64748b', fontSize: 12 }}>
        Drag slider to change β and see RSS(β). Yellow dashed = optimal β̂ = {betaHatVal.toFixed(2)}.
      </p>
    </div>
  )
}
