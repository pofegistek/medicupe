const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export type Procedure = {
  id: number;
  slug: string;
  name: string;
  description: string;
  note: string;
  type: string;
  isVisible: boolean;
};

export type DayState = {
  morning: Record<string, boolean>;
  evening: Record<string, boolean>;
};

async function request<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {})
    }
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Ошибка API");
  }
  return res.json();
}

export async function login(initData: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData })
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Ошибка авторизации");
  }

  const data = await res.json();
  return data.token;
}

export function fetchProcedures(token: string) {
  return request<Procedure[]>("/procedures", token);
}

export function fetchDay(token: string, date: string) {
  return request<DayState>(`/calendar/day?date=${date}`, token);
}

export function updateCheck(
  token: string,
  payload: { date: string; dayPart: "morning" | "evening"; procedureId: number; completed: boolean }
) {
  return request<{ ok: boolean }>("/calendar/day", token, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function fetchMonth(token: string, month: string) {
  return request<Record<string, { morning: number; evening: number }>>(
    `/calendar/month?month=${month}`,
    token
  );
}
