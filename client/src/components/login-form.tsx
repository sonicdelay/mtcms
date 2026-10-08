import { useState } from "react";
import { useAppStore } from "../lib/app.store";
import SdPageHeader from "./SdPageHeader";
import SdInput from "./SdInput";
import SdButton from "./SdButton";

export default function LoginForm() {
  const login = useAppStore((s) => s.login);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await login(email, password);
  };

  return (
    <div style={{ maxWidth: "360px", margin: "2rem auto" }}>
      <SdPageHeader value="Sign in" />
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
        <SdInput
          label="Email"
          value={email}
          type="email"
          required
          onChange={(ev) =>
            setEmail(
              String((ev.payload as { value?: string } | undefined)?.value ?? ""),
            )}
        />
        <SdInput
          label="Password"
          value={password}
          type="password"
          required
          onChange={(ev) =>
            setPassword(
              String((ev.payload as { value?: string } | undefined)?.value ?? ""),
            )}
        />
        {error && (
          <p className="m-0 text-red-600 dark:text-red-400">{error}</p>
        )}
        <SdButton type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </SdButton>
      </form>
    </div>
  );
}
