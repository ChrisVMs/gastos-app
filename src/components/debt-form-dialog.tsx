"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addDebt } from "@/lib/db";
import { useData } from "@/lib/data";
import { PAYMENT_METHODS } from "@/lib/constants";
import { toDateString } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";

interface DebtFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DebtFormDialog({
  open,
  onOpenChange,
}: DebtFormDialogProps) {
  const categories = useData()?.categories;

  const [name, setName] = useState("");
  const [capitalAmount, setCapitalAmount] = useState("");
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("efectivo");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setCapitalAmount("");
    setDate(toDateString(new Date()));
    setCategoryId("");
    setPaymentMethod("efectivo");
    setDescription("");
    setError("");
    setSaving(false);
  }, [open]);

  const expenseCategories = (categories ?? []).filter(
    (c) => c.type === "expense"
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(capitalAmount);

    if (!name.trim()) {
      setError("Ingresa el nombre de la deuda.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Ingresa un saldo capital mayor a 0.");
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
    try {
      await addDebt({
        name: name.trim(),
        description: description.trim(),
        capitalAmount: parsedAmount,
        categoryId: Number(categoryId),
        paymentMethod,
        date,
      });
      onOpenChange(false);
    } catch {
      setError("Ocurrió un error al guardar la deuda. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva deuda</DialogTitle>
          <DialogDescription>
            Registra una deuda frecuente como una deuda bancaria. El saldo
            capital se descuenta de tu reporte como egreso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="debt-name">Nombre</Label>
            <Input
              id="debt-name"
              placeholder="Ej. Deuda bancaria"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="debt-capital">Saldo capital (S/)</Label>
              <Input
                id="debt-capital"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={capitalAmount}
                onChange={(e) => setCapitalAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-date">Fecha</Label>
              <Input
                id="debt-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="debt-category">Categoría</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="debt-category">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    No hay categorías de gasto
                  </SelectItem>
                ) : (
                  expenseCategories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="debt-payment">Método de pago</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            >
              <SelectTrigger id="debt-payment">
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
            <Label htmlFor="debt-description">Descripción (opcional)</Label>
            <Input
              id="debt-description"
              placeholder="Ej. Préstamo personal a 36 cuotas"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <p className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            El egreso generado no se puede editar. Solo podrás eliminarlo
            eliminando la deuda desde la sección Deudas.
          </p>

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
              {saving ? "Guardando…" : "Registrar deuda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}