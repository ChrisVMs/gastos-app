"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";
import {
  getCategories,
  getDebts,
  getDebtInstallments,
  getGoals,
  getTransactions,
} from "@/lib/db";
import { subscribe } from "@/lib/refresh";
import type { Category, Debt, DebtInstallment, Goal, Transaction } from "@/lib/types";

export interface AppData {
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  debts: Debt[];
  debtInstallments: DebtInstallment[];
}

export { notifyDataChanged } from "@/lib/refresh";

async function fetchDebts(): Promise<{
  debts: Debt[];
  debtInstallments: DebtInstallment[];
}> {
  try {
    const [debts, debtInstallments] = await Promise.all([
      getDebts(),
      getDebtInstallments(),
    ]);
    return { debts, debtInstallments };
  } catch {
    return { debts: [], debtInstallments: [] };
  }
}

async function fetchData(): Promise<AppData> {
  const [transactions, categories, goals, debtData] = await Promise.all([
    getTransactions(),
    getCategories(),
    getGoals(),
    fetchDebts(),
  ]);

  return {
    transactions,
    categories,
    goals,
    debts: debtData.debts,
    debtInstallments: debtData.debtInstallments,
  };
}

export interface UserState {
  user: User | null;
  loading: boolean;
}

/** Sesión actual del usuario autenticado. */
export function useUser(): UserState {
  const [state, setState] = useState<UserState>({ user: null, loading: true });

  useEffect(() => {
    let active = true;

    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setState({ user: data.user ?? null, loading: false });
    }

    void init();

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setState({ user: session?.user ?? null, loading: false });
    });

    return () => {
      active = false;
      authSub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

/**
 * Carga en paralelo movimientos, categorías, objetivos y deudas del usuario.
 * Recarga automáticamente al cambiar de usuario y al llamar a `notifyDataChanged`.
 */
export function useData(): AppData | null {
  const [data, setData] = useState<AppData | null>(null);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    async function refresh() {
      if (!active) return;
      try {
        const next = await fetchData();
        if (active) setData(next);
      } catch {
        // Sin red o sesión inválida: mantener el último estado conocido.
      }
    }

    const unsubscribeData = subscribe(() => {
      void refresh();
    });

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id ?? null;
      if (userId !== lastUserId.current) {
        lastUserId.current = userId;
        if (userId === null) {
          setData(null);
        } else {
          void refresh();
        }
      }
    });

    void supabase.auth.getUser().then(({ data: { user } }) => {
      lastUserId.current = user?.id ?? null;
      if (user) void refresh();
    });

    return () => {
      active = false;
      unsubscribeData();
      authSub.subscription.unsubscribe();
    };
  }, []);

  return data;
}