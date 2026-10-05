"use client";

import { useMemo, useState } from "react";
import { Landmark, Lock, Percent, Plus, Trash2, Wallet } from "lucide-react";

import { DebtFormDialog } from "@/components/debt-form-dialog";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEBT_CATEGORY_NAME, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { deleteDebt } from "@/lib/db";
import { debtInterest, debtTotalCost, isProjectedInstallment } from "@/lib/debts";
import { useData } from "@/lib/data";
import { formatCurrency, formatDate, toDateString } from "@/lib/format";
import type { Debt, DebtInstallment } from "@/lib/types";

export default function DebtsPage() {
  const data = useData();
  const debts = data?.debts;
  const installments = data?.debtInstallments;

  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Debt | null>(null);
  const [deletingError, setDeletingError] = useState("");

  const today = toDateString(new Date());

  const totals = useMemo(() => {
    return (debts ?? []).reduce(
      (acc, debt) => ({
        capital: acc.capital + debt.capitalAmount,
        cost: acc.cost + debtTotalCost(debt),
        interest: acc.interest + debtInterest(debt),
      }),
      { capital: 0, cost: 0, interest: 0 }
    );
  }, [debts]);

  const schedule = useMemo(() => {
    const debtById = new Map((debts ?? []).map((d) => [d.id, d]));
    return (installments ?? [])
      .map((installment) => ({
        installment,
        debt: debtById.get(installment.debtId),
      }))
      .filter((row): row is { installment: DebtInstallment; debt: Debt } =>
        Boolean(row.debt)
      )
      .sort((a, b) => a.installment.date.localeCompare(b.installment.date));
  }, [debts, installments]);

  const handleDelete = async () => {
    if (!deleting?.id) return;
    setDeletingError("");
    try {
      await deleteDebt(deleting.id);
      setDeleting(null);
    } catch {
      setDeletingError(
        "Ocurrió un error al eliminar la deuda. Inténtalo de nuevo."
      );
    }
  };

  const loading = debts === undefined;
  const deletingCost = deleting ? debtTotalCost(deleting) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deudas</h1>
          <p className="text-sm text-muted-foreground">
            Registra tus deudas frecuentes y su saldo capital. Cada cuota suma un
            egreso a los reportes de su mes y solo se elimina desde aquí.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus /> Nueva deuda
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : debts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Deudas registradas"
            value={String(debts.length)}
            icon={Landmark}
          />
          <StatCard
            label="Saldo capital total"
            value={formatCurrency(totals.capital)}
            icon={Wallet}
          />
          <StatCard
            label="Interés total a pagar"
            value={formatCurrency(totals.interest)}
            icon={Percent}
            iconClassName="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
          />
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
        </div>
      ) : debts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Aún no tienes deudas"
          description={`Agrega una deuda como la bancaria con su saldo capital y sus cuotas; cada cuota se sumará como egreso en la categoría ${DEBT_CATEGORY_NAME}.`}
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> Registrar deuda
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {debts.map((debt) => {
            const debtSchedule = schedule.filter(
              (row) => row.debt.id === debt.id
            );
            const last = debtSchedule[debtSchedule.length - 1];
            const interest = debtInterest(debt);
            return (
              <Card key={debt.id}>
                <CardContent className="flex h-full flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {debt.name}
                        </p>
                        {debt.description ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {debt.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                      aria-label={`Eliminar deuda ${debt.name}`}
                      onClick={() => {
                        setDeleting(debt);
                        setDeletingError("");
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Saldo capital
                      </p>
                      <p className="font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(debt.capitalAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cuota</p>
                      <p className="font-semibold">
                        {formatCurrency(debt.cuotaAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Total a pagar
                      </p>
                      <p className="font-semibold">
                        {formatCurrency(debtTotalCost(debt))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Interés</p>
                      <p
                        className={
                          interest > 0
                            ? "font-semibold text-red-600 dark:text-red-400"
                            : "font-semibold text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {formatCurrency(interest)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary">
                        {debt.cuotas}{" "}
                        {debt.cuotas === 1 ? "cuota" : "cuotas"}
                      </Badge>
                      <Badge variant="outline">
                        {DEBT_CATEGORY_NAME}
                      </Badge>
                      <Badge variant="outline">
                        {PAYMENT_METHOD_LABELS[debt.paymentMethod]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(debt.date)} →{" "}
                      {last ? formatDate(last.installment.date) : "-"}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Lock className="h-3.5 w-3.5 shrink-0" />
                      Cuotas registradas sin edición
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && schedule.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Cronograma de cuotas</h2>
              <p className="text-xs text-muted-foreground">
                Proyección mes a mes: cada cuota ya está registrada como egreso
                en su mes.
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deuda</TableHead>
                  <TableHead>Cuota</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map(({ installment, debt }) => (
                  <TableRow key={installment.id}>
                    <TableCell className="font-medium">{debt.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {installment.number}/{debt.cuotas}
                    </TableCell>
                    <TableCell>{formatDate(installment.date)}</TableCell>
                    <TableCell>
                      {isProjectedInstallment(installment, today) ? (
                        <Badge variant="outline">Proyectada</Badge>
                      ) : (
                        <Badge variant="expense">Registrada</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-600 dark:text-red-400">
                      -{formatCurrency(installment.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <DebtFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar deuda?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán sus {deleting?.cuotas ?? 0} cuotas (
              {formatCurrency(deletingCost)}) y desaparecerán de tus
              reportes. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deletingError ? (
            <p className="text-sm font-medium text-destructive" role="alert">
              {deletingError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
