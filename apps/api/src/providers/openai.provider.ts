import OpenAI from 'openai';
import { z } from 'zod';
import { Sentiment, Recommendation } from '@repo/database';
import type { IAnalysisProvider, AnalysisResult } from '../interfaces/providers/IAnalysisProvider';
import { MODERATION_PROMPT } from '../constants/prompts';
import { env } from '../config/env';

const analysisSchema = z.object({
  toxicityScore: z.number().min(0).max(10),
  sentiment: z.nativeEnum(Sentiment),
  summary: z.string().min(1),
  recommendation: z.nativeEnum(Recommendation),
});

export class OpenAIProvider implements IAnalysisProvider {
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      timeout: env.OPENAI_TIMEOUT_MS,
    });
  }

  async analyze(title: string, body: string): Promise<AnalysisResult> {
    const prompt = MODERATION_PROMPT(title, body);

    const response = await this.client.chat.completions.create({
      model: env.OPENAI_MODEL,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const parsed = JSON.parse(content) as unknown;
    const validated = analysisSchema.safeParse(parsed);

    if (!validated.success) {
      throw new Error(`Invalid OpenAI response structure: ${validated.error.message}`);
    }

    return validated.data;
  }
}
