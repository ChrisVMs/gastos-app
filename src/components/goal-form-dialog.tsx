"use client";

import { useEffect, useState } from "react";

import { GoalIcon, GOAL_ICON_OPTIONS } from "@/components/goal-icon";
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
import { addGoal, updateGoal } from "@/lib/db";
import type { Goal } from "@/lib/types";
import { cn } from "@/lib/utils";

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
}

export function GoalFormDialog({
  open,
  onOpenChange,
  goal,
}: GoalFormDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [icon, setIcon] = useState("target");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(goal?.name ?? "");
    setDescription(goal?.description ?? "");
    setTargetAmount(goal ? String(goal.targetAmount) : "");
    setSavedAmount(goal ? String(goal.savedAmount) : "");
    setTargetDate(goal?.targetDate ?? "");
    setIcon(goal?.icon ?? "target");
    setError("");
    setSaving(false);
  }, [open, goal]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedTarget = Number(targetAmount);
    const parsedSaved = Number(savedAmount || "0");

    if (!name.trim()) {
      setError("Ingresa el nombre del objetivo.");
      return;
    }
    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      setError("Ingresa un monto objetivo mayor a 0.");
      return;
    }
    if (!Number.isFinite(parsedSaved) || parsedSaved < 0) {
      setError("El monto ahorrado no puede ser negativo.");
      return;
    }

    setError("");
    setSaving(true);
    const data = {
      name: name.trim(),
      description: description.trim(),
      targetAmount: parsedTarget,
      savedAmount: parsedSaved,
      targetDate: targetDate || null,
      icon,
    };
    try {
      if (goal?.id) {
        await updateGoal(goal.id, data);
      } else {
        await addGoal(data);
      }
      onOpenChange(false);
    } catch {
      setError("Ocurrió un error al guardar el objetivo. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {goal ? "Editar objetivo" : "Nuevo objetivo"}
          </DialogTitle>
          <DialogDescription>
            Define un objetivo de ahorro y registra cuánto llevas ahorrado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-name">Nombre</Label>
            <Input
              id="goal-name"
              placeholder="Ej. Comprar laptop"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-description">Descripción (opcional)</Label>
            <Input
              id="goal-description"
              placeholder="Ej. Ahorro para el trabajo"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal-target">Monto objetivo (S/)</Label>
              <Input
                id="goal-target"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-saved">Ahorrado (S/)</Label>
              <Input
                id="goal-saved"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={savedAmount}
                onChange={(e) => setSavedAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-date">Fecha objetivo (opcional)</Label>
            <Input
              id="goal-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Icono</Label>
            <div className="grid grid-cols-6 gap-2">
              {GOAL_ICON_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  title={option.label}
                  aria-label={option.label}
                  onClick={() => setIcon(option.value)}
                  className={cn(
                    "flex h-10 items-center justify-center rounded-md border transition-colors",
                    icon === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <option.icon className="h-4 w-4" />
                </button>
              ))}
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Seleccionado: <GoalIcon name={icon} className="h-3.5 w-3.5" />
            </p>
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
            <Button type="submit" disabled={saving}>
              {saving
                ? "Guardando…"
                : goal
                  ? "Guardar cambios"
                  : "Crear objetivo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}