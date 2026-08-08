# Infrastructure

**Canonical source:** https://github.com/kamakazi34/jake-saro-context/blob/Home/INFRASTRUCTURE.md

Rewritten 8 August 2026 for the Google stack build. Read it before changing anything about hosting, assets or secrets.

## What applies here

This site carries **no Cloudflare assets**, so the R2 migration on 8 August did not touch it. It has no environment variables either.

That makes it the **lowest-risk candidate to move to Firebase App Hosting first**. One caveat before you do: the Vercel project has no framework preset set, and the Firebase console warns that App Hosting supports Node.js apps. Confirm what this actually builds as before migrating, because a pure static site belongs on Firebase Hosting rather than App Hosting.

App Hosting has **no Australian region**. The options are Taiwan, Singapore, Netherlands and three US regions. `asia-southeast1` (Singapore) is the choice already made for this project; Cloud CDN fronts it, so only cache misses cross the Pacific.

## Before you deploy

**Vercel refuses to build if the commit author is not a GitHub-linked user.** The deploy lands in `BLOCKED` with zero build events, so there are no logs to read and it looks like a quota problem. The signal is `seatBlock.blockCode = COMMIT_AUTHOR_REQUIRED` on `/v13/deployments/<id>`. **Commit as `jake.alderman@gmail.com`.**

---

Please note, this document was formatted using AI but was checked by a human.
