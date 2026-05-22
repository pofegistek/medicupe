import { useEffect, useMemo, useState } from "react";
import { addDays, endOfMonth, startOfMonth, subDays } from "date-fns";
import {
  DayState,
  fetchDay,
  fetchHistory,
  fetchMonth,
  fetchProcedures,
  HistoryItem,
  login,
  Procedure,
  updateCheck
} from "./api";
import { isoDate, isoMonth, ruDateLabel } from "./date";

type Tab = "today" | "calendar" | "history" | "procedures";
type TelegramState = "checking" | "inside" | "outside";

const emptyState: DayState = { morning: {}, evening: {} };

const MORNING_SLUGS = new Set(["air-shot", "booster", "mc"]);
const EVENING_SLUGS = new Set(["air-shot", "booster", "mc", "derma-shot", "retinol"]);

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function detectInitData(): Promise<{ initData: string; inside: boolean }> {
  for (let i = 0; i < 20; i += 1) {
    const webApp = window.Telegram?.WebApp;
    const initData = webApp?.initData?.trim() || "";
    if (webApp && initData.length > 0) {
      return { initData, inside: true };
    }
    await wait(120);
  }

  const hasTelegramWebApp = Boolean(window.Telegram?.WebApp);
  return { initData: "", inside: hasTelegramWebApp };
}

function byDayPart(procedures: Procedure[], dayPart: "morning" | "evening") {
  const allowed = dayPart === "morning" ? MORNING_SLUGS : EVENING_SLUGS;
  return procedures.filter((p) => allowed.has(p.slug));
}

function safeProcedureName(p: Procedure) {
  if (p.slug === "mc") return "MC Mode";
  return p.name;
}

