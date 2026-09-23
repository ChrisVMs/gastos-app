"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  PiggyBank,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/empty-state";
import { MonthPicker } from "@/components/month-picker";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useData } from "@/lib/data";
import {
  CATEGORY_COLORS,
  expenseByCategory,
  percentChange,
  savingsRate,
  summarizeMonth,
  topExpenses,
} from "@/lib/dashboard";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import {
  currentMonth,
  formatCurrency,
  formatDateShort,
  monthName,
  shiftMonth,
} from "@/lib/format";

interface ComparisonRow {
  label: string;
  current: number;
  previous: number;
}

export default function ReportesPage() {
  const [month, setMonth] = useState(currentMonth);

  const data = useData();

  const loading = data === null;

  const summary = useMemo(
    () => summarizeMonth(data?.transactions ?? [], month),
    [data, month]
  );

  const previousMonth = useMemo(() => shiftMonth(month, -1), [month]);
  const previousSummary = useMemo(
    () => summarizeMonth(data?.transactions ?? [], previousMonth),
    [data, previousMonth]
  );

  const rate = useMemo(() => savingsRate(summary), [summary]);
  const breakdown = useMemo(
    () =>
      expenseByCategory(
        data?.transactions ?? [],
        month,
        data?.categories ?? []
      ),
    [data, month]
  );
  const largerExpenses = useMemo(
    () => topExpenses(data?.transactions ?? [], month, 8),
    [data, month]
  );

  const categoryById = useMemo(
    () => new Map((data?.categories ?? []).map((c) => [c.id, c])),
    [data]
  );

  const comparison: ComparisonRow[] = [
    { label: "Ingresos", current: summary.income, previous: previousSummary.income },
    { label: "Gastos", current: summary.expense, previous: previousSummary.expense },
    { label: "Balance", current: summary.balance, previous: previousSummary.balance },
  ];

  const monthIsEmpty = summary.income === 0 && summary.expense === 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight capitalize">
            Reporte de {monthName(month)}
          </h1>
          <p className="text-sm text-muted-foreground">
            Resumen financiero del período seleccionado.
          </p>
        </div>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {(data?.transactions.length ?? 0) === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No hay movimientos"
          description="Registra movimientos para poder generar tu reporte mensual."
          action={
            <Button asChild>
              <Link href="/movimientos">Ir a movimientos</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Ingresos"
              value={formatCurrency(summary.income)}
              icon={ArrowDownToLine}
              iconClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
            />
            <StatCard
              label="Gastos"
              value={formatCurrency(summary.expense)}
              icon={ArrowUpFromLine}
              iconClassName="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
            />
            <StatCard
              label="Balance"
              value={formatCurrency(summary.balance)}
              icon={Scale}
              iconClassName="bg-muted"
            />
            <StatCard
              label="Tasa de ahorro"
              value={rate === null ? "—" : `${rate.toFixed(1)}%`}
              icon={PiggyBank}
              iconClassName="bg-primary/10 text-primary"
            />
          </div>

          {monthIsEmpty ? (
            <EmptyState
              icon={PiggyBank}
              title="Sin movimientos en este mes"
              description="Selecciona otro mes o registra movimientos para ver el reporte."
            />
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Comparación con {monthName(previousMonth)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {comparison.map((row) => {
                      const change = percentChange(row.current, row.previous);
                      return (
                        <li
                          key={row.label}
                          className="flex items-center justify-between gap-4 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="font-medium">{row.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(row.previous)} →{" "}
                              {formatCurrency(row.current)}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
                            {change === null ? (
                              <span>—</span>
                            ) : (
                              <span className="flex items-center gap-1 font-medium">
                                {change >= 0 ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                                {change >= 0 ? "+" : ""}
                                {change.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Gastos por categoría
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {breakdown.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No registraste gastos este mes.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <div
                          style={{
                            height: Math.max(160, breakdown.length * 36 + 16),
                          }}
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={breakdown}
                              layout="vertical"
                              margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                            >
                              <XAxis type="number" hide />
                              <YAxis
                                type="category"
                                dataKey="name"
                                width={104}
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                stroke="currentColor"
                                className="text-muted-foreground"
                              />
                              <Tooltip
                                formatter={(v: number) => [
                                  formatCurrency(v),
                                  "Gasto",
                                ]}
                                contentStyle={{ borderRadius: 8, fontSize: 13 }}
                              />
                              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                                {breakdown.map((entry, index) => (
                                  <Cell
                                    key={`${entry.categoryId}-${index}`}
                                    fill={
                                      CATEGORY_COLORS[
                                        index % CATEGORY_COLORS.length
                                      ]
                                    }
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <ul className="space-y-1.5">
                          {breakdown.map((entry, index) => (
                            <li
                              key={entry.categoryId ?? "sin-categoria"}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{
                                  backgroundColor:
                                    CATEGORY_COLORS[
                                      index % CATEGORY_COLORS.length
                                    ],
                                }}
                              />
                              <span className="truncate text-muted-foreground">
                                {entry.name}
                              </span>
                              <span className="ml-auto font-medium">
                                {formatCurrency(entry.total)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Mayores gastos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {largerExpenses.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No registraste gastos este mes.
                      </p>
                    ) : (
                      <ol className="space-y-2">
                        {largerExpenses.map((t, index) => {
                          const category = categoryById.get(t.categoryId);
                          return (
                            <li
                              key={t.id}
                              className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                                {index + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {t.description ||
                                    category?.name ||
                                    "Gasto"}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {category?.name ?? "Sin categoría"} ·{" "}
                                  {formatDateShort(t.date)} ·{" "}
                                  {PAYMENT_METHOD_LABELS[t.paymentMethod]}
                                </p>
                              </div>
                              <span className="shrink-0 text-sm font-semibold">
                                {formatCurrency(t.amount)}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}