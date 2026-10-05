/**
 * Capa de persistencia: toda la lógica de Supabase/PostgreSQL vive aquí.
 * Los componentes no acceden al cliente de Supabase directamente.
 * Las lecturas convierten snake_case (base de datos) a camelCase (UI).
 */

import { supabase } from "@/lib/supabase/client";
import { DEBT_CATEGORY_NAME, INITIAL_CATEGORIES } from "@/lib/constants";
import { buildDebtSchedule } from "@/lib/debts";
import { notifyDataChanged } from "@/lib/refresh";
import type {
  Category,
  Debt,
  DebtInput,
  DebtInstallment,
  Goal,
  GoalInput,
  PaymentMethod,
  Transaction,
  TransactionType,
} from "@/lib/types";

let seeding = false;

interface TransactionRow {
  id: number;
  user_id: string;
  type: TransactionType;
  amount: number;
  category_id: number;
  description: string;
  date: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

interface CategoryRow {
  id: number;
  user_id: string;
  name: string;
  icon: string;
  type: TransactionType;
  created_at: string;
  updated_at: string;
}

interface DebtRow {
  id: number;
  user_id: string;
  name: string;
  description: string;
  capital_amount: number;
  cuotas: number;
  cuota_amount: number;
  category_id: number;
  payment_method: string;
  date: string;
  created_at: string;
  updated_at: string;
}

interface DebtInstallmentRow {
  id: number;
  user_id: string;
  debt_id: number;
  number: number;
  amount: number;
  date: string;
  transaction_id: number | null;
  created_at: string;
}

interface GoalRow {
  id: number;
  user_id: string;
  name: string;
  description: string;
  target_amount: number;
  saved_amount: number;
  target_date: string | null;
  icon: string;
  created_at: string;
  updated_at: string;
}

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    amount: row.amount,
    categoryId: row.category_id,
    description: row.description,
    date: row.date,
    paymentMethod: row.payment_method as PaymentMethod,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    icon: row.icon,
    type: row.type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDebt(row: DebtRow): Debt {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    capitalAmount: row.capital_amount,
    cuotas: row.cuotas,
    cuotaAmount: row.cuota_amount,
    categoryId: row.category_id,
    paymentMethod: row.payment_method as PaymentMethod,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDebtInstallment(row: DebtInstallmentRow): DebtInstallment {
  return {
    id: row.id,
    userId: row.user_id,
    debtId: row.debt_id,
    number: row.number,
    amount: row.amount,
    date: row.date,
    transactionId: row.transaction_id ?? null,
    createdAt: row.created_at,
  };
}

function toGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    targetAmount: row.target_amount,
    savedAmount: row.saved_amount,
    targetDate: row.target_date,
    icon: row.icon,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Elimina la base de datos local de IndexedDB de la versión anterior (sin afectar Supabase). */
function dropLegacyLocalDatabase(): void {
  if (typeof indexedDB === "undefined") return;
  try {
    indexedDB.deleteDatabase("app-gastos");
  } catch {
    // Si está bloqueada por otra pestaña, se reintenta en el próximo arranque.
  }
}

/** Devuelve el id de la categoría de gasto "Deuda", creándola si el usuario aún no la tiene. */
async function ensureDebtCategory(): Promise<number> {
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .ilike("name", DEBT_CATEGORY_NAME)
    .eq("type", "expense")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return data.id as number;

  const { error: insertError, data: row } = await supabase
    .from("categories")
    .insert({ name: DEBT_CATEGORY_NAME, type: "expense", icon: "landmark" })
    .select("id")
    .single();
  if (insertError) throw new Error(insertError.message);
  return row.id;
}

/** Crea las categorías iniciales del usuario solo si aún no tiene ninguna. */
export async function ensureInitialCategories(): Promise<void> {
  if (seeding) return;
  seeding = true;
  try {
    const { count, error } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true })
      .limit(0);
    if (error) throw new Error(error.message);
    if (count === 0) {
      const { error: insertError } = await supabase
        .from("categories")
        .insert(INITIAL_CATEGORIES.map((c) => ({ name: c.name, type: c.type })));
      if (insertError) throw new Error(insertError.message);
    }
    await ensureDebtCategory();
    dropLegacyLocalDatabase();
  } finally {
    seeding = false;
    notifyDataChanged();
  }
}

