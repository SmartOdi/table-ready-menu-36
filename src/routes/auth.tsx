import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { LockKeyhole } from "lucide-react";

import { BrandLogo, BrandProvider } from "@/components/brand";
import { GlassCard, PillButton } from "@/components/kit";
import { supabase } from "@/integrations/supabase/client";
import { claimFirstAdmin } from "@/lib/staff.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Espace personnel — Connexion" },
      {
        name: "description",
        content: "Connexion réservée à l'équipe du restaurant : cuisine, caisse et gestion.",
      },
      { property: "og:title", content: "Espace personnel — Connexion" },
      { property: "og:description", content: "Connexion réservée à l'équipe du restaurant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const claim = useServerFn(claimFirstAdmin);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (signUpError) {
        setError(signUpError.message);
        setBusy(false);
        return;
      }
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setInfo("Compte créé. Confirmez votre e-mail puis connectez-vous.");
        setMode("signin");
        setBusy(false);
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError("E-mail ou mot de passe incorrect.");
        setBusy(false);
        return;
      }
    }

    let granted = false;
    try {
      const result = await claim({ data: { setupCode: setupCode.trim() || undefined } });
      granted = result.granted;
    } catch {
      // Un administrateur existe déjà : rien à faire.
    }
    setBusy(false);
    if (!granted && mode === "signup" && setupCode.trim()) {
      setInfo("Compte créé. Le code d'installation est invalide : un administrateur devra vous attribuer un rôle.");
      return;
    }
    await navigate({ to: "/dashboard" });
  }

  return (
    <BrandProvider>
      <div className="halo-scene flex min-h-screen items-center justify-center px-5 py-16">
        <GlassCard strong className="w-full max-w-sm p-8">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <div>
              <h1 className="text-2xl">Espace équipe</h1>
              <p className="text-xs text-muted-foreground">Cuisine · Caisse · Gestion</p>
            </div>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="glass mt-2 w-full rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide">
                Mot de passe
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

            {mode === "signup" ? (
              <div>
                <label htmlFor="setupCode" className="text-xs font-semibold uppercase tracking-wide">
                  Code d'installation (premier administrateur)
                </label>
                <input
                  id="setupCode"
                  type="password"
                  value={setupCode}
                  onChange={(event) => setSetupCode(event.target.value)}
                  placeholder="Laisser vide pour un compte équipe"
                  className="glass mt-2 w-full rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {info ? <p className="text-sm text-primary">{info}</p> : null}

            <PillButton type="submit" size="lg" className="w-full" disabled={busy}>
              <LockKeyhole className="size-4" aria-hidden="true" />
              {busy
                ? "Patientez..."
                : mode === "signin"
                  ? "Se connecter"
                  : "Créer le compte"}
            </PillButton>
          </form>

          {mode === "signin" ? (
            <button
              type="button"
              onClick={async () => {
                if (!email) {
                  setError("Entrez d'abord votre e-mail.");
                  return;
                }
                setError(null);
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/reset-password`,
                });
                setInfo(
                  resetError
                    ? "Envoi impossible pour le moment. Réessayez dans quelques minutes."
                    : "E-mail envoyé : suivez le lien pour choisir un nouveau mot de passe.",
                );
              }}
              className="mt-5 w-full text-center text-xs text-primary underline-offset-4 hover:underline"
            >
              Mot de passe oublié ?
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
            className="mt-4 w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {mode === "signin"
              ? "Premier accès ? Créer un compte équipe"
              : "J'ai déjà un compte"}
          </button>

          <a
            href="/acces"
            className="mt-4 block text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Accès cuisine / caisse par code à 4 chiffres
          </a>
        </GlassCard>
      </div>
    </BrandProvider>
  );
}
