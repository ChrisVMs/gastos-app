/**
 * Capa de persistencia: toda la lógica de Supabase/PostgreSQL vive aquí.
 * Los componentes no acceden al cliente de Supabase directamente.
 * Las lecturas convierten snake_case (base de datos) a camelCase (UI).
 */

import { supabase } from "@/lib/supabase/client";
import { INITIAL_CATEGORIES } from "@/lib/constants";
import { notifyDataChanged } from "@/lib/refresh";
import type {
  Category,
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

export async function addTransaction(data: TransactionInput): Promise<number> {
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
  notifyDataChanged();
  return row.id;
}

export async function updateTransaction(
  id: number,
  data: Partial<TransactionInput>
): Promise<void> {
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
  const { error } = await supabase.from("transactions").delete().eq("id", id);
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