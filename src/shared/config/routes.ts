export const appRoutes = {
  experiments: "experiments",
  models: "models",
  wrappers: "wrappers",
  wrappersNew: "wrappers/new",
  stats: "stats",
  settings: "settings",
} as const;

export function getWrapperDetailRoute(wrapperId: string) {
  return `${appRoutes.wrappers}/${wrapperId}`;
}
