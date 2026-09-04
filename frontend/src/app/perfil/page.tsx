import { redirect } from "next/navigation";

import { Container } from "@/components/container";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
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
    <Container>
      <PageHeader
        title="Preferencias de compra"
        description={
          <>
            Sesión iniciada como <span className="font-medium text-fg">{user.email}</span>
            . Estos criterios guiarán el Car Score y los filtros por defecto.
          </>
        }
      />

      {preference ? (
        <PreferencesForm initialPreference={preference} />
      ) : (
        <Alert tone="danger">
          No se pudieron cargar tus preferencias. Recarga la página.
        </Alert>
      )}
    </Container>
  );
}
