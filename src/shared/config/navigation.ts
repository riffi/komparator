import { appRoutes } from "@/shared/config/routes";

export const navigationItems = [
  { href: appRoutes.experiments, label: "Experiments", icon: "experiments" },
  { href: appRoutes.models, label: "Models", icon: "models" },
  { href: appRoutes.wrappers, label: "Wrappers", icon: "wrappers" },
  { href: appRoutes.stats, label: "Stats", icon: "stats" },
  { href: appRoutes.settings, label: "Settings", icon: "settings" },
] as const;
