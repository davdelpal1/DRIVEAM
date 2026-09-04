"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
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
      {generalError && <Alert tone="danger">{generalError}</Alert>}

      <Field label="Email" htmlFor="email" error={emailError}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : undefined}
        />
      </Field>

      <Field label="Contraseña" htmlFor="password" error={passwordError}>
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
      </Field>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? copy.pending : copy.submit}
      </Button>

      <p className="text-sm text-muted">
        {copy.alt}{" "}
        <Link href={copy.altHref} className="font-medium text-primary hover:underline">
          {copy.altLabel}
        </Link>
      </p>
    </form>
  );
}