// --- Categorías ---

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toCategory(row as CategoryRow));
}

export async function addCategory(data: {
  name: string;
  type: TransactionType;
}): Promise<number> {
  const { error, data: row } = await supabase
    .from("categories")
    .insert({ name: data.name, type: data.type })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  notifyDataChanged();
  return row.id;
}

export async function updateCategory(
  id: number,
  data: Partial<Omit<Category, "id">>
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.type !== undefined) patch.type = data.type;
  if (data.icon !== undefined) patch.icon = data.icon;
  const { error } = await supabase.from("categories").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  notifyDataChanged();
}

export async function countTransactionsForCategory(id: number): Promise<number> {
  const { count, error } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function deleteCategory(id: number): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    throw new Error(
      "No se puede eliminar: la categoría tiene movimientos asociados."
    );
  }
  notifyDataChanged();
}

// --- Movimientos ---

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  categoryId: number;
  description: string;
  date: string;
  paymentMethod: PaymentMethod;
}

export async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toTransaction(row as TransactionRow));
}

async function insertTransaction(data: TransactionInput): Promise<number> {
  const { error, data: row } = await supabase
    .from("transactions")
    .insert({
      type: data.type,
      amount: data.amount,
      category_id: data.categoryId,
      description: data.description,
      date: data.date,
      payment_method: data.paymentMethod,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return row.id;
}

async function findDebtByTransaction(
  transactionId: number
): Promise<Debt | null> {
  const { data, error } = await supabase
    .from("debt_installments")
    .select("debt_id")
    .eq("transaction_id", transactionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const { data: debt, error: debtError } = await supabase
    .from("debts")
    .select("*")
    .eq("id", data.debt_id)
    .single();
  if (debtError) throw new Error(debtError.message);
  return toDebt(debt as DebtRow);
}

export async function addTransaction(data: TransactionInput): Promise<number> {
  const id = await insertTransaction(data);
  notifyDataChanged();
  return id;
}

export async function updateTransaction(
  id: number,
  data: Partial<TransactionInput>
): Promise<void> {
  const debt = await findDebtByTransaction(id);
  if (debt) {
    throw new Error(
      `El movimiento de "${debt.name}" no se puede editar. Gestiona la deuda desde la sección Deudas.`
    );
  }
  const patch: Record<string, unknown> = {};
  if (data.type !== undefined) patch.type = data.type;
  if (data.amount !== undefined) patch.amount = data.amount;
  if (data.categoryId !== undefined) patch.category_id = data.categoryId;
  if (data.description !== undefined) patch.description = data.description;
  if (data.date !== undefined) patch.date = data.date;
  if (data.paymentMethod !== undefined) patch.payment_method = data.paymentMethod;
  const { error } = await supabase
    .from("transactions")
    .update(patch)
    .eq("id", id);
  if (error) throw new Error(error.message);
  notifyDataChanged();
}

export async function deleteTransaction(id: number): Promise<void> {
  const debt = await findDebtByTransaction(id);
  if (debt) {
    throw new Error(
      `El movimiento de "${debt.name}" no se puede eliminar aquí. Elimínalo desde la sección Deudas.`
    );
  }
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  notifyDataChanged();
}

// --- Deudas ---

export async function getDebts(): Promise<Debt[]> {
  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toDebt(row as DebtRow));
}

export async function getDebtInstallments(): Promise<DebtInstallment[]> {
  const { data, error } = await supabase
    .from("debt_installments")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toDebtInstallment(row as DebtInstallmentRow));
}

/**
 * Registra una deuda y proyecta sus cuotas: crea un egreso por mes
 * (desde la fecha de la deuda) en la categoría fija "Deuda".
 */
export async function addDebt(data: DebtInput): Promise<number> {
  const categoryId = await ensureDebtCategory();
  const schedule = buildDebtSchedule(data.date, data.cuotas, data.cuotaAmount);
  if (schedule.length === 0) throw new Error("La deuda debe tener al menos una cuota.");

  const { error: debtError, data: debtRow } = await supabase
    .from("debts")
    .insert({
      name: data.name,
      description: data.description,
      capital_amount: data.capitalAmount,
      cuotas: data.cuotas,
      cuota_amount: data.cuotaAmount,
      category_id: categoryId,
      payment_method: data.paymentMethod,
      date: data.date,
    })
    .select("id")
    .single();
  if (debtError) throw new Error(debtError.message);
  const debtId = debtRow.id;

  const { error: transactionError, data: transactions } = await supabase
    .from("transactions")
    .insert(
      schedule.map((installment) => ({
        type: "expense",
        amount: installment.amount,
        category_id: categoryId,
        description: `${data.name} · cuota ${installment.number}/${data.cuotas}`,
        date: installment.date,
        payment_method: data.paymentMethod,
      }))
    )
    .select("id, date");
  if (transactionError) {
    await supabase.from("debts").delete().eq("id", debtId);
    throw new Error(transactionError.message);
  }

  const transactionIdByDate = new Map(
    (transactions ?? []).map((row) => [row.date as string, row.id as number])
  );
  const { error: installmentError } = await supabase
    .from("debt_installments")
    .insert(
      schedule.map((installment) => ({
        debt_id: debtId,
        number: installment.number,
        amount: installment.amount,
        date: installment.date,
        transaction_id: transactionIdByDate.get(installment.date) ?? null,
      }))
    );
  if (installmentError) {
    const ids = [...transactionIdByDate.values()];
    if (ids.length > 0) {
      await supabase.from("transactions").delete().in("id", ids);
    }
    await supabase.from("debts").delete().eq("id", debtId);
    throw new Error(installmentError.message);
  }

  notifyDataChanged();
  return debtId;
}

export async function deleteDebt(id: number): Promise<void> {
  const { data, error: selectError } = await supabase
    .from("debt_installments")
    .select("transaction_id")
    .eq("debt_id", id);
  if (selectError) throw new Error(selectError.message);

  const transactionIds = (data ?? [])
    .map((row) => row.transaction_id as number | null)
    .filter((transactionId): transactionId is number => transactionId !== null);
  if (transactionIds.length > 0) {
    const { error: transactionError } = await supabase
      .from("transactions")
      .delete()
      .in("id", transactionIds);
    if (transactionError) throw new Error(transactionError.message);
  }

  const { error: installmentError } = await supabase
    .from("debt_installments")
    .delete()
    .eq("debt_id", id);
  if (installmentError) throw new Error(installmentError.message);

  const { error } = await supabase.from("debts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  notifyDataChanged();
}

// --- Objetivos ---

export async function getGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toGoal(row as GoalRow));
}

