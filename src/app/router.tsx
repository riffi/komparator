import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import { ExperimentDetailPage } from "@/pages/experiment-detail-page/index";
import { ExperimentsPage } from "@/pages/experiments-page/index";
import { ModelsPage } from "@/pages/models-page/index";
import { StatsPage } from "@/pages/stats-page/index";
import { WrappersPage } from "@/pages/wrappers-page/index";
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
        element: <ModelsPage />,
      },
      {
        path: appRoutes.wrappers,
        element: <WrappersPage />,
      },
      {
        path: appRoutes.stats,
        element: <StatsPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
