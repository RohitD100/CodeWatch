import * as core from '@actions/core';
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
      temperature: 0.2,
    };
    try {
      const resp = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        payload,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        },
      );
      return resp.data.choices?.[0]?.message?.content ?? '';
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logError(`OpenAI request failed: ${message}`);
      throw err;
    }
  }
}

// NVIDIA provider using integrate API
class NvidiaProvider implements LLMProvider {
  name = 'nvidia';
  private apiKey: string;
  private model: string;
  private baseURL = 'https://integrate.api.nvidia.com/v1';

  constructor(apiKey: string, model: string = 'meta/llama-3.3-70b-instruct') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async sendPrompt(prompt: string, model?: string): Promise<string> {
    const payload = {
      model: model ?? this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 1024,
      stream: false,
    };
    try {
      const resp = await axios.post(
        `${this.baseURL}/chat/completions`,
        payload,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        },
      );
      return resp.data.choices?.[0]?.message?.content ?? '';
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logError(`NVIDIA request failed: ${message}`);
      throw err;
    }
  }
}

// Placeholder for other providers – they can be implemented similarly.

export function createLLMProvider(): LLMProvider {
  const provider = core.getInput('llm_provider');
  if (!provider) {
    throw new Error('LLM_PROVIDER not set');
  }
  const apiKey = core.getInput("nvidia_api_key"); 
  if (!provider) {
    logError('LLM_PROVIDER environment variable not set');
    throw new Error('LLM_PROVIDER not set');
  }
  if (provider === 'openai') {
    if (!apiKey) {
      logError('OPENAI_API_KEY not set');
      throw new Error('OPENAI_API_KEY not set');
    }
    const model = core.getInput('model') ?? 'gpt-4o';
    return new OpenAIProvider(apiKey, model);
  }
  if (provider === 'nvidia') {
    const nvidiaKey = core.getInput('nvidia_api_key');
    if (!nvidiaKey) {
      logError('NVIDIA_API_KEY not set');
      throw new Error('NVIDIA_API_KEY not set');
    }
    const model =
      core.getInput('nvidia_model') ?? 'meta/llama-3.3-70b-instruct';
    return new NvidiaProvider(nvidiaKey, model);
  }
  // Future: add Anthropic, Gemini, Azure, OpenRouter
  logError(`LLM provider ${provider} not implemented`);
  throw new Error(`LLM provider ${provider} not implemented`);
}
