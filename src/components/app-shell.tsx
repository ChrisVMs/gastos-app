"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Menu,
  Tags,
  Target,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUser } from "@/lib/data";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/categorias", label: "Categorías", icon: Tags },
  { href: "/objetivos", label: "Objetivos", icon: Target },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
];

export function Brand() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Wallet className="h-4 w-4" />
      </div>
      <span className="text-sm font-semibold tracking-tight">Mis Finanzas</span>
    </div>
  );
}

interface SidebarNavProps {
  onNavigate?: () => void;
}

function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarFooter() {
  const { user } = useUser();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <div className="mt-auto border-t pt-4">
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 px-3"
        onClick={handleSignOut}
        disabled={signingOut}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span className="min-w-0 text-left">
          <span className="block truncate text-sm font-medium">
            {user?.user_metadata?.email ?? user?.email ?? "Mi cuenta"}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
          </span>
        </span>
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-secondary/30 lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col gap-6 border-r bg-background p-4 lg:flex">
        <Brand />
        <SidebarNav />
        <SidebarFooter />
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur lg:hidden">
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menú">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <Brand />
        </header>
        <SheetContent side="left" className="flex w-72 flex-col p-4">
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <SheetDescription className="sr-only">
            Navegación principal de la aplicación
          </SheetDescription>
          <div className="mb-6">
            <Brand />
          </div>
          <SidebarNav onNavigate={() => setMenuOpen(false)} />
          <SidebarFooter />
        </SheetContent>
      </Sheet>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}