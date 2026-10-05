export type TransactionType = "income" | "expense";

export type PaymentMethod =
  | "efectivo"
  | "tarjeta_debito"
  | "tarjeta_credito"
  | "transferencia"
  | "yape"
  | "plin"
  | "otro";

export interface Transaction {
  id: number;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId: number;
  description: string;
  date: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  userId: string;
  name: string;
  icon: string;
  type: TransactionType;
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  id: number;
  userId: string;
  name: string;
  description: string;
  /** Saldo capital tomado de la deuda. */
  capitalAmount: number;
  /** Número de cuotas en las que se proyecta la deuda. */
  cuotas: number;
  /** Importe de cada cuota. */
  cuotaAmount: number;
  /** Categoría fija "Deuda". */
  categoryId: number;
  paymentMethod: PaymentMethod;
  /** Fecha de la primera cuota. */
  date: string;
  createdAt: string;
  updatedAt: string;
}

export type DebtInput = Omit<
  Debt,
  "id" | "userId" | "categoryId" | "createdAt" | "updatedAt"
>;

export interface DebtInstallment {
  id: number;
  userId: string;
  debtId: number;
  /** Número de cuota (1..cuotas). */
  number: number;
  amount: number;
  date: string;
  /** Egreso generado por la cuota (no editable). */
  transactionId: number | null;
  createdAt: string;
}

export interface Goal {
  id: number;
  userId: string;
  name: string;
  description: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string | null;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export type GoalInput = Omit<Goal, "id" | "userId" | "createdAt" | "updatedAt">;