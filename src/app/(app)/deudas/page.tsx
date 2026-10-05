"use client";

import { useMemo, useState } from "react";
import { Landmark, Lock, Plus, Trash2 } from "lucide-react";

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
import { deleteDebt } from "@/lib/db";
import { useData } from "@/lib/data";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Debt } from "@/lib/types";

export default function DebtsPage() {
  const data = useData();
  const debts = data?.debts;
  const categories = data?.categories;

  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Debt | null>(null);
  const [deletingError, setDeletingError] = useState("");

  const categoryById = useMemo(
    () => new Map((categories ?? []).map((c) => [c.id, c])),
    [categories]
  );

  const totalCapital = useMemo(
    () => (debts ?? []).reduce((acc, d) => acc + d.capitalAmount, 0),
    [debts]
  );

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deudas</h1>
          <p className="text-sm text-muted-foreground">
            Registra tus deudas frecuentes y su saldo capital. Cada deuda suma un
            egreso a tus reportes y solo se elimina desde aquí.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus /> Nueva deuda
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : debts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Deudas registradas"
            value={String(debts.length)}
            icon={Landmark}
          />
          <StatCard
            label="Saldo capital total"
            value={formatCurrency(totalCapital)}
            icon={Landmark}
            iconClassName="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
          />
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : debts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Aún no tienes deudas"
          description="Agrega una deuda como la bancaria con su saldo capital y se sumará como egreso en tu reporte."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> Registrar deuda
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {debts.map((debt) => {
            const category = categoryById.get(debt.categoryId);
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
                      <p className="text-xs text-muted-foreground">Fecha</p>
                      <p className="font-semibold">{formatDate(debt.date)}</p>
                    </div>
                  </div>

                  <div className="mt-auto space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary">
                        {category?.name ?? "Sin categoría"}
                      </Badge>
                      <Badge variant="outline">
                        {PAYMENT_METHOD_LABELS[debt.paymentMethod]}
                      </Badge>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Lock className="h-3.5 w-3.5 shrink-0" />
                      Egreso registrado sin edición
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
              Se eliminará el egreso de {formatCurrency(deleting?.capitalAmount ?? 0)}{" "}
              asociado y desaparecerá de tus reportes. Esta acción no se puede
              deshacer.
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