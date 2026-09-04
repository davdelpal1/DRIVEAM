import { redirect } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { Container } from "@/components/container";
import { Card, CardBody } from "@/components/ui/card";
import { CredentialsForm } from "@/features/auth/credentials-form";
import { getCurrentUser } from "@/lib/server-auth";

export const metadata = {
  title: "Crear cuenta · DRIVEAM",
  description: "Crea tu cuenta de DRIVEAM.",
};

export default async function RegistroPage() {
  if (await getCurrentUser()) redirect("/perfil");

  return (
    <Container size="narrow" className="flex-1 justify-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <BrandMark className="size-8" />
        <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>
        <p className="text-sm text-muted">
          Email y contraseña. La contraseña debe tener al menos 8 caracteres y
          no ser demasiado común.
        </p>
      </div>
      <Card>
        <CardBody>
          <CredentialsForm mode="register" />
        </CardBody>
      </Card>
    </Container>
  );
}
