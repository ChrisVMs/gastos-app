"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRight,
  PiggyBank,
  Plus,
  Scale,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/empty-state";
import { MonthPicker } from "@/components/month-picker";
import { MovementFormDialog } from "@/components/movement-form-dialog";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useData } from "@/lib/data";
import {
  CATEGORY_COLORS,
  dailySeries,
  expenseByCategory,
  latestTransactions,
  summarizeMonth,
} from "@/lib/dashboard";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { currentMonth, formatCurrency, formatDate } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

function chartTooltipFormatter(value: number) {
  return [formatCurrency(value), ""];
}

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const data = useData();

  const loading = data === null;

  const summary = useMemo(
    () => summarizeMonth(data?.transactions ?? [], month),
    [data, month]
  );
  const evolution = useMemo(
    () => dailySeries(data?.transactions ?? [], month),
    [data, month]
  );
  const breakdown = useMemo(
    () =>
      expenseByCategory(
        data?.transactions ?? [],
        month,
        data?.categories ?? []
      ),
    [data, month]
  );
  const recent = useMemo(
    () => latestTransactions(data?.transactions ?? [], 6),
    [data]
  );

  const hasAnyMovement = (data?.transactions.length ?? 0) > 0;
  const emptyEvolution = evolution.every(
    (d) => d.income === 0 && d.expense === 0
  );

  const categoryById = useMemo(
    () => new Map((data?.categories ?? []).map((c) => [c.id, c])),
    [data]
  );

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (t: Transaction) => {
    setEditing(t);
    setFormOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-3">
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
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Resumen de tus finanzas del mes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthPicker value={month} onChange={setMonth} />
          <Button onClick={openNew}>
            <Plus /> Nuevo movimiento
          </Button>
        </div>
      </div>

      {!hasAnyMovement ? (
        <EmptyState
          icon={PiggyBank}
          title="Aún no tienes movimientos"
          description="Registra tu primer ingreso o gasto para comenzar a ver tu resumen financiero."
          action={
            <Button onClick={openNew}>
              <Plus /> Registrar movimiento
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Ingresos del mes"
              value={formatCurrency(summary.income)}
              icon={ArrowDownToLine}
              iconClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
            />
            <StatCard
              label="Gastos del mes"
              value={formatCurrency(summary.expense)}
              icon={ArrowUpFromLine}
              iconClassName="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
            />
            <StatCard
              label="Balance"
              value={formatCurrency(summary.balance)}
              icon={Scale}
              iconClassName={cn(
                "bg-muted",
                summary.balance >= 0
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-red-700 dark:text-red-300"
              )}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">
                  Evolución de ingresos y gastos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {emptyEvolution ? (
                  <div className="flex h-72 items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      No hay movimientos en este mes.
                    </p>
                  </div>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={evolution}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                          dataKey="day"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tick={{ fontSize: 12 }}
                          stroke="currentColor"
                          className="text-muted-foreground"
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          width={60}
                          tick={{ fontSize: 12 }}
                          stroke="currentColor"
                          className="text-muted-foreground"
                          tickFormatter={(v: number) => formatCurrency(v)}
                        />
                        <Tooltip
                          formatter={chartTooltipFormatter}
                          labelFormatter={(label) => `Día ${label}`}
                          contentStyle={{
                            borderRadius: 8,
                            fontSize: 13,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="income"
                          name="Ingresos"
                          stroke="#10b981"
                          fill="url(#income)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="expense"
                          name="Gastos"
                          stroke="#ef4444"
                          fill="url(#expense)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Gastos por categoría</CardTitle>
              </CardHeader>
              <CardContent>
                {breakdown.length === 0 ? (
                  <div className="flex h-72 flex-col items-center justify-center gap-1 text-center">
                    <p className="text-sm text-muted-foreground">
                      No registraste gastos en este mes.
                    </p>
                  </div>
                ) : (
                  <div className="flex h-72 flex-col items-center justify-center gap-3">
                    <div className="relative h-44 w-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={breakdown}
                            dataKey="total"
                            nameKey="name"
                            innerRadius={52}
                            outerRadius={80}
                            paddingAngle={2}
                            strokeWidth={2}
                          >
                            {breakdown.map((entry, index) => (
                              <Cell
                                key={`${entry.categoryId}-${index}`}
                                fill={
                                  CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number, name: string) => [
                              formatCurrency(value),
                              name,
                            ]}
                            contentStyle={{ borderRadius: 8, fontSize: 13 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold">
                          {formatCurrency(summary.expense)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Gasto total
                        </span>
                      </div>
                    </div>

                    <ul className="w-full space-y-1.5">
                      {breakdown.map((entry, index) => (
                        <li
                          key={entry.categoryId ?? "sin-categoria"}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                CATEGORY_COLORS[index % CATEGORY_COLORS.length],
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
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Últimos movimientos</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/movimientos">
                  Ver todos <ArrowRight />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recent.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No hay movimientos para mostrar.
                </p>
              ) : (
                <ul className="divide-y">
                  {recent.map((t) => {
                    const category = categoryById.get(t.categoryId);
                    return (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => openEdit(t)}
                          className="flex w-full items-center gap-3 rounded-md px-1 py-3 text-left transition-colors hover:bg-accent"
                        >
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                              t.type === "expense"
                                ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                            )}
                          >
                            {t.type === "expense" ? (
                              <ArrowUpFromLine className="h-4 w-4" />
                            ) : (
                              <ArrowDownToLine className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {category?.name ?? "Sin categoría"}
                              {t.description ? (
                                <span className="font-normal text-muted-foreground">
                                  {" "}
                                  · {t.description}
                                </span>
                              ) : null}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {formatDate(t.date)} ·{" "}
                              {PAYMENT_METHOD_LABELS[t.paymentMethod]}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 text-sm font-semibold",
                              t.type === "expense"
                                ? "text-red-600 dark:text-red-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            )}
                          >
                            {t.type === "expense" ? "-" : "+"}
                            {formatCurrency(t.amount)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <MovementFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        transaction={editing}
      />
    </div>
  );
}