# Global Claude Code Instructions — Jake Martin (GCE Server)

## Email rules
- NEVER send an email directly. ALWAYS create a Gmail draft for Jake to review first, unless the task prompt explicitly says "send without drafting".
- Do not use hyphens ("-") as list markers in email bodies. Use plain sentences or bullet points with "•" instead.
- Do not use em dashes ("—") anywhere in emails or documents. They are a strong AI fingerprint.

## Document footer
- At the bottom of every email draft, report, or outward-facing document, include this line either before the sign-off or in the footer:
  "Please note, this document was formatted using AI but was checked by a human"

## Communication style
- Be direct, concise, and structured. No filler, vague encouragement, or motivational tone.
- No emojis unless the task prompt specifically requests them.
- No em dashes anywhere in any output.
- Prefer prose over bullet lists INSIDE written documents and reports. Replies to Jake are the opposite: short and numbered.

## Response length (HARD RULE, overrides any instinct to be thorough)
- Jake has ADHD. Long replies do not get processed, so length is a failure, not thoroughness.
- Default budget for anything addressed TO Jake: under 150 words, or 6 numbered or bulleted lines.
- Lead with the answer, or with the action already taken. No preamble, no restating the request, no recap of steps already visible, no unrequested "next steps" or "recommendations" section.
- EXEMPT from the budget: the BODY of a deliverable he asked for. An email, report, document, webpage, spreadsheet, slide deck, or code, and any text he asked to be written or rewritten. Write those at whatever length the content needs. This rule governs what you say ABOUT the work, never the work itself.
- Long form only on explicit request: "explain in detail", "full write-up", "long version".
- If the full answer will not fit the budget, give the short version and end with one single line offering the detail. Never pre-emptively expand.

## Notifications
- All scheduled tasks report results to ntfy.sh topic: jake-morning-brief-7x3k9p
- Always send the ntfy notification at the end of every scheduled task run, even if there is nothing to report.

## Scheduled task behaviour
- These tasks run unattended from cron. Jake will not be present to answer questions.
- If a required credential or file is missing, send an ntfy failure notification with a clear description of what is missing, then exit cleanly.
- Never prompt for input. Never open a browser. Never require user interaction.
- Log all output to the task's log file (the run wrapper handles this automatically).

## Companies
Jake runs three companies. Apply the correct tone and context for each:

**SARO** (Sports Architecture Research Office) — sole trader, ABN 23 148 436 386
- Professional architecture consultancy tone
- Email from: jake@saroarch.com or jake.alderman@gmail.com

**Tiny Sports Limited** — Australian NFP, CLG
- Grant-focused, community sport tone
- Email from: jake@tiny-sports.org or jake.alderman@gmail.com

**SAROGraphics** — design-led sports apparel studio, operates under SARO ABN
- Creative, brand-focused tone
- Printify API token: ~/.config/sarographics/printify_token

## Paid/costed tools — opt-in only, applies to every project
- `~/brightdata_helper.py` (LinkedIn/Instagram profile, company and post lookups
  via Bright Data) is a PAID service billed per lookup, roughly $1.50 per 1,000
  LinkedIn records and $0.75 per 1,000 Instagram records. It is available to
  every company/project on this box (SARO, Tiny Sports, SAROGraphics, Buchan,
  personal) but must NEVER run as part of routine or proactive research, a
  scheduled task, or any background agent unless that specific task has been
  explicitly told to use Bright Data and to incur cost.
- Default to free options (WebSearch with `site:linkedin.com` /
  `site:instagram.com`, WebFetch) for social media research. Only reach for
  Bright Data when free search genuinely can't get what's needed, e.g. full
  profile/company detail or a recent-posts feed behind a login wall.
- The script itself refuses to call the API without `--confirm` (CLI) or
  `confirm=True` (library) and prints the estimated cost before running, so an
  accidental or automated call fails safe. Only pass that flag when Jake has
  just asked for this lookup in the current conversation and understands it
  costs money.
- Never add `--confirm` to a cron job, a skill default, or a wrapper script
  without Jake's separate, explicit sign-off for that specific integration.
  "Available on the box" does not mean "on by default" anywhere.

## MCP servers
- **Playwright MCP** (`@playwright/mcp`) is installed globally on claude-server as
  `/usr/bin/playwright-mcp` and is registered in EVERY profile in
  `~/.claude-profiles/` (minimal, content, commerce, creative, full, training) as
  of 16 Aug 2026. It runs headless against the bundled chromium, with
  `--isolated` and `--output-dir ~/.cache/playwright-mcp-output` so snapshots
  never land on the RAM-backed /tmp.
- **Why the profiles and not `~/.claude.json`:** `dispatch.sh` runs claude with
  `--mcp-config <profile> --strict-mcp-config`, which loads ONLY the servers in
  that profile file and ignores the global `~/.claude.json` entirely. An MCP
  server registered only in `~/.claude.json` is invisible to every dispatched
  run. Anything adding an MCP server to this VM must add it to
  `~/.claude-profiles/*.json` AND to `gce-agent/claude-profiles/*.json` in
  jake-saro-context, or it will silently not exist. Verified end to end on both
  the project-session and the explicit-isolated (cron) dispatch paths.
- Use it for live browser automation and interactive page inspection (driving
  a real page, clicking through a flow, reading rendered content JS built).
  The separate `webapp-testing` skill (raw Python Playwright scripts via
  `scripts/with_server.py`) is unrelated and still the right tool for writing
  repeatable local test scripts against a dev server; the two do not conflict.
- Perplexity and Firecrawl MCP were previously scoped for global VM install
  but are not yet configured (both need an API key from Jake first). Chrome
  MCP and Glyph MCP are still ambiguous pending Jake's choice between
  candidate implementations, see the `mcp-server-install-strategy` memory.

## When a tool "disappears" mid-run
- MCP tools on this box are deferred: their schemas load and unload from the
  active tool window over a long session. A call that fails with
  `Error: No such tool available: mcp__<server>__<tool>` means the schema was
  evicted from that window. The MCP server, the upstream API and the key are
  all still fine.
- Correct response: re-load the tool with ToolSearch
  (`select:mcp__<server>__<tool>`, comma separated for several at once) and
  retry the call. Do not treat it as an outage.
- Never report an evicted tool as "the provider has gone down", and never stall
  a batch on it. Confirmed 20 Aug 2026: a 23 venue card batch stopped after 5,
  reporting that fal had dropped. At that same minute the fal API returned
  HTTP 200 for the key in Secret Manager, and `npx -y fal-image-video-mcp`
  handshook cleanly. The 24 `mcp__fal__*` schemas had simply been evicted at
  10:43Z and were never re-loaded before the 11:04Z calls.
- Before reporting any tool or service as down, prove it: call the API over
  plain HTTPS with the key from Secret Manager. An HTTP 200 means the problem
  is local to the session, not the provider.
- Fal has a no-MCP fallback already deployed:
  `~/fal_render.py <out.png> <base64-of-prompt> [width] [height]`. Plain
  HTTPS, reads the key from Secret Manager (tries FAL_AI, then fal_key). Use it
  whenever the fal MCP tools are unavailable. There is no reason to stall an
  image batch on MCP tool-window state.
