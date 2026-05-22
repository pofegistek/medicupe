import { useEffect, useMemo, useState } from "react";
import { addDays, endOfMonth, startOfMonth, subDays } from "date-fns";
import {
  DayState,
  fetchDay,
  fetchHistory,
  fetchMonth,
  fetchProcedures,
  fetchSupplementDay,
  fetchSupplements,
  HistoryItem,
  login,
  MonthMark,
  Procedure,
  Supplement,
  SupplementDayState,
  updateCheck,
  updateSupplementCheck
} from "./api";
import { isoDate, isoMonth, ruDateLabel } from "./date";

type Tab = "today" | "calendar" | "history" | "supplements" | "procedures";
type TelegramState = "checking" | "inside" | "outside";
type DayPart = "morning" | "evening";
type SupplementDayPart = "morning" | "day" | "evening";

const emptyState: DayState = { morning: {}, evening: {} };
const emptySupplementState: SupplementDayState = { morning: {}, day: {}, evening: {} };

const MORNING_SLUGS = new Set(["air-shot", "booster", "mc"]);
const EVENING_SLUGS = new Set(["air-shot", "booster", "mc", "derma-shot", "retinol"]);

const SUPPLEMENT_MORNING_DAY_SLUGS = new Set([
  "omega-3",
  "vitamin-d",
  "b12",
  "b9",
  "collagen",
  "psyllium",
  "iron"
]);
const SUPPLEMENT_EVENING_SLUGS = new Set(["magnesium"]);

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

function byDayPart(procedures: Procedure[], dayPart: DayPart) {
  const allowed = dayPart === "morning" ? MORNING_SLUGS : EVENING_SLUGS;
  return procedures.filter((p) => allowed.has(p.slug));
}

function supplementsByDayPart(supplements: Supplement[], dayPart: SupplementDayPart) {
  if (dayPart === "evening") {
    return supplements.filter((s) => SUPPLEMENT_EVENING_SLUGS.has(s.slug));
  }
  return supplements.filter((s) => SUPPLEMENT_MORNING_DAY_SLUGS.has(s.slug));
}

function safeProcedureName(p: Procedure) {
  if (p.slug === "mc") return "MC Mode";
  return p.name;
}

function triggerToggleHaptic() {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
  } catch {
    // no-op if haptic is unavailable
  }
}

function triggerSuccessHaptic() {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("success");
  } catch {
    // no-op if haptic is unavailable
  }
}

