import { Outlet, useLocation, useNavigate } from "react-router";
import {
  IxApplication,
  IxApplicationHeader,
  IxAvatar,
  IxContent,
  IxDropdownItem,
  IxMenu,
  IxMenuItem,
} from "@siemens/ix-react";
import {
  iconAddTaskList,
  iconElement,
  iconFolderApplicationScreen,
  iconHome,
  iconLogOut,
  iconObjectsTree,
  iconUser,
} from "@siemens/ix-icons/icons";
import { useAppStore } from "../../lib/app.store";
import { useMounted } from "../../components/use-mounted";
import LoginForm from "../../components/login-form";
import "../../admin.scss";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: iconHome },
  { href: "/admin/tasks", label: "Tasklist", icon: iconAddTaskList },
  { href: "/admin/tools", label: "Tools", icon: iconElement },
  { href: "/admin/files", label: "Files", icon: iconFolderApplicationScreen },
  { href: "/admin/edit", label: "Edit", icon: iconObjectsTree },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const token = useAppStore((s) => s.token);
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const theme = useAppStore((s) => s.theme);

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
    <div className="ix-admin">
      <IxApplication
        theme={theme === "dark" ? "classic-dark" : "classic-light"}
      >
        <IxApplicationHeader name="mtCMS">
          <div
            slot="logo"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0 0.75rem",
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>mtCMS</span>
          </div>
          {token && (
            <IxAvatar slot="bottom" username={username} extra={role}>
              <IxDropdownItem
                icon={iconUser}
                label={`${username} (${role})`}
                disabled
              />
              <IxDropdownItem
                icon={iconLogOut}
                label="Logout"
                onClick={handleLogout}
              />
            </IxAvatar>
          )}
        </IxApplicationHeader>

        {token
          ? (
            <>
              <IxMenu enableToggleTheme i18nToggleTheme="Toggle theme">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <IxMenuItem
                      key={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={active}
                      href={item.href}
                      onClick={() => navigate(item.href)}
                    />
                  );
                })}
              </IxMenu>
              <IxContent>
                <Outlet />
              </IxContent>
            </>
          )
          : (
            <IxContent>
              <LoginForm />
            </IxContent>
          )}
      </IxApplication>
    </div>
  );
};

export default AdminLayout;
