//import Nav from "./components/nav";
//import "./markdown.scss";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1 flex-col">
      {/* <Nav /> */}
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