export function App() {
  const [tab, setTab] = useState<Tab>("today");
  const [token, setToken] = useState<string>("");
  const [telegramState, setTelegramState] = useState<TelegramState>("checking");
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [savedDayState, setSavedDayState] = useState<DayState>(emptyState);
  const [draftDayState, setDraftDayState] = useState<DayState>(emptyState);

  const [savedSupplementState, setSavedSupplementState] = useState<SupplementDayState>(emptySupplementState);
  const [draftSupplementState, setDraftSupplementState] = useState<SupplementDayState>(emptySupplementState);

  const [monthMarks, setMonthMarks] = useState<Record<string, MonthMark>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [proceduresLoading, setProceduresLoading] = useState(false);
  const [supplementsLoading, setSupplementsLoading] = useState(false);
  const [dayLoading, setDayLoading] = useState(false);
  const [supplementDayLoading, setSupplementDayLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [savingMorning, setSavingMorning] = useState(false);
  const [savingEvening, setSavingEvening] = useState(false);
  const [savingSuppMorning, setSavingSuppMorning] = useState(false);
  const [savingSuppDay, setSavingSuppDay] = useState(false);
  const [savingSuppEvening, setSavingSuppEvening] = useState(false);

  const [morningStatus, setMorningStatus] = useState("");
  const [eveningStatus, setEveningStatus] = useState("");
  const [suppMorningStatus, setSuppMorningStatus] = useState("");
  const [suppDayStatus, setSuppDayStatus] = useState("");
  const [suppEveningStatus, setSuppEveningStatus] = useState("");

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

    setSupplementsLoading(true);
    fetchSupplements(token)
      .then((data) => {
        setSupplements(data);
        setError("");
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setSupplementsLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token) return;

    setDayLoading(true);
    fetchDay(token, selectedIso)
      .then((data) => {
        setSavedDayState(data);
        setDraftDayState(data);
        setMorningStatus("");
        setEveningStatus("");
        setError("");
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setDayLoading(false));

    setSupplementDayLoading(true);
    fetchSupplementDay(token, selectedIso)
      .then((data) => {
        setSavedSupplementState(data);
        setDraftSupplementState(data);
        setSuppMorningStatus("");
        setSuppDayStatus("");
        setSuppEveningStatus("");
        setError("");
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setSupplementDayLoading(false));
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
  }, [token, savedDayState, savedSupplementState]);

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

  const listMorning = byDayPart(procedures, "morning");
  const listEvening = byDayPart(procedures, "evening");

  const supplementMorning = supplementsByDayPart(supplements, "morning");
  const supplementDay = supplementsByDayPart(supplements, "day");
  const supplementEvening = supplementsByDayPart(supplements, "evening");

  const isDirty = (dayPart: DayPart, list: Procedure[]) =>
    list.some((p) => {
      const key = String(p.id);
      return Boolean(draftDayState[dayPart][key]) !== Boolean(savedDayState[dayPart][key]);
    });

  const isSupplementDirty = (dayPart: SupplementDayPart, list: Supplement[]) =>
    list.some((s) => {
      const key = String(s.id);
      return Boolean(draftSupplementState[dayPart][key]) !== Boolean(savedSupplementState[dayPart][key]);
    });

  const dirtyMorning = isDirty("morning", listMorning);
  const dirtyEvening = isDirty("evening", listEvening);

  const dirtySuppMorning = isSupplementDirty("morning", supplementMorning);
  const dirtySuppDay = isSupplementDirty("day", supplementDay);
  const dirtySuppEvening = isSupplementDirty("evening", supplementEvening);

  const hasUnsavedChanges =
    dirtyMorning || dirtyEvening || dirtySuppMorning || dirtySuppDay || dirtySuppEvening;

  function confirmDiscardChanges(): boolean {
    if (!hasUnsavedChanges) return true;
    return window.confirm("Есть несохраненные изменения. Перейти без сохранения?");
  }

  const changeDateWithGuard = (nextDate: Date, nextTab: Tab = tab) => {
    if (!confirmDiscardChanges()) return;
    setSelectedDate(nextDate);
    setTab(nextTab);
  };

  const toggleDraft = (dayPart: DayPart, procedureId: number, checked: boolean) => {
    triggerToggleHaptic();

    const key = String(procedureId);
    setDraftDayState((prev) => ({
      ...prev,
      [dayPart]: {
        ...prev[dayPart],
        [key]: checked
      }
    }));

    if (dayPart === "morning") setMorningStatus("");
    if (dayPart === "evening") setEveningStatus("");
  };

  const toggleSupplementDraft = (dayPart: SupplementDayPart, supplementId: number, checked: boolean) => {
    triggerToggleHaptic();

    const key = String(supplementId);
    setDraftSupplementState((prev) => ({
      ...prev,
      [dayPart]: {
        ...prev[dayPart],
        [key]: checked
      }
    }));

    if (dayPart === "morning") setSuppMorningStatus("");
    if (dayPart === "day") setSuppDayStatus("");
    if (dayPart === "evening") setSuppEveningStatus("");
  };

  const saveDayPart = async (dayPart: DayPart, list: Procedure[]) => {
    if (!token) return;

    const setSaving = dayPart === "morning" ? setSavingMorning : setSavingEvening;
    const setStatus = dayPart === "morning" ? setMorningStatus : setEveningStatus;

    const changed = list.filter((p) => {
      const key = String(p.id);
      return Boolean(draftDayState[dayPart][key]) !== Boolean(savedDayState[dayPart][key]);
    });

    if (changed.length === 0) return;

    setSaving(true);
    setStatus("");

    try {
      await Promise.all(
        changed.map((p) =>
          updateCheck(token, {
            date: selectedIso,
            dayPart,
            procedureId: p.id,
            completed: Boolean(draftDayState[dayPart][String(p.id)])
          })
        )
      );

      const [freshDay, freshMonth] = await Promise.all([
        fetchDay(token, selectedIso),
        fetchMonth(token, isoMonth(selectedDate))
      ]);

      setSavedDayState(freshDay);
      setDraftDayState(freshDay);
      setMonthMarks(freshMonth);
      setStatus("Сохранено");
      setError("");
      triggerSuccessHaptic();
    } catch {
      setStatus("Не удалось сохранить. Проверьте соединение и попробуйте еще раз.");
    } finally {
      setSaving(false);
    }
  };

  const saveSupplementDayPart = async (dayPart: SupplementDayPart, list: Supplement[]) => {
    if (!token) return;

    const setSaving =
      dayPart === "morning" ? setSavingSuppMorning : dayPart === "day" ? setSavingSuppDay : setSavingSuppEvening;
    const setStatus =
      dayPart === "morning" ? setSuppMorningStatus : dayPart === "day" ? setSuppDayStatus : setSuppEveningStatus;

    const changed = list.filter((s) => {
      const key = String(s.id);
      return Boolean(draftSupplementState[dayPart][key]) !== Boolean(savedSupplementState[dayPart][key]);
    });

    if (changed.length === 0) return;

    setSaving(true);
    setStatus("");

    try {
      await Promise.all(
        changed.map((s) =>
          updateSupplementCheck(token, {
            date: selectedIso,
            dayPart,
            supplementId: s.id,
            completed: Boolean(draftSupplementState[dayPart][String(s.id)])
          })
        )
      );

      const [freshSuppDay, freshMonth] = await Promise.all([
        fetchSupplementDay(token, selectedIso),
        fetchMonth(token, isoMonth(selectedDate))
      ]);

      setSavedSupplementState(freshSuppDay);
      setDraftSupplementState(freshSuppDay);
      setMonthMarks(freshMonth);
      setStatus("Сохранено");
      setError("");
      triggerSuccessHaptic();
    } catch {
      setStatus("Не удалось сохранить. Проверьте соединение и попробуйте еще раз.");
    } finally {
      setSaving(false);
    }
  };

  const renderProcedureChecklist = (dayPart: DayPart, title: string, list: Procedure[]) => {
    if (proceduresLoading || dayLoading) {
      return (
        <section className="card">
          <div className="card-head">
            <h3>{title}</h3>
          </div>
          <p className="hint">Загрузка данных...</p>
        </section>
      );
    }

    if (!token) {
      return (
        <section className="card">
          <div className="card-head">
            <h3>{title}</h3>
          </div>
          <p className="hint">Для отметок нужен доступ к API и авторизация Telegram.</p>
        </section>
      );
    }

    if (list.length === 0) {
      return (
        <section className="card">
          <div className="card-head">
            <h3>{title}</h3>
          </div>
          <p className="hint">Список процедур пока недоступен.</p>
        </section>
      );
    }

    const dirty = dayPart === "morning" ? dirtyMorning : dirtyEvening;
    const saving = dayPart === "morning" ? savingMorning : savingEvening;
    const status = dayPart === "morning" ? morningStatus : eveningStatus;

    return (
      <section className="card">
        <div className="card-head">
          <h3>{title}</h3>
          <span className="card-sub">{dayPart === "morning" ? "Утренний чек-ин" : "Вечерний чек-ин"}</span>
        </div>

        <div className="tile-list">
          {list.map((p) => {
            const checked = Boolean(draftDayState[dayPart][String(p.id)]);
            return (
              <button
                key={`${dayPart}-${p.id}`}
                type="button"
                className={`tile ${checked ? "active" : ""}`}
                onClick={() => toggleDraft(dayPart, p.id, !checked)}
                aria-pressed={checked}
              >
                <span className="tile-name">{safeProcedureName(p)}</span>
                <span className={`tile-check ${checked ? "on" : ""}`} aria-hidden="true">
                  {checked ? "✓" : "○"}
                </span>
              </button>
            );
          })}
        </div>

        {dirty && <p className="unsaved">Есть несохраненные изменения</p>}

        <button className="save-btn" disabled={!dirty || saving} onClick={() => saveDayPart(dayPart, list)}>
          {saving ? "Сохранение..." : dayPart === "morning" ? "Сохранить утро" : "Сохранить вечер"}
        </button>

        {status && <p className={status === "Сохранено" ? "saved" : "save-error"}>{status}</p>}
      </section>
    );
  };

  const renderSupplementChecklist = (dayPart: SupplementDayPart, title: string, list: Supplement[]) => {
    if (supplementsLoading || supplementDayLoading) {
      return (
        <section className="card">
          <div className="card-head">
            <h3>{title}</h3>
          </div>
          <p className="hint">Загрузка данных...</p>
        </section>
      );
    }

    if (!token) {
      return (
        <section className="card">
          <div className="card-head">
            <h3>{title}</h3>
          </div>
          <p className="hint">Для отметок нужен доступ к API и авторизация Telegram.</p>
        </section>
      );
    }

    if (list.length === 0) {
      return (
        <section className="card">
          <div className="card-head">
            <h3>{title}</h3>
          </div>
          <p className="hint">Список добавок пока недоступен.</p>
        </section>
      );
    }

    const dirty =
      dayPart === "morning" ? dirtySuppMorning : dayPart === "day" ? dirtySuppDay : dirtySuppEvening;
    const saving =
      dayPart === "morning" ? savingSuppMorning : dayPart === "day" ? savingSuppDay : savingSuppEvening;
    const status =
      dayPart === "morning" ? suppMorningStatus : dayPart === "day" ? suppDayStatus : suppEveningStatus;

    return (
      <section className="card">
        <div className="card-head">
          <h3>{title}</h3>
          <span className="card-sub">Отметки приема</span>
        </div>

        <div className="tile-list">
          {list.map((s) => {
            const checked = Boolean(draftSupplementState[dayPart][String(s.id)]);
            return (
              <button
                key={`${dayPart}-${s.id}`}
                type="button"
                className={`tile ${checked ? "active" : ""}`}
                onClick={() => toggleSupplementDraft(dayPart, s.id, !checked)}
                aria-pressed={checked}
              >
                <span className="tile-name">{s.name}</span>
                <span className={`tile-check ${checked ? "on" : ""}`} aria-hidden="true">
                  {checked ? "✓" : "○"}
                </span>
              </button>
            );
          })}
        </div>

        {dirty && <p className="unsaved">Есть несохраненные изменения</p>}

        <button className="save-btn" disabled={!dirty || saving} onClick={() => saveSupplementDayPart(dayPart, list)}>
          {saving
            ? "Сохранение..."
            : dayPart === "morning"
              ? "Сохранить утро"
              : dayPart === "day"
                ? "Сохранить день"
                : "Сохранить вечер"}
        </button>

        {status && <p className={status === "Сохранено" ? "saved" : "save-error"}>{status}</p>}
      </section>
    );
  };

  return (
    <main className="app">
      <header className="topbar card">
        <span className="app-kicker">Medicube</span>
        <h1>Ежедневные отметки</h1>
        <p>{ruDateLabel(selectedDate)}</p>
      </header>

      {telegramState === "checking" && <div className="info">Подключение к Telegram...</div>}
      {telegramState === "outside" && (
        <div className="info">
          Это веб-версия Mini App. Для полноценной работы откройте приложение через Telegram.
        </div>
      )}
      {error && <div className="error">{error}</div>}

      <nav className="tabs tabs-5">
        <button onClick={() => setTab("today")} className={tab === "today" ? "active" : ""}>Сегодня</button>
        <button onClick={() => setTab("supplements")} className={tab === "supplements" ? "active" : ""}>Добавки</button>
        <button onClick={() => setTab("calendar")} className={tab === "calendar" ? "active" : ""}>Календарь</button>
        <button onClick={() => setTab("history")} className={tab === "history" ? "active" : ""}>История</button>
        <button onClick={() => setTab("procedures")} className={tab === "procedures" ? "active" : ""}>Процедуры</button>
      </nav>

      {(tab === "today" || tab === "supplements") && (
        <section className="date-switcher">
          <button onClick={() => changeDateWithGuard(subDays(selectedDate, 1))}>← Вчера</button>
          <button onClick={() => changeDateWithGuard(new Date())}>Сегодня</button>
          <button onClick={() => changeDateWithGuard(addDays(selectedDate, 1))}>Завтра →</button>
        </section>
      )}

      {tab === "today" && (
        <>
          {renderProcedureChecklist("morning", "Утро", listMorning)}
          {renderProcedureChecklist("evening", "Вечер", listEvening)}
        </>
      )}

      {tab === "supplements" && (
        <>
          {renderSupplementChecklist("morning", "Утро", supplementMorning)}
          {renderSupplementChecklist("day", "День", supplementDay)}
          {renderSupplementChecklist("evening", "Вечер", supplementEvening)}
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
                  onClick={() => changeDateWithGuard(d, "today")}
                >
                  <span>{d.getDate()}</span>
                  {marks && <small>{marks.total} активностей</small>}
                </button>
              );
            })}
          </div>
          <p className="hint">Дни с уходом или добавками отмечаются как активность.</p>
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
              <p className="hint">Пока нет отмеченных процедур или добавок.</p>
            </section>
          )}

          {!historyLoading && history.map((item) => {
            const hasSupplements =
              item.supplements.morning.length || item.supplements.day.length || item.supplements.evening.length;

            return (
              <article key={item.date} className="card">
                <h3>
                  {new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(
                    new Date(item.date)
                  )}
                </h3>

                <p className="meta"><strong>Уход</strong></p>
                <p className="meta">Утро: {item.care.morning.length ? item.care.morning.join(", ") : "нет отметок"}</p>
                <p className="meta">Вечер: {item.care.evening.length ? item.care.evening.join(", ") : "нет отметок"}</p>

                {hasSupplements ? (
                  <>
                    <p className="meta"><strong>Добавки</strong></p>
                    <p className="meta">
                      Утро: {item.supplements.morning.length ? item.supplements.morning.join(", ") : "нет отметок"}
                    </p>
                    <p className="meta">
                      День: {item.supplements.day.length ? item.supplements.day.join(", ") : "нет отметок"}
                    </p>
                    <p className="meta">
                      Вечер: {item.supplements.evening.length ? item.supplements.evening.join(", ") : "нет отметок"}
                    </p>
                  </>
                ) : null}
              </article>
            );
          })}
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
