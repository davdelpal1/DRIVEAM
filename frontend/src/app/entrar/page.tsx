import { redirect } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { Container } from "@/components/container";
import { Card, CardBody } from "@/components/ui/card";
import { CredentialsForm } from "@/features/auth/credentials-form";
import { getCurrentUser } from "@/lib/server-auth";

export const metadata = {
  title: "Entrar · DRIVEAM",
  description: "Inicia sesión en DRIVEAM.",
};

export default async function EntrarPage() {
  if (await getCurrentUser()) redirect("/perfil");

  return (
    <Container size="narrow" className="flex-1 justify-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <BrandMark className="size-8" />
        <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
        <p className="text-sm text-muted">
          Accede para gestionar tus preferencias de compra.
        </p>
      </div>
      <Card>
        <CardBody>
          <CredentialsForm mode="login" />
        </CardBody>
      </Card>
    </Container>
  );
}
