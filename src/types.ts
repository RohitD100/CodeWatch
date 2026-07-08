export interface LLMProvider {
  name: string;
  sendPrompt(prompt: string, model?: string): Promise<string>;
}

export interface ReviewComment {
  path: string;
  line: number;
  body: string;
}
