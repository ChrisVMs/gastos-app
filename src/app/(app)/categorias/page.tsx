"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";

import { CategoryFormDialog } from "@/components/category-form-dialog";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { countTransactionsForCategory, deleteCategory } from "@/lib/db";
import { useData } from "@/lib/data";
import { TYPE_LABELS } from "@/lib/constants";
import type { Category, TransactionType } from "@/lib/types";

type Section = { type: TransactionType; title: string };

const SECTIONS: Section[] = [
  { type: "expense", title: "Gastos" },
  { type: "income", title: "Ingresos" },
];

export default function CategoriesPage() {
  const categories = useData()?.categories;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formType, setFormType] = useState<TransactionType>("expense");
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [deletingUsage, setDeletingUsage] = useState<number | null>(null);
  const [deletingError, setDeletingError] = useState("");

  const byType = useMemo(() => {
    const groups: Record<TransactionType, Category[]> = {
      expense: [],
      income: [],
    };
    for (const c of categories ?? []) {
      groups[c.type].push(c);
    }
    return groups;
  }, [categories]);

  const openNew = (type: TransactionType) => {
    setEditing(null);
    setFormType(type);
    setFormOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setFormType(c.type);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting?.id) return;
    setDeletingError("");
    try {
      await deleteCategory(deleting.id);
      setDeleting(null);
    } catch (err) {
      setDeletingError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar la categoría. Inténtalo de nuevo."
      );
    }
  };

  const startDelete = async (c: Category) => {
    setDeleting(c);
    setDeletingError("");
    setDeletingUsage(null);
    const usage = c.id ? await countTransactionsForCategory(c.id) : 0;
    setDeletingUsage(usage);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
          <p className="text-sm text-muted-foreground">
            Organiza tus movimientos por categoría.
          </p>
        </div>
        <Button onClick={() => openNew("expense")}>
          <Plus /> Nueva categoría
        </Button>
      </div>

      {categories !== undefined && categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No hay categorías"
          description="Crea categorías para clasificar tus movimientos."
          action={
            <Button onClick={() => openNew("expense")}>
              <Plus /> Crear categoría
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {SECTIONS.map((section) => (
            <Card key={section.type}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{section.title}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openNew(section.type)}
                >
                  <Plus /> Agregar
                </Button>
              </CardHeader>
              <CardContent>
                {byType[section.type].length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Sin categorías de {section.title.toLowerCase()}.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {byType[section.type].map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-2 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{c.name}</span>
                          <Badge variant={c.type} className="hidden sm:inline-flex">
                            {TYPE_LABELS[c.type]}
                          </Badge>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Editar categoría ${c.name}`}
                            onClick={() => openEdit(c)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            aria-label={`Eliminar categoría ${c.name}`}
                            onClick={() => {
                              void startDelete(c);
                            }}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
        defaultType={formType}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            {deletingUsage === null ? (
              <AlertDialogDescription>
                Verificando movimientos asociados…
              </AlertDialogDescription>
            ) : deletingUsage > 0 ? (
              <AlertDialogDescription>
                Esta categoría tiene movimientos asociados y no se puede
                eliminar. Podrás eliminarla una vez que no tenga movimientos.
              </AlertDialogDescription>
            ) : (
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La categoría se eliminará de
                forma permanente.
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          {deletingError ? (
            <p className="text-sm font-medium text-destructive" role="alert">
              {deletingError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingUsage === null || deletingUsage > 0}
              onClick={handleDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}