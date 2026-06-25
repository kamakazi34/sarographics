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
- Prefer prose over bullet lists for reports and documents.

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
