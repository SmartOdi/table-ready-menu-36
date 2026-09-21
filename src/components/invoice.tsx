import { Printer, X } from "lucide-react";

import { useBrand } from "@/components/brand";
import { GlassCard, PillButton } from "@/components/kit";
import { formatDateTime, formatPrice, STATUS_LABELS } from "@/lib/format";

export type InvoiceOrder = {
  numero: number | null;
  numero_table: string;
  total: number;
  created_at: string;
  order_items: { id: string; nom: string; quantite: number; prix_unitaire: number }[];
};

const STATUT_BADGE: Record<string, string> = {
  recu: "bg-status-recu/15 text-status-recu",
  en_preparation: "bg-status-preparation/15 text-status-preparation",
  pret: "bg-status-servi/15 text-status-servi",
  servi: "bg-status-servi/15 text-status-servi",
};

export function InvoiceModal({
  order,
  devise,
  statut,
  onClose,
}: {
  order: InvoiceOrder;
  devise: string;
  statut?: string;
  onClose: () => void;
}) {
  const brand = useBrand();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <GlassCard strong className="max-h-[88vh] w-full max-w-sm overflow-y-auto p-7">
        <div className="flex items-start justify-between print:hidden">
          <h2 className="text-2xl">Facture</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full bg-white/10"
            aria-label="Fermer la facture"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 text-center">
          <p className="text-lg font-bold">{brand?.nom ?? "Restaurant"}</p>
          {brand?.adresse ? <p className="text-xs text-muted-foreground">{brand.adresse}</p> : null}
          {brand?.telephone ? (
            <p className="text-xs text-muted-foreground">{brand.telephone}</p>
          ) : null}
        </div>

        {statut ? (
          <p className="mt-4 text-center">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${STATUT_BADGE[statut] ?? "bg-white/10"}`}
            >
              {STATUS_LABELS[statut] ?? statut}
            </span>
          </p>
        ) : null}

        <div className="mt-5 flex justify-between border-y border-border py-3 text-xs text-muted-foreground">
          <span>Table {order.numero_table}</span>
          <span>{order.numero ? `n°${order.numero}` : ""}</span>
          <span>{formatDateTime(order.created_at)}</span>
        </div>

        <ul className="mt-4 space-y-2 text-sm">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>
                {item.quantite}× {item.nom}
              </span>
              <span>{formatPrice(item.prix_unitaire * item.quantite, devise)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <span className="font-semibold">Total</span>
          <span className="text-xl font-bold text-primary">{formatPrice(order.total, devise)}</span>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Règlement sur place. Merci de votre visite.
        </p>

        <PillButton className="mt-6 w-full print:hidden" onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden="true" />
          Imprimer
        </PillButton>
      </GlassCard>
    </div>
  );
}
