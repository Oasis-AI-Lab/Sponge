# Site Plan — Sponge paradigm site (Aurora UI)

Status: planning | Date: 2026-08-23 | Owner: Sponge R&D

## 1. Goal

A bilingual (English first, Chinese under `/zh/`) static site presenting the Sponge
paradigm: landing + paradigm argumentation + concept dictionary + ecosystem + docs/paper
entry. Visual style: **Aurora UI** (dark night + aurora gradients + glassmorphism).

## 2. Stack (decided)

- **Astro** ^5 — static-first, official i18n routing, zero default JS.
- Standalone package (not in the pnpm workspace): `npm install --no-workspaces`.
- i18n: `locales: ["en", "zh"]`, `defaultLocale: "en"`, EN at root, ZH under `/zh/`.

## 3. Current state

| Item | Files |
|---|---|
| Project scaffold | `package.json` · `astro.config.mjs` · `tsconfig.json` · `README.md` |
| Aurora design system | `src/styles/tokens.css` · `src/styles/global.css` |
| Global frame | `src/components/Aurora.astro` (bg) · `Nav.astro` · `Footer.astro` · `src/layouts/Base.astro` |
| Landing (both locales) | `src/data/landing.ts` · `src/components/Landing.astro` · `src/pages/index.astro` · `src/pages/zh/index.astro` |
| Content pages (both locales) | `src/data/content.ts` (shared model) · `src/data/paradigm.ts` · `src/data/concepts.ts` · `src/data/ecosystem.ts` · `src/data/docs.ts` · `src/data/paper.ts` |
| Content layout | `src/layouts/ContentLayout.astro` · `src/components/ContentPage.astro` · `src/components/ConceptIndex.astro` · `src/components/ConceptPage.astro` |
| Content routes | `paradigm/` · `concepts/` (+10 per locale) · `ecosystem/` · `docs/` · `paper/` |
| Deps | `npm install` done (3 vulnerabilities reported by npm audit — to review) |

Landing sections (approved outline): Hero → 缺陷论 (C1) → 三机制 (slice/AgentPark/scheduler, scheduler glows) → 五野心 → 生态 (Statuz—Sponge—derivatives) → MVP 状态 → CTA.

## 4. Scope

### In scope
- Landing (built) + content pages (below) in EN and ZH.
- Aurora UI design system; responsive; `prefers-reduced-motion`.
- Content sourced from 研发 notes (00-06) and impl/SPEC.

### Out of scope (do not build now)
- Backend / CMS / analytics.
- Full 论文 (paper) content — only an entry page.
- Anything beyond the approved outline.

## 5. Phases

### Phase C — Content pages ✅ (2026-08-25)
Pages (EN root + ZH under `/zh/`), each: 定位一句话 → 论述 → 边界 → 状态徽章 → 关联链接:
- `paradigm/` — vision (00), argument (01), falsify (证伪条款)
- `concepts/` — one page per abstract class: slice · element · infosource · channel ·
  scene · translator · receiver · agentpark · op-domain · subject(🟡提案)
  - layout: left nav (status badges ✅/🟡/⚠️) + right content card
- `ecosystem/` — Statuz / WAM / Lemma / Sandboxer (03 修正版生态位)
- `docs/` — entry to impl/SPEC + 契约 + PLAN (content mirrored or linked)
- `paper/` — entry page (英文线入口)

Exit: all routes resolve in both locales; nav links no longer 404. — **Done: 32 routes built, astro check clean, preview verified.**

### Phase D — Verification
- `npm run build` green (both locales).
- `npm run check` (astro check) clean.
- Manual preview: landing sections, nav, locale switch, mobile width, reduced motion.

### Phase E — Polish ✅ (2026-08-25)
- Fonts (Space Grotesk / Inter + Noto Sans SC) — **Google Fonts CDN**, wired in `Base.astro` head
- favicon (aurora mark) — **`public/favicon.svg`** (gradient mark)
- OG meta — **`Base.astro`**: per-locale `og:locale`, `og:image` from **`public/og.png`** (2560×1440, authored via `src/assets/og.svg` → sharp rasterize)
- 404 page — **`src/pages/404.astro` + `src/components/NotFound.astro`**: single static fallback; a tiny inline script localizes it by `/zh/` path (en/zh verified)
- npm audit review (3 vulnerabilities from install) — **documented to defer** (see below)

## 6. Milestones

| Milestone | Exit |
|---|---|
| S0 | Plan approved (this doc) |
| S1 | Landing verified (build green, preview OK) — **done 2026-08-25** |
| S2 | Content pages done in EN + ZH — **done 2026-08-25** |
| S3 | Verification + polish done — **done 2026-08-25** |
| S4 | Deploy to GitHub Pages — **configured 2026-08-25** (`.github/workflows/site-pages.yml`; base-aware links via `src/lib/link.ts`; deploy URL `https://oasis-ai-lab.github.io/Sponge/`) |

## 8. npm audit — status & decision (2026-08-25)

`npm audit` reports 3 vulnerabilities (1 low, 2 high), all from the `astro <=7.0.9` dependency chain:
- **astro** itself — multiple XSS / reflected-XSS / server-island replay / host-header SSRF advisories
- **esbuild** — arbitrary file read **only when running the dev server on Windows**
- **sharp** — libvips CVEs (image processing, unused at build/runtime here)

**All fixes require `astro@7.2.6`, a breaking major upgrade (5 → 7).**

Decision: **defer.** The site is static-only, ships zero default JS, and exercises none of the affected runtime paths (no server islands, view transitions, spread props, slot names, or define:vars). SSRF targets request-time server features that a static build never runs. Impact = low in practice; a breaking major upgrade conflicts with the current stability-first posture. **Deployment target now GitHub Pages (2026-08-25)** — revisit the upgrade once the site is live and traffic is real, then take either (a) upgrade to Astro 7 + re-verify the full build, or (b) apply platform-specific mitigations.

## 9. Open decisions for the team

1. Keep the already-created scaffold/landing as-is, or restart? — **kept as-is**
2. Content strategy per page: full translation (EN+ZH) vs EN full + ZH summary? — **full translation (EN+ZH)**
3. Docs pages: mirror impl/SPEC content, or link out? — **entry page; content mirrored as summarized sections**
4. Fonts: Google Fonts (CDN) vs self-hosted (offline-friendly)? — **Google Fonts CDN**
5. Deployment target (GitHub Pages / Vercel / none)? — **GitHub Pages (2026-08-25)**: no extra account, repo already on GitHub, Pages currently unused (docs-pages.yml never ran). Site deploys to `https://oasis-ai-lab.github.io/Sponge/`. Note: a future `docs-pages.yml` run would overwrite the Pages site — decide docs hosting separately if the docs site is ever needed.
