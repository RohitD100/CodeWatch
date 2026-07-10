---
name: ai-review-batching
description: Batch AI review comments, truncate bodies, skip config files, and handle provider setup for OpenAI/NVIDIA.
source: auto-skill
extracted_at: '2026-07-10T08:30:00.000Z'
---

## Overview
This skill encapsulates the pattern used in the **CodeWatch** GitHub Action to generate AI‑driven code review comments efficiently and within provider rate limits.

### Key Steps
1. **Collect changed files** using `getChangedFilesWithPatch`.
2. **Skip configuration files** (`package.json`, `package-lock.json`) to avoid unnecessary comments.
3. **Generate comments** per file via `generateReviewComments`.
4. **Truncate comment bodies** to 200 characters (or 197 + `...`) to keep token usage low.
5. **Batch posting**: GitHub allows up to **40 comments** per `createReview` request. The code slices the comment list into batches of `MAX_PER_BATCH = 40` and posts each batch with a single review.
6. **Provider abstraction**:
   - **OpenAI** provider uses `axios` for direct API calls.
   - **NVIDIA** provider leverages the **OpenAI SDK** pointed at NVIDIA’s `integrate.api.nvidia.com` endpoint.
7. **Logging** for each major action (`logInfo`, `logWarning`, `logError`).
8. **Output** the total number of posted comments via `core.setOutput`.

### Benefits
- **Rate‑limit friendly**: respects the 40‑comment limit and reduces token consumption.
- **Scalable**: supports multiple comments per file rather than a single short comment.
- **Configurable**: works with either OpenAI or NVIDIA LLM providers.
- **Cleaner PRs**: skips boilerplate config files, focusing reviewer attention on code.

## Usage
The skill is applied in `src/index.ts`. To adapt it to another project:
- Adjust the file‑skip list as needed.
- Change `MAX_PER_BATCH` if the target platform has different limits.
- Ensure the appropriate provider credentials are supplied via action inputs or environment variables.

---
