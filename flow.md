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
       LLM Provider (OpenAI/Claude/
      Gemini/NVIDIA/OpenRouter...)
                   │
         JSON Review Response
                   │
                   ▼
          Response Validation
                   │
                   ▼
      GitHub REST API Comments
