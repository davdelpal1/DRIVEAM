"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useAuth } from "./auth-provider";
import { firstError, toFieldErrors } from "./form-errors";
import type { FieldErrors } from "./types";

type Mode = "login" | "register";

const COPY: Record<
  Mode,
  {
    submit: string;
    pending: string;
    alt: string;
    altHref: string;
    altLabel: string;
  }
> = {
  login: {
    submit: "Entrar",
    pending: "Entrando…",
    alt: "¿Todavía no tienes cuenta?",
    altHref: "/registro",
    altLabel: "Crear una",
  },
  register: {
    submit: "Crear cuenta",
    pending: "Creando la cuenta…",
    alt: "¿Ya tienes cuenta?",
    altHref: "/entrar",
    altLabel: "Entrar",
  },
};

export function CredentialsForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { login, register } = useAuth();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const credentials = {
      email: String(data.get("email") ?? "").trim(),
      password: String(data.get("password") ?? ""),
    };

    setPending(true);
    setErrors({});
    try {
      if (mode === "login") {
        await login(credentials);
      } else {
        await register(credentials);
      }
      router.push("/perfil");
      router.refresh();
    } catch (error) {
      setErrors(toFieldErrors(error));
      setPending(false);
    }
  }

  const emailError = firstError(errors, "email");
  const passwordError = firstError(errors, "password");
  const generalError = firstError(errors, "detail", "non_field_errors");
  const copy = COPY[mode];

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {generalError && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-400"
        >
          {generalError}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : undefined}
        />
        {emailError && (
          <p
            id="email-error"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {emailError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Contraseña
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={mode === "register" ? 8 : undefined}
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? "password-error" : undefined}
        />
        {passwordError && (
          <p
            id="password-error"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {passwordError}
          </p>
        )}
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? copy.pending : copy.submit}
      </Button>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {copy.alt}{" "}
        <Link href={copy.altHref} className="underline underline-offset-4">
          {copy.altLabel}
        </Link>
      </p>
    </form>
  );
}
