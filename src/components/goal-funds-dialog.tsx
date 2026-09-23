"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addGoalFunds, withdrawGoalFunds } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import type { Goal } from "@/lib/types";
import { cn } from "@/lib/utils";

export type FundsAction = "add" | "withdraw";

interface GoalFundsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
  action: FundsAction;
}

export function GoalFundsDialog({
  open,
  onOpenChange,
  goal,
  action,
}: GoalFundsDialogProps) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setError("");
    setSaving(false);
  }, [open, goal, action]);

  if (!goal) return null;

  const isAdd = action === "add";
  const percent = goal.targetAmount > 0
    ? Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100))
    : 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Ingresa un monto mayor a 0.");
      return;
    }
    if (!isAdd && goal.id && parsed > goal.savedAmount) {
      setError("El monto a retirar no puede superar lo ahorrado.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      if (goal.id) {
        if (isAdd) {
          await addGoalFunds(goal.id, parsed);
        } else {
          await withdrawGoalFunds(goal.id, parsed);
        }
      }
      onOpenChange(false);
    } catch {
      setError("Ocurrió un error al actualizar el objetivo. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isAdd ? "Agregar dinero" : "Retirar dinero"}
          </DialogTitle>
          <DialogDescription>
            {goal.name} · ahorrado {formatCurrency(goal.savedAmount)} de{" "}
            {formatCurrency(goal.targetAmount)} ({percent}%)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="funds-amount">Monto (S/)</Label>
            <Input
              id="funds-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>

          {error ? (
            <p className="text-sm font-medium text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className={cn(!isAdd && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
            >
              {isAdd ? <ArrowDownLeft /> : <ArrowUpRight />}
              {saving
                ? "Actualizando…"
                : isAdd
                  ? "Agregar"
                  : "Retirar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}