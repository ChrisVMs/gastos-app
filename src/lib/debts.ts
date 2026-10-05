import { addMonths } from "@/lib/format";
import type { Debt, DebtInstallment } from "@/lib/types";

export interface ScheduledInstallment {
  number: number;
  amount: number;
  date: string;
}

/**
 * Cronograma de una deuda: una cuota por mes, empezando en la fecha
 * de la deuda. Las cuotas futuras son la proyección hacia meses siguientes.
 */
export function buildDebtSchedule(
  startDate: string,
  cuotas: number,
  cuotaAmount: number
): ScheduledInstallment[] {
  return Array.from({ length: Math.max(0, Math.floor(cuotas)) }, (_, index) => ({
    number: index + 1,
    amount: cuotaAmount,
    date: addMonths(startDate, index),
  }));
}

/** Total a pagar: importe de la cuota por número de cuotas. */
export function debtTotalCost(debt: Debt): number {
  return debt.cuotas * debt.cuotaAmount;
}

/** Interés total: total a pagar menos el saldo capital. */
export function debtInterest(debt: Debt): number {
  return debtTotalCost(debt) - debt.capitalAmount;
}

/** Una cuota con fecha posterior a `today` todavía no se ha registrado. */
export function isProjectedInstallment(
  installment: Pick<DebtInstallment, "date">,
  today: string
): boolean {
  return installment.date > today;
}
