# zeroshotmind/open-blog

The open content layer for [zeroshotmind.com](https://zeroshotmind.com) — a technical blog focused on ML systems, inference, training internals, interpretability, and the math behind modern AI.

Posts in this repo are published directly to zeroshotmind.com. Anyone can contribute: open a pull request, and if it fits the site's depth and quality bar, it goes live.

## What gets published here

zeroshotmind.com covers topics like:

- LLM inference systems (batching, KV cache, memory/compute trade-offs)
- Training internals (optimizers, normalization, attention variants)
- Mechanistic interpretability
- Reinforcement learning for language models
- Diffusion models and generative systems
- GPU kernels and systems-level ML
- Mathematical foundations of deep learning

Posts should be technical and substantive. Cheatsheets, deep dives, visual explainers, and interactive posts are all welcome.

## How to contribute

1. Fork this repo
2. Add your post to `posts/YYYY/` (see [CONTRIBUTING.md](CONTRIBUTING.md) for the full spec)
3. Open a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for frontmatter requirements, component rules, and style guidance.

## Repo structure

```
posts/
  2024/          # flat .mdx files (no custom components)
  2025/
    slug.mdx                   # flat post
    slug-with-component/       # post + its React component
      index.mdx
      MyComponent.tsx
  2026/
POST_TEMPLATE.mdx   # starter template
CONTRIBUTING.md
```
