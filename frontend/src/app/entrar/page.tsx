import { redirect } from "next/navigation";

import { CredentialsForm } from "@/features/auth/credentials-form";
import { getCurrentUser } from "@/lib/server-auth";

export const metadata = {
  title: "Entrar · DRIVEAM",
  description: "Inicia sesión en DRIVEAM.",
};

export default async function EntrarPage() {
  if (await getCurrentUser()) redirect("/perfil");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Accede para gestionar tus preferencias de compra.
        </p>
      </header>
      <CredentialsForm mode="login" />
    </main>
  );
}
