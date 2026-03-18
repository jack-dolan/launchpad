const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface ApiErrorShape {
  detail?: string;
  message?: string;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = (await readJson<ApiErrorShape>(response)) ?? {};
    const message = body.detail ?? body.message ?? "Request failed";
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return readJson<T>(response);
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}
