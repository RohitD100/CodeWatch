export const SUPPORTED_PROVIDERS = ['openai', 'anthropic', 'gemini', 'azure', 'openrouter', 'nvidia'] as const;
export type ProviderName = typeof SUPPORTED_PROVIDERS[number];
