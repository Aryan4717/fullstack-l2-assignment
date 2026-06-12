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

async function fetchApi<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.message ?? 'Request failed');
  }

  return json.data as T;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

// Login and logout go through Next.js Route Handlers so cookies are set on
// the frontend domain — the only domain where Next.js middleware can read them.
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
  return fetchApi(`/api/submissions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason }),
  });
}

export async function triggerAnalysis(id: string): Promise<AIAnalysis> {
  return fetchApi(`/api/analyse/${id}`, { method: 'POST' });
}

export async function seedSubmissions(): Promise<void> {
  return fetchApi(`/api/admin/seed`, { method: 'POST' });
}

export { ApiError };
