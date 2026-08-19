import { useState } from "react";
import { IxButton, IxContentHeader, IxInput } from "@siemens/ix-react";
import { useAppStore } from "../../lib/app.store";

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
      <IxContentHeader headerTitle="Sign in" />
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
        <IxInput
          label="Email"
          value={email}
          type="email"
          required
          onInput={(event) =>
            setEmail((event.target as HTMLInputElement).value)
          }
        />
        <IxInput
          label="Password"
          value={password}
          type="password"
          required
          onInput={(event) =>
            setPassword((event.target as HTMLInputElement).value)
          }
        />
        {error && (
          <p style={{ margin: 0, color: "var(--theme-color-alarm-text)" }}>
            {error}
          </p>
        )}
        <IxButton type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </IxButton>
      </form>
    </div>
  );
}