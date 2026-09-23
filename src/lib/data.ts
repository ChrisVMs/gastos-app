"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";
import { getCategories, getGoals, getTransactions } from "@/lib/db";
import { subscribe } from "@/lib/refresh";
import type { Category, Goal, Transaction } from "@/lib/types";

export interface AppData {
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
}

export { notifyDataChanged } from "@/lib/refresh";

async function fetchData(): Promise<AppData> {
  const [transactions, categories, goals] = await Promise.all([
    getTransactions(),
    getCategories(),
    getGoals(),
  ]);

  return { transactions, categories, goals };
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
 * Carga en paralelo movimientos, categorías y objetivos del usuario.
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