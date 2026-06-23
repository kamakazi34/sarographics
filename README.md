# SAROGraphics

Design-led sports apparel and graphics studio, operating under **SARO sole trader** (ABN 23 148 436 386). Successor brand to Sarah Wild Designs (transitioned May 2026).

## What is in this repo

| Path | Purpose |
|------|---------|
| `index.html` | Landing page (deploys to sarographics.com via Cloudflare Pages) |
| `docs/business-plan.md` | The 12-month business plan (v1.1) |
| `docs/operating-system.md` | How the systems fit together: Notion, Make.com, the GCE server, Drive backups |
| `docs/CHANGELOG.md` | Plan and system change log |

## The thesis

SAROGraphics is a **design house**, not a manufacturer. Jake designs; established Australian sublimation suppliers manufacture. Revenue = design fee + per-unit margin. Low capital, low risk, scalable.

## Revenue streams (priority order)

1. Custom sports apparel (lead)
2. Private commissions
3. Digital downloads (passive)
4. Print-on-demand via Etsy / Redbubble (passive)

## Live systems

- **Notion** is the operating hub (CRM, pipeline, orders, design backlog, content calendar, tasks).
- **Make.com** runs the automation stack (listing drafting, finance logging, buyer comms).
- **GCE server** (`claude-server`) runs autonomous background tasks and has GitHub + Notion access.

_Formatted using AI, checked by a human._
