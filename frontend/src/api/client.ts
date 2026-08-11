import { supabase } from "../lib/supabase";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<TResponse>(path: string, init: RequestInit = {}): Promise<TResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: Object.fromEntries(headers.entries()),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<TResponse>;
}

async function readErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as { detail?: string };
    return data.detail || "API 요청에 실패했습니다.";
  } catch {
    return "API 요청에 실패했습니다.";
  }
}