export function App() {
  const [tab, setTab] = useState<Tab>("today");
  const [token, setToken] = useState<string>("");
  const [telegramState, setTelegramState] = useState<TelegramState>("checking");
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayState, setDayState] = useState<DayState>(emptyState);
  const [monthMarks, setMonthMarks] = useState<Record<string, { morning: number; evening: number }>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [proceduresLoading, setProceduresLoading] = useState(false);
  const [dayLoading, setDayLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [error, setError] = useState("");

  const selectedIso = isoDate(selectedDate);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const { initData, inside } = await detectInitData();
        if (!mounted) return;

        const webApp = window.Telegram?.WebApp;
        webApp?.ready();
        webApp?.expand();

        if (!inside || !initData) {
          setTelegramState("outside");
          return;
        }

        setTelegramState("inside");
        const sessionToken = await login(initData);
        if (!mounted) return;
        setToken(sessionToken);
      } catch (e) {
        if (!mounted) return;
        setTelegramState("inside");
        setError((e as Error).message);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    setProceduresLoading(true);
    fetchProcedures(token)
      .then((data) => {
        setProcedures(data);
        setError("");
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setProceduresLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token) return;

    setDayLoading(true);
    fetchDay(token, selectedIso)
      .then((data) => {
        setDayState(data);
        setError("");
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setDayLoading(false));
  }, [token, selectedIso]);

  useEffect(() => {
    if (!token) return;
    fetchMonth(token, isoMonth(selectedDate))
      .then(setMonthMarks)
      .catch((e) => setError((e as Error).message));
  }, [token, selectedDate]);

  useEffect(() => {
    if (!token) return;
    setHistoryLoading(true);
    fetchHistory(token, 45)
      .then((data) => {
        setHistory(data);
        setError("");
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setHistoryLoading(false));
  }, [token, dayState]);

  const calendarDays = useMemo(() => {
    const first = startOfMonth(selectedDate);
    const last = endOfMonth(selectedDate);
    const startWeekday = (first.getDay() + 6) % 7;

    const days: Date[] = [];
    for (let i = startWeekday; i > 0; i -= 1) days.push(subDays(first, i));

    let cursor = first;
    while (cursor <= last) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }

    while (days.length % 7 !== 0) {
      days.push(addDays(days[days.length - 1], 1));
    }

    return days;
  }, [selectedDate]);

  const toggle = async (dayPart: "morning" | "evening", procedureId: number, checked: boolean) => {
    if (!token) return;
    try {
      await updateCheck(token, { date: selectedIso, dayPart, procedureId, completed: checked });
      const [nextState, nextMonth] = await Promise.all([
        fetchDay(token, selectedIso),
        fetchMonth(token, isoMonth(selectedDate))
      ]);
      setDayState(nextState);
      setMonthMarks(nextMonth);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const renderChecklist = (dayPart: "morning" | "evening", title: string) => {
    if (proceduresLoading || dayLoading) {
      return (
        <section className="card">
          <h3>{title}</h3>
          <p className="hint">Загрузка данных...</p>
        </section>
      );
    }

    if (!token) {
      return (
        <section className="card">
          <h3>{title}</h3>
          <p className="hint">Для отметок нужен доступ к API и авторизация Telegram.</p>
        </section>
      );
    }

    const list = byDayPart(procedures, dayPart);
    if (list.length === 0) {
      return (
        <section className="card">
          <h3>{title}</h3>
          <p className="hint">Список процедур пока недоступен.</p>
        </section>
      );
    }

    return (
      <section className="card">
        <h3>{title}</h3>
        {list.map((p) => (
          <label key={`${dayPart}-${p.id}`} className="check-row">
            <input
              type="checkbox"
              checked={Boolean(dayState[dayPart][String(p.id)])}
              onChange={(e) => toggle(dayPart, p.id, e.target.checked)}
            />
            <span>{safeProcedureName(p)}</span>
          </label>
        ))}
      </section>
    );
  };

  return (
    <main className="app">
      <header className="topbar">
        <h1>Medicube</h1>
        <p>{ruDateLabel(selectedDate)}</p>
      </header>

      {telegramState === "checking" && <div className="info">Подключение к Telegram...</div>}
      {telegramState === "outside" && (
        <div className="info">
          Это веб-версия Mini App. Для полноценной работы откройте приложение через Telegram.
        </div>
      )}
      {error && <div className="error">{error}</div>}

      <nav className="tabs tabs-4">
        <button onClick={() => setTab("today")} className={tab === "today" ? "active" : ""}>Сегодня</button>
        <button onClick={() => setTab("calendar")} className={tab === "calendar" ? "active" : ""}>Календарь</button>
        <button onClick={() => setTab("history")} className={tab === "history" ? "active" : ""}>История</button>
        <button onClick={() => setTab("procedures")} className={tab === "procedures" ? "active" : ""}>Процедуры</button>
      </nav>

      {tab === "today" && (
        <>
          <section className="card date-switcher">
            <button onClick={() => setSelectedDate(subDays(selectedDate, 1))}>← Вчера</button>
            <button onClick={() => setSelectedDate(new Date())}>Сегодня</button>
            <button onClick={() => setSelectedDate(addDays(selectedDate, 1))}>Завтра →</button>
          </section>
          {renderChecklist("morning", "Утро")}
          {renderChecklist("evening", "Вечер")}
        </>
      )}

      {tab === "calendar" && (
        <section className="card">
          <h3>Календарь месяца</h3>
          <div className="calendar-grid week-head">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {calendarDays.map((d) => {
              const key = isoDate(d);
              const marks = monthMarks[key];
              const inMonth = d.getMonth() === selectedDate.getMonth();
              const selected = key === selectedIso;
              return (
                <button
                  key={key}
                  className={`day ${inMonth ? "" : "muted"} ${selected ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedDate(d);
                    setTab("today");
                  }}
                >
                  <span>{d.getDate()}</span>
                  {marks && <small>{marks.morning + marks.evening} отметок</small>}
                </button>
              );
            })}
          </div>
          <p className="hint">Выберите дату, чтобы перейти к отметкам за выбранный день.</p>
        </section>
      )}

      {tab === "history" && (
        <section className="stack">
          {historyLoading && (
            <section className="card">
              <h3>История</h3>
              <p className="hint">Загрузка истории...</p>
            </section>
          )}

          {!historyLoading && history.length === 0 && (
            <section className="card">
              <h3>История</h3>
              <p className="hint">Пока нет отмеченных процедур.</p>
            </section>
          )}

          {!historyLoading && history.map((item) => (
            <article key={item.date} className="card">
              <h3>{new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(item.date))}</h3>
              <p className="meta">Утро: {item.morning.length ? item.morning.join(", ") : "нет отметок"}</p>
              <p className="meta">Вечер: {item.evening.length ? item.evening.join(", ") : "нет отметок"}</p>
            </article>
          ))}
        </section>
      )}

      {tab === "procedures" && (
        <section className="stack">
          {procedures.map((p) => (
            <article key={p.id} className="card">
              <h3>{safeProcedureName(p)}</h3>
              <p className="meta">Тип: {p.type}</p>
              <p>{p.description || "Описание пока не заполнено."}</p>
              <p className="note">Заметка: {p.note || "—"}</p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
