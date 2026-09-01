import { redirect } from "next/navigation";

import { PreferencesForm } from "@/features/preferences/preferences-form";
import type { Preference } from "@/features/preferences/types";
import { serverApiGet } from "@/lib/server-api";
import { getCurrentUser } from "@/lib/server-auth";

export const metadata = {
  title: "Preferencias · DRIVEAM",
  description: "Tus criterios de compra.",
};

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const preference = await serverApiGet<Preference>("/preferences/");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Preferencias de compra
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Sesión iniciada como <span className="font-medium">{user.email}</span>
          . Estos criterios guiarán el Car Score y los filtros por defecto.
        </p>
      </header>

      {preference ? (
        <PreferencesForm initialPreference={preference} />
      ) : (
        <p className="rounded-xl border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          No se pudieron cargar tus preferencias. Recarga la página.
        </p>
      )}
    </main>
  );
}
