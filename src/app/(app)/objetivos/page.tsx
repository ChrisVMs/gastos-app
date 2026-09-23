"use client";

import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  MoreVertical,
  Pencil,
  Plus,
  Target,
  Trash2,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { GoalIcon } from "@/components/goal-icon";
import { GoalFormDialog } from "@/components/goal-form-dialog";
import {
  GoalFundsDialog,
  type FundsAction,
} from "@/components/goal-funds-dialog";
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
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteGoal } from "@/lib/db";
import { useData } from "@/lib/data";
import { formatCurrency, formatDateShort } from "@/lib/format";
import type { Goal } from "@/lib/types";

function goalPercent(goal: Goal): number {
  if (goal.targetAmount <= 0) return 0;
  return Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));
}

export default function ObjetivosPage() {
  const goals = useData()?.goals;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [fundsOpen, setFundsOpen] = useState(false);
  const [fundsGoal, setFundsGoal] = useState<Goal | null>(null);
  const [fundsAction, setFundsAction] = useState<FundsAction>("add");
  const [deleting, setDeleting] = useState<Goal | null>(null);
  const [deletingError, setDeletingError] = useState("");

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (goal: Goal) => {
    setEditing(goal);
    setFormOpen(true);
  };

  const openFunds = (goal: Goal, action: FundsAction) => {
    setFundsGoal(goal);
    setFundsAction(action);
    setFundsOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting?.id) return;
    setDeletingError("");
    try {
      await deleteGoal(deleting.id);
      setDeleting(null);
    } catch {
      setDeletingError(
        "Ocurrió un error al eliminar el objetivo. Inténtalo de nuevo."
      );
    }
  };

  const loading = goals === undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Objetivos</h1>
          <p className="text-sm text-muted-foreground">
            Define metas de ahorro y sigue su progreso.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus /> Nuevo objetivo
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Aún no tienes objetivos"
          description="Crea una meta de ahorro como un viaje, una laptop o un fondo de emergencia."
          action={
            <Button onClick={openNew}>
              <Plus /> Crear objetivo
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => {
            const percent = goalPercent(goal);
            const completed = goal.savedAmount >= goal.targetAmount;
            const remaining = goal.targetAmount - goal.savedAmount;
            return (
              <Card key={goal.id}>
                <CardContent className="flex h-full flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={
                          completed
                            ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                            : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                        }
                      >
                        <GoalIcon name={goal.icon} className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {goal.name}
                        </p>
                        {goal.description ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {goal.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          aria-label={`Acciones de ${goal.name}`}
                        >
                          <MoreVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(goal)}>
                          <Pencil /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openFunds(goal, "add")}>
                          <ArrowDownLeft /> Agregar dinero
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openFunds(goal, "withdraw")}
                        >
                          <ArrowUpRight /> Retirar dinero
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setDeleting(goal);
                            setDeletingError("");
                          }}
                        >
                          <Trash2 /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Objetivo</p>
                      <p className="font-semibold">
                        {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ahorrado</p>
                      <p className="font-semibold">
                        {formatCurrency(goal.savedAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-semibold">{percent}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-auto">
                    {completed ? (
                      <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Objetivo completado
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Faltan{" "}
                        <span className="font-semibold text-foreground">
                          {formatCurrency(Math.max(0, remaining))}
                        </span>
                      </p>
                    )}
                    {goal.targetDate ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Fecha objetivo: {formatDateShort(goal.targetDate)}
                      </p>
                    ) : null}
                    {completed ? (
                      <Badge variant="income" className="mt-1.5">
                        Completado
                      </Badge>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <GoalFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        goal={editing}
      />

      <GoalFundsDialog
        open={fundsOpen}
        onOpenChange={setFundsOpen}
        goal={fundsGoal}
        action={fundsAction}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar objetivo?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && deleting.savedAmount > 0
                ? "Este objetivo tiene dinero ahorrado que se perderá. Esta acción no se puede deshacer."
                : "Esta acción no se puede deshacer. El objetivo se eliminará de forma permanente."}
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