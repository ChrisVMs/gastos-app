"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  /** Versión solo icono para la barra superior móvil. */
  compact?: boolean;
  className?: string;
}

export function ThemeToggle({ compact, className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? "icon" : "default"}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      onClick={toggleTheme}
      className={cn(
        compact
          ? "text-muted-foreground"
          : "w-full justify-start gap-3 px-3 text-muted-foreground hover:text-accent-foreground",
        className
      )}
    >
      {isDark ? (
        <Sun className="h-4 w-4 shrink-0" />
      ) : (
        <Moon className="h-4 w-4 shrink-0" />
      )}
      {!compact ? (
        <span className="text-sm font-medium">
          {isDark ? "Modo claro" : "Modo oscuro"}
        </span>
      ) : null}
    </Button>
  );
}
