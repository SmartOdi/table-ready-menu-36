import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LockKeyhole } from "lucide-react";

import { BrandLogo, BrandProvider } from "@/components/brand";
import { GlassCard, PillButton } from "@/components/kit";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — Espace équipe" },
      {
        name: "description",
        content: "Choisissez un nouveau mot de passe pour accéder à l'espace équipe du restaurant.",
      },
      { property: "og:title", content: "Nouveau mot de passe" },
      { property: "og:description", content: "Réinitialisation du mot de passe de l'espace équipe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <BrandProvider>
      <ResetPasswordPage />
    </BrandProvider>
  ),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    if (password !== confirm) {
      setError("Les deux mots de passe ne sont pas identiques.");
      return;
    }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(
        "Impossible de changer le mot de passe. Le lien a peut-être expiré : demandez-en un nouveau.",
      );
      return;
    }
    setInfo("Mot de passe modifié. Redirection...");
    setTimeout(() => void navigate({ to: "/dashboard" }), 900);
  }

  return (
    <div className="halo-scene flex min-h-screen items-center justify-center px-5 py-16">
      <GlassCard strong className="w-full max-w-sm p-8">
        <div className="flex items-center gap-3">
          <BrandLogo />
          <div>
            <h1 className="text-2xl">Nouveau mot de passe</h1>
            <p className="text-xs text-muted-foreground">Espace équipe</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide">
              Nouveau mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="glass mt-2 w-full rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="text-xs font-semibold uppercase tracking-wide">
              Confirmer
            </label>
            <input
              id="confirm"
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="glass mt-2 w-full rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {info ? <p className="text-sm text-primary">{info}</p> : null}

          <PillButton type="submit" size="lg" className="w-full" disabled={busy}>
            <LockKeyhole className="size-4" aria-hidden="true" />
            {busy ? "Patientez..." : "Enregistrer"}
          </PillButton>
        </form>
      </GlassCard>
    </div>
  );
}
