import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Salida autónoma para una imagen Docker de producción mínima.
  output: "standalone",
  // Fija la raíz del proyecto: evita que Next detecte lockfiles de carpetas superiores
  // (p. ej. el home del usuario) al vivir el repo en una ruta con OneDrive.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
