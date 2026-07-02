'use client'

import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type BlockKind = 'embed' | 'pe' | 'norm' | 'attn' | 'ffn' | 'lmhead'

interface SubBlock {
  label: string
  keyStat?: string
  lines: string[]
  colorClass?: string
  borderClass?: string
}

interface BlockSpec {
  kind: BlockKind
  label: string
  keyStat: string
  tooltip: string
  expandedLines: string[]
  subBlocks?: SubBlock[]   // nested collapsible sub-blocks shown inside expanded parent
  colorClass: string
  borderClass: string
}

interface ModelSpec {
  id: string
  label: string
  r1Banner?: string
  sourceUrl: string        // GitHub link to forward pass / modeling file
  sourceLabel: string      // short label for the link
  blocks: BlockSpec[]
}

// ── Color tokens ──────────────────────────────────────────────────────────────

const EMBED_COLOR = 'bg-slate-100 dark:bg-slate-800'
const EMBED_BORDER = 'border-slate-300 dark:border-slate-600'
const ATTN_COLOR = 'bg-teal-50 dark:bg-teal-900/30'
const ATTN_BORDER = 'border-teal-300 dark:border-teal-700'
const FFN_COLOR = 'bg-violet-50 dark:bg-violet-900/30'
const FFN_BORDER = 'border-violet-300 dark:border-violet-700'
const NORM_COLOR = 'bg-slate-50 dark:bg-slate-900/30'
const NORM_BORDER = 'border-slate-200 dark:border-slate-700'

// ── Model definitions ─────────────────────────────────────────────────────────

const MODELS: ModelSpec[] = [
  // ── GPT-2 (1.5B) ──────────────────────────────────────────────────────────
  {
    id: 'gpt2',
    label: 'GPT-2',
    sourceUrl: 'https://github.com/huggingface/transformers/blob/main/src/transformers/models/gpt2/modeling_gpt2.py',
    sourceLabel: 'modeling_gpt2.py',
    blocks: [
      {
        kind: 'embed',
        label: 'Token Embedding',
        keyStat: 'vocab 50257 × d 1600',
        tooltip: 'Maps token id t → embedding vector x ∈ ℝ^{d_model}',
        colorClass: EMBED_COLOR,
        borderClass: EMBED_BORDER,
        expandedLines: [
          'Maps token id t → embedding vector x ∈ ℝ^{d_model}',
          'Params: vocab_size × d_model = 50257 × 1600 = 80.4M',
        ],
      },
      {
        kind: 'pe',
        label: 'Positional Encoding',
        keyStat: 'Learned absolute, ctx 1024',
        tooltip: 'Learned absolute positional embeddings added to token embeddings at each position',
        colorClass: EMBED_COLOR,
        borderClass: EMBED_BORDER,
        expandedLines: [
          'Learned absolute embeddings: PE ∈ ℝ^{1024 × 1600}',
          'Added to token embeddings before first layer',
          'Unlike RoPE, position info is baked in at input — no per-layer rotation',
          'Context window: 1024 tokens',
        ],
      },
      {
        kind: 'norm',
        label: 'Pre-Norm (LayerNorm)',
        keyStat: 'LN before each sub-layer',
        tooltip: 'x_norm = (x - μ) / σ × γ + β; applied before attention and FFN',
        colorClass: NORM_COLOR,
        borderClass: NORM_BORDER,
        expandedLines: [
          'LayerNorm: x_norm = (x − μ) / σ × γ + β',
          'GPT-2 uses pre-norm: norm applied before attention and FFN, not after',
          'Pre-norm stabilises gradients for deep networks',
        ],
      },
      {
        kind: 'attn',
        label: 'MHA — Multi-Head Attention',
        keyStat: '25 heads, d_h 64',
        tooltip: 'Attention(Q,K,V) = softmax(QKᵀ/√d_k)V — all 25 heads share one KV set',
        colorClass: ATTN_COLOR,
        borderClass: ATTN_BORDER,
        expandedLines: [
          'Attention(Q,K,V) = softmax(QKᵀ/√d_k)V',
          'Q,K,V ∈ ℝ^{n × n_h × d_h},  d_h = d_model / n_h = 1600 / 25 = 64',
          'No GQA: each query head has its own K,V head (25Q / 25KV)',
          'Params: 4 × d_model² = 4 × 1600² ≈ 10.2M per layer',
          'No RoPE — positional info from absolute PE at input',
        ],
      },
      {
        kind: 'norm',
        label: 'Post-Attn LayerNorm',
        keyStat: 'LN before FFN',
        tooltip: 'Second LayerNorm applied after attention residual, before FFN',
        colorClass: NORM_COLOR,
        borderClass: NORM_BORDER,
        expandedLines: [
          'Second LayerNorm before FFN sub-layer',
          'Pre-norm pattern: norm(x) fed to FFN, output added back to x',
        ],
      },
      {
        kind: 'ffn',
        label: 'Dense FFN — GELU',
        keyStat: 'd_ffn 6400 (4×)',
        tooltip: 'FFN(x) = W₂ · GELU(W₁x); intermediate dim = 4 × d_model',
        colorClass: FFN_COLOR,
        borderClass: FFN_BORDER,
        expandedLines: [
          'FFN(x) = W₂ · GELU(W₁x)',
          'Intermediate dim: 4 × d_model = 4 × 1600 = 6400',
          'GELU: x · Φ(x), smooth approximation of ReLU',
          'Params per layer: 2 × d_model × d_ffn = 2 × 1600 × 6400 ≈ 20.5M',
          '48 layers total',
        ],
      },
      {
        kind: 'lmhead',
        label: 'LM Head',
        keyStat: 'd 1600 → vocab 50257',
        tooltip: 'Linear projection from d_model to vocab; weight-tied with embedding matrix',
        colorClass: EMBED_COLOR,
        borderClass: EMBED_BORDER,
        expandedLines: [
          'Linear: ℝ^{d_model} → ℝ^{vocab} = ℝ^{1600} → ℝ^{50257}',
          'Weight-tied with token embedding matrix (no extra params)',
          'softmax over logits to get next-token probabilities',
        ],
      },
    ],
  },

  // ── Qwen3-8B ──────────────────────────────────────────────────────────────
  {
    id: 'qwen3',
    label: 'Qwen3-8B',
    sourceUrl: 'https://github.com/huggingface/transformers/blob/main/src/transformers/models/qwen3/modeling_qwen3.py',
    sourceLabel: 'modeling_qwen3.py',
    blocks: [
      {
        kind: 'embed',
        label: 'Token Embedding',
        keyStat: 'vocab 151936 × d 4096',
        tooltip: 'Maps token id t → embedding vector x ∈ ℝ^{4096}',
        colorClass: EMBED_COLOR,
        borderClass: EMBED_BORDER,
        expandedLines: [
          'Maps token id t → embedding vector x ∈ ℝ^{d_model}',
          'Params: vocab_size × d_model = 151936 × 4096 ≈ 622.5M',
        ],
      },
      {
        kind: 'pe',
        label: 'Positional Encoding',
        keyStat: 'RoPE theta=1,000,000',
        tooltip: 'Rotates Q,K by θ_i = pos × rope_theta^{-2i/d} before dot product',
        colorClass: EMBED_COLOR,
        borderClass: EMBED_BORDER,
        expandedLines: [
          'RoPE: rotates Q,K by angle θ_i = position × rope_theta^{-2i/d} before dot product',
          'Result: Q·K depends only on relative position (n−m), not absolute',
          'rope_theta = 1,000,000 — high theta extends effective context range',
          'Context: 40960 tokens',
        ],
      },
      {
        kind: 'norm',
        label: 'Pre-Norm (RMSNorm)',
        keyStat: 'RMSNorm before each sub-layer',
        tooltip: 'RMSNorm(x) = x / RMS(x) × γ; no mean subtraction',
        colorClass: NORM_COLOR,
        borderClass: NORM_BORDER,
        expandedLines: [
          'RMSNorm(x) = x / RMS(x) × γ,  RMS(x) = √(1/d Σ xᵢ²)',
          'No mean subtraction or additive bias β — cheaper than LayerNorm',
          'Pre-norm applied before attention and FFN',
        ],
      },
      {
        kind: 'attn',
        label: 'GQA — Grouped Query Attention',
        keyStat: '32Q / 8KV heads, d_h 128',
        tooltip: 'Each KV head is shared by 32/8=4 query heads — 4× KV cache savings',
        colorClass: ATTN_COLOR,
        borderClass: ATTN_BORDER,
        expandedLines: [
          'Attention(Q,K,V) = softmax(QKᵀ/√d_k)V',
          'Q heads: 32, KV heads: 8 — each KV head shared by 32/8 = 4 query heads',
          'KV cache per layer: 2 × seq × n_kv × d_h = 2 × seq × 8 × 128 bytes (vs 32×128 MHA)',
          'GQA KV cache savings vs MHA: 4× smaller',
          'RoPE with theta=1M applied to Q,K before dot product',
          'head_dim: 128',
        ],
      },
      {
        kind: 'norm',
        label: 'Post-Attn RMSNorm',
        keyStat: 'RMSNorm before FFN',
        tooltip: 'RMSNorm applied after attention residual, before FFN',
        colorClass: NORM_COLOR,
        borderClass: NORM_BORDER,
        expandedLines: [
          'Second RMSNorm before FFN sub-layer',
        ],
      },
      {
        kind: 'ffn',
        label: 'Dense FFN — SwiGLU',
        keyStat: 'd_ffn 12288 (3×)',
        tooltip: 'FFN(x) = (W₁x ⊙ σ(W₃x)) · W₂ — gated linear unit controls info flow',
        colorClass: FFN_COLOR,
        borderClass: FFN_BORDER,
        expandedLines: [
          'FFN(x) = (W₁x ⊙ swish(W₃x)) · W₂',
          'SwiGLU: gate network (swish) controls information flow',
          'intermediate_size: 12288 (≈3× d_model with SwiGLU correction)',
          '36 layers total',
        ],
      },
      {
        kind: 'lmhead',
        label: 'LM Head',
        keyStat: 'd 4096 → vocab 151936',
        tooltip: 'Linear projection from d_model to vocab',
        colorClass: EMBED_COLOR,
        borderClass: EMBED_BORDER,
        expandedLines: [
          'Linear: ℝ^{4096} → ℝ^{151936}',
          'softmax over logits to get next-token probabilities',
        ],
      },
    ],
  },

  // ── DeepSeek-V3 ───────────────────────────────────────────────────────────
  {
    id: 'deepseek-v3',
    label: 'DeepSeek-V3',
    sourceUrl: 'https://github.com/deepseek-ai/DeepSeek-V3/blob/main/inference/model.py',
    sourceLabel: 'inference/model.py (official)',
    blocks: [
      {
        kind: 'embed',
        label: 'Token Embedding',
        keyStat: 'vocab 129280 × d 7168',
        tooltip: 'Maps token id t → embedding vector x ∈ ℝ^{7168}',
        colorClass: EMBED_COLOR,
        borderClass: EMBED_BORDER,
        expandedLines: [
          'Maps token id t → embedding vector x ∈ ℝ^{d_model}',
          'Params: vocab_size × d_model = 129280 × 7168 ≈ 927M',
        ],
      },
      {
        kind: 'pe',
        label: 'Positional Encoding',
        keyStat: 'YaRN RoPE, rope_theta=10000',
        tooltip: 'RoPE with YaRN extension for long-context; separate rope dim subset in MLA heads',
        colorClass: EMBED_COLOR,
        borderClass: EMBED_BORDER,
        expandedLines: [
          'RoPE with YaRN scaling — enables long context beyond training length',
          'In MLA: RoPE applied only to qk_rope_head_dim=64 subset of each head',
          'Remaining qk_nope_head_dim=128 dims are unrotated (compressed K/Q path)',
          'Context window: up to 163,840 tokens with YaRN',
        ],
      },
      {
        kind: 'norm',
        label: 'Pre-Norm (RMSNorm)',
        keyStat: 'RMSNorm before each sub-layer',
        tooltip: 'RMSNorm(x) = x / RMS(x) × γ',
        colorClass: NORM_COLOR,
        borderClass: NORM_BORDER,
        expandedLines: [
          'RMSNorm(x) = x / RMS(x) × γ,  RMS(x) = √(1/d Σ xᵢ²)',
        ],
      },
      {
        kind: 'attn',
        label: 'MLA — Multi-Head Latent Attention',
        keyStat: '128 heads, KV compressed 64×',
        tooltip: 'Compresses KV cache to 512-dim latent; 64× reduction vs standard MHA',
        colorClass: ATTN_COLOR,
        borderClass: ATTN_BORDER,
        expandedLines: [
          'Standard KV cache per layer: 2 · n · n_h · d_h = 2 · n · 128 · 128 = 32768n elements',
          'MLA compresses: c_KV = X · W^{DKV} ∈ ℝ^{n × 512}, decompressed at attention time',
          'KV cache reduction: 512 vs 32768 → 64× smaller',
          'Q also compressed: c_Q = X · W^{DQ} ∈ ℝ^{n × 1536}',
          'RoPE applied separately to qk_rope_head_dim=64 subset per head',
          'kv_lora_rank=512, q_lora_rank=1536, qk_nope_head_dim=128, v_head_dim=128',
        ],
      },
      {
        kind: 'norm',
        label: 'Post-Attn RMSNorm',
        keyStat: 'RMSNorm before FFN',
        tooltip: 'RMSNorm applied after attention residual, before FFN',
        colorClass: NORM_COLOR,
        borderClass: NORM_BORDER,
        expandedLines: [
          'RMSNorm before FFN sub-layer',
        ],
      },
      {
        kind: 'ffn',
        label: 'FFN — Mixed Dense + MoE',
        keyStat: '3 dense + 58 MoE layers',
        tooltip: 'Layers 1–3: dense SwiGLU. Layers 4–61: 256 routed experts + 1 shared, top-8',
        colorClass: FFN_COLOR,
        borderClass: FFN_BORDER,
        expandedLines: [
          '61 transformer layers total — FFN type differs by depth:',
        ],
        subBlocks: [
          {
            label: 'Layers 1–3: Dense SwiGLU FFN',
            keyStat: 'standard FFN, no routing',
            lines: [
              'FFN(x) = (W₁x ⊙ swish(W₃x)) · W₂',
              'intermediate_size=18432, d_model=7168',
              'First 3 layers use a dense feed-forward block (same as any standard transformer)',
            ],
            colorClass: 'bg-violet-50 dark:bg-violet-900/30',
            borderClass: 'border-violet-200 dark:border-violet-800',
          },
          {
            label: 'Layers 4–61: MoE SwiGLU FFN',
            keyStat: '256 routed + 1 shared expert, top-8',
            lines: [
              'Router: s_i = sigmoid(x · W_r)_i,  select top-8 of 256 routed experts',
              'Output: FFN(x) = Σ_{i∈top-8} s_i · FFN_i(x)  +  FFN_shared(x)',
              '1 shared expert always active (captures universal patterns)',
              'moe_intermediate_size=2048 per expert; gated SwiGLU activation',
              'Aux-loss-free load balancing: bias correction on router logits instead of auxiliary loss',
              'n_group=8, topk_group=4 — experts partitioned into 8 groups, top-4 groups selected first',
            ],
            colorClass: 'bg-violet-100 dark:bg-violet-800/30',
            borderClass: 'border-violet-300 dark:border-violet-700',
          },
          {
            label: 'Multi-Token Prediction (MTP)',
            keyStat: 'predicts next N tokens per step',
            lines: [
              'After the main LM head, an extra MTP module predicts tokens at t+1, t+2, …',
              'num_nextn_predict_layers=1 (one extra prediction head)',
              'Used as auxiliary training signal to improve representation quality',
              'Discarded at inference — only the main LM head is used',
            ],
            colorClass: 'bg-amber-50 dark:bg-amber-900/20',
            borderClass: 'border-amber-200 dark:border-amber-800',
          },
        ],
      },
      {
        kind: 'lmhead',
        label: 'LM Head',
        keyStat: 'd 7168 → vocab 129280',
        tooltip: 'Linear projection from d_model to vocab',
        colorClass: EMBED_COLOR,
        borderClass: EMBED_BORDER,
        expandedLines: [
          'Linear: ℝ^{7168} → ℝ^{129280}',
          'softmax over logits to get next-token probabilities',
          'Total params: 671B; active per token: ~37B',
        ],
      },
    ],
  },

  // ── DeepSeek-R1 ───────────────────────────────────────────────────────────
  {
    id: 'deepseek-r1',
    label: 'DeepSeek-R1',
    r1Banner: 'Same architecture as DeepSeek-V3. Trained with RLVR pipeline: cold-start SFT → GRPO on verifiable rewards → rejection-sampled SFT → final GRPO.',
    sourceUrl: 'https://github.com/huggingface/transformers/blob/main/src/transformers/models/deepseek_v3/modeling_deepseek_v3.py',
    sourceLabel: 'modeling_deepseek_v3.py (same code as V3)',
    blocks: [
      {
        kind: 'embed',
        label: 'Token Embedding',
        keyStat: 'vocab 129280 × d 7168',
        tooltip: 'Identical to DeepSeek-V3 — maps token id t → embedding vector x ∈ ℝ^{7168}',
        colorClass: EMBED_COLOR,
        borderClass: EMBED_BORDER,
        expandedLines: [
          'Identical to DeepSeek-V3 embedding',
          'Params: vocab_size × d_model = 129280 × 7168 ≈ 927M',
        ],
      },
      {
        kind: 'pe',
        label: 'Positional Encoding',
        keyStat: 'YaRN RoPE (same as V3)',
        tooltip: 'RoPE with YaRN extension — same as DeepSeek-V3',
        colorClass: EMBED_COLOR,
        borderClass: EMBED_BORDER,
        expandedLines: [
          'Identical to DeepSeek-V3 RoPE with YaRN scaling',
          'Context window: up to 163,840 tokens',
        ],
      },
      {
        kind: 'norm',
        label: 'Pre-Norm (RMSNorm)',
        keyStat: 'RMSNorm before each sub-layer',
        tooltip: 'RMSNorm — identical to DeepSeek-V3',
        colorClass: NORM_COLOR,
        borderClass: NORM_BORDER,
        expandedLines: [
          'RMSNorm — identical to DeepSeek-V3',
        ],
      },
      {
        kind: 'attn',
        label: 'MLA — Multi-Head Latent Attention',
        keyStat: '128 heads, KV compressed 64× (same as V3)',
        tooltip: 'Identical MLA to DeepSeek-V3',
        colorClass: ATTN_COLOR,
        borderClass: ATTN_BORDER,
        expandedLines: [
          'Identical to DeepSeek-V3 MLA',
          'c_KV = X · W^{DKV} ∈ ℝ^{n × 512}, 64× KV cache savings',
          'kv_lora_rank=512, q_lora_rank=1536, qk_nope_head_dim=128, v_head_dim=128',
        ],
      },
      {
        kind: 'norm',
        label: 'Post-Attn RMSNorm',
        keyStat: 'RMSNorm before FFN',
        tooltip: 'Same as DeepSeek-V3',
        colorClass: NORM_COLOR,
        borderClass: NORM_BORDER,
        expandedLines: ['RMSNorm before FFN — same as DeepSeek-V3'],
      },
      {
        kind: 'ffn',
        label: 'FFN — Mixed Dense + MoE (same as V3)',
        keyStat: '3 dense + 58 MoE layers',
        tooltip: 'Identical FFN structure to DeepSeek-V3; all differences are in training',
        colorClass: FFN_COLOR,
        borderClass: FFN_BORDER,
        expandedLines: [
          'Architecture identical to DeepSeek-V3 — see V3 tab for full FFN details.',
          'The distinction is the training pipeline:',
        ],
        subBlocks: [
          {
            label: 'Layers 1–3: Dense SwiGLU (same as V3)',
            keyStat: 'identical',
            lines: [
              'Standard dense SwiGLU FFN — see DeepSeek-V3 for equations',
            ],
            colorClass: 'bg-violet-50 dark:bg-violet-900/30',
            borderClass: 'border-violet-200 dark:border-violet-800',
          },
          {
            label: 'Layers 4–61: MoE SwiGLU (same as V3)',
            keyStat: '256 routed + 1 shared, top-8',
            lines: [
              'Identical MoE structure to DeepSeek-V3',
              '256 routed experts + 1 shared, top-8 routing, aux-loss-free load balancing',
            ],
            colorClass: 'bg-violet-100 dark:bg-violet-800/30',
            borderClass: 'border-violet-300 dark:border-violet-700',
          },
          {
            label: 'Training pipeline (R1-specific)',
            keyStat: 'RLVR with GRPO — 4 phases',
            lines: [
              'Phase 1 — Cold-start SFT: fine-tune V3 on curated chain-of-thought data',
              'Phase 2 — RLVR: GRPO on verifiable rewards (math answer correctness, code tests)',
              '   Reward is binary (correct/incorrect), no reward model needed',
              '   Policy learns to produce long, structured reasoning traces',
              'Phase 3 — Rejection-sampled SFT: filter best traces, re-train on them',
              'Phase 4 — Final GRPO: reasoning + helpfulness + safety alignment',
            ],
            colorClass: 'bg-amber-50 dark:bg-amber-900/20',
            borderClass: 'border-amber-200 dark:border-amber-800',
          },
        ],
      },
      {
        kind: 'lmhead',
        label: 'LM Head',
        keyStat: 'd 7168 → vocab 129280',
        tooltip: 'Same as DeepSeek-V3',
        colorClass: EMBED_COLOR,
        borderClass: EMBED_BORDER,
        expandedLines: [
          'Linear: ℝ^{7168} → ℝ^{129280} — identical to DeepSeek-V3',
          'Total params: 671B; active per token: ~37B',
        ],
      },
    ],
  },

  // ── GPT-OSS-20B ───────────────────────────────────────────────────────────
  {
    id: 'gpt-oss-20b',
    label: 'GPT-OSS-20B',
    sourceUrl: 'https://github.com/huggingface/transformers/blob/main/src/transformers/models/gpt_oss/modeling_gpt_oss.py',
    sourceLabel: 'modeling_gpt_oss.py',
    blocks: [
      {
        kind: 'embed',
        label: 'Token Embedding',
        keyStat: 'vocab 201088 × d 2880',
        tooltip: 'Maps token id t → embedding vector x ∈ ℝ^{2880}',
        colorClass: EMBED_COLOR,
        borderClass: EMBED_BORDER,
        expandedLines: [
          'Maps token id t → embedding vector x ∈ ℝ^{d_model}',
          'Params: vocab_size × d_model = 201088 × 2880 ≈ 579M',
        ],
      },
      {
        kind: 'pe',
        label: 'Positional Encoding',
        keyStat: 'YaRN RoPE theta=150000',
        tooltip: 'RoPE with YaRN extension and theta=150,000; context 131,072',
        colorClass: EMBED_COLOR,
        borderClass: EMBED_BORDER,
        expandedLines: [
          'RoPE with YaRN scaling: rope_theta=150,000',
          'High theta + YaRN extends effective context to 131,072 tokens',
          'Alternating layers use sliding-window attention (see attention block)',
        ],
      },
      {
        kind: 'norm',
        label: 'Pre-Norm (RMSNorm)',
        keyStat: 'RMSNorm before each sub-layer',
        tooltip: 'RMSNorm(x) = x / RMS(x) × γ',
        colorClass: NORM_COLOR,
        borderClass: NORM_BORDER,
        expandedLines: [
          'RMSNorm(x) = x / RMS(x) × γ',
        ],
      },
      {
        kind: 'attn',
        label: 'GQA — Alternating Sliding + Full Attention',
        keyStat: '64Q / 8KV, alternating per layer',
        tooltip: 'Even layers: full causal O(n²); Odd layers: sliding window O(n·128)',
        colorClass: ATTN_COLOR,
        borderClass: ATTN_BORDER,
        expandedLines: [
          'GQA: Q heads=64, KV heads=8, head_dim=64; each KV head shared by 8 Q heads',
          'Layers alternate between two attention patterns:',
        ],
        subBlocks: [
          {
            label: 'Even layers: Full causal attention',
            keyStat: 'O(n²), global context',
            lines: [
              'Standard causal attention over all previous tokens',
              'Attention(Q,K,V) = softmax(QKᵀ/√d_k + M)V',
              'M_{ij} = 0 if j≤i else −∞  (causal mask)',
              'Complexity: O(n²·d) per layer',
            ],
            colorClass: 'bg-teal-50 dark:bg-teal-900/30',
            borderClass: 'border-teal-200 dark:border-teal-800',
          },
          {
            label: 'Odd layers: Sliding window attention',
            keyStat: 'window=128, O(n·128)',
            lines: [
              'Each token attends only to the last 128 tokens: positions [t−128, t]',
              'Complexity: O(n·w·d) where w=128 — linear in sequence length',
              'KV cache bounded: only 128 tokens stored per layer (not full sequence)',
              'Local context captured here; global context captured in even layers',
            ],
            colorClass: 'bg-teal-100 dark:bg-teal-800/30',
            borderClass: 'border-teal-300 dark:border-teal-700',
          },
        ],
      },
      {
        kind: 'norm',
        label: 'Post-Attn RMSNorm',
        keyStat: 'RMSNorm before FFN',
        tooltip: 'RMSNorm applied after attention residual',
        colorClass: NORM_COLOR,
        borderClass: NORM_BORDER,
        expandedLines: ['RMSNorm before FFN sub-layer'],
      },
      {
        kind: 'ffn',
        label: 'MoE FFN — SwiGLU',
        keyStat: '32 experts, top-4 selected',
        tooltip: 'Router picks top-4 of 32 experts; output = weighted sum of expert FFNs',
        colorClass: FFN_COLOR,
        borderClass: FFN_BORDER,
        expandedLines: [
          '24 layers, each with an MoE FFN block:',
        ],
        subBlocks: [
          {
            label: 'Router',
            keyStat: 'top-4 of 32 experts',
            lines: [
              'Router: s_i = softmax(x · W_r)_i,  select top-4 of 32 experts',
              'router_aux_loss_coef=0.9 (auxiliary load-balancing loss)',
            ],
            colorClass: 'bg-violet-50 dark:bg-violet-900/30',
            borderClass: 'border-violet-200 dark:border-violet-800',
          },
          {
            label: 'Expert FFNs',
            keyStat: 'gated SwiGLU, d_int=2880',
            lines: [
              'Output: FFN(x) = Σ_{i∈top-4} s_i · FFN_i(x)',
              'Each expert: gated SwiGLU, intermediate_size=2880',
              'swiglu_limit=7.0 (clamp on gate activation for training stability)',
              'Active params per token: ~3.6B of 21B total',
            ],
            colorClass: 'bg-violet-100 dark:bg-violet-800/30',
            borderClass: 'border-violet-300 dark:border-violet-700',
          },
        ],
      },
      {
        kind: 'lmhead',
        label: 'LM Head',
        keyStat: 'd 2880 → vocab 201088',
        tooltip: 'Linear projection from d_model to vocab',
        colorClass: EMBED_COLOR,
        borderClass: EMBED_BORDER,
        expandedLines: [
          'Linear: ℝ^{2880} → ℝ^{201088}',
          'Total params: ~21B; active per token: ~3.6B',
        ],
      },
    ],
  },

  // ── GPT-OSS-120B ──────────────────────────────────────────────────────────
  {
    id: 'gpt-oss-120b',
    label: 'GPT-OSS-120B',
    sourceUrl: 'https://github.com/huggingface/transformers/blob/main/src/transformers/models/gpt_oss/modeling_gpt_oss.py',
    sourceLabel: 'modeling_gpt_oss.py (same code, 128 experts)',
    blocks: [
      {
        kind: 'embed',
        label: 'Token Embedding',
        keyStat: 'vocab 201088 × d 2880',
        tooltip: 'Same embedding as 20B — vocab 201088, d_model 2880',
        colorClass: EMBED_COLOR,
        borderClass: EMBED_BORDER,
        expandedLines: [
          'Same as GPT-OSS-20B',
          'Params: 201088 × 2880 ≈ 579M',
        ],
      },
      {
        kind: 'pe',
        label: 'Positional Encoding',
        keyStat: 'YaRN RoPE theta=150000 (same)',
        tooltip: 'Same RoPE + YaRN as 20B; context 131,072',
        colorClass: EMBED_COLOR,
        borderClass: EMBED_BORDER,
        expandedLines: [
          'Identical to GPT-OSS-20B: YaRN RoPE, rope_theta=150,000, ctx=131,072',
        ],
      },
      {
        kind: 'norm',
        label: 'Pre-Norm (RMSNorm)',
        keyStat: 'RMSNorm before each sub-layer',
        tooltip: 'Same as 20B',
        colorClass: NORM_COLOR,
        borderClass: NORM_BORDER,
        expandedLines: ['RMSNorm — same as GPT-OSS-20B'],
      },
      {
        kind: 'attn',
        label: 'GQA — Alternating Sliding + Full Attention',
        keyStat: '64Q / 8KV, same pattern as 20B',
        tooltip: 'Identical to GPT-OSS-20B: even layers full causal, odd layers sliding window=128',
        colorClass: ATTN_COLOR,
        borderClass: ATTN_BORDER,
        expandedLines: [
          'GQA: Q=64, KV=8 heads, head_dim=64 — identical to GPT-OSS-20B',
          'Layers alternate between two attention patterns:',
        ],
        subBlocks: [
          {
            label: 'Even layers: Full causal attention',
            keyStat: 'O(n²), global context',
            lines: [
              'Standard causal attention over all previous tokens',
              'Attention(Q,K,V) = softmax(QKᵀ/√d_k + M)V',
            ],
            colorClass: 'bg-teal-50 dark:bg-teal-900/30',
            borderClass: 'border-teal-200 dark:border-teal-800',
          },
          {
            label: 'Odd layers: Sliding window attention',
            keyStat: 'window=128, O(n·128)',
            lines: [
              'Attend only to [t−128, t] — same as GPT-OSS-20B',
              'Bounded KV cache cost per sliding layer',
            ],
            colorClass: 'bg-teal-100 dark:bg-teal-800/30',
            borderClass: 'border-teal-300 dark:border-teal-700',
          },
        ],
      },
      {
        kind: 'norm',
        label: 'Post-Attn RMSNorm',
        keyStat: 'RMSNorm before FFN',
        tooltip: 'Same as 20B',
        colorClass: NORM_COLOR,
        borderClass: NORM_BORDER,
        expandedLines: ['RMSNorm before FFN — same as 20B'],
      },
      {
        kind: 'ffn',
        label: 'MoE FFN — SwiGLU',
        keyStat: '128 experts, top-4 selected',
        tooltip: '128 routed experts top-4; 4× more capacity than 20B, same compute per token',
        colorClass: FFN_COLOR,
        borderClass: FFN_BORDER,
        expandedLines: [
          '36 layers, each with an MoE FFN block (vs 24 in 20B):',
        ],
        subBlocks: [
          {
            label: 'Router',
            keyStat: 'top-4 of 128 experts',
            lines: [
              'Router: s_i = softmax(x · W_r)_i,  select top-4 of 128 experts',
              '4× more experts than 20B → 4× more total capacity at same active compute',
            ],
            colorClass: 'bg-violet-50 dark:bg-violet-900/30',
            borderClass: 'border-violet-200 dark:border-violet-800',
          },
          {
            label: 'Expert FFNs',
            keyStat: 'gated SwiGLU, d_int=2880',
            lines: [
              'Output: FFN(x) = Σ_{i∈top-4} s_i · FFN_i(x)',
              'Each expert: gated SwiGLU, intermediate_size=2880',
              'Same per-expert architecture as 20B; more experts = more total params',
              'Active params per token: ~5.1B of 117B total',
            ],
            colorClass: 'bg-violet-100 dark:bg-violet-800/30',
            borderClass: 'border-violet-300 dark:border-violet-700',
          },
        ],
      },
      {
        kind: 'lmhead',
        label: 'LM Head',
        keyStat: 'd 2880 → vocab 201088',
        tooltip: 'Same as 20B',
        colorClass: EMBED_COLOR,
        borderClass: EMBED_BORDER,
        expandedLines: [
          'Linear: ℝ^{2880} → ℝ^{201088} — same as 20B',
          'Total params: ~117B; active per token: ~5.1B',
        ],
      },
    ],
  },
]

// ── Sub-block Component ───────────────────────────────────────────────────────

function SubBlockItem({ sub }: { sub: SubBlock }) {
  const [open, setOpen] = useState(false)
  const color = sub.colorClass ?? 'bg-ink-50 dark:bg-ink-800/50'
  const border = sub.borderClass ?? 'border-ink-200 dark:border-ink-700'

  return (
    <div className={`rounded-md border ${color} ${border} px-3 py-2`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-xs font-semibold text-ink-700 dark:text-ink-200">{sub.label}</span>
          {sub.keyStat && (
            <span className="ml-2 text-xs font-mono text-ink-400 dark:text-ink-500">{sub.keyStat}</span>
          )}
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Collapse' : 'Expand'}
          className="flex-shrink-0 w-5 h-5 rounded text-xs font-bold bg-white/60 dark:bg-black/20 border border-current text-ink-500 dark:text-ink-400 hover:bg-white dark:hover:bg-black/40 transition-colors"
        >
          {open ? '−' : '+'}
        </button>
      </div>
      {open && (
        <ul className="mt-1.5 space-y-0.5">
          {sub.lines.map((line, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-ink-600 dark:text-ink-300 font-mono">
              <span className="mt-0.5 text-ink-300 dark:text-ink-600 flex-shrink-0">›</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Block Component ───────────────────────────────────────────────────────────

function ArchBlock({ block }: { block: BlockSpec }) {
  const [open, setOpen] = useState(false)
  const isNorm = block.kind === 'norm'
  const hasSubBlocks = !!(block.subBlocks && block.subBlocks.length > 0)

  return (
    <div
      title={open ? undefined : block.tooltip}
      className={`relative rounded-lg border ${block.colorClass} ${block.borderClass} transition-all ${isNorm ? 'py-1.5 px-3' : 'px-4 py-3'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className={`font-semibold ${isNorm ? 'text-xs' : 'text-sm'} text-ink-700 dark:text-ink-200`}>
            {block.label}
          </span>
          {!isNorm && (
            <span className="ml-2 text-xs text-ink-400 dark:text-ink-500 font-mono">{block.keyStat}</span>
          )}
        </div>
        {!isNorm && (
          <button
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Collapse' : 'Expand'}
            className="flex-shrink-0 w-6 h-6 rounded text-xs font-bold bg-white/60 dark:bg-black/20 border border-current text-ink-500 dark:text-ink-400 hover:bg-white dark:hover:bg-black/40 transition-colors"
          >
            {open ? '−' : '+'}
          </button>
        )}
      </div>
      {open && !isNorm && (
        <div className="mt-2 space-y-2">
          {/* Intro lines (if any) */}
          {block.expandedLines.length > 0 && (
            <ul className="space-y-0.5">
              {block.expandedLines.map((line, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-ink-600 dark:text-ink-300 font-mono">
                  <span className="mt-0.5 text-ink-300 dark:text-ink-600 flex-shrink-0">›</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          )}
          {/* Nested sub-blocks */}
          {hasSubBlocks && (
            <div className="space-y-1.5 mt-1">
              {block.subBlocks!.map((sub, i) => (
                <SubBlockItem key={i} sub={sub} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Connector Arrow ───────────────────────────────────────────────────────────

function Arrow() {
  return (
    <div className="flex justify-center">
      <svg width="16" height="16" viewBox="0 0 16 16" className="text-ink-300 dark:text-ink-600">
        <line x1="8" y1="0" x2="8" y2="12" stroke="currentColor" strokeWidth="1.5" />
        <polyline points="4,9 8,13 12,9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ArchitectureCheatsheet() {
  const [activeId, setActiveId] = useState(MODELS[0].id)
  const model = MODELS.find(m => m.id === activeId)!

  return (
    <div className="my-8 rounded-xl border border-ink-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900">
      <h3 className="mt-0 mb-1 text-base font-semibold">LLM Architecture Block Diagrams</h3>
      <p className="mb-5 text-sm text-ink-500 dark:text-ink-400">
        Select a model to see its architecture as a vertical block diagram. Click <strong>+</strong> on any block to expand equations and parameters.
      </p>

      {/* Tab selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {MODELS.map(m => (
          <button
            key={m.id}
            onClick={() => setActiveId(m.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              activeId === m.id
                ? 'bg-teal-500 text-white'
                : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Source code link */}
      <div className="mb-4 flex items-center gap-2 text-xs text-ink-400 dark:text-ink-500">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        <a
          href={model.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono hover:text-teal-500 dark:hover:text-teal-400 transition-colors underline underline-offset-2"
        >
          {model.sourceLabel}
        </a>
        <span>— forward pass implementation</span>
      </div>

      {/* R1 banner */}
      {model.r1Banner && (
        <div className="mb-4 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          <span className="font-semibold">Training note: </span>{model.r1Banner}
        </div>
      )}

      {/* Block diagram */}
      <div className="flex flex-col gap-1 max-w-xl mx-auto">
        {model.blocks.map((block, i) => (
          <div key={i}>
            {i > 0 && <Arrow />}
            <ArchBlock block={block} />
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs text-ink-500 dark:text-ink-400">
        <span className="flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded border ${EMBED_COLOR} ${EMBED_BORDER} inline-block`} />
          Embedding / PE / LM Head
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded border ${ATTN_COLOR} ${ATTN_BORDER} inline-block`} />
          Attention
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded border ${FFN_COLOR} ${FFN_BORDER} inline-block`} />
          FFN / MoE
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded border ${NORM_COLOR} ${NORM_BORDER} inline-block`} />
          Norm
        </span>
      </div>
    </div>
  )
}

// ── Model Comparison Table ────────────────────────────────────────────────────

const TABLE_ROWS = [
  {
    model: 'GPT-2',
    total: '1.5B',
    active: '1.5B',
    layers: '48',
    hidden: '1600',
    attention: 'MHA 25H',
    ffn: 'Dense GELU',
    experts: '—',
    context: '1K',
    pe: 'Absolute',
  },
  {
    model: 'Qwen3-8B',
    total: '8B',
    active: '8B',
    layers: '36',
    hidden: '4096',
    attention: 'GQA 32Q/8KV',
    ffn: 'Dense SwiGLU',
    experts: '—',
    context: '40K',
    pe: 'RoPE 1M',
  },
  {
    model: 'DeepSeek-V3',
    total: '671B',
    active: '37B',
    layers: '61',
    hidden: '7168',
    attention: 'MLA 128H',
    ffn: 'MoE SwiGLU',
    experts: '256+1 top-8',
    context: '163K',
    pe: 'YaRN',
  },
  {
    model: 'DeepSeek-R1',
    total: '671B',
    active: '37B',
    layers: '61',
    hidden: '7168',
    attention: 'MLA 128H',
    ffn: 'MoE SwiGLU',
    experts: '256+1 top-8',
    context: '163K',
    pe: 'YaRN',
  },
  {
    model: 'GPT-OSS-20B',
    total: '21B',
    active: '3.6B',
    layers: '24',
    hidden: '2880',
    attention: 'GQA 64Q/8KV + sliding',
    ffn: 'MoE SwiGLU',
    experts: '32 top-4',
    context: '131K',
    pe: 'YaRN',
  },
  {
    model: 'GPT-OSS-120B',
    total: '117B',
    active: '5.1B',
    layers: '36',
    hidden: '2880',
    attention: 'GQA 64Q/8KV + sliding',
    ffn: 'MoE SwiGLU',
    experts: '128 top-4',
    context: '131K',
    pe: 'YaRN',
  },
]

const TH = 'px-3 py-2 text-left text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wide whitespace-nowrap'
const TD = 'px-3 py-2 text-xs font-mono whitespace-nowrap'

export function ModelComparisonTable() {
  return (
    <div className="my-8 overflow-x-auto rounded-xl border border-ink-200 dark:border-ink-700">
      <table className="w-full text-sm">
        <thead className="bg-ink-50 dark:bg-ink-800">
          <tr>
            <th className={TH}>Model</th>
            <th className={TH}>Total</th>
            <th className={TH}>Active</th>
            <th className={TH}>Layers</th>
            <th className={TH}>Hidden</th>
            <th className={TH}>Attention</th>
            <th className={TH}>FFN</th>
            <th className={TH}>Experts</th>
            <th className={TH}>Context</th>
            <th className={TH}>PE</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
          {TABLE_ROWS.map((row, i) => (
            <tr key={i} className="bg-white dark:bg-ink-900 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
              <td className={`${TD} font-semibold font-sans text-ink-800 dark:text-ink-100`}>{row.model}</td>
              <td className={TD}>{row.total}</td>
              <td className={`${TD} text-teal-700 dark:text-teal-300 font-semibold`}>{row.active}</td>
              <td className={TD}>{row.layers}</td>
              <td className={TD}>{row.hidden}</td>
              <td className={TD}>{row.attention}</td>
              <td className={TD}>{row.ffn}</td>
              <td className={TD}>{row.experts}</td>
              <td className={TD}>{row.context}</td>
              <td className={TD}>{row.pe}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
