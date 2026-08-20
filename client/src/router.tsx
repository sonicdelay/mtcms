import { createBrowserRouter, Navigate } from "react-router";
import RootLayout from "./routes/root-layout";
import HomeLayout from "./routes/home/home-layout";
import HomePage from "./routes/home/home-page";
import ArticlesPage from "./routes/home/articles-page";
import ContentPage from "./routes/home/content-page";
import FilesPage from "./routes/admin/files-page";
import EditIndexPage from "./routes/admin/edit-index-page";
import EditPage from "./routes/admin/edit-page";
import TasksPage from "./routes/admin/tasks-page";
import ToolsPage from "./routes/admin/tools-page";
//import DashboardPage from "./routes/admin/dashboard-page";

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
        lazy: async () => ({
          Component: (await import("./routes/engine/engine-page")).default,
        }),
      },
      {
        path: "admin",
        lazy: async () => ({
          Component: (await import("./routes/admin/admin-layout")).default,
        }),
        children: [
          { index: true, element: <TasksPage /> },
          { path: "tools", element: <ToolsPage /> },
          { path: "files", element: <FilesPage /> },
          { path: "edit", element: <EditIndexPage /> },
          { path: "edit/:id", element: <EditPage /> },
        ],
      },
      { path: "*", element: <Navigate to="/home" replace /> },
    ],
  },
]);
