                    User Opens/Updates PR
                             │
                             ▼
                  GitHub Action Trigger
                             │
                             ▼
                     Get Git Diff
                             │
                             ▼
                  Build Structured Prompt
                             │
                             ▼
              Provider Abstraction Layer
      (OpenAI | Claude | Gemini | Azure OpenAI
          | OpenRouter | NVIDIA-hosted)
                             │
                             ▼
                  JSON Review Response
                             │
                             ▼
                   Response Validation
                             │
                             ▼
          GitHub REST API Inline Comments


Design Decisions
──────────────────────────────────────────────
• Common interface for multiple LLM providers (easy to switch providers without changing the workflow).
• Process one file at a time.
• Ignore non-source files.
• Chunk large diffs for token limits.
• Process files in parallel with configurable concurrency.
• Independent file processing isolates failures.
