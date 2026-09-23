import {
  Briefcase,
  Car,
  Gift,
  GraduationCap,
  Heart,
  House,
  Laptop,
  PiggyBank,
  Plane,
  ShoppingCart,
  Target,
  Umbrella,
  type LucideIcon,
} from "lucide-react";

export const GOAL_ICON_OPTIONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "target", label: "Meta", icon: Target },
  { value: "laptop", label: "Laptop", icon: Laptop },
  { value: "plane", label: "Viaje", icon: Plane },
  { value: "umbrella", label: "Emergencia", icon: Umbrella },
  { value: "car", label: "Auto", icon: Car },
  { value: "house", label: "Casa", icon: House },
  { value: "piggy-bank", label: "Ahorro", icon: PiggyBank },
  { value: "gift", label: "Regalo", icon: Gift },
  { value: "graduation", label: "Educación", icon: GraduationCap },
  { value: "briefcase", label: "Trabajo", icon: Briefcase },
  { value: "heart", label: "Salud", icon: Heart },
  { value: "shopping", label: "Compras", icon: ShoppingCart },
];

const ICONS: Record<string, LucideIcon> = Object.fromEntries(
  GOAL_ICON_OPTIONS.map((o) => [o.value, o.icon])
);

export function GoalIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Target;
  return <Icon className={className} aria-hidden="true" />;
}