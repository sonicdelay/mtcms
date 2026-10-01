// import { Outlet } from "react-router";
// import Nav from "../../components/home/nav";

import App from "../../../../vp1/src/App";

export default function DashboardLayout() {
  return (
    <div className="flex flex-1 flex-col">
      Dashboard Layout
      <App />
      {
        /* <Nav />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main> */
      }
    </div>
  );
}
