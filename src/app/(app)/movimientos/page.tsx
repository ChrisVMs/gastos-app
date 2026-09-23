"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  FilterX,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { MovementFormDialog } from "@/components/movement-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { deleteTransaction } from "@/lib/db";
import { useData } from "@/lib/data";
import { PAYMENT_METHOD_LABELS, TYPE_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Transaction, TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_FILTERS: { value: "all" | TransactionType; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "expense", label: "Gastos" },
  { value: "income", label: "Ingresos" },
];

export default function MovementsPage() {
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [deletingError, setDeletingError] = useState("");

  const data = useData();
  const transactions = data?.transactions;
  const categories = data?.categories;

  const filtered = useMemo(() => {
    return (transactions ?? []).filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (categoryFilter !== "all" && String(t.categoryId) !== categoryFilter)
        return false;
      if (from && t.date < from) return false;
      if (to && t.date > to) return false;
      return true;
    });
  }, [transactions, typeFilter, categoryFilter, from, to]);

  const categoryById = useMemo(
    () => new Map((categories ?? []).map((c) => [c.id, c])),
    [categories]
  );

  const hasActiveFilters =
    typeFilter !== "all" ||
    categoryFilter !== "all" ||
    from !== "" ||
    to !== "";

  const resetFilters = () => {
    setTypeFilter("all");
    setCategoryFilter("all");
    setFrom("");
    setTo("");
  };

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (t: Transaction) => {
    setEditing(t);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting?.id) return;
    setDeletingError("");
    try {
      await deleteTransaction(deleting.id);
      setDeleting(null);
    } catch {
      setDeletingError(
        "Ocurrió un error al eliminar el movimiento. Inténtalo de nuevo."
      );
    }
  };

  const showCategories =
    categories && categories.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Movimientos</h1>
          <p className="text-sm text-muted-foreground">
            Registra, edita y filtra tus ingresos y gastos.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus /> Nuevo movimiento
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="filter-type" className="text-xs">
              Tipo
            </Label>
            <Select
              value={typeFilter}
              onValueChange={(v) =>
                setTypeFilter(v as "all" | TransactionType)
              }
            >
              <SelectTrigger id="filter-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filter-category" className="text-xs">
              Categoría
            </Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger id="filter-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {(categories ?? [])
                  .sort((a, b) => a.type.localeCompare(b.type))
                  .map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filter-from" className="text-xs">
              Desde
            </Label>
            <Input
              id="filter-from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filter-to" className="text-xs">
              Hasta
            </Label>
            <Input
              id="filter-to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {hasActiveFilters ? (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
            <FilterX /> Limpiar filtros
          </Button>
        </div>
      ) : null}

      {!showCategories ? (
        <EmptyState
          icon={Wallet}
          title="Cargando…"
          description="Preparando tus categorías."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={hasActiveFilters ? "Sin resultados" : "No hay movimientos"}
          description={
            hasActiveFilters
              ? "No se encontraron movimientos con los filtros seleccionados."
              : "Registra tu primer ingreso o gasto para empezar."
          }
          action={
            !hasActiveFilters ? (
              <Button onClick={openNew}>
                <Plus /> Nuevo movimiento
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Método de pago</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="w-20 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => {
                    const category = categoryById.get(t.categoryId);
                    return (
                      <TableRow key={t.id}>
                        <TableCell>{formatDate(t.date)}</TableCell>
                        <TableCell>
                          <Badge variant={t.type}>
                            {TYPE_LABELS[t.type]}
                          </Badge>
                        </TableCell>
                        <TableCell>{category?.name ?? "Sin categoría"}</TableCell>
                        <TableCell className="max-w-48 truncate text-muted-foreground">
                          {t.description || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {PAYMENT_METHOD_LABELS[t.paymentMethod]}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-semibold",
                            t.type === "expense"
                              ? "text-red-600 dark:text-red-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          )}
                        >
                          {t.type === "expense" ? "-" : "+"}
                          {formatCurrency(t.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Editar movimiento"
                              onClick={() => openEdit(t)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Eliminar movimiento"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeleting(t);
                                setDeletingError("");
                              }}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="md:hidden">
            <CardContent className="p-2">
              <ul className="divide-y">
                {filtered.map((t) => {
                  const category = categoryById.get(t.categoryId);
                  return (
                    <li key={t.id}>
                      <div
                        className="flex items-center gap-3 px-2 py-3"
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                            t.type === "expense"
                              ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                          )}
                        >
                          {t.type === "expense" ? (
                            <ArrowUpFromLine className="h-4 w-4" />
                          ) : (
                            <ArrowDownToLine className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {category?.name ?? "Sin categoría"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {formatDate(t.date)}
                            {t.description ? ` · ${t.description}` : ""}
                            {" · "}
                            {PAYMENT_METHOD_LABELS[t.paymentMethod]}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 text-sm font-semibold",
                            t.type === "expense"
                              ? "text-red-600 dark:text-red-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          )}
                        >
                          {t.type === "expense" ? "-" : "+"}
                          {formatCurrency(t.amount)}
                        </span>
                      </div>
                      <div className="flex justify-end gap-1 px-2 pb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(t)}
                        >
                          <Pencil /> Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeleting(t);
                            setDeletingError("");
                          }}
                        >
                          <Trash2 /> Eliminar
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      <MovementFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        transaction={editing}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar movimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El movimiento se eliminará de
              forma permanente.
            </AlertDialogDescription>
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