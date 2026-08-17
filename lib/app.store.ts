import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { ComponentType, ReactNode } from "react";

type AppTheme = "light" | "dark";
type AppLanguage = "en" | "de";
type ModalContent = ReactNode | ComponentType;

interface AuthUser {
  id: string;
  email: string;
  role: string;
  token?: string;
}

export interface AppState {
  theme: AppTheme;
  token: string | null;
  user: AuthUser | null;

  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;

  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;

  isModalOpen: boolean;
  modalId: string | null;
  modalContent: ModalContent | null;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  openModal: (content: ModalContent, modalId?: string) => void;
  setModalContent: (content: ModalContent | null) => void;
  closeModal: () => void;
}

const normalizeLanguage = (language: string): AppLanguage => {
  return language === "de" ? "de" : "en";
};

const decodePayload = (token: string): AuthUser | null => {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64url = parts[1];
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const payload = JSON.parse(json);
    return payload.user ?? null;
  } catch {
    console.error("Failed to decode JWT payload");
    return null;
  }
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        token: null,
        user: null,
        theme:
          typeof globalThis !== "undefined" &&
          globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light",
        language: normalizeLanguage(
          typeof navigator !== "undefined" ? navigator.language : "en",
        ),
        loading: false,
        error: null,
        isModalOpen: false,
        modalId: null,
        modalContent: null,

        openModal: (content, modalId) =>
          set(
            {
              isModalOpen: true,
              modalId: modalId ?? null,
              modalContent: content,
            },
            false,
            "app/openModal",
          ),

        closeModal: () =>
          set(
            { isModalOpen: false, modalId: null, modalContent: null },
            false,
            "app/closeModal",
          ),
        setModalContent: (content) =>
          set({ modalContent: content ?? null }, false, "app/setModalContent"),
        setTheme: (theme) => {
          set({ theme }, false, "app/setTheme");
        },
        toggleTheme: () => {
          const { theme, setTheme } = get();
          const newTheme = theme === "dark" ? "light" : "dark";
          setTheme(newTheme);
        },
        setLanguage: (language) => {
          set({ language }, false, "app/setLanguage");
        },
        login: async (email: string, password: string) => {
          const trimmedEmail = email?.trim();
          const trimmedPassword = password?.trim();

          if (!trimmedEmail || !trimmedPassword) {
            set(
              { loading: false, error: "Email and password are required" },
              false,
              "app/login:validation",
            );
            return false;
          }

          set({ loading: true, error: null }, false, "app/login:start");

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const res = await fetch("/api/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: trimmedEmail,
                password: trimmedPassword,
              }),
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              set(
                {
                  loading: false,
                  error: body.error ?? `Login failed (${res.status})`,
                },
                false,
                "app/login:error",
              );
              return false;
            }

            const data = await res.json();
            if (!data.token) {
              set(
                { loading: false, error: "Invalid server response" },
                false,
                "app/login:error",
              );
              return false;
            }

            const user = decodePayload(data.token);
            if (!user) {
              set(
                { loading: false, error: "Failed to decode auth token" },
                false,
                "app/login:error",
              );
              return false;
            }

            set(
              {
                token: data.token,
                user,
                loading: false,
                error: null,
              },
              false,
              "app/login:success",
            );
            return true;
          } catch (err) {
            const errorMsg =
              err instanceof Error && err.name === "AbortError"
                ? "Login request timed out"
                : "Network error";

            set(
              { token: null, user: null, loading: false, error: errorMsg },
              false,
              "app/login:error",
            );
            return false;
          }
        },

        logout: () => {
          set(
            {
              token: null,
              user: null,
              error: null,
            },
            false,
            "app/logout",
          );
        },

        refreshToken: async () => {
          const { token } = get();
          if (!token) return false;

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const res = await fetch("/api/auth", {
              headers: { Authorization: `Bearer ${token}` },
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
              set({ token: null, user: null }, false, "app/refresh:expired");
              return false;
            }

            const data = await res.json();
            if (!data.token) return false;

            const user = decodePayload(data.token);
            if (!user) {
              set({ token: null, user: null }, false, "app/refresh:error");
              return false;
            }

            set(
              {
                token: data.token,
                user,
              },
              false,
              "app/refresh:success",
            );
            return true;
          } catch {
            set({ token: null, user: null }, false, "app/refresh:error");
            return false;
          }
        },
      }),
      {
        name: "app-store-storage",
        partialize: (state) => ({
          token: state.token,
          user: state.user,
          theme: state.theme,
          language: state.language,
        }),
      },
    ),
    { name: "app-store" },
  ),
);
