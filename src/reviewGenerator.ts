import { LLMProvider } from './types';
import { logError } from './logger';
import { ReviewComment } from './types';

export async function generateReviewComments(provider: LLMProvider, diff: string, filePath: string): Promise<ReviewComment[]> {
  const prompt = `You are an expert code reviewer. Analyze the following diff for ${filePath} and identify any bugs, security vulnerabilities, performance problems, code smells, or best‑practice violations. Respond with a JSON array of objects with fields: path, line (the line number in the new file), and body (the review comment). Only return the JSON array, nothing else.\n\n${diff}`;
  try {
    const response = await provider.sendPrompt(prompt);
    // Try to parse JSON safely.
    const jsonStart = response.indexOf('[');
    const jsonStr = jsonStart !== -1 ? response.slice(jsonStart) : response;
    const data: ReviewComment[] = JSON.parse(jsonStr);
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logError(`Failed to generate review comments for ${filePath}: ${message}`);
    throw err;
  }
}
