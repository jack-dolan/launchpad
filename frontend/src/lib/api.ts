export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
export const AUTH_TOKEN_KEY = "launchpad.auth.token";

interface ApiErrorShape {
  detail?: string;
  message?: string;
}

interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init: ApiRequestOptions = {}): Promise<T> {
  const response = await request(path, init);

  if (response.status === 204) {
    return undefined as T;
  }

  return readJson<T>(response);
}

export async function apiFetchText(path: string, init: ApiRequestOptions = {}): Promise<string> {
  const response = await request(path, init);
  return response.text();
}

async function request(path: string, init: ApiRequestOptions): Promise<Response> {
  const { skipAuth, ...requestInit } = init;
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  const headers = new Headers(init.headers);
  const shouldSetJsonContentType =
    init.body !== undefined && !(init.body instanceof FormData) && !headers.has("Content-Type");

  if (shouldSetJsonContentType) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth && token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestInit,
    headers,
  });

  if (!response.ok) {
    const body = (await readPossibleJson<ApiErrorShape>(response)) ?? {};
    const message = body.detail ?? body.message ?? "Request failed";
    throw new ApiError(message, response.status);
  }

  return response;
}

async function readPossibleJson<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return readJson<T>(response);
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}
