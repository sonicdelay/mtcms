import type { Metadata } from "next";
import "./admin.scss";
import AdminShell from "./admin-shell";

export const metadata: Metadata = {
  title: "mtCMS Admin",
  description: "Siemens iX demo application for mtCMS",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminShell>{children}</AdminShell>;
}
