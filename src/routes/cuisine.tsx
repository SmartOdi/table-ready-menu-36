import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { BellRing, CheckCircle2, ChefHat, LogOut, Utensils, Volume2, VolumeX } from "lucide-react";

import { BrandLogo, BrandProvider, useBrand } from "@/components/brand";
import { GlassCard, PillButton } from "@/components/kit";
import { formatDateTime, formatPrice, STATUS_LABELS } from "@/lib/format";
import { pinAdvance, pinBoard, pinLogout, pinResolveCall } from "@/lib/pin.functions";
import { clearPinSession, playChime, readPinToken } from "@/lib/pin-session";

export const Route = createFileRoute("/cuisine")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Écran cuisine — Commandes à préparer" },
      {
        name: "description",
        content: "Commandes reçues, en préparation et prêtes, avec les appels des tables.",
      },
      { property: "og:title", content: "Écran cuisine" },
      { property: "og:description", content: "Commandes à préparer en temps réel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <BrandProvider zone="staff">
      <KitchenScreen />
    </BrandProvider>
  ),
});

const COLUMNS = [
  { statut: "recu", next: "en_preparation" as const, action: "Commencer" },
  { statut: "en_preparation", next: "servi" as const, action: "Marquer servi" },
];

const STATUS_DOT: Record<string, string> = {
  recu: "bg-status-recu",
  en_preparation: "bg-status-preparation",
  pret: "bg-status-servi",
};

const STATUS_RANK: Record<string, number> = {
  recu: 0,
  en_preparation: 1,
  pret: 2,
  servi: 3,
};

