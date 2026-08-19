import { createBrowserRouter, Navigate } from "react-router";
import RootLayout from "./routes/root-layout";
import HomeLayout from "./routes/home/home-layout";
import HomePage from "./routes/home/home-page";
import ArticlesPage from "./routes/home/articles-page";
import ContentPage from "./routes/home/content-page";

const engineRoute = async () => ({
  Component: (await import("./routes/engine/engine-page")).default,
});

const adminLayoutRoute = async () => ({
  Component: (await import("./routes/admin/admin-layout")).default,
});

const dashboardRoute = async () => ({
  Component: (await import("./routes/admin/dashboard-page")).default,
});

const tasksRoute = async () => ({
  Component: (await import("./routes/admin/tasks-page")).default,
});

const toolsRoute = async () => ({
  Component: (await import("./routes/admin/tools-page")).default,
});

const filesRoute = async () => ({
  Component: (await import("./routes/admin/files-page")).default,
});

const editIndexRoute = async () => ({
  Component: (await import("./routes/admin/edit-index-page")).default,
});

const editPageRoute = async () => ({
  Component: (await import("./routes/admin/edit-page")).default,
});

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      {
        path: "home",
        element: <HomeLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "articles/*", element: <ArticlesPage /> },
          { path: "content/:id", element: <ContentPage /> },
        ],
      },
      {
        path: "engine",
        lazy: engineRoute,
      },
      {
        path: "admin",
        lazy: adminLayoutRoute,
        children: [
          { index: true, lazy: dashboardRoute },
          { path: "tasks", lazy: tasksRoute },
          { path: "tools", lazy: toolsRoute },
          { path: "files", lazy: filesRoute },
          { path: "edit", lazy: editIndexRoute },
          { path: "edit/:id", lazy: editPageRoute },
        ],
      },
      { path: "*", element: <Navigate to="/home" replace /> },
    ],
  },
]);