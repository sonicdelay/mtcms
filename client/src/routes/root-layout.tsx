import { Outlet } from "react-router";
import { Providers } from "../components/internal/providers";
import ModalHost from "../components/modal-host";
import ToastHost from "../components/toast-host";

export default function RootLayout() {
  return (
    <Providers>
      <Outlet />
      <ModalHost />
      <ToastHost />
    </Providers>
  );
}
