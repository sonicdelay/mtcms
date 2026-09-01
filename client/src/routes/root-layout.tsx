import { Outlet } from "react-router";
import { Providers } from "../components/providers";
import ModalHost from "../components/modal-host";

export default function RootLayout() {
  return (
    <Providers>
      <Outlet />
      <ModalHost />
    </Providers>
  );
}
