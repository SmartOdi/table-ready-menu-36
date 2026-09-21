export function formatPrice(value: number, devise = "FCFA"): string {
  const rounded = Math.round(value);
  return `${rounded.toLocaleString("fr-FR")} ${devise}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const STATUS_LABELS: Record<string, string> = {
  recu: "Reçu",
  en_preparation: "En préparation",
  pret: "Prêt",
  servi: "Servi",
};
