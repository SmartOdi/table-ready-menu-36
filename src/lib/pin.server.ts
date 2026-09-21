import { createHash, randomBytes } from "node:crypto";

export type PinRole = "cuisine" | "caisse";

const SESSION_HOURS = 14;

function pepper(): string {
  const value = process.env["PIN_PEPPER"];
  if (!value || value.length < 16) {
    throw new Error(
      "Configuration manquante : PIN_PEPPER doit être défini (secret aléatoire) pour les codes d'accès.",
    );
  }
  return value;
}

export function hashPin(pin: string): string {
  return createHash("sha256").update(`${pepper()}:${pin}`).digest("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(`${pepper()}:token:${token}`).digest("hex");
}

export function newToken(): string {
  return randomBytes(32).toString("hex");
}

export function sessionExpiry(): string {
  return new Date(Date.now() + SESSION_HOURS * 3_600_000).toISOString();
}
