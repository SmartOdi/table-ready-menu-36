import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Delete } from "lucide-react";

import { BrandLogo, BrandProvider } from "@/components/brand";
import { GlassCard } from "@/components/kit";
import { pinLogin } from "@/lib/pin.functions";
import { savePinSession } from "@/lib/pin-session";

export const Route = createFileRoute("/acces")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Accès équipe par code — Cuisine & caisse" },
      {
        name: "description",
        content: "Entrée rapide de l'équipe : un code à 6 chiffres ouvre l'écran cuisine ou caisse.",
      },
      { property: "og:title", content: "Accès équipe par code" },
      { property: "og:description", content: "Code à 6 chiffres pour la cuisine et la caisse." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <BrandProvider zone="staff">
      <AccessPage />
    </BrandProvider>
  ),
});

function AccessPage() {
  const navigate = useNavigate();
  const login = useServerFn(pinLogin);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(code: string) {
    setBusy(true);
    setError(null);
    try {
      const result = await login({ data: { pin: code } });
      if (!result.ok) {
        setError("Code incorrect.");
        setPin("");
        setBusy(false);
        return;
      }
      savePinSession(result.token, result.role);
      await navigate({ to: result.role === "cuisine" ? "/cuisine" : "/caisse" });
    } catch {
      setError("Connexion impossible. Réessayez.");
      setPin("");
      setBusy(false);
    }
  }

  function press(digit: string) {
    if (busy || pin.length >= 6) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 6) void submit(next);
  }

  return (
    <div className="halo-scene flex min-h-screen items-center justify-center px-5 py-14">
      <GlassCard strong className="w-full max-w-sm p-8 text-center">
        <div className="flex items-center justify-center gap-3">
          <BrandLogo />
          <div className="text-left leading-tight">
            <h1 className="text-2xl">Accès équipe</h1>
            <p className="text-xs text-muted-foreground">Cuisine · Caisse</p>
          </div>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">Entrez votre code à 6 chiffres</p>

        <div className="mt-5 flex items-center justify-center gap-2.5" aria-live="polite">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <span
              key={index}
              className={`size-3.5 rounded-full transition-all ${
                pin.length > index ? "bg-primary scale-110" : "bg-white/15"
              }`}
            />
          ))}
        </div>

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        {busy ? <p className="mt-4 text-sm text-muted-foreground">Vérification...</p> : null}

        <div className="mt-7 grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => press(digit)}
              className="glass rounded-2xl py-4 text-xl font-bold transition-transform active:scale-95"
            >
              {digit}
            </button>
          ))}
          <span />
          <button
            type="button"
            onClick={() => press("0")}
            className="glass rounded-2xl py-4 text-xl font-bold transition-transform active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => setPin(pin.slice(0, -1))}
            className="glass flex items-center justify-center rounded-2xl py-4 transition-transform active:scale-95"
            aria-label="Effacer un chiffre"
          >
            <Delete className="size-5" aria-hidden="true" />
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
