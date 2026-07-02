'use client'

import { useState } from 'react'

// ── Hardware specs ─────────────────────────────────────────────────────────────

const HW = {
  'H100 SXM5': { flops: 989,  bw: 3.35, label: 'H100 SXM5' },
  'A100 SXM4': { flops: 312,  bw: 2.0,  label: 'A100 SXM4' },
  'A10G':      { flops: 31.2, bw: 0.6,  label: 'A10G'       },
} as const

type HWKey = keyof typeof HW

// ── Roofline Explainer ─────────────────────────────────────────────────────────

export function RooflineExplainer() {
  const [hwKey, setHwKey] = useState<HWKey>('H100 SXM5')
  const [intensity, setIntensity] = useState(30)   // FLOP/byte — the draggable workload
  const spec = HW[hwKey]
  const ridge = spec.flops / spec.bw               // FLOP/byte at ridge point

  const maxI = Math.ceil(ridge * 2.5 / 50) * 50    // round up to nice number
  const achievable = Math.min(intensity * spec.bw, spec.flops)
  const isMemBound = intensity < ridge

  // ── SVG geometry ──────────────────────────────────────────────────────────
  const W = 500
  const H = 200
  const PAD = { left: 56, right: 20, top: 20, bottom: 44 }
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const xS = (v: number) => PAD.left + (v / maxI) * plotW
  const yS = (v: number) => H - PAD.bottom - (v / spec.flops) * plotH

  // roofline path
  const pts = Array.from({ length: 120 }, (_, i) => {
    const x = (i / 119) * maxI
    const y = Math.min(x * spec.bw, spec.flops)
    return { x, y }
  })
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xS(p.x).toFixed(1)} ${yS(p.y).toFixed(1)}`).join(' ')

  // workload point
  const wx = xS(Math.min(intensity, maxI))
  const wy = yS(achievable)

  // ridge line
  const rx = xS(ridge)

  // y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(f => f * spec.flops)

  // x-axis ticks
  const xTickCount = 6
  const xTicks = Array.from({ length: xTickCount + 1 }, (_, i) => (i / xTickCount) * maxI)

  return (
    <div className="my-8 rounded-xl border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900">
      <h3 className="mt-0 mb-1 text-base font-semibold">The Roofline Model</h3>
      <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">
        Drag the <strong>arithmetic intensity</strong> slider to place a workload on the roofline. The roofline is the minimum of two ceilings: bandwidth × intensity, and peak compute.
      </p>

      {/* Hardware selector */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(Object.keys(HW) as HWKey[]).map(k => (
          <button
            key={k}
            onClick={() => setHwKey(k)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              hwKey === k
                ? 'bg-teal-500 text-white'
                : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Roofline chart */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mb-4" style={{ maxHeight: 220 }}>
        {/* Y gridlines */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={yS(v)} y2={yS(v)}
              stroke="currentColor" strokeOpacity={0.06} strokeWidth={1} />
            <text x={PAD.left - 5} y={yS(v) + 4} textAnchor="end" fontSize={8}
              fill="currentColor" fillOpacity={0.4}>
              {Math.round(v)}
            </text>
          </g>
        ))}

        {/* X gridlines */}
        {xTicks.map((v, i) => (
          <g key={i}>
            <line x1={xS(v)} x2={xS(v)} y1={PAD.top} y2={H - PAD.bottom}
              stroke="currentColor" strokeOpacity={0.06} strokeWidth={1} />
            <text x={xS(v)} y={H - PAD.bottom + 12} textAnchor="middle" fontSize={8}
              fill="currentColor" fillOpacity={0.4}>
              {Math.round(v)}
            </text>
          </g>
        ))}

        {/* Axes */}
        <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={H - PAD.bottom}
          stroke="currentColor" strokeOpacity={0.25} strokeWidth={1.5} />
        <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom}
          stroke="currentColor" strokeOpacity={0.25} strokeWidth={1.5} />

        {/* Axis labels */}
        <text x={W / 2} y={H - 2} textAnchor="middle" fontSize={9} fill="currentColor" fillOpacity={0.45}>
          Arithmetic intensity (FLOP / byte)
        </text>
        <text x={11} y={H / 2} textAnchor="middle" fontSize={9} fill="currentColor" fillOpacity={0.45}
          transform={`rotate(-90, 11, ${H / 2})`}>
          TFLOP/s
        </text>

        {/* Bandwidth slope region label */}
        <text x={xS(ridge * 0.28)} y={yS(ridge * 0.28 * spec.bw) - 10}
          textAnchor="middle" fontSize={8} fill="#f97316" fillOpacity={0.7}
          transform={`rotate(-38, ${xS(ridge * 0.28)}, ${yS(ridge * 0.28 * spec.bw) - 10})`}>
          memory-bound
        </text>

        {/* Compute flat region label */}
        <text x={xS(ridge * 1.6)} y={yS(spec.flops) - 8}
          textAnchor="middle" fontSize={8} fill="#8b5cf6" fillOpacity={0.7}>
          compute-bound
        </text>

        {/* Roofline */}
        <path d={path} fill="none" stroke="#14b8a6" strokeWidth={2.5} />

        {/* Bandwidth line extended (dashed) */}
        <line
          x1={xS(0)} y1={yS(0)}
          x2={xS(maxI)} y2={yS(maxI * spec.bw)}
          stroke="#f97316" strokeWidth={1} strokeDasharray="5 3" strokeOpacity={0.25}
        />

        {/* Compute ceiling (dashed) */}
        <line
          x1={PAD.left} y1={yS(spec.flops)}
          x2={W - PAD.right} y2={yS(spec.flops)}
          stroke="#8b5cf6" strokeWidth={1} strokeDasharray="5 3" strokeOpacity={0.25}
        />

        {/* Ridge point */}
        <line x1={rx} x2={rx} y1={PAD.top} y2={H - PAD.bottom}
          stroke="#14b8a6" strokeWidth={1} strokeDasharray="4 3" strokeOpacity={0.5} />
        <text x={rx + 3} y={PAD.top + 11} fontSize={8} fill="#14b8a6" fillOpacity={0.9}>
          ridge = {ridge.toFixed(0)} FLOP/B
        </text>

        {/* Workload point */}
        <circle cx={wx} cy={wy} r={7}
          fill={isMemBound ? '#f97316' : '#8b5cf6'}
          stroke="white" strokeWidth={1.5} />

        {/* Drop line from point to axis */}
        <line x1={wx} x2={wx} y1={wy} y2={H - PAD.bottom}
          stroke={isMemBound ? '#f97316' : '#8b5cf6'}
          strokeWidth={1} strokeDasharray="3 2" strokeOpacity={0.5} />
      </svg>

      {/* Slider */}
      <div className="mb-5">
        <label className="mb-1 flex justify-between text-sm font-medium">
          <span>Arithmetic intensity</span>
          <span className="font-mono text-teal-600 dark:text-teal-400">{intensity} FLOP/byte</span>
        </label>
        <input
          type="range" min={1} max={maxI} step={1} value={intensity}
          onChange={e => setIntensity(Number(e.target.value))}
          className="w-full accent-teal-500"
        />
        <div className="mt-1 flex justify-between text-xs text-ink-400 dark:text-ink-500">
          <span>1</span>
          <span>ridge = {ridge.toFixed(0)}</span>
          <span>{maxI}</span>
        </div>
      </div>

      {/* Status panel */}
      <div className={`rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm
        ${isMemBound
          ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
          : 'bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800'
        }`}>
        <div>
          <div className={`text-xs font-semibold mb-1 ${isMemBound ? 'text-amber-600 dark:text-amber-400' : 'text-violet-600 dark:text-violet-400'}`}>
            Regime: {isMemBound ? 'MEMORY-BOUND' : 'COMPUTE-BOUND'}
          </div>
          <div className="font-mono text-xs space-y-1 text-ink-700 dark:text-ink-200">
            <div>intensity = {intensity} FLOP/B</div>
            <div>ridge     = {ridge.toFixed(0)} FLOP/B</div>
            <div className={isMemBound ? 'text-amber-700 dark:text-amber-300 font-semibold' : ''}>
              {isMemBound ? `bottleneck: bandwidth (${spec.bw} TB/s)` : `bottleneck: compute (${spec.flops} TFLOP/s)`}
            </div>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold mb-1 text-ink-500 dark:text-ink-400">Achievable throughput</div>
          <div className="font-mono text-xs space-y-1 text-ink-700 dark:text-ink-200">
            <div>= min(I × BW, Peak)</div>
            <div>= min({intensity} × {spec.bw}, {spec.flops})</div>
            <div>= min({(intensity * spec.bw).toFixed(0)}, {spec.flops})</div>
            <div className="font-semibold text-teal-600 dark:text-teal-400">
              = {achievable.toFixed(0)} TFLOP/s ({(achievable / spec.flops * 100).toFixed(0)}% of peak)
            </div>
          </div>
        </div>
      </div>

      {/* Hardware specs */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-400 dark:text-ink-500 font-mono">
        <span>{spec.label}</span>
        <span>Peak: {spec.flops} TFLOP/s fp16</span>
        <span>BW: {spec.bw} TB/s</span>
        <span>Ridge: {ridge.toFixed(0)} FLOP/byte</span>
      </div>
    </div>
  )
}

// ── LLM Operation Intensity Table ─────────────────────────────────────────────

const OPS = [
  {
    op: 'Decode — single token, bs=1',
    regime: 'Memory-bound',
    intensity: '~1 FLOP/B',
    why: 'Load all weights once per token; 1 token × 2 FLOP/param ÷ 2 bytes/param = 1',
    color: 'amber',
  },
  {
    op: 'Decode — batched, bs=64',
    regime: 'Memory-bound →',
    intensity: '~64 FLOP/B',
    why: '64 tokens share one weight load; intensity scales linearly with batch size',
    color: 'amber',
  },
  {
    op: 'Prefill — long prompt, n=2048',
    regime: 'Compute-bound',
    intensity: '~2048 FLOP/B',
    why: 'Attention: 2n² ops over 2n×d_h bytes — intensity ≈ n (sequence length)',
    color: 'violet',
  },
  {
    op: 'FlashAttention tile (SRAM)',
    regime: 'Compute-bound',
    intensity: 'Very high',
    why: 'Tile fits in SRAM — reuses the same bytes many times, no HBM round-trip',
    color: 'violet',
  },
  {
    op: 'MLA KV decompress (DeepSeek-V3)',
    regime: 'Memory-bound (less so)',
    intensity: 'Higher than MHA',
    why: 'Smaller KV footprint per byte loaded → more FLOP per byte vs standard MHA',
    color: 'teal',
  },
  {
    op: 'LoRA adapter (rank 16)',
    regime: 'Memory-bound',
    intensity: 'Low',
    why: 'Tiny adapter matrices → very few FLOP, but still load the base weights',
    color: 'amber',
  },
]

const COLOR: Record<string, string> = {
  amber:  'bg-amber-50  dark:bg-amber-950/20  border-amber-200  dark:border-amber-800  text-amber-700  dark:text-amber-300',
  violet: 'bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300',
  teal:   'bg-teal-50   dark:bg-teal-950/20   border-teal-200   dark:border-teal-800   text-teal-700   dark:text-teal-300',
}

export function LLMOperationIntensity() {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div className="my-8 rounded-xl border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900">
      <h3 className="mt-0 mb-1 text-base font-semibold">Arithmetic Intensity of LLM Operations</h3>
      <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">
        Click any row to see why that operation lands where it does on the roofline.
      </p>
      <div className="space-y-2">
        {OPS.map((op, i) => (
          <div
            key={i}
            onClick={() => setExpanded(expanded === i ? null : i)}
            className={`cursor-pointer rounded-lg border px-4 py-3 transition-colors ${COLOR[op.color]}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-sm font-semibold text-ink-800 dark:text-ink-100">{op.op}</span>
                <span className="ml-3 text-xs font-mono text-ink-500 dark:text-ink-400">{op.intensity}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`rounded px-2 py-0.5 text-xs font-semibold border ${COLOR[op.color]}`}>
                  {op.regime}
                </span>
                <span className="text-xs text-ink-400">{expanded === i ? '−' : '+'}</span>
              </div>
            </div>
            {expanded === i && (
              <p className="mt-2 text-xs text-ink-600 dark:text-ink-300 font-mono leading-relaxed">
                {op.why}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Decode Batch Roofline ──────────────────────────────────────────────────────

export function DecodeBatchRoofline() {
  const [modelB, setModelB] = useState(70)
  const [hwKey, setHwKey] = useState<HWKey>('H100 SXM5')
  const spec = HW[hwKey]
  const ridge = spec.flops / spec.bw

  const batchSizes = [1, 2, 4, 8, 16, 32, 64, 128, 256]

  // For each batch size: arithmetic intensity ≈ batch_size (FLOP/byte)
  // time to decode one step = weight_bytes / bw  (if mem-bound)
  //                         = 2*P*B FLOP / peak_flops  (if compute-bound)
  const weightBytes = modelB * 1e9 * 2 // fp16

  const rows = batchSizes.map(bs => {
    const intensity = bs
    const isMemBound = intensity < ridge
    const timeMs = isMemBound
      ? (weightBytes / (spec.bw * 1e12)) * 1000          // bandwidth limited
      : (2 * modelB * 1e9 * bs) / (spec.flops * 1e12) * 1000  // compute limited
    const tokensPerSec = bs / (timeMs / 1000)
    return { bs, intensity, isMemBound, timeMs, tokensPerSec }
  })

  const maxTok = Math.max(...rows.map(r => r.tokensPerSec))

  return (
    <div className="my-8 rounded-xl border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900">
      <h3 className="mt-0 mb-1 text-base font-semibold">Decode Throughput vs Batch Size</h3>
      <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">
        Decode arithmetic intensity ≈ batch size. Throughput grows linearly while memory-bound; flattens at the ridge point.
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {(Object.keys(HW) as HWKey[]).map(k => (
          <button key={k} onClick={() => setHwKey(k)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              hwKey === k ? 'bg-teal-500 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200'
            }`}>
            {k}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <label className="mb-1 flex justify-between text-sm font-medium">
          <span>Model size</span>
          <span className="font-mono">{modelB}B params</span>
        </label>
        <input type="range" min={7} max={405} step={1} value={modelB}
          onChange={e => setModelB(Number(e.target.value))}
          className="w-full accent-teal-500" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="text-ink-400 dark:text-ink-500 border-b border-ink-100 dark:border-ink-800">
              <th className="py-2 text-left">Batch</th>
              <th className="py-2 text-left">Intensity</th>
              <th className="py-2 text-left">Regime</th>
              <th className="py-2 text-left">Latency (ms)</th>
              <th className="py-2 text-left">Throughput</th>
              <th className="py-2 text-left pl-2">Utilisation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.bs}
                className={`border-b border-ink-50 dark:border-ink-800/50 ${
                  r.isMemBound ? '' : 'bg-violet-50/40 dark:bg-violet-950/10'
                }`}>
                <td className="py-1.5 pr-4 font-semibold text-ink-800 dark:text-ink-100">{r.bs}</td>
                <td className="py-1.5 pr-4">{r.intensity} F/B</td>
                <td className={`py-1.5 pr-4 ${r.isMemBound ? 'text-amber-600 dark:text-amber-400' : 'text-violet-600 dark:text-violet-400'}`}>
                  {r.isMemBound ? 'mem-bound' : 'compute-bound'}
                </td>
                <td className="py-1.5 pr-4">{r.timeMs.toFixed(1)}</td>
                <td className="py-1.5 pr-4">{r.tokensPerSec.toFixed(0)} tok/s</td>
                <td className="py-1.5 pl-2 w-36">
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-2 rounded bg-ink-100 dark:bg-ink-800">
                      <div
                        className={`h-2 rounded ${r.isMemBound ? 'bg-amber-400' : 'bg-violet-500'}`}
                        style={{ width: `${(r.tokensPerSec / maxTok) * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-400 dark:text-ink-500">
        Ridge point for {spec.label}: ~{ridge.toFixed(0)} FLOP/byte ≈ batch size {Math.round(ridge)}.
        Below this batch size, adding more GPUs does not help — the bottleneck is memory bandwidth, not compute.
      </p>
    </div>
  )
}
