import Link from "next/link";
import { redirect } from "next/navigation";

import { ImportWizard } from "@/features/import/import-wizard";
import { getCurrentUser } from "@/lib/server-auth";

export const metadata = {
  title: "Importar por URL · DRIVEAM",
  description: "Añade un candidato pegando el enlace de un anuncio.",
};

export default async function ImportarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Importar por URL
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Pega el enlace de un anuncio y DRIVEAM intentará rellenar los datos
          por ti. Podrás revisarlos antes de guardar. ¿Prefieres teclearlos?{" "}
          <Link
            href="/candidatos/nuevo"
            className="underline underline-offset-4"
          >
            Alta manual
          </Link>
          .
        </p>
      </header>
      <ImportWizard />
    </main>
  );
}
