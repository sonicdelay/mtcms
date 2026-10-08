import { Outlet, useLocation, useNavigate } from "react-router";
import { useAppStore } from "../../lib/app.store";
import { useMounted } from "../../components/use-mounted";
import LoginForm from "../../components/login-form";
import SdApplication, { type SdNavNavItem } from "../../components/SdApplication";
import "../../stylesheets/admin.scss";

const navItems: SdNavNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "home" },
  { href: "/admin/tasks", label: "Tasklist", icon: "tasks" },
  { href: "/admin/tools", label: "Tools", icon: "tools" },
  { href: "/admin/files", label: "Files", icon: "folder" },
  { href: "/admin/edit", label: "Edit", icon: "tree" },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const token = useAppStore((s) => s.token);
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);

  const mounted = useMounted();

  if (!mounted) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const username = user?.email ?? "Guest";
  const role = user?.role ?? "Guest";

  return (
    <SdApplication
      brand="mtCMS"
      navItems={token ? navItems : undefined}
      activeHref={pathname}
      user={token ? { username, role } : null}
      theme={theme}
      onToggleTheme={toggleTheme}
      onNavigate={(href) => navigate(href)}
      onLogout={handleLogout}
    >
      {token ? <Outlet /> : <LoginForm />}
    </SdApplication>
  );
};

export default AdminLayout;
