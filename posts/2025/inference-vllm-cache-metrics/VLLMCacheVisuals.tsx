'use client'

import { useState, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Block {
  id: number
  status: 'free' | 'used' | 'cached' | 'evicting'
  hash?: string       // prefix-cache hash (only full blocks)
  seqId?: number      // which sequence occupies it
  lruAge?: number     // lower = older = evicted first
  tokens?: number[]   // token IDs in this block
}

// ── KV Cache Usage Simulator ───────────────────────────────────────────────────

const BLOCK_SIZE = 16   // tokens per block
const NUM_BLOCKS = 32

function hashTokens(prev: string | null, tokens: number[]): string {
  const key = `${prev ?? 'null'}|${tokens.join(',')}`
  // simple djb2-style hash for demo
  let h = 5381
  for (let i = 0; i < key.length; i++) h = ((h << 5) + h) ^ key.charCodeAt(i)
  return (h >>> 0).toString(16).slice(0, 6)
}

function buildBlocks(): Block[] {
  return Array.from({ length: NUM_BLOCKS }, (_, i) => ({ id: i, status: 'free' as const }))
}

// Build block layout from sequences
interface Seq {
  id: number
  tokens: number[]
  color: string
  label: string
}

const COLORS = [
  'bg-blue-400', 'bg-green-400', 'bg-violet-400', 'bg-amber-400', 'bg-pink-400',
]
const COLORS_BORDER = [
  'border-blue-400', 'border-green-400', 'border-violet-400', 'border-amber-400', 'border-pink-400',
]
const COLORS_TEXT = [
  'text-blue-600 dark:text-blue-300',
  'text-green-600 dark:text-green-300',
  'text-violet-600 dark:text-violet-300',
  'text-amber-600 dark:text-amber-300',
  'text-pink-600 dark:text-pink-300',
]

export function KVCacheUsageSimulator() {
  const [seqs, setSeqs] = useState<Seq[]>([
    { id: 0, tokens: Array.from({ length: 48 }, (_, i) => i + 1), color: COLORS[0], label: 'Seq A' },
  ])
  const [nextSeqId, setNextSeqId] = useState(1)
  const [selected, setSelected] = useState<number | null>(null)

  // Assign blocks to sequences in order
  const blocks: Block[] = buildBlocks()
  let blockIdx = 0
  for (const seq of seqs) {
    const numBlocks = Math.ceil(seq.tokens.length / BLOCK_SIZE)
    for (let b = 0; b < numBlocks && blockIdx < NUM_BLOCKS; b++, blockIdx++) {
      const start = b * BLOCK_SIZE
      const sliceTokens = seq.tokens.slice(start, start + BLOCK_SIZE)
      blocks[blockIdx] = {
        id: blockIdx,
        status: 'used',
        seqId: seq.id,
        tokens: sliceTokens,
      }
    }
  }

  const usedCount = blocks.filter(b => b.status === 'used').length
  const freeCount = NUM_BLOCKS - usedCount
  const usagePercent = ((usedCount / NUM_BLOCKS) * 100).toFixed(1)

  const addSeq = () => {
    const tokenCount = [32, 48, 64, 80][Math.floor(Math.random() * 4)]
    const offset = nextSeqId * 100
    setSeqs(s => [...s, {
      id: nextSeqId,
      tokens: Array.from({ length: tokenCount }, (_, i) => offset + i + 1),
      color: COLORS[nextSeqId % COLORS.length],
      label: `Seq ${String.fromCharCode(65 + nextSeqId)}`,
    }])
    setNextSeqId(n => n + 1)
  }

  const removeSeq = (id: number) => {
    setSeqs(s => s.filter(seq => seq.id !== id))
    if (selected === id) setSelected(null)
  }

  return (
    <div className="my-8 rounded-xl border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900">
      <h3 className="mt-0 mb-1 text-base font-semibold">KV Cache Usage</h3>
      <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">
        Each cell is one <strong>block</strong> ({BLOCK_SIZE} tokens). The pool has {NUM_BLOCKS} blocks total. Usage = used ÷ total.
      </p>

      {/* Usage bar */}
      <div className="mb-5">
        <div className="mb-1 flex justify-between text-xs font-mono">
          <span>{usedCount} used / {NUM_BLOCKS} total</span>
          <span className={parseFloat(usagePercent) > 80 ? 'text-red-500 font-semibold' : 'text-teal-600 dark:text-teal-400'}>
            {usagePercent}% usage
          </span>
        </div>
        <div className="h-3 w-full rounded bg-ink-100 dark:bg-ink-800">
          <div className="h-3 rounded bg-teal-500 transition-all duration-300"
            style={{ width: `${usagePercent}%` }} />
        </div>
        <div className="mt-1 text-xs font-mono text-ink-400 dark:text-ink-500">
          gpu_cache_usage_perc = 1 - ({freeCount} / {NUM_BLOCKS}) = {(usedCount / NUM_BLOCKS).toFixed(3)}
        </div>
      </div>

      {/* Block grid */}
      <div className="mb-5 grid gap-1" style={{ gridTemplateColumns: `repeat(${NUM_BLOCKS / 4}, 1fr)` }}>
        {blocks.map(b => {
          const seq = b.seqId !== undefined ? seqs.find(s => s.id === b.seqId) : undefined
          const isSelected = b.seqId !== undefined && b.seqId === selected
          return (
            <div
              key={b.id}
              onClick={() => b.seqId !== undefined && setSelected(b.seqId === selected ? null : b.seqId)}
              className={`h-8 rounded border cursor-pointer transition-all text-center flex items-center justify-center text-xs font-mono
                ${b.status === 'free'
                  ? 'bg-ink-50 dark:bg-ink-800 border-ink-200 dark:border-ink-700 text-ink-300'
                  : `${seq?.color ?? ''} border-transparent text-white font-semibold`
                }
                ${isSelected ? 'ring-2 ring-offset-1 ring-ink-600' : ''}
              `}
              title={b.status === 'free' ? `Block ${b.id}: free` : `Block ${b.id}: ${seq?.label}, tokens ${b.tokens?.[0]}–${b.tokens?.[b.tokens.length - 1]}`}
            >
              {b.id}
            </div>
          )
        })}
      </div>

      {/* Sequence list */}
      <div className="mb-4 space-y-2">
        {seqs.map((seq, idx) => {
          const numBlocks = Math.ceil(seq.tokens.length / BLOCK_SIZE)
          const partialTokens = seq.tokens.length % BLOCK_SIZE
          return (
            <div key={seq.id}
              onClick={() => setSelected(seq.id === selected ? null : seq.id)}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors
                ${selected === seq.id ? 'border-ink-400 dark:border-ink-500' : 'border-ink-100 dark:border-ink-800'}
              `}>
              <div className={`h-3 w-3 rounded-full ${seq.color} flex-shrink-0`} />
              <span className={`text-sm font-semibold ${COLORS_TEXT[idx % COLORS_TEXT.length]}`}>{seq.label}</span>
              <span className="text-xs text-ink-500 dark:text-ink-400 font-mono">
                {seq.tokens.length} tokens → {numBlocks} blocks
                {partialTokens > 0 ? ` (last block: ${partialTokens}/${BLOCK_SIZE} full)` : ' (all full)'}
              </span>
              <button onClick={e => { e.stopPropagation(); removeSeq(seq.id) }}
                className="ml-auto text-xs text-ink-400 hover:text-red-500 px-2">✕</button>
            </div>
          )
        })}
      </div>

      <button onClick={addSeq}
        disabled={usedCount >= NUM_BLOCKS - 4}
        className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        + Add sequence
      </button>

      <div className="mt-4 rounded-lg bg-ink-50 dark:bg-ink-800 p-3 font-mono text-xs text-ink-600 dark:text-ink-300">
        <span className="text-ink-400">vLLM formula:</span><br />
        gpu_cache_usage = 1.0 - (get_num_free_gpu_blocks() / get_num_total_gpu_blocks())<br />
        = 1.0 - ({freeCount} / {NUM_BLOCKS}) = <strong>{(usedCount / NUM_BLOCKS).toFixed(4)}</strong>
      </div>
    </div>
  )
}

// ── Prefix Cache Demo ──────────────────────────────────────────────────────────

interface PrefixBlock {
  id: number
  hash: string
  prevHash: string | null
  tokens: number[]
  hit: boolean
  refCount: number
  lruAge: number
}

const SYSTEM_PROMPT_TOKENS = Array.from({ length: 32 }, (_, i) => i + 1)  // tokens 1-32 = system prompt
const BLOCK_SZ = 16

// Predefined prompts that share a system prefix
const DEMO_PROMPTS = [
  {
    label: 'Prompt A (first request)',
    description: 'System prompt + "What is 2+2?"',
    tokens: [...SYSTEM_PROMPT_TOKENS, 101, 102, 103, 104],
  },
  {
    label: 'Prompt B (same system, new query)',
    description: 'System prompt + "Explain quantum computing"',
    tokens: [...SYSTEM_PROMPT_TOKENS, 201, 202, 203, 204],
  },
  {
    label: 'Prompt C (different system)',
    description: 'New system prompt + "What is the capital of France?"',
    tokens: [51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 301, 302],
  },
  {
    label: 'Prompt D (same system as A/B)',
    description: 'System prompt + longer follow-up',
    tokens: [...SYSTEM_PROMPT_TOKENS, 401, 402, 403, 404, 405, 406, 407, 408],
  },
]

function computeBlocks(tokens: number[], cachedHashes: Set<string>): { blocks: PrefixBlock[], hits: number, total: number } {
  const result: PrefixBlock[] = []
  let prevHash: string | null = null
  let hits = 0

  for (let i = 0; i < tokens.length; i += BLOCK_SZ) {
    const slice = tokens.slice(i, i + BLOCK_SZ)
    if (slice.length < BLOCK_SZ) {
      // Partial block — not cacheable, just append as non-cached
      result.push({ id: result.length, hash: 'partial', prevHash, tokens: slice, hit: false, refCount: 1, lruAge: 0 })
      break
    }
    const h = hashTokens(prevHash, slice)
    const hit = cachedHashes.has(h)
    if (hit) hits++
    result.push({ id: result.length, hash: h, prevHash, tokens: slice, hit, refCount: 1, lruAge: 0 })
    prevHash = h
  }

  const fullBlocks = result.filter(b => b.tokens.length === BLOCK_SZ)
  return { blocks: result, hits, total: fullBlocks.length }
}

export function PrefixCacheDemo() {
  const [history, setHistory] = useState<{ promptIdx: number, blocks: PrefixBlock[], hits: number, total: number }[]>([])
  const [cachedHashes, setCachedHashes] = useState<Set<string>>(new Set())
  const [cumulativeHits, setCumulativeHits] = useState(0)
  const [cumulativeTotal, setCumulativeTotal] = useState(0)

  const sendPrompt = (promptIdx: number) => {
    const prompt = DEMO_PROMPTS[promptIdx]
    const { blocks, hits, total } = computeBlocks(prompt.tokens, cachedHashes)

    // Add new hashes to cache
    const newHashes = new Set(cachedHashes)
    for (const b of blocks) {
      if (b.tokens.length === BLOCK_SZ) newHashes.add(b.hash)
    }

    setCachedHashes(newHashes)
    setCumulativeHits(h => h + hits)
    setCumulativeTotal(t => t + total)
    setHistory(h => [...h, { promptIdx, blocks, hits, total }])
  }

  const reset = () => {
    setHistory([])
    setCachedHashes(new Set())
    setCumulativeHits(0)
    setCumulativeTotal(0)
  }

  const hitRate = cumulativeTotal > 0 ? (cumulativeHits / cumulativeTotal) : 0

  return (
    <div className="my-8 rounded-xl border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900">
      <h3 className="mt-0 mb-1 text-base font-semibold">Prefix Cache Hit Rate</h3>
      <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">
        Send prompts in order. Blocks that share a token prefix are <span className="text-green-600 dark:text-green-400 font-semibold">hits</span> (reused from cache).
        Partial blocks (last block, tokens &lt; {BLOCK_SZ}) are never cached.
      </p>

      {/* Hit rate meter */}
      <div className="mb-5 rounded-lg bg-ink-50 dark:bg-ink-800 p-4">
        <div className="mb-2 flex justify-between text-sm font-semibold">
          <span>gpu_prefix_cache_hit_rate</span>
          <span className="font-mono text-teal-600 dark:text-teal-400">{(hitRate * 100).toFixed(1)}%</span>
        </div>
        <div className="h-3 w-full rounded bg-ink-200 dark:bg-ink-700">
          <div className="h-3 rounded bg-green-500 transition-all duration-500"
            style={{ width: `${hitRate * 100}%` }} />
        </div>
        <div className="mt-2 font-mono text-xs text-ink-400 dark:text-ink-500">
          hits / total_full_blocks = {cumulativeHits} / {cumulativeTotal}
        </div>
      </div>

      {/* Prompt buttons */}
      <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {DEMO_PROMPTS.map((p, i) => (
          <button key={i} onClick={() => sendPrompt(i)}
            className="rounded-lg border border-ink-200 dark:border-ink-700 px-3 py-2.5 text-left transition-colors hover:bg-ink-50 dark:hover:bg-ink-800">
            <div className="text-xs font-semibold text-ink-700 dark:text-ink-200">{p.label}</div>
            <div className="text-xs text-ink-400 dark:text-ink-500 mt-0.5">{p.description}</div>
          </button>
        ))}
      </div>

      {/* Request history */}
      {history.length > 0 && (
        <div className="space-y-4 mb-4">
          {history.map((entry, reqIdx) => (
            <div key={reqIdx} className="rounded-lg border border-ink-100 dark:border-ink-800 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
                <span className="text-ink-600 dark:text-ink-300">Request {reqIdx + 1}:</span>
                <span className="text-ink-500">{DEMO_PROMPTS[entry.promptIdx].label}</span>
                <span className={`ml-auto ${entry.hits > 0 ? 'text-green-600 dark:text-green-400' : 'text-ink-400'}`}>
                  {entry.hits}/{entry.total} blocks hit
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entry.blocks.map((b, bi) => (
                  <div key={bi}
                    className={`rounded px-2 py-1 text-xs font-mono border
                      ${b.tokens.length < BLOCK_SZ
                        ? 'bg-ink-100 dark:bg-ink-700 border-ink-300 dark:border-ink-600 text-ink-400'
                        : b.hit
                          ? 'bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-600 text-green-700 dark:text-green-300'
                          : 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300'
                      }`}
                    title={`Hash: ${b.hash}, tokens: ${b.tokens[0]}…${b.tokens[b.tokens.length - 1]}`}
                  >
                    {b.tokens.length < BLOCK_SZ ? `partial(${b.tokens.length}t)` : b.hit ? `✓ #${b.hash}` : `miss #${b.hash}`}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length === 0 && (
        <div className="rounded-lg bg-ink-50 dark:bg-ink-800 p-6 text-center text-sm text-ink-400 dark:text-ink-500">
          Send some prompts above to see which blocks hit the prefix cache.
        </div>
      )}

      {history.length > 0 && (
        <button onClick={reset}
          className="text-xs text-ink-400 hover:text-ink-600 dark:hover:text-ink-300 underline">
          Reset
        </button>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-green-400" /> Cache hit (block reused)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-amber-400" /> Cache miss (block allocated fresh)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-ink-300 dark:bg-ink-600" /> Partial block (never cached)
        </span>
      </div>
    </div>
  )
}

// ── Block Pool State Machine ───────────────────────────────────────────────────

type PoolStatus = 'free' | 'used' | 'cached' | 'lru'

interface PoolBlock {
  id: number
  status: PoolStatus
  lruRank?: number
}

export function BlockPoolExplorer() {
  const TOTAL = 20
  const [step, setStep] = useState(0)

  const scenarios: { label: string, description: string, blocks: PoolBlock[], free: number, used: number, cached: number }[] = [
    {
      label: 'Initial state',
      description: 'All blocks start in the free pool (deque). No sequences are running.',
      blocks: Array.from({ length: TOTAL }, (_, i) => ({ id: i, status: 'free' as PoolStatus })),
      free: TOTAL, used: 0, cached: 0,
    },
    {
      label: 'Two sequences arrive',
      description: 'Blocks are popped from the free deque (popleft) and assigned to sequences. free_list shrinks.',
      blocks: Array.from({ length: TOTAL }, (_, i) => ({
        id: i,
        status: i < 10 ? 'used' as PoolStatus : 'free' as PoolStatus,
      })),
      free: 10, used: 10, cached: 0,
    },
    {
      label: 'Sequence A finishes (prefix cache ON)',
      description: 'Blocks with content_hash (full blocks) move to the LRU evictor — status becomes "cached". ref_count drops to 0 but blocks are not freed yet.',
      blocks: Array.from({ length: TOTAL }, (_, i) => ({
        id: i,
        status: i < 4 ? ('cached' as PoolStatus) : i < 10 ? ('used' as PoolStatus) : ('free' as PoolStatus),
        lruRank: i < 4 ? i : undefined,
      })),
      free: 10, used: 6, cached: 4,
    },
    {
      label: 'New sequence B shares prefix',
      description: "B's first 4 blocks match the cached hashes — blocks move from LRU back to 'used' (ref_count incremented). Cache hit!",
      blocks: Array.from({ length: TOTAL }, (_, i) => ({
        id: i,
        status: i < 10 ? ('used' as PoolStatus) : ('free' as PoolStatus),
      })),
      free: 10, used: 10, cached: 0,
    },
    {
      label: 'Memory pressure — LRU eviction',
      description: 'Pool nearly full. When a new sequence needs a block and none are free, the LRU evictor pops the oldest cached block (OrderedDict.popitem(last=False)) and reuses it.',
      blocks: Array.from({ length: TOTAL }, (_, i) => ({
        id: i,
        status: i < 17 ? 'used' as PoolStatus : i < 19 ? 'lru' as PoolStatus : 'free' as PoolStatus,
        lruRank: i >= 17 && i < 19 ? i - 17 : undefined,
      })),
      free: 1, used: 17, cached: 2,
    },
  ]

  const s = scenarios[step]

  const statusColor: Record<PoolStatus, string> = {
    free: 'bg-ink-100 dark:bg-ink-700 border-ink-300 dark:border-ink-600 text-ink-400 dark:text-ink-500',
    used: 'bg-teal-400 border-transparent text-white',
    cached: 'bg-green-400 border-transparent text-white',
    lru: 'bg-amber-400 border-transparent text-white',
  }

  return (
    <div className="my-8 rounded-xl border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900">
      <h3 className="mt-0 mb-1 text-base font-semibold">Block Pool State Machine</h3>
      <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">
        Walk through how blocks move between states — free deque → used → cached (LRU evictor) → evicted.
      </p>

      {/* Step indicator */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {scenarios.map((sc, i) => (
          <button key={i} onClick={() => setStep(i)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors
              ${step === i ? 'bg-teal-500 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700'}`}>
            {i + 1}. {sc.label}
          </button>
        ))}
      </div>

      {/* Description */}
      <div className="mb-4 rounded-lg bg-ink-50 dark:bg-ink-800 px-4 py-3 text-sm text-ink-700 dark:text-ink-200">
        {s.description}
      </div>

      {/* Block grid */}
      <div className="mb-4 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${TOTAL / 2}, 1fr)` }}>
        {s.blocks.map(b => (
          <div key={b.id}
            className={`h-10 rounded border flex flex-col items-center justify-center text-xs font-mono transition-all ${statusColor[b.status]}`}>
            <span className="font-semibold">{b.id}</span>
            {b.lruRank !== undefined && (
              <span className="text-[9px] opacity-80">LRU{b.lruRank}</span>
            )}
          </div>
        ))}
      </div>

      {/* Counters */}
      <div className="mb-4 grid grid-cols-3 gap-3 text-sm text-center font-mono">
        <div className="rounded-lg bg-ink-50 dark:bg-ink-800 py-2">
          <div className="text-lg font-bold text-ink-700 dark:text-ink-100">{s.free}</div>
          <div className="text-xs text-ink-400">free</div>
        </div>
        <div className="rounded-lg bg-teal-50 dark:bg-teal-900/20 py-2">
          <div className="text-lg font-bold text-teal-600 dark:text-teal-400">{s.used}</div>
          <div className="text-xs text-ink-400">used</div>
        </div>
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 py-2">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">{s.cached}</div>
          <div className="text-xs text-ink-400">cached (LRU)</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        {([['free', 'bg-ink-300 dark:bg-ink-600', 'Free (in deque)'],
           ['used', 'bg-teal-400', 'Used by active sequence'],
           ['cached', 'bg-green-400', 'Cached (in LRU evictor, reusable)'],
           ['lru', 'bg-amber-400', 'About to be evicted (LRU oldest)']] as const).map(([, cls, label]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded ${cls}`} /> {label}
          </span>
        ))}
      </div>

      {/* Navigation */}
      <div className="mt-4 flex gap-3">
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          className="rounded-lg border border-ink-200 dark:border-ink-700 px-4 py-2 text-sm disabled:opacity-40 hover:bg-ink-50 dark:hover:bg-ink-800">
          ← Prev
        </button>
        <button onClick={() => setStep(s => Math.min(scenarios.length - 1, s + 1))} disabled={step === scenarios.length - 1}
          className="rounded-lg border border-ink-200 dark:border-ink-700 px-4 py-2 text-sm disabled:opacity-40 hover:bg-ink-50 dark:hover:bg-ink-800">
          Next →
        </button>
        <span className="ml-auto flex items-center text-xs text-ink-400 font-mono">{step + 1} / {scenarios.length}</span>
      </div>
    </div>
  )
}

// ── Block Memory Calculator ────────────────────────────────────────────────────

export function BlockMemoryCalculator() {
  const [numLayers, setNumLayers] = useState(32)
  const [numKvHeads, setNumKvHeads] = useState(8)
  const [headDim, setHeadDim] = useState(128)
  const [blockSize, setBlockSize] = useState(16)
  const [dtype, setDtype] = useState<'fp16' | 'fp8' | 'int8'>('fp16')
  const [totalGpuGb, setTotalGpuGb] = useState(80)
  const [modelWeightsGb, setModelWeightsGb] = useState(16)
  const [gpuUtil, setGpuUtil] = useState(0.9)

  const dtypeBytes = dtype === 'fp16' ? 2 : 1
  // bytes per block = 2 (K+V) × block_size × num_kv_heads × head_dim × dtype_bytes × num_layers
  const bytesPerBlock = 2 * blockSize * numKvHeads * headDim * dtypeBytes * numLayers
  const availableBytes = (totalGpuGb * gpuUtil - modelWeightsGb) * 1e9
  const numBlocks = Math.max(0, Math.floor(availableBytes / bytesPerBlock))
  const maxTokens = numBlocks * blockSize

  return (
    <div className="my-8 rounded-xl border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900">
      <h3 className="mt-0 mb-1 text-base font-semibold">Block Pool Size Calculator</h3>
      <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">
        vLLM sizes the block pool at startup based on available GPU memory after model weights. Tune these values to see how it changes.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Layers', value: numLayers, set: setNumLayers, min: 1, max: 128 },
          { label: 'KV heads', value: numKvHeads, set: setNumKvHeads, min: 1, max: 64 },
          { label: 'Head dim', value: headDim, set: setHeadDim, min: 64, max: 256, step: 64 },
          { label: 'Block size (tokens)', value: blockSize, set: setBlockSize, min: 4, max: 64, step: 4 },
          { label: 'GPU memory (GB)', value: totalGpuGb, set: setTotalGpuGb, min: 16, max: 160, step: 16 },
          { label: 'Model weights (GB)', value: modelWeightsGb, set: setModelWeightsGb, min: 1, max: 120 },
        ].map(({ label, value, set, min, max, step }) => (
          <div key={label}>
            <label className="mb-1 flex justify-between text-xs font-medium text-ink-600 dark:text-ink-400">
              <span>{label}</span>
              <span className="font-mono">{value}</span>
            </label>
            <input type="range" min={min} max={max} step={step ?? 1} value={value}
              onChange={e => set(Number(e.target.value))}
              className="w-full accent-teal-500" />
          </div>
        ))}
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-ink-600 dark:text-ink-400">dtype</label>
        <div className="flex gap-2">
          {(['fp16', 'fp8', 'int8'] as const).map(d => (
            <button key={d} onClick={() => setDtype(d)}
              className={`rounded px-3 py-1.5 text-xs font-mono font-semibold transition-colors
                ${dtype === d ? 'bg-teal-500 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300'}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-ink-50 dark:bg-ink-800 p-4 font-mono text-xs space-y-1 text-ink-700 dark:text-ink-200">
        <div className="text-ink-400 dark:text-ink-500 mb-2"># vLLM block sizing formula</div>
        <div>bytes_per_block = 2 × {blockSize} × {numKvHeads} × {headDim} × {dtypeBytes} × {numLayers}</div>
        <div className="pl-16 text-teal-600 dark:text-teal-400">= {bytesPerBlock.toLocaleString()} bytes ({(bytesPerBlock / 1e6).toFixed(2)} MB)</div>
        <div className="mt-2">available = {totalGpuGb} × {gpuUtil} − {modelWeightsGb} = {((totalGpuGb * gpuUtil) - modelWeightsGb).toFixed(1)} GB</div>
        <div className="mt-2 font-bold text-teal-600 dark:text-teal-400">
          num_gpu_blocks = ⌊{((totalGpuGb * gpuUtil - modelWeightsGb) * 1e9 / bytesPerBlock).toFixed(1)}⌋ = {numBlocks.toLocaleString()}
        </div>
        <div className="font-bold text-teal-600 dark:text-teal-400">
          max_cached_tokens = {numBlocks} × {blockSize} = {maxTokens.toLocaleString()}
        </div>
      </div>
    </div>
  )
}
