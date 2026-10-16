import { useEffect } from "react";
import { Outlet } from "react-router";
import { Providers } from "../components/internal/providers";
import ModalHost from "../components/modal-host";
import ToastHost from "../components/toast-host";
import { startWsBridge } from "../lib/ws-bridge";

export default function RootLayout() {
  useEffect(() => startWsBridge(), []);

  return (
    <Providers>
      <Outlet />
      <ModalHost />
      <ToastHost />
    </Providers>
  );
}
