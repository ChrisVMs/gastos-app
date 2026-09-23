import { daysInMonth, monthRange } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";

export interface MonthSummary {
  income: number;
  expense: number;
  balance: number;
}

export interface DailyPoint {
  day: number;
  income: number;
  expense: number;
}

export interface CategoryBreakdown {
  categoryId: number | undefined;
  name: string;
  total: number;
}

/** Paleta compartida para los gráficos por categoría. */
export const CATEGORY_COLORS = [
  "#10b981",
  "#6366f1",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
  "#8b5cf6",
  "#f97316",
];

export function summarizeMonth(
  transactions: Transaction[],
  month: string
): MonthSummary {
  const { start, end } = monthRange(month);
  const { income, expense } = transactions.reduce(
    (acc, t) => {
      if (t.date < start || t.date > end) return acc;
      if (t.type === "income") acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );
  return { income, expense, balance: income - expense };
}

export function dailySeries(
  transactions: Transaction[],
  month: string
): DailyPoint[] {
  const { start, end } = monthRange(month);
  const totalDays = daysInMonth(month);
  const result: DailyPoint[] = Array.from({ length: totalDays }, (_, i) => ({
    day: i + 1,
    income: 0,
    expense: 0,
  }));

  for (const t of transactions) {
    if (t.date < start || t.date > end) continue;
    const day = Number(t.date.slice(8, 10));
    if (!day || day > totalDays) continue;
    const point = result[day - 1];
    if (t.type === "income") point.income += t.amount;
    else point.expense += t.amount;
  }

  return result;
}

export function expenseByCategory(
  transactions: Transaction[],
  month: string,
  categories: Category[]
): CategoryBreakdown[] {
  const { start, end } = monthRange(month);
  const byId = new Map<number, number>();
  let uncategorized = 0;

  for (const t of transactions) {
    if (t.date < start || t.date > end) continue;
    if (t.type !== "expense") continue;
    if (t.categoryId) {
      byId.set(t.categoryId, (byId.get(t.categoryId) ?? 0) + t.amount);
    } else {
      uncategorized += t.amount;
    }
  }

  const breakdown: CategoryBreakdown[] = [];
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  for (const [categoryId, total] of byId) {
    breakdown.push({
      categoryId,
      name: categoryById.get(categoryId)?.name ?? "Sin categoría",
      total,
    });
  }
  if (uncategorized > 0) {
    breakdown.push({ categoryId: undefined, name: "Sin categoría", total: uncategorized });
  }
  return breakdown.sort((a, b) => b.total - a.total);
}

export function latestTransactions(
  transactions: Transaction[],
  limit: number
): Transaction[] {
  return [...transactions]
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    })
    .slice(0, limit);
}

/**
 * Tasa de ahorro: (ingresos - gastos) / ingresos * 100.
 * Devuelve null cuando no existen ingresos.
 */
export function savingsRate(summary: MonthSummary): number | null {
  if (summary.income <= 0) return null;
  return ((summary.income - summary.expense) / summary.income) * 100;
}

/**
 * Variación porcentual entre dos valores.
 * Devuelve null cuando no existe base de comparación (mes anterior en 0).
 */
export function percentChange(
  current: number,
  previous: number
): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function topExpenses(
  transactions: Transaction[],
  month: string,
  limit: number
): Transaction[] {
  const { start, end } = monthRange(month);
  return transactions
    .filter((t) => t.type === "expense" && t.date >= start && t.date <= end)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}