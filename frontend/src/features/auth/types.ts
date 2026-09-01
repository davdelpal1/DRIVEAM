/**
 * Tipos de autenticación (FASE 2).
 *
 * El contrato completo es el esquema OpenAPI de la API (`/api/v1/schema/`).
 */

export interface User {
  id: number;
  email: string;
  date_joined: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export type RegisterInput = Credentials;

/** Errores por campo devueltos por DRF: `{ email: ["..."], password: ["..."], detail: ["..."] }`. */
export type FieldErrors = Record<string, string[] | string>;

export type AuthStatus = "loading" | "authenticated" | "anonymous";
