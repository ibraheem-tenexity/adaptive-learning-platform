import OpenAI from 'openai';

let _client: OpenAI | null = null;

export function getPlannerClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY || 'mock',
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://adaptive-learning.example.com',
        'X-Title': 'Adaptive Learning Platform',
      },
    });
  }
  return _client;
}

export const PLANNER_MODEL = 'openai/gpt-4o-mini';
export const MAX_RETRIES = 3;
