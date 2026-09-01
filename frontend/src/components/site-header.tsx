"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/features/auth/auth-provider";

export function SiteHeader() {
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <nav className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-6 py-3 text-sm">
        <Link href="/" className="font-semibold tracking-tight">
          DRIVEAM
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/catalogo"
            className="text-zinc-600 hover:underline dark:text-zinc-300"
          >
            Catálogo
          </Link>
          {status === "authenticated" && user ? (
            <>
              <Link
                href="/candidatos"
                className="text-zinc-600 hover:underline dark:text-zinc-300"
              >
                Candidatos
              </Link>
              <Link
                href="/perfil"
                className="text-zinc-600 hover:underline dark:text-zinc-300"
              >
                Preferencias
              </Link>
              <span className="hidden text-zinc-400 sm:inline">·</span>
              <span className="hidden text-zinc-500 sm:inline">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-full border border-black/15 px-3 py-1 font-medium hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
              >
                {loggingOut ? "Saliendo…" : "Salir"}
              </button>
            </>
          ) : status === "loading" ? null : (
            <>
              <Link href="/entrar" className="hover:underline">
                Entrar
              </Link>
              <Link
                href="/registro"
                className="rounded-full bg-foreground px-3 py-1 font-medium text-background hover:opacity-90"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