function KitchenScreen() {
  const navigate = useNavigate();
  const brand = useBrand();
  const devise = brand?.devise ?? "FCFA";
  const queryClient = useQueryClient();
  const board = useServerFn(pinBoard);
  const advanceFn = useServerFn(pinAdvance);
  const resolveFn = useServerFn(pinResolveCall);
  const logoutFn = useServerFn(pinLogout);
  const [token, setToken] = useState<string | null>(null);
  const [sound, setSound] = useState(true);
  const [knownStatuses, setKnownStatuses] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const previous = useRef<{ orders: number; calls: number } | null>(null);

  useEffect(() => {
    const stored = readPinToken("cuisine");
    if (!stored) {
      void navigate({ to: "/acces" });
      return;
    }
    setToken(stored);
  }, [navigate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["pin-board", "cuisine"],
    enabled: Boolean(token),
    refetchInterval: 5000,
    queryFn: () => {
      if (!token) throw new Error("Session expirée");
      return board({ data: { token } });
    },
  });

  useEffect(() => {
    if (error) {
      clearPinSession("cuisine");
      void navigate({ to: "/acces" });
    }
  }, [error, navigate]);

  useEffect(() => {
    if (data && data.role !== "cuisine") {
      clearPinSession("cuisine");
      void navigate({ to: "/acces" });
    }
  }, [data, navigate]);

  const active = (data?.orders ?? [])
    .map((order) => {
      const knownStatus = knownStatuses[order.id];
      const knownRank = knownStatus ? (STATUS_RANK[knownStatus] ?? -1) : -1;
      const serverRank = STATUS_RANK[order.statut] ?? -1;
      const statut = knownStatus && knownRank > serverRank ? knownStatus : order.statut;
      return {
        ...order,
        // Deux étapes seulement : les anciennes commandes « Prêt » restent en préparation.
        statut: statut === "pret" ? "en_preparation" : statut,
      };
    })
    .filter((order) => order.statut !== "servi");
  const calls = data?.calls ?? [];

  useEffect(() => {
    if (!data) return;
    setKnownStatuses((current) => {
      const next = { ...current };
      let changed = false;
      for (const order of data.orders) {
        const currentStatus = next[order.id];
        const currentRank = currentStatus ? (STATUS_RANK[currentStatus] ?? -1) : -1;
        const serverRank = STATUS_RANK[order.statut] ?? -1;
        if (serverRank > currentRank) {
          next[order.id] = order.statut;
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [data]);

  useEffect(() => {
    if (!data) return;
    const counts = { orders: active.length, calls: calls.length };
    const before = previous.current;
    if (before && sound && (counts.orders > before.orders || counts.calls > before.calls)) {
      playChime();
    }
    previous.current = counts;
  }, [data, active.length, calls.length, sound]);

  const advance = useMutation({
    mutationFn: (input: { orderId: string; statut: "en_preparation" | "pret" | "servi" }) => {
      if (!token) throw new Error("Session expirée");
      return advanceFn({ data: { token, ...input } });
    },
    onMutate: async (input) => {
      setActionError(null);
      await queryClient.cancelQueries({ queryKey: ["pin-board", "cuisine"] });
      const previousStatus = knownStatuses[input.orderId];
      setKnownStatuses((current) => ({ ...current, [input.orderId]: input.statut }));
      return { previousStatus };
    },
    onError: (_error, input, context) => {
      setKnownStatuses((current) => {
        const next = { ...current };
        if (context?.previousStatus) next[input.orderId] = context.previousStatus;
        else delete next[input.orderId];
        return next;
      });
      setActionError("Le statut n’a pas été enregistré. Réessayez ou reconnectez la cuisine.");
    },
    onSuccess: (result, input) => {
      setKnownStatuses((current) => ({ ...current, [input.orderId]: result.statut }));
      return queryClient.invalidateQueries({ queryKey: ["pin-board", "cuisine"] });
    },
  });

  const resolveCall = useMutation({
    mutationFn: (callId: string) => {
      if (!token) throw new Error("Session expirée");
      return resolveFn({ data: { token, callId } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pin-board", "cuisine"] }),
  });

  async function quit() {
    if (token) await logoutFn({ data: { token } }).catch(() => undefined);
    clearPinSession("cuisine");
    queryClient.clear();
    await navigate({ to: "/acces" });
  }

  return (
    <div className="halo-scene min-h-screen pb-16">
      <header className="sticky top-0 z-40 px-4 pt-4">
        <div className="glass-strong mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-full px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo className="size-9 shrink-0" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold">{brand?.nom ?? "Restaurant"}</p>
              <p className="text-xs text-muted-foreground">Écran cuisine</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setSound(!sound)}
              aria-label={sound ? "Couper le son" : "Activer le son"}
              title={sound ? "Couper le son" : "Activer le son"}
              className="glass grid size-9 place-items-center rounded-full text-muted-foreground transition hover:text-foreground"
            >
              {sound ? (
                <Volume2 className="size-4" aria-hidden="true" />
              ) : (
                <VolumeX className="size-4" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={quit}
              aria-label="Quitter"
              title="Quitter"
              className="glass grid size-9 place-items-center rounded-full text-muted-foreground transition hover:text-destructive"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pt-8">
        {calls.length > 0 ? (
          <section className="glass-strong rounded-3xl border-status-recu/40 p-4">
            <div className="flex items-center gap-2">
              <BellRing className="size-4 shrink-0 animate-pulse text-status-recu" aria-hidden="true" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-status-recu">
                Appels des tables ({calls.length})
              </h2>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {calls.map((call) => (
                <div
                  key={call.id}
                  className="glass flex min-w-0 items-center justify-between gap-3 rounded-2xl p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold">Table {call.numero_table}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {call.raison ?? "Demande d'aide"} · {formatDateTime(call.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => resolveCall.mutate(call.id)}
                    disabled={resolveCall.isPending}
                    aria-label="Marquer l'appel comme traité"
                    title="Traité"
                    className="glass grid size-9 shrink-0 place-items-center rounded-full text-status-servi transition hover:scale-105"
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <h1 className="mt-8 text-3xl sm:text-4xl">Commandes à préparer</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mise à jour automatique toutes les 5 secondes.
        </p>
        {actionError ? (
          <p className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
            {actionError}
          </p>
        ) : null}

        {isLoading ? (
          <p className="mt-10 text-sm text-muted-foreground">Chargement...</p>
        ) : (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {COLUMNS.map((column) => {
              const list = active.filter((order) => order.statut === column.statut);
              return (
                <section key={column.statut}>
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex size-9 items-center justify-center rounded-full text-background ${STATUS_DOT[column.statut]}`}
                    >
                      {column.statut === "recu" ? (
                        <Utensils className="size-4" aria-hidden="true" />
                      ) : (
                        <ChefHat className="size-4" aria-hidden="true" />
                      )}
                    </span>
                    <h2 className="text-lg">{STATUS_LABELS[column.statut]}</h2>
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
                            className={`absolute inset-y-0 left-0 w-1.5 ${STATUS_DOT[order.statut] ?? "bg-status-recu"}`}
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
                            <div className="shrink-0 text-right">
                              <span
                                className={`inline-block rounded-full px-3 py-1 text-xs font-bold text-background ${STATUS_DOT[order.statut] ?? "bg-status-recu"}`}
                              >
                                {STATUS_LABELS[order.statut] ?? order.statut}
                              </span>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {formatPrice(order.total, devise)}
                              </p>
                            </div>
                          </div>

                          <ul className="mt-4 space-y-1 text-sm">
                            {order.order_items.map((item) => (
                              <li key={item.id}>
                                <span className="font-bold text-primary">{item.quantite}×</span>{" "}
                                {item.nom}
                              </li>
                            ))}
                          </ul>

                          {order.note ? (
                            <p className="mt-3 rounded-2xl bg-white/5 px-4 py-2 text-xs text-muted-foreground">
                              Note : {order.note}
                            </p>
                          ) : null}

                          <PillButton
                            size="lg"
                            className="mt-5 w-full"
                            disabled={advance.isPending}
                            onClick={() =>
                              advance.mutate({ orderId: order.id, statut: column.next })
                            }
                          >
                            {column.action}
                          </PillButton>
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
    </div>
  );
}
