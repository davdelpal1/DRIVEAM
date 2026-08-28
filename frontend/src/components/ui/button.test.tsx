import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renderiza su contenido", () => {
    render(<Button>Guardar</Button>);

    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
  });

  it("es de tipo 'button' por defecto", () => {
    render(<Button>Guardar</Button>);

    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("aplica clases de la variante indicada", () => {
    render(<Button variant="secondary">Cancelar</Button>);

    expect(screen.getByRole("button")).toHaveClass("border");
  });
});
