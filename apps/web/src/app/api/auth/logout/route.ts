import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    // Best-effort call to the Express API to clear its own cookies
    if (token) {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { Cookie: `accessToken=${token}` },
      }).catch(() => undefined);
    }

    // Clear the cookie on the frontend domain
    cookieStore.delete('accessToken');

    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch {
    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  }
}
