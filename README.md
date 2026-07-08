# CodeWatch GitHub Action

**AI‑powered pull request reviewer** that sends changed files and diffs to a configurable large language model (LLM) and posts inline review comments for detected bugs, security issues, performance problems, code smells, and best‑practice violations.

## Features

- Supports multiple LLM providers: OpenAI, Anthropic, Gemini, Azure OpenAI, OpenRouter (implemented for OpenAI, others can be added).
- Automatic detection of changed files in a pull request.
- Generates detailed review comments using a structured JSON response from the LLM.
- Posts comments inline on the PR using the GitHub REST API.
- Fully typed TypeScript code, linted, formatted, and bundled with `@vercel/ncc`.
- Tested with Vitest.

## Usage

Create a workflow file (e.g., `.github/workflows/codewatch.yml`) that runs on `pull_request` events:

```yaml
name: CodeWatch Review
on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Run CodeWatch
        uses: ./
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          llm_provider: openai
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          openai_model: gpt-4o
```

### Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `github_token` | GitHub token for API access (automatically provided by GitHub Actions) | Yes | `${{ github.token }}` |
| `llm_provider` | LLM provider name (`openai`, `anthropic`, `gemini`, `azure`, `openrouter`) | Yes | `openai` |
| `openai_api_key` | API key for OpenAI (required when `llm_provider` is `openai`) | No | – |
| `openai_model` | Model name for OpenAI (e.g., `gpt-4o`) | No | `gpt-4o` |

### Environment Variables

The action also reads the same variables as inputs via `process.env` for flexibility.

## Development

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Run tests**
   ```bash
   npm test
   ```
3. **Lint and format**
   ```bash
   npm run lint
   npm run format
   ```
4. **Build the bundled action**
   ```bash
   npm run build
   ```
   The output is placed in `dist/index.js` and used by the action.

## License

MIT License. See `LICENSE` for details.
