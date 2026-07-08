import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { createLLMProvider } from './llmClient';

vi.mock('axios');

beforeEach(() => {
  vi.resetAllMocks();
  process.env.LLM_PROVIDER = 'openai';
  process.env.OPENAI_API_KEY = 'test-key';
});

describe('OpenAIProvider', () => {
  it('sends request and returns content', async () => {
    const fakeResponse = { data: { choices: [{ message: { content: 'Review result' } }] } };
    vi.spyOn(axios, 'post').mockResolvedValue(fakeResponse);
    const provider = createLLMProvider();
    const result = await provider.sendPrompt('test prompt');
    expect(result).toBe('Review result');
    expect(axios.post).toHaveBeenCalled();
  });
});
