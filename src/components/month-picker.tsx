"use client";

import { useId } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { currentMonth, formatMonth, shiftMonth } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MonthPickerProps {
  value: string;
  onChange: (month: string) => void;
}

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const id = useId();
  const today = currentMonth();
  const isCurrent = value >= today;

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9"
        aria-label="Mes anterior"
        onClick={() => onChange(shiftMonth(value, -1))}
      >
        <ChevronLeft />
      </Button>
      <label
        htmlFor={id}
        className={cn(
          "inline-flex h-9 cursor-pointer select-none items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="capitalize">{formatMonth(value)}</span>
        <input
          id={id}
          type="month"
          tabIndex={-1}
          className="sr-only"
          value={value}
          max={today}
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value);
          }}
        />
      </label>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9"
        aria-label="Mes siguiente"
        disabled={isCurrent}
        onClick={() => onChange(shiftMonth(value, 1))}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}