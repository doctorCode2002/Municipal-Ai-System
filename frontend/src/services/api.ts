export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const getAuthToken = () => localStorage.getItem("auth.token");

export async function apiFetch(path: string, options: RequestInit = {}, withAuth = true) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (withAuth) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  return response;
}

export async function apiJson<T>(path: string, options: RequestInit = {}, withAuth = true) {
  const response = await apiFetch(path, options, withAuth);
  const data = await response.json().catch(() => null);
  return { response, data: data as T | null };
}
