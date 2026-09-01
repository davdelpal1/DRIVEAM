import { redirect } from "next/navigation";

import { CandidateForm } from "@/features/candidates/candidate-form";
import { getCurrentUser } from "@/lib/server-auth";

export const metadata = {
  title: "Nuevo candidato · DRIVEAM",
  description: "Añade un coche a mano.",
};

export default async function NuevoCandidatoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Nuevo candidato
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Solo marca y modelo son obligatorios. Lo demás lo puedes completar
          luego.
        </p>
      </header>
      <CandidateForm />
    </main>
  );
}
