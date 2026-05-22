import { useEffect, useMemo, useState } from "react";
import { addDays, endOfMonth, startOfMonth, subDays } from "date-fns";
import { DayState, fetchDay, fetchMonth, fetchProcedures, login, Procedure, updateCheck } from "./api";
import { isoDate, isoMonth, ruDateLabel } from "./date";

type Tab = "today" | "calendar" | "procedures";

const emptyState: DayState = { morning: {}, evening: {} };

export function App() {
  const [tab, setTab] = useState<Tab>("today");
  const [token, setToken] = useState<string>("");
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayState, setDayState] = useState<DayState>(emptyState);
  const [monthMarks, setMonthMarks] = useState<Record<string, { morning: number; evening: number }>>({});
  const [error, setError] = useState("");

  const selectedIso = isoDate(selectedDate);

  useEffect(() => {
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();

    const initData = window.Telegram?.WebApp?.initData;
    if (!initData) {
      setError("Откройте приложение из Telegram, чтобы начать работу.");
      return;
    }

    login(initData)
      .then(setToken)
      .catch((e) => setError((e as Error).message));
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchProcedures(token)
      .then(setProcedures)
      .catch((e) => setError((e as Error).message));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchDay(token, selectedIso)
      .then(setDayState)
      .catch((e) => setError((e as Error).message));
  }, [token, selectedIso]);

  useEffect(() => {
    if (!token) return;
    fetchMonth(token, isoMonth(selectedDate))
      .then(setMonthMarks)
      .catch((e) => setError((e as Error).message));
  }, [token, selectedDate]);

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
      const nextState = await fetchDay(token, selectedIso);
      setDayState(nextState);
      const nextMonth = await fetchMonth(token, isoMonth(selectedDate));
      setMonthMarks(nextMonth);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const renderChecklist = (dayPart: "morning" | "evening", title: string) => (
    <section className="card">
      <h3>{title}</h3>
      {procedures.map((p) => (
        <label key={`${dayPart}-${p.id}`} className="check-row">
          <input
            type="checkbox"
            checked={Boolean(dayState[dayPart][String(p.id)])}
            onChange={(e) => toggle(dayPart, p.id, e.target.checked)}
          />
          <span>{p.name}</span>
        </label>
      ))}
    </section>
  );

  return (
    <main className="app">
      <header className="topbar">
        <h1>Medicube</h1>
        <p>{ruDateLabel(selectedDate)}</p>
      </header>

      {error && <div className="error">{error}</div>}

      <nav className="tabs">
        <button onClick={() => setTab("today")} className={tab === "today" ? "active" : ""}>Сегодня</button>
        <button onClick={() => setTab("calendar")} className={tab === "calendar" ? "active" : ""}>Календарь</button>
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
                  onClick={() => setSelectedDate(d)}
                >
                  <span>{d.getDate()}</span>
                  {marks && <small>{marks.morning + marks.evening} отметок</small>}
                </button>
              );
            })}
          </div>
          <p className="hint">Выберите дату, затем перейдите во вкладку «Сегодня» для редактирования.</p>
        </section>
      )}

      {tab === "procedures" && (
        <section className="stack">
          {procedures.map((p) => (
            <article key={p.id} className="card">
              <h3>{p.name}</h3>
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
