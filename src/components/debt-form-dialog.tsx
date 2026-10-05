"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, Lock } from "lucide-react";

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
import { DEBT_CATEGORY_NAME, PAYMENT_METHODS } from "@/lib/constants";
import { addDebt } from "@/lib/db";
import { buildDebtSchedule } from "@/lib/debts";
import { formatCurrency, formatMonth, toDateString } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";

const MAX_CUOTAS = 600;

interface DebtFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DebtFormDialog({ open, onOpenChange }: DebtFormDialogProps) {
  const [name, setName] = useState("");
  const [capitalAmount, setCapitalAmount] = useState("");
  const [cuotas, setCuotas] = useState("1");
  const [cuotaAmount, setCuotaAmount] = useState("");
  const [date, setDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setCapitalAmount("");
    setCuotas("1");
    setCuotaAmount("");
    setDate(toDateString(new Date()));
    setPaymentMethod("efectivo");
    setDescription("");
    setError("");
    setSaving(false);
  }, [open]);

  const parsedCapital = Number(capitalAmount);
  const parsedCuotas = Math.floor(Number(cuotas));
  const parsedCuota = Number(cuotaAmount);

  const summary = useMemo(() => {
    const valid =
      Number.isFinite(parsedCapital) &&
      parsedCapital > 0 &&
      Number.isFinite(parsedCuotas) &&
      parsedCuotas > 0 &&
      Number.isFinite(parsedCuota) &&
      parsedCuota > 0 &&
      date !== "";
    if (!valid) return null;
    const schedule = buildDebtSchedule(date, parsedCuotas, parsedCuota);
    const total = parsedCuotas * parsedCuota;
    return {
      total,
      interest: total - parsedCapital,
      firstMonth: schedule[0]?.date.slice(0, 7) ?? "",
      lastMonth: schedule[schedule.length - 1]?.date.slice(0, 7) ?? "",
    };
  }, [parsedCapital, parsedCuotas, parsedCuota, date]);

  const handleCalculateCuota = () => {
    if (!Number.isFinite(parsedCapital) || parsedCapital <= 0) {
      setError("Ingresa un saldo capital mayor a 0 para calcular la cuota.");
      return;
    }
    if (!Number.isFinite(parsedCuotas) || parsedCuotas <= 0) {
      setError("Ingresa un número de cuotas válido para calcular el importe.");
      return;
    }
    setError("");
    setCuotaAmount((parsedCapital / parsedCuotas).toFixed(2));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Ingresa el nombre de la deuda.");
      return;
    }
    if (!Number.isFinite(parsedCapital) || parsedCapital <= 0) {
      setError("Ingresa un saldo capital mayor a 0.");
      return;
    }
    if (!Number.isFinite(parsedCuotas) || parsedCuotas < 1) {
      setError("La deuda debe tener al menos 1 cuota.");
      return;
    }
    if (parsedCuotas > MAX_CUOTAS) {
      setError(`El número de cuotas no puede superar ${MAX_CUOTAS}.`);
      return;
    }
    if (!Number.isFinite(parsedCuota) || parsedCuota <= 0) {
      setError("Ingresa el importe de la cuota.");
      return;
    }
    if (!date) {
      setError("Selecciona la fecha de la primera cuota.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      await addDebt({
        name: name.trim(),
        description: description.trim(),
        capitalAmount: parsedCapital,
        cuotas: parsedCuotas,
        cuotaAmount: parsedCuota,
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
            Registra una deuda como la bancaria con su saldo capital y proyecta
            sus cuotas mes a mes.
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
              <Label htmlFor="debt-cuotas">Cuotas</Label>
              <Input
                id="debt-cuotas"
                type="number"
                inputMode="numeric"
                min="1"
                max={MAX_CUOTAS}
                step="1"
                value={cuotas}
                onChange={(e) => setCuotas(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="debt-cuota-amount">Importe por cuota (S/)</Label>
              <Input
                id="debt-cuota-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={cuotaAmount}
                onChange={(e) => setCuotaAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-date">Fecha de la 1.° cuota</Label>
              <Input
                id="debt-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCalculateCuota}
              className="text-muted-foreground"
            >
              <Calculator /> Calcular cuota (capital / cuotas)
            </Button>
          </div>

          {summary ? (
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Total a pagar</p>
                <p className="font-semibold">
                  {formatCurrency(summary.total)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Interés total</p>
                <p
                  className={
                    summary.interest > 0
                      ? "font-semibold text-red-600 dark:text-red-400"
                      : "font-semibold"
                  }
                >
                  {formatCurrency(summary.interest)}
                </p>
              </div>
              <p className="col-span-2 text-xs text-muted-foreground">
                {parsedCuotas} {parsedCuotas === 1 ? "cuota" : "cuotas"} de{" "}
                {formatCurrency(parsedCuota)} · {formatMonth(summary.firstMonth)}{" "}
                → {formatMonth(summary.lastMonth)}
              </p>
            </div>
          ) : null}

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
              placeholder="Ej. Préstamo personal a 12 cuotas"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <p className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Cada cuota se registra como egreso en la categoría{" "}
            <span className="font-semibold">{DEBT_CATEGORY_NAME}</span> y no
            podrá editarse. Solo se elimina borrando la deuda desde la sección
            Deudas.
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
