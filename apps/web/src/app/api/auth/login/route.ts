import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Server-to-server URL — never exposed to the browser
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email: string; password: string };

    const apiRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = (await apiRes.json()) as {
      success: boolean;
      data?: { user: unknown; accessToken: string };
      message?: string;
    };

    if (!apiRes.ok || !data.success || !data.data) {
      return NextResponse.json(data, { status: apiRes.status });
    }

    // Set cookie on the FRONTEND domain so Next.js middleware can read it.
    // The Express API sets it on its own domain — useless for server-side auth checks.
    const cookieStore = await cookies();
    cookieStore.set('accessToken', data.data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
