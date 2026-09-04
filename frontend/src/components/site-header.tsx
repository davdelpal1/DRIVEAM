"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonClass } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import { cn } from "@/lib/cn";

const NAV_LINKS: ReadonlyArray<{
  href: string;
  label: string;
  authOnly?: boolean;
}> = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/candidatos", label: "Mis coches", authOnly: true },
  { href: "/perfil", label: "Preferencias", authOnly: true },
];

export function SiteHeader() {
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const authenticated = status === "authenticated" && user;
  const links = NAV_LINKS.filter((link) => !link.authOnly || authenticated);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <BrandMark />
          DRIVEAM
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-weak text-primary-weak-fg"
                    : "text-muted hover:bg-surface-muted hover:text-fg",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <ThemeToggle />
          {authenticated ? (
            <>
              <span className="text-sm text-subtle">{user.email}</span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className={buttonClass({ variant: "secondary", size: "sm" })}
              >
                {loggingOut ? "Saliendo…" : "Salir"}
              </button>
            </>
          ) : status === "loading" ? null : (
            <>
              <Link href="/entrar" className="text-sm font-medium text-muted hover:text-fg">
                Entrar
              </Link>
              <Link href="/registro" className={buttonClass({ size: "sm" })}>
                Crear cuenta
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 sm:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex size-9 items-center justify-center rounded-md text-muted hover:bg-surface-muted hover:text-fg"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              {menuOpen ? (
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-border px-6 py-3 sm:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-surface-muted hover:text-fg"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            {authenticated ? (
              <>
                <span className="px-3 text-sm text-subtle">{user.email}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className={buttonClass({ variant: "secondary", size: "sm" })}
                >
                  {loggingOut ? "Saliendo…" : "Salir"}
                </button>
              </>
            ) : status === "loading" ? null : (
              <>
                <Link href="/entrar" onClick={() => setMenuOpen(false)} className="px-3 text-sm font-medium text-muted">
                  Entrar
                </Link>
                <Link
                  href="/registro"
                  onClick={() => setMenuOpen(false)}
                  className={buttonClass({ size: "sm" })}
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
