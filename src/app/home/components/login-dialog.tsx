"use client";

import { FormEvent, useState } from "react";
import { useAppStore } from "@/lib/app.store";

export function LoginDialog() {
  const login = useAppStore((state) => state.login);
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);
  const closeModal = useAppStore((state) => state.closeModal);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ok = await login(email, password);
    if (ok) closeModal();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Login</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Sign in to access admin and authenticated API requests.
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={closeModal}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function LogoutMessage({ email }: { email?: string }) {
  const closeModal = useAppStore((state) => state.closeModal);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Logged out</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        {email ? `Signed out ${email} successfully.` : "Signed out successfully."}
      </p>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={closeModal}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Close
        </button>
      </div>
    </div>
  );
}
