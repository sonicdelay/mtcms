"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/app.store";

export default function LoginDialog() {
  const login = useAppStore((s) => s.login);
  const closeModal = useAppStore((s) => s.closeModal);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const ok = await login(email, password);
    if (ok) {
      closeModal();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Anmelden
      </h2>
      <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        Email
        <input
          type="email"
          value={email}
          required
          autoFocus
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none transition-colors focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          placeholder="email"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        Passwort
        <input
          type="password"
          value={password}
          required
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none transition-colors focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          placeholder="password"
        />
      </label>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "Anmelden…" : "Anmelden"}
      </button>
    </form>
  );
}
