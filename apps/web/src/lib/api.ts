import type {
  ApiResponse,
  PaginatedApiResponse,
  Submission,
  Stats,
  AIAnalysis,
  User,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

//─── Auth ────────────────────────────────────────────────────────────────────

// Login/logout go through Next.js Route Handlers so the httpOnly cookie is
// set on the frontend domain — the only place Next.js middleware can read it.
export async function login(email: string, password: string): Promise<{ user: User; accessToken: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = (await res.json()) as ApiResponse<{ user: User; accessToken: string }>;
  if (!res.ok || !json.success) throw new ApiError(res.status, json.message ?? 'Login failed');
  return json.data!;
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
}

// ─── Submissions ─────────────────────────────────────────────────────────────

export interface SubmissionFilters {
  status?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getSubmissions(
  filters: SubmissionFilters = {},
  token?: string
): Promise<PaginatedApiResponse<Submission>['data'] extends undefined ? never : { data: Submission[]; pagination: PaginatedApiResponse<Submission>['pagination'] }> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const qs = params.toString();
  const res = await fetch(`${API_BASE}/api/submissions${qs ? `?${qs}` : ''}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });

  const json = (await res.json()) as PaginatedApiResponse<Submission>;
  if (!res.ok || !json.success) throw new ApiError(res.status, json.message);
  return { data: json.data ?? [], pagination: json.pagination };
}

export async function getSubmission(id: string, token?: string): Promise<Submission> {
  const res = await fetch(`${API_BASE}/api/submissions/${id}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
  const json = (await res.json()) as ApiResponse<Submission>;
  if (!res.ok || !json.success) throw new ApiError(res.status, json.message);
  return json.data!;
}

export async function getStats(token?: string): Promise<Stats> {
  const res = await fetch(`${API_BASE}/api/stats`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
  const json = (await res.json()) as ApiResponse<Stats>;
  if (!res.ok || !json.success) throw new ApiError(res.status, json.message);
  return json.data!;
}

export async function updateSubmissionStatus(
  id: string,
  status: 'APPROVED' | 'REJECTED',
  reason?: string
): Promise<Submission> {
  // Proxied through Next.js so the httpOnly cookie is forwarded as Bearer token
  const res = await fetch(`/api/proxy/submissions/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, reason }),
  });
  const json = (await res.json()) as ApiResponse<Submission>;
  if (!res.ok || !json.success) throw new ApiError(res.status, json.message ?? 'Request failed');
  return json.data!;
}

export async function triggerAnalysis(id: string): Promise<AIAnalysis> {
  // Proxied through Next.js so the httpOnly cookie is forwarded as Bearer token
  const res = await fetch(`/api/proxy/analyse/${id}`, { method: 'POST' });
  const json = (await res.json()) as ApiResponse<AIAnalysis>;
  if (!res.ok || !json.success) throw new ApiError(res.status, json.message ?? 'Request failed');
  return json.data!;
}

export async function seedSubmissions(): Promise<void> {
  // Proxied through Next.js so the httpOnly cookie is forwarded as Bearer token
  const res = await fetch('/api/proxy/admin/seed', { method: 'POST' });
  const json = (await res.json()) as ApiResponse<void>;
  if (!res.ok || !json.success) throw new ApiError(res.status, json.message ?? 'Request failed');
}

export { ApiError };
