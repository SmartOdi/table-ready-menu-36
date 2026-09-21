import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { KeyRound, LayoutDashboard, LogOut, TrendingUp } from "lucide-react";

import { BrandLogo, BrandProvider, useBrand } from "@/components/brand";
import { GlassCard, PillButton } from "@/components/kit";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { listPins, managerStats, setPin } from "@/lib/pin.functions";

export const Route = createFileRoute("/_authenticated/gerance")({
  head: () => ({
    meta: [
      { title: "Espace gérant — Chiffre d'affaires et codes équipe" },
      {
        name: "description",
        content: "Suivi du chiffre d'affaires en temps réel et gestion des codes d'accès cuisine et caisse.",
      },
      { property: "og:title", content: "Espace gérant" },
      { property: "og:description", content: "Chiffre d'affaires et codes d'accès de l'équipe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <BrandProvider zone="admin">
      <ManagerPage />
    </BrandProvider>
  ),
});

function ManagerPage() {
  const navigate = useNavigate();
  const brand = useBrand();
  const devise = brand?.devise ?? "FCFA";
  const queryClient = useQueryClient();
  const stats = useServerFn(managerStats);
  const pins = useServerFn(listPins);
  const savePin = useServerFn(setPin);
  const [codes, setCodes] = useState<Record<string, string>>({ cuisine: "", caisse: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statsQuery = useQuery({
    queryKey: ["manager-stats"],
    refetchInterval: 5_000,
    queryFn: () => stats({}),
  });

  const pinsQuery = useQuery({
    queryKey: ["staff-pins"],
    queryFn: () => pins({}),
  });

  const update = useMutation({
    mutationFn: (input: { role: "cuisine" | "caisse"; pin: string }) => savePin({ data: input }),
    onSuccess: (_result, input) => {
      setMessage(`Nouveau code enregistré pour ${input.role}.`);
      setError(null);
      setCodes((current) => ({ ...current, [input.role]: "" }));
      void queryClient.invalidateQueries({ queryKey: ["staff-pins"] });
    },
    onError: () => setError("Enregistrement impossible. Vérifiez le code (6 chiffres)."),
  });

  const data = statsQuery.data;

  return (
    <div className="halo-scene min-h-screen pb-20">
      <header className="sticky top-0 z-40 px-4 pt-4">
        <div className="glass-strong mx-auto flex max-w-5xl items-center justify-between rounded-full px-4 py-2.5">
          <div className="flex items-center gap-3">
            <BrandLogo className="size-9" />
            <div className="leading-tight">
              <p className="text-sm font-bold">{brand?.nom ?? "Restaurant"}</p>
              <p className="text-xs text-muted-foreground">Espace gérant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <PillButton variant="glass" size="sm">
                <LayoutDashboard className="size-4" aria-hidden="true" />
                Commandes
              </PillButton>
            </Link>
            <PillButton
              variant="glass"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                queryClient.clear();
                await navigate({ to: "/auth" });
              }}
            >
              <LogOut className="size-4" aria-hidden="true" />
              Quitter
            </PillButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pt-10">
        <h1 className="text-3xl sm:text-4xl">Chiffre d'affaires</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mise à jour automatique, sans notification à chaque commande.
        </p>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GlassCard strong className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Aujourd'hui</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-extrabold text-primary">
              <TrendingUp className="size-5" aria-hidden="true" />
              {formatPrice(data?.caJour ?? 0, devise)}
            </p>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">7 derniers jours</p>
            <p className="mt-2 text-2xl font-extrabold">{formatPrice(data?.caSemaine ?? 0, devise)}</p>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Ticket moyen</p>
            <p className="mt-2 text-2xl font-extrabold">{formatPrice(data?.ticketMoyen ?? 0, devise)}</p>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Commandes du jour
            </p>
            <p className="mt-2 text-2xl font-extrabold">{data?.commandesJour ?? 0}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data?.serviesJour ?? 0} servies · {data?.enCours ?? 0} en cours
            </p>
          </GlassCard>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl">Codes d'accès de l'équipe</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Un code à 6 chiffres par poste. L'équipe se connecte sur la page d'accès rapide.
          </p>

          {message ? <p className="mt-4 text-sm text-primary">{message}</p> : null}
          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {(["cuisine", "caisse"] as const).map((role) => {
              const existing = pinsQuery.data?.find((row) => row.role === role);
              return (
                <GlassCard key={role} className="p-5">
                  <div className="flex items-center gap-2">
                    <KeyRound className="size-4 text-primary" aria-hidden="true" />
                    <h3 className="text-lg capitalize">{role}</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {existing ? "Code actif — modifiable à tout moment." : "Aucun code défini."}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <input
                      inputMode="numeric"
                      maxLength={6}
                      value={codes[role] ?? ""}
                      onChange={(event) =>
                        setCodes((current) => ({
                          ...current,
                          [role]: event.target.value.replace(/\D/g, "").slice(0, 6),
                        }))
                      }
                      placeholder="000000"
                      className="glass w-36 rounded-full px-5 py-3 text-center text-lg tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label={`Nouveau code ${role}`}
                    />
                    <PillButton
                      disabled={(codes[role] ?? "").length !== 6 || update.isPending}
                      onClick={() => update.mutate({ role, pin: codes[role] ?? "" })}
                    >
                      Enregistrer
                    </PillButton>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          <Link to="/acces" className="mt-6 inline-block text-sm text-primary underline-offset-4 hover:underline">
            Ouvrir la page d'accès par code
          </Link>
        </section>
      </main>
    </div>
  );
}
