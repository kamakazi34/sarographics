# SAROGraphics

Design-led sports apparel and graphics studio, operating under **SARO sole trader** (ABN 23 148 436 386). Successor brand to Sarah Wild Designs (transitioned May 2026).

## What is in this repo

| Path | Purpose |
|------|---------|
| `index.html` | Landing page (deploys to sarographics.com via **Vercel**, git-connected to `main`) |
| `assets/` | Brand logo SVGs from the v2 identity package (do not recreate the mark; masters live in Drive) |
| `docs/business-plan.md` | The 12-month business plan (v1.1) |
| `docs/operating-system.md` | How the systems fit together: Notion, the GCE server, Drive backups |
| `docs/CHANGELOG.md` | Plan and system change log |

Hosting note: earlier versions of this file said Cloudflare Pages. That was stale; the canonical infrastructure doc is `jake-saro-context/INFRASTRUCTURE.md` (branch `Home`) and it wins over this file on hosting questions.

Brand note: the landing page follows `SAROGraphics_Visual_Identity_v2.md` (August 2026), in the brand package at Drive: `SAROGraphics/02_Projects/000002_Our Logos/03_Brand Package/SAROGraphics/`. Acid Lime `#B8CE1F` on Hot Magenta `#E23E9A`, Bone ground, Ink dark surfaces. Anton is reserved to the mark and is never loaded as a webfont; the SVGs are outlined.

## The thesis

SAROGraphics is a **design house**, not a manufacturer. Jake designs; established Australian sublimation suppliers manufacture. Revenue = design fee + per-unit margin. Low capital, low risk, scalable.

## Revenue streams (priority order)

1. Custom sports apparel (lead)
2. Private commissions
3. Digital downloads (passive)
4. Print-on-demand via Etsy / Redbubble (passive)

## Live systems

- **Notion** is the operating hub (CRM, pipeline, orders, design backlog, content calendar, tasks).
- **GCE server** (`claude-server`) runs autonomous background tasks and has GitHub + Notion access. Automation is native on Google Cloud; Make.com is decommissioned.

_Formatted using AI, checked by a human._
