import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import { ExperimentDetailPage } from "@/pages/experiment-detail-page/index";
import { ExperimentsPage } from "@/pages/experiments-page/index";
import { appRoutes } from "@/shared/config/routes";
import { AppShell } from "@/widgets/app-shell/ui/app-shell";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Navigate to={appRoutes.experiments} replace />,
      },
      {
        path: appRoutes.experiments,
        element: <ExperimentsPage />,
      },
      {
        path: `${appRoutes.experiments}/:experimentId`,
        element: <ExperimentDetailPage />,
      },
      {
        path: appRoutes.models,
        element: <PlaceholderPage title="Models" />,
      },
      {
        path: appRoutes.wrappers,
        element: <PlaceholderPage title="Wrappers" />,
      },
      {
        path: appRoutes.categories,
        element: <PlaceholderPage title="Categories" />,
      },
      {
        path: appRoutes.stats,
        element: <PlaceholderPage title="Stats" />,
      },
    ],
  },
]);

function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="rounded-lg border border-border/80 bg-surface/70 p-6 shadow-panel">
      <h1 className="font-mono text-2xl font-semibold text-text">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        This section is scaffolded and will be implemented after the experiments workspace reaches MVP quality.
      </p>
    </section>
  );
}

export function AppRouter() {
  return <RouterProvider router={router} />;
}