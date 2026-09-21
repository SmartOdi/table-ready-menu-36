import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type CSSProperties } from "react";
import { Bell, CheckCircle2, ChefHat, LogOut, Printer, Settings, TrendingUp, Utensils, X } from "lucide-react";

import { BrandLogo, BrandProvider, useBrand } from "@/components/brand";
import { GlassCard, PillButton } from "@/components/kit";
import { useRoles } from "@/hooks/use-roles";
import { supabase } from "@/integrations/supabase/client";
import { ordersQuery, type Order, type OrderStatus } from "@/lib/data";
import { formatDateTime, formatPrice, STATUS_LABELS } from "@/lib/format";

type StaffCall = {
  id: string;
  numero_table: string;
  raison: string | null;
  statut: string;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Commandes en cuisine — Tableau de bord" },
      {
        name: "description",
        content: "Suivi en temps réel des commandes reçues, en préparation et servies.",
      },
      { property: "og:title", content: "Commandes en cuisine — Tableau de bord" },
      { property: "og:description", content: "Suivi en temps réel des commandes du restaurant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <BrandProvider zone="staff">
      <Dashboard />
    </BrandProvider>
  ),
});

const COLUMNS: { statut: OrderStatus }[] = [
  { statut: "recu" },
  { statut: "en_preparation" },
  { statut: "servi" },
];

/** Système de couleurs des statuts : ambre = reçu, bleu = en préparation/prêt, vert = servi. */
const STATUS_STYLES: Record<OrderStatus, { dot: string; text: string; ring: string }> = {
  recu: {
    dot: "bg-status-recu",
    text: "text-status-recu",
    ring: "border-status-recu/60",
  },
  en_preparation: {
    dot: "bg-status-preparation",
    text: "text-status-preparation",
    ring: "border-status-preparation/60",
  },
  pret: {
    dot: "bg-status-preparation",
    text: "text-status-preparation",
    ring: "border-status-preparation/60",
  },
  servi: {
    dot: "bg-status-servi",
    text: "text-status-servi",
    ring: "border-status-servi/60",
  },
};

function Dashboard() {
  const brand = useBrand();
  const devise = brand?.devise ?? "FCFA";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isStaff, isAdmin, isGerant, email, isLoading: rolesLoading } = useRoles();
  const { data: orders = [], isLoading } = useQuery({ ...ordersQuery, enabled: isStaff });
  const { data: calls = [] } = useQuery({
    queryKey: ["staff-calls"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("staff_calls")
        .select("id, numero_table, raison, statut, created_at")
        .eq("statut", "nouveau")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StaffCall[];
    },
    enabled: isStaff,
  });
  const [invoice, setInvoice] = useState<Order | null>(null);

  useEffect(() => {
    if (!isStaff) return;
    const channel = supabase
      .channel("orders-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["orders"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_calls" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["staff-calls"] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isStaff, queryClient]);

  const resolveCall = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("staff_calls").update({ statut: "traite" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff-calls"] }),
  });

  async function signOut() {
    await supabase.auth.signOut();
    queryClient.clear();
    await navigate({ to: "/auth" });
  }

  if (rolesLoading) {
    return (
      <div className="halo-scene flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="halo-scene flex min-h-screen items-center justify-center px-5">
        <GlassCard strong className="max-w-sm p-8 text-center">
          <h1 className="text-2xl">Accès en attente</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Le compte {email} n'a pas encore de rôle. Demandez à l'administrateur de vous ajouter à
            l'équipe.
          </p>
          <PillButton variant="glass" className="mt-6" onClick={signOut}>
            <LogOut className="size-4" aria-hidden="true" />
            Se déconnecter
          </PillButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="halo-scene min-h-screen pb-16">
      <header className="sticky top-0 z-40 px-4 pt-4 print:hidden">
        <div className="glass-strong mx-auto flex max-w-6xl items-center justify-between rounded-full px-4 py-2.5">
          <div className="flex items-center gap-3">
            <BrandLogo className="size-9" />
            <div className="leading-tight">
              <p className="text-sm font-bold">{brand?.nom ?? "Restaurant"}</p>
              <p className="text-xs text-muted-foreground">Cuisine & caisse</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isGerant ? (
              <Link to="/gerance">
                <PillButton variant="glass" size="sm">
                  <TrendingUp className="size-4" aria-hidden="true" />
                  Gérance
                </PillButton>
              </Link>
            ) : null}
            {isAdmin ? (
              <Link to="/admin">
                <PillButton variant="glass" size="sm">
                  <Settings className="size-4" aria-hidden="true" />
                  Gestion
                </PillButton>
              </Link>
            ) : null}
            <PillButton variant="glass" size="sm" onClick={signOut}>
              <LogOut className="size-4" aria-hidden="true" />
              Quitter
            </PillButton>
          </div>
        </div>
      </header>

      {calls.length > 0 ? (
        <section className="mx-auto max-w-6xl px-5 pt-6 print:hidden">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-status-recu" aria-hidden="true" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-status-recu">
              Appels serveur
            </h2>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {calls.map((call) => (
              <GlassCard
                key={call.id}
                strong
                className="card-enter flex items-center justify-between gap-3 p-4"
                style={{ "--enter-delay": 0 } as CSSProperties}
              >
                <div>
                  <p className="font-bold">Table {call.numero_table}</p>
                  <p className="text-xs text-muted-foreground">
                    {call.raison ?? "Demande d'aide"} · {formatDateTime(call.created_at)}
                  </p>
                </div>
                <PillButton
                  size="sm"
                  variant="glass"
                  onClick={() => resolveCall.mutate(call.id)}
                  disabled={resolveCall.isPending}
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  Traité
                </PillButton>
              </GlassCard>
            ))}
          </div>
        </section>
      ) : null}

      <main className="mx-auto max-w-6xl px-5 pt-10 print:hidden">
        <h1 className="text-3xl sm:text-4xl">Commandes</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mise à jour automatique dès qu'un client envoie une commande.
        </p>

        {isLoading ? (
          <p className="mt-10 text-sm text-muted-foreground">Chargement des commandes...</p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((column) => {
              const list = orders.filter((order) => order.statut === column.statut);
              const style = STATUS_STYLES[column.statut];
              return (
                <section key={column.statut}>
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex size-9 items-center justify-center rounded-full text-background ${style.dot}`}
                    >
                      {column.statut === "recu" ? (
                        <Utensils className="size-4" aria-hidden="true" />
                      ) : column.statut === "en_preparation" ? (
                        <ChefHat className="size-4" aria-hidden="true" />
                      ) : (
                        <Printer className="size-4" aria-hidden="true" />
                      )}
                    </span>
                    <h2 className={`text-lg ${style.text}`}>{STATUS_LABELS[column.statut]}</h2>
                    <span className="text-sm text-muted-foreground">({list.length})</span>
                  </div>

                  <div className="mt-4 space-y-4">
                    {list.length === 0 ? (
                      <GlassCard className="p-5 text-sm text-muted-foreground">
                        Aucune commande.
                      </GlassCard>
                    ) : (
                      list.map((order) => (
                        <GlassCard key={order.id} className="relative overflow-hidden p-5">
                          <span
                            className={`absolute inset-y-0 left-0 w-1.5 ${style.dot}`}
                            aria-hidden="true"
                          />
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xl font-bold">Table {order.numero_table}</p>
                              <p className="text-xs text-muted-foreground">
                                {order.numero ? `Commande n°${order.numero} · ` : ""}
                                {formatDateTime(order.created_at)}
                              </p>
                            </div>
                            <p className={`text-lg font-bold ${style.text}`}>
                              {formatPrice(order.total, devise)}
                            </p>
                          </div>

                          <ul className="mt-4 space-y-1 text-sm">
                            {order.order_items.map((item) => (
                              <li key={item.id} className="flex justify-between gap-3">
                                <span>
                                  <span className="font-bold text-primary">{item.quantite}×</span>{" "}
                                  {item.nom}
                                </span>
                                <span className="text-muted-foreground">
                                  {formatPrice(item.prix_unitaire * item.quantite, devise)}
                                </span>
                              </li>
                            ))}
                          </ul>

                          {order.note ? (
                            <p className="mt-3 rounded-2xl bg-white/5 px-4 py-2 text-xs text-muted-foreground">
                              Note : {order.note}
                            </p>
                          ) : null}

                          <div className="mt-5 flex flex-wrap items-center gap-2">
                            {order.statut === "servi" ? (
                              <PillButton
                                variant="glass"
                                size="sm"
                                onClick={() => setInvoice(order)}
                              >
                                <Printer className="size-4" aria-hidden="true" />
                                Facture
                              </PillButton>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                En attente de la cuisine
                              </span>
                            )}
                          </div>
                        </GlassCard>
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {invoice ? (
        <InvoiceModal order={invoice} devise={devise} onClose={() => setInvoice(null)} />
      ) : null}
    </div>
  );
}

function InvoiceModal({
  order,
  devise,
  onClose,
}: {
  order: Order;
  devise: string;
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
          {brand?.adresse ? (
            <p className="text-xs text-muted-foreground">{brand.adresse}</p>
          ) : null}
          {brand?.telephone ? (
            <p className="text-xs text-muted-foreground">{brand.telephone}</p>
          ) : null}
        </div>

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
          <span className="text-xl font-bold text-primary">
            {formatPrice(order.total, devise)}
          </span>
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
