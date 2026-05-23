const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const BACKEND_NOT_CONNECTED_MESSAGE =
  "Сервер отметок еще не подключен. Интерфейс открыт, но сохранение календаря пока недоступно.";

export type Procedure = {
  id: number;
  slug: string;
  name: string;
  description: string;
  note: string;
  type: string;
  isVisible: boolean;
};

export type Supplement = {
  id: number;
  slug: string;
  name: string;
  isVisible: boolean;
};

export type DayState = {
  morning: Record<string, boolean>;
  evening: Record<string, boolean>;
};

export type SupplementDayState = {
  morning: Record<string, boolean>;
  day: Record<string, boolean>;
  evening: Record<string, boolean>;
};

export type HistoryItem = {
  date: string;
  care: {
    morning: string[];
    evening: string[];
  };
  supplements: {
    morning: string[];
    day: string[];
    evening: string[];
  };
};

export type MonthMark = {
  morning: number;
  day: number;
  evening: number;
  care: number;
  supplements: number;
  total: number;
};

async function request<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options?.headers || {})
      }
    });
  } catch (error) {
    console.error("[Medicube API] network error", { path, error });
    throw new Error("Сервер временно недоступен. Проверьте подключение к API.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error("[Medicube API] request failed", {
      path,
      status: res.status,
      bodyError: body?.error || null
    });
    throw new Error(body.error || "Ошибка API");
  }
  return res.json();
}

export async function login(initData: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData })
    });
  } catch (error) {
    console.error("[Medicube Auth] network error", { error });
    throw new Error(BACKEND_NOT_CONNECTED_MESSAGE);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    console.error("[Medicube Auth] auth failed", {
      status: res.status,
      bodyError: body?.error || null
    });
    if (body?.error) {
      const authLikeError =
        String(body.error).includes("init data") ||
        String(body.error).includes("подпись") ||
        String(body.error).includes("Telegram");
      if (authLikeError) {
        throw new Error("Ошибка авторизации Telegram. Закройте и заново откройте Mini App в Telegram.");
      }
      throw new Error(body.error);
    }

    if (res.status >= 500 || res.status === 404 || res.status === 403) {
      throw new Error(BACKEND_NOT_CONNECTED_MESSAGE);
    }

    throw new Error("Ошибка авторизации Telegram. Закройте и заново откройте Mini App в Telegram.");
  }

  const data = await res.json();
  return data.token;
}

export function fetchProcedures(token: string) {
  return request<Procedure[]>("/procedures", token);
}

export function fetchSupplements(token: string) {
  return request<Supplement[]>("/supplements", token);
}

export function fetchDay(token: string, date: string) {
  return request<DayState>(`/calendar/day?date=${date}`, token);
}

export function fetchSupplementDay(token: string, date: string) {
  return request<SupplementDayState>(`/supplements/day?date=${date}`, token);
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

export function updateSupplementCheck(
  token: string,
  payload: {
    date: string;
    dayPart: "morning" | "day" | "evening";
    supplementId: number;
    completed: boolean;
  }
) {
  return request<{ ok: boolean }>("/supplements/day", token, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function fetchMonth(token: string, month: string) {
  return request<Record<string, MonthMark>>(`/calendar/month?month=${month}`, token);
}

export function fetchHistory(token: string, limit = 30) {
  return request<HistoryItem[]>(`/calendar/history?limit=${limit}`, token);
}
