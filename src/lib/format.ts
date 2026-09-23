const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

/** Convierte una fecha local a string YYYY-MM-DD. */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Convierte una fecha a string YYYY-MM. */
export function toMonthString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** Mes actual como string YYYY-MM. */
export function currentMonth(): string {
  return toMonthString(new Date());
}

/** "2026-03-12" -> "12 mar 2026" */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** "2026-03" -> "Marzo 2026" */
export function formatMonth(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  if (!year || !monthNum) return month;
  return new Intl.DateTimeFormat("es-PE", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNum - 1, 1));
}

/** Desplaza un mes YYYY-MM por `delta`. */
export function shiftMonth(month: string, delta: number): string {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(year, monthNum - 1 + delta, 1);
  return toMonthString(date);
}

/** Número de días de un mes YYYY-MM. */
export function daysInMonth(month: string): number {
  const [year, monthNum] = month.split("-").map(Number);
  return new Date(year, monthNum, 0).getDate();
}

/** "2026-03" -> primer día (2026-03-01) y último día (2026-03-31). */
export function monthRange(
  month: string
): { start: string; end: string } {
  const [year, monthNum] = month.split("-").map(Number);
  const start = `${year}-${monthNum < 10 ? "0" + monthNum : monthNum}-01`;
  const end = toDateString(new Date(year, monthNum, 0));
  return { start, end };
}

/** "2026-03-12" -> "12/03/2026" */
export function formatDateShort(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

/** "2026-03" -> "Marzo" */
export function monthName(month: string): string {
  const monthNum = Number(month.split("-")[1]);
  if (!monthNum) return month;
  return capitalize(
    new Intl.DateTimeFormat("es-PE", { month: "long" }).format(
      new Date(2026, monthNum - 1, 1)
    )
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}