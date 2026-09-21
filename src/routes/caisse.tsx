import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BellRing,
  CalendarDays,
  CheckCircle2,
  History,
  LogOut,
  Receipt,
  Wallet,
} from "lucide-react";

import { BrandLogo, BrandProvider, useBrand } from "@/components/brand";
import { InvoiceModal, type InvoiceOrder } from "@/components/invoice";
import { GlassCard, PillButton } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateTime, formatPrice, STATUS_LABELS } from "@/lib/format";
import { pinBoard, pinLogout, pinResolveCall } from "@/lib/pin.functions";
import { clearPinSession, readPinToken } from "@/lib/pin-session";

export const Route = createFileRoute("/caisse")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Écran caisse — Encaissement et factures" },
      {
        name: "description",
        content: "Suivi des commandes servies, factures et chiffre d'affaires du jour.",
      },
      { property: "og:title", content: "Écran caisse" },
      {
        property: "og:description",
        content: "Encaissement, factures et chiffre d'affaires du jour.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <BrandProvider zone="staff">
      <CashierScreen />
    </BrandProvider>
  ),
});

const STATUS_STYLE: Record<string, string> = {
  recu: "bg-status-recu/15 text-status-recu",
  en_preparation: "bg-status-preparation/15 text-status-preparation",
  pret: "bg-status-servi/15 text-status-servi",
  servi: "bg-status-servi/15 text-status-servi",
};

function cotonouDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "01";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function CashierScreen() {
  const navigate = useNavigate();
  const brand = useBrand();
  const devise = brand?.devise ?? "FCFA";
  const queryClient = useQueryClient();
  const board = useServerFn(pinBoard);
  const resolveFn = useServerFn(pinResolveCall);
  const logoutFn = useServerFn(pinLogout);
  const [token, setToken] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [historyMode, setHistoryMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const todayKey = cotonouDateKey();
  const selectedDateKey = historyMode ? format(selectedDate, "yyyy-MM-dd") : todayKey;

  useEffect(() => {
    const stored = readPinToken("caisse");
    if (!stored) {
      void navigate({ to: "/acces" });
      return;
    }
    setToken(stored);
  }, [navigate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["pin-board", "caisse", selectedDateKey],
    enabled: Boolean(token),
    refetchInterval: 4000,
    queryFn: () => {
      if (!token) throw new Error("Session expirée");
      return board({ data: { token, date: selectedDateKey } });
    },
  });

  useEffect(() => {
    if (error) {
      clearPinSession("caisse");
      void navigate({ to: "/acces" });
    }
  }, [error, navigate]);

  useEffect(() => {
    if (data && data.role !== "caisse") {
      clearPinSession("caisse");
      void navigate({ to: "/acces" });
    }
  }, [data, navigate]);

  const orders = data?.orders ?? [];
  const calls = data?.calls ?? [];
  const revenue = data?.revenue;
  const selectedDateLabel = historyMode
    ? format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })
    : "aujourd’hui";
  /** La facture suit la commande en direct : son statut change avec la cuisine. */
  const invoice = (orders.find((order) => order.id === invoiceId) ?? null) as
    (InvoiceOrder & { statut: string }) | null;

  const resolveCall = useMutation({
    mutationFn: (callId: string) => {
      if (!token) throw new Error("Session expirée");
      return resolveFn({ data: { token, callId } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pin-board", "caisse"] }),
  });

  async function quit() {
    if (token) await logoutFn({ data: { token } }).catch(() => undefined);
    clearPinSession("caisse");
    queryClient.clear();
    await navigate({ to: "/acces" });
  }

  return (
    <div className="halo-scene min-h-screen pb-16">
      <header className="sticky top-0 z-40 px-4 pt-4 print:hidden">
        <div className="glass-strong mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-full px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo className="size-9 shrink-0" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold">{brand?.nom ?? "Restaurant"}</p>
              <p className="text-xs text-muted-foreground">Écran caisse</p>
            </div>
          </div>
          <button
            type="button"
            onClick={quit}
            aria-label="Quitter"
            title="Quitter"
            className="glass grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:text-destructive"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pt-10">
        <h1 className="text-3xl sm:text-4xl">Caisse</h1>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="glass inline-flex w-fit rounded-lg p-1">
            <Button
              type="button"
              size="sm"
              variant={historyMode ? "ghost" : "default"}
              onClick={() => {
                setHistoryMode(false);
                setInvoiceId(null);
              }}
            >
              Aujourd’hui
            </Button>
            <Button
              type="button"
              size="sm"
              variant={historyMode ? "default" : "ghost"}
              onClick={() => {
                setHistoryMode(true);
                setInvoiceId(null);
              }}
            >
              <History aria-hidden="true" />
              Historique
            </Button>
          </div>

          {historyMode ? (
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-start sm:w-auto">
                  <CalendarDays aria-hidden="true" />
                  <span className="capitalize">
                    {format(selectedDate, "d MMMM yyyy", { locale: fr })}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (!date) return;
                    setSelectedDate(date);
                    setInvoiceId(null);
                    setCalendarOpen(false);
                  }}
                  disabled={{ after: new Date() }}
                  defaultMonth={selectedDate}
                  locale={fr}
                  className="pointer-events-auto p-3"
                />
              </PopoverContent>
            </Popover>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <GlassCard strong className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Chiffre d'affaires · <span className="capitalize">{selectedDateLabel}</span>
            </p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-extrabold text-primary">
              <Wallet className="size-5" aria-hidden="true" />
              {formatPrice(revenue?.total ?? 0, devise)}
            </p>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Commandes · <span className="capitalize">{selectedDateLabel}</span>
            </p>
            <p className="mt-2 text-2xl font-extrabold">{revenue?.commandes ?? 0}</p>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Servies</p>
            <p className="mt-2 text-2xl font-extrabold">{revenue?.servies ?? 0}</p>
          </GlassCard>
        </div>

        {calls.length > 0 ? (
          <section className="glass-strong mt-8 rounded-3xl border-status-recu/40 p-4">
            <div className="flex items-center gap-2">
              <BellRing
                className="size-4 shrink-0 animate-pulse text-status-recu"
                aria-hidden="true"
              />
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

        <section className="mt-10">
          <h2 className="text-lg">Commandes du {selectedDateLabel}</h2>
          {isLoading ? (
            <p className="mt-6 text-sm text-muted-foreground">Chargement...</p>
          ) : orders.length === 0 ? (
            <GlassCard className="mt-5 p-8 text-center">
              <CalendarDays className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm text-muted-foreground">
                Aucune commande pour cette journée.
              </p>
            </GlassCard>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {orders.map((order) => (
                <GlassCard key={order.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xl font-bold">Table {order.numero_table}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.numero ? `n°${order.numero} · ` : ""}
                        {formatDateTime(order.created_at)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[order.statut]}`}
                    >
                      {STATUS_LABELS[order.statut] ?? order.statut}
                    </span>
                  </div>

                  <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                    {order.order_items.map((item) => (
                      <li key={item.id} className="flex justify-between gap-3">
                        <span>
                          {item.quantite}× {item.nom}
                        </span>
                        <span>{formatPrice(item.prix_unitaire * item.quantite, devise)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(order.total, devise)}
                    </span>
                    <div className="flex gap-2">
                      {/* La cuisine pilote le statut ; la caisse ne fait que le consulter. */}
                      {order.statut === "servi" ? (
                        <PillButton
                          size="sm"
                          variant="glass"
                          onClick={() => setInvoiceId(order.id)}
                        >
                          <Receipt className="size-4" aria-hidden="true" />
                          Facture
                        </PillButton>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          En attente de la cuisine
                        </span>
                      )}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </section>
      </main>

      {invoice ? (
        <InvoiceModal
          order={invoice}
          statut={invoice.statut}
          devise={devise}
          onClose={() => setInvoiceId(null)}
        />
      ) : null}
    </div>
  );
}
