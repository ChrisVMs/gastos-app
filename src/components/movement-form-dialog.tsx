"use client";

import { useEffect, useState } from "react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addTransaction, updateTransaction } from "@/lib/db";
import { useData } from "@/lib/data";
import { PAYMENT_METHODS } from "@/lib/constants";
import { toDateString } from "@/lib/format";
import type { PaymentMethod, Transaction, TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MovementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  defaultType?: TransactionType;
}

export function MovementFormDialog({
  open,
  onOpenChange,
  transaction,
  defaultType,
}: MovementFormDialogProps) {
  const categories = useData()?.categories;

  const [type, setType] = useState<TransactionType>(defaultType ?? "expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(transaction?.type ?? defaultType ?? "expense");
    setAmount(transaction ? String(transaction.amount) : "");
    setCategoryId(transaction?.categoryId ? String(transaction.categoryId) : "");
    setDescription(transaction?.description ?? "");
    setDate(transaction?.date ?? toDateString(new Date()));
    setPaymentMethod(transaction?.paymentMethod ?? "efectivo");
    setError("");
    setSaving(false);
  }, [open, transaction, defaultType]);

  const typeCategories =
    categories?.filter((c) => c.type === type) ?? [];

  const handleTypeChange = (next: TransactionType) => {
    setType(next);
    const currentCat = categories?.find((c) => c.id === Number(categoryId));
    if (currentCat && currentCat.type !== next) {
      setCategoryId("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Ingresa un monto mayor a 0.");
      return;
    }
    if (!categoryId) {
      setError("Selecciona una categoría.");
      return;
    }
    if (!date) {
      setError("Selecciona una fecha.");
      return;
    }

    setError("");
    setSaving(true);
    const data = {
      type,
      amount: parsedAmount,
      categoryId: Number(categoryId),
      description: description.trim(),
      date,
      paymentMethod,
    };
    try {
      if (transaction?.id) {
        await updateTransaction(transaction.id, data);
      } else {
        await addTransaction(data);
      }
      onOpenChange(false);
    } catch {
      setError("Ocurrió un error al guardar el movimiento. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Editar movimiento" : "Nuevo movimiento"}
          </DialogTitle>
          <DialogDescription>
            Registra un ingreso o gasto con su categoría y método de pago.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  type === t
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "expense" ? "Gasto" : "Ingreso"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="movement-amount">Monto (S/)</Label>
              <Input
                id="movement-amount"
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
            <div className="space-y-2">
              <Label htmlFor="movement-date">Fecha</Label>
              <Input
                id="movement-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="movement-category">Categoría</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="movement-category">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {typeCategories.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    No hay categorías de este tipo
                  </SelectItem>
                ) : (
                  typeCategories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="movement-payment">Método de pago</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            >
              <SelectTrigger id="movement-payment">
                <SelectValue placeholder="Selecciona un método de pago" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="movement-description">Descripción (opcional)</Label>
            <Input
              id="movement-description"
              placeholder="Ej. Compra en el supermercado"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
            <Button type="submit" disabled={saving}>
              {saving
                ? "Guardando…"
                : transaction
                  ? "Guardar cambios"
                  : "Guardar movimiento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}