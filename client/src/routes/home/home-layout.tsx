import { Outlet } from "react-router";
import Nav from "../../components/home/nav";

export default function HomeLayout() {
  return (
    <div className="flex flex-1 flex-col">
      <Nav />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}