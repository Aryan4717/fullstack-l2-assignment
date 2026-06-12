import Langfuse from 'langfuse';
import { env } from '../config/env';

let instance: Langfuse | null = null;

export function getLangfuse(): Langfuse | null {
  if (!env.LANGFUSE_PUBLIC_KEY || !env.LANGFUSE_SECRET_KEY) return null;
  if (!instance) {
    instance = new Langfuse({
      publicKey: env.LANGFUSE_PUBLIC_KEY,
      secretKey: env.LANGFUSE_SECRET_KEY,
      baseUrl: env.LANGFUSE_HOST,
    });
  }
  return instance;
}
