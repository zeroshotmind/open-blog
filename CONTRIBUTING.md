# Contributing to zeroshotmind/open-blog

Thanks for wanting to contribute. Posts here are published on [zeroshotmind.com](https://zeroshotmind.com), a technical blog about ML systems and deep learning internals. This guide covers everything you need to know to get a post merged.

---

## Folder structure

**Flat post** (no custom React components):

```
posts/2025/my-post-slug.mdx
```

**Post with a component** (interactive visuals, custom diagrams, etc.):

```
posts/2025/my-post-slug/
  index.mdx
  MyComponent.tsx
```

Place posts under the year matching their `date` frontmatter field.

---

## Frontmatter spec

Every post must include these fields:

```yaml
---
title: "Your Post Title"
slug: my-post-slug
date: "2025-06-15"
summary: "One or two sentences describing what the post covers."
tags:
  - inference
  - llm
authors:
  - name: Your Name
    github: your-github-handle
publishOnZeroShotMind: true
---
```

### Required fields

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | Title as it appears on the site |
| `slug` | string | URL slug — must match the filename/folder name |
| `date` | string | ISO 8601 date: `"2025-06-15"` |
| `summary` | string | Short description shown in post listings |
| `tags` | string[] | Array of topic tags (lowercase, hyphenated) |
| `authors` | object[] | At least one author with `name` and `github` |
| `publishOnZeroShotMind` | boolean | Must be `true` to appear on zeroshotmind.com |

### Optional fields

| Field | Type | Notes |
|-------|------|-------|
| `series` | object | `{ name: "Series Name", order: 1 }` — groups posts into a series |
| `orcid` | string | Per-author ORCID for scholarly posts |
| `draft` | boolean | Set `true` to exclude from all builds |

### Author object

```yaml
authors:
  - name: Your Name
    github: your-github-handle
    orcid: "0000-0000-0000-0000"   # optional
```

---

## Component rules

If your post uses a custom React component:

1. The component file must live **in the same folder** as `index.mdx`
2. Components may only import from:
   - React (`import React from 'react'`)
   - Standard npm packages (e.g., `recharts`, `d3`, `framer-motion`)
   - Other files in the **same folder**
3. Do **not** import from the site's internals — no `@/components/...`, `@/lib/...`, or any path outside the post folder
4. Keep dependencies minimal; prefer widely-used packages

Import the component in your MDX like this:

```mdx
import MyComponent from './MyComponent'

<MyComponent />
```

---

## How to submit

1. **Fork** this repo
2. **Create a branch**: `git checkout -b post/my-post-slug`
3. **Add your post** following the structure and frontmatter spec above
4. **Open a pull request** with a brief description of what the post covers

PRs are reviewed for technical accuracy, clarity, and fit with the site's topics. Expect feedback on both content and structure.

---

## Style guidance

- **Technical depth is the goal.** Assume readers have ML fundamentals; don't pad with basics.
- **Show your work.** Derive equations, explain trade-offs, include worked examples.
- **Interactive components are encouraged.** If a diagram or slider helps intuition, build it.
- **Math is supported** via KaTeX — use `$...$` for inline and `$$...$$` for display math.
- **Code blocks** should be runnable or clearly illustrative — avoid pseudocode that looks like real code.
- **Figures and tables** should have captions. Keep them tight.
- Prefer short paragraphs and clear section headers over walls of text.
