# SAROGraphics Operating System

How the pieces fit together. This is the reference the GCE server and any automation should read.

## Notion (operating hub, source of truth for live data)

**Hub page:** https://app.notion.com/p/388acd427eee8156a4f3e7f8a3d60f0a

| Database | Data source ID | Purpose |
|----------|----------------|---------|
| CRM / Contacts | `c8bb231c-30fc-4e5e-980c-e9187f2b31bb` | Clubs, athletes, suppliers, commission contacts |
| Deal Pipeline | `0198fc75-b2eb-4877-837d-97ef34154c31` | Enquiry to delivered; linked to Contacts |
| Order Tracker | `c57e9c44-170a-47eb-b1de-ee6dc2cdd6de` | Production orders; deposit + size-breakdown gates |
| Design Backlog | `e22e5d75-482c-4216-9cb4-f1f8804bc81b` | Idea to published; tagged by stream |
| Content Calendar | `cb22c32f-ebd4-4a42-b36c-7b21725801fb` | Posts by pillar/platform; linked to designs |
| Tasks | `1ce58221-8a6e-4c50-b998-e566237f24c0` | Dated launch + recurring tasks, by quarter/area |

## Make.com (automation engine)

Existing scenarios under the SAROGraphics prefix. Core scenario **5012771** watches the New Designs Drive folder, drafts an Etsy listing via Claude, logs to the finance tracker, and emails a checklist. Blocked on: Anthropic API key (module 3 `x-api-key`) and Etsy developer app approval.

Planned extension: also draft a social caption per design and create a Notion Design Backlog + Content Calendar row.

## Google Drive (backup layer)

Scheduled export of Notion databases to Drive so nothing lives in only one place. Mirrors the existing finance-tracker backup pattern.

## GCE server (`claude-server`)

Always-on Ubuntu VM running Claude Code with GitHub, Notion, Fal, DrawIO and Etsy MCPs. Role for SAROGraphics:

- Autonomous background tasks via Telegram (`@Jake_claude_server_bot`).
- Weekly operating brief: read Notion Tasks due in the next 7 days plus the pipeline, and message Jake.
- Reads this repo for current plan and system state.

## Email rule

All outward emails are drafted and saved for review, never auto-sent, unless Jake says otherwise.

_Formatted using AI, checked by a human._
