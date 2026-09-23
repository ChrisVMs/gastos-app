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