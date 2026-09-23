import type { PaymentMethod, TransactionType } from "@/lib/types";

export const CURRENCY = "PEN";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta_debito", label: "Tarjeta de débito" },
  { value: "tarjeta_credito", label: "Tarjeta de crédito" },
  { value: "transferencia", label: "Transferencia" },
  { value: "yape", label: "Yape" },
  { value: "plin", label: "Plin" },
  { value: "otro", label: "Otro" },
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> =
  PAYMENT_METHODS.reduce(
    (acc, m) => {
      acc[m.value] = m.label;
      return acc;
    },
    {} as Record<PaymentMethod, string>
  );

export const TYPE_LABELS: Record<TransactionType, string> = {
  income: "Ingreso",
  expense: "Gasto",
};

export const INITIAL_CATEGORIES: { name: string; type: TransactionType }[] = [
  { name: "Alimentación", type: "expense" },
  { name: "Vivienda", type: "expense" },
  { name: "Transporte", type: "expense" },
  { name: "Servicios", type: "expense" },
  { name: "Entretenimiento", type: "expense" },
  { name: "Salud", type: "expense" },
  { name: "Compras", type: "expense" },
  { name: "Educación", type: "expense" },
  { name: "Otros", type: "expense" },
  { name: "Sueldo", type: "income" },
  { name: "Freelance", type: "income" },
  { name: "Negocio", type: "income" },
  { name: "Inversiones", type: "income" },
  { name: "Otros", type: "income" },
];