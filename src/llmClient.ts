import axios from 'axios';
import { LLMProvider } from './types';
import { logError } from './logger';

class OpenAIProvider implements LLMProvider {
  name = 'openai';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async sendPrompt(prompt: string, model?: string): Promise<string> {
    const payload = {
      model: model ?? this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    };
    try {
      const resp = await axios.post('https://api.openai.com/v1/chat/completions', payload, {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });
      return resp.data.choices?.[0]?.message?.content ?? '';
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logError(`OpenAI request failed: ${message}`);
      throw err;
    }
  }
}

// Placeholder for other providers – they can be implemented similarly.

export function createLLMProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER?.toLowerCase();
  const apiKey = process.env.OPENAI_API_KEY; // default for OpenAI
  if (!provider) {
    logError('LLM_PROVIDER environment variable not set');
    throw new Error('LLM_PROVIDER not set');
  }
  if (provider === 'openai') {
    if (!apiKey) {
      logError('OPENAI_API_KEY not set');
      throw new Error('OPENAI_API_KEY not set');
    }
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o';
    return new OpenAIProvider(apiKey, model);
  }
  // Future: add Anthropic, Gemini, Azure, OpenRouter
  logError(`LLM provider ${provider} not implemented`);
  throw new Error(`LLM provider ${provider} not implemented`);
}