export async function addGoal(data: GoalInput): Promise<number> {
  const { error, data: row } = await supabase
    .from("goals")
    .insert({
      name: data.name,
      description: data.description,
      target_amount: data.targetAmount,
      saved_amount: data.savedAmount,
      target_date: data.targetDate,
      icon: data.icon,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  notifyDataChanged();
  return row.id;
}

export async function updateGoal(
  id: number,
  data: Omit<GoalInput, "savedAmount">
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.description !== undefined) patch.description = data.description;
  if (data.targetAmount !== undefined) patch.target_amount = data.targetAmount;
  if (data.targetDate !== undefined) patch.target_date = data.targetDate;
  if (data.icon !== undefined) patch.icon = data.icon;
  const { error } = await supabase.from("goals").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  notifyDataChanged();
}

export async function deleteGoal(id: number): Promise<void> {
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw new Error(error.message);
  notifyDataChanged();
}

export async function addGoalFunds(id: number, amount: number): Promise<void> {
  const { data: goal, error: selectError } = await supabase
    .from("goals")
    .select("saved_amount")
    .eq("id", id)
    .single();
  if (selectError || !goal) throw new Error("No se encontró el objetivo.");
  const savedAmount = Math.max(0, (goal.saved_amount ?? 0) + amount);
  const { error } = await supabase
    .from("goals")
    .update({ saved_amount: savedAmount })
    .eq("id", id);
  if (error) throw new Error(error.message);
  notifyDataChanged();
}

export async function withdrawGoalFunds(
  id: number,
  amount: number
): Promise<void> {
  const { data: goal, error: selectError } = await supabase
    .from("goals")
    .select("saved_amount")
    .eq("id", id)
    .single();
  if (selectError || !goal) throw new Error("No se encontró el objetivo.");
  const savedAmount = Math.max(0, (goal.saved_amount ?? 0) - amount);
  const { error } = await supabase
    .from("goals")
    .update({ saved_amount: savedAmount })
    .eq("id", id);
  if (error) throw new Error(error.message);
  notifyDataChanged();
}