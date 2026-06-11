import { cookies } from 'next/headers';

export async function getServerToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('accessToken')?.value;
}

export function parseJwtPayload(token: string): { sub: string; email: string; role: string } | null {
  try {
    const base64 = token.split('.')[1];
    const decoded = Buffer.from(base64, 'base64url').toString('utf8');
    return JSON.parse(decoded) as { sub: string; email: string; role: string };
  } catch {
    return null;
  }
}
