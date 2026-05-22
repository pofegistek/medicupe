import { format } from "date-fns";

export function isoDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function isoMonth(date: Date) {
  return format(date, "yyyy-MM");
}

export function ruDateLabel(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}
