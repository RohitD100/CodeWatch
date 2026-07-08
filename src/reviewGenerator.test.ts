import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateReviewComments } from './reviewGenerator';
import { LLMProvider } from './types';

const mockProvider: LLMProvider = {
  name: 'openai',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async sendPrompt(_prompt: string) {
    return JSON.stringify([
      { path: 'src/index.ts', line: 10, body: 'Potential issue detected.' }
    ]);
  }
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('generateReviewComments', () => {
  it('parses LLM response into ReviewComment objects', async () => {
    const diff = '--- a/src/index.ts\n+++ b/src/index.ts\n@@ -1,2 +1,3 @@\n+console.log(\'test\');';
    const comments = await generateReviewComments(mockProvider, diff, 'src/index.ts');
    expect(comments).toHaveLength(1);
    expect(comments[0]).toEqual({ path: 'src/index.ts', line: 10, body: 'Potential issue detected.' });
  });
});
