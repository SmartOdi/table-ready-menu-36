import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { UtensilsCrossed } from "lucide-react";

import { restaurantQuery, type Restaurant } from "@/lib/data";
import { cn } from "@/lib/utils";

const BrandContext = createContext<Restaurant | null>(null);

export function useBrand() {
  return useContext(BrandContext);
}

export function useDevise() {
  return useBrand()?.devise ?? "FCFA";
}

/**
 * Applique l'identité visuelle du restaurant (couleurs de l'admin) à tout
 * l'arbre React via les variables CSS du design system.
 * La prop `data` permet d'initialiser le contexte avec les données du loader
 * et d'éviter les erreurs de hydration entre serveur et client.
 */
export function BrandProvider({
  children,
  zone = "client",
  data: initialData,
}: {
  children: ReactNode;
  /** Palette globale appliquée : client (ambre), admin (bleu/violet), staff (émeraude). */
  zone?: "client" | "admin" | "staff";
  /** Données initiales fournies par le loader (SSR-safe). */
  data?: Restaurant | null;
}) {
  const { data } = useQuery({
    ...restaurantQuery,
    ...(initialData !== undefined ? { initialData } : {}),
  });

  // Seule la zone client suit les couleurs choisies par le restaurateur.
  const style = (
    zone === "client"
      ? {
          ...(data?.couleur_principale
            ? {
                "--client-primary": data.couleur_principale,
                "--client-icon": data.couleur_principale,
                "--client-price": data.couleur_principale,
              }
            : {}),
          ...(data?.couleur_secondaire
            ? {
                "--client-primary-strong": data.couleur_secondaire,
                "--client-halo": data.couleur_secondaire,
              }
            : {}),
        }
      : {}
  ) as CSSProperties;

  return (
    <BrandContext.Provider value={data ?? null}>
      <div style={style} className={cn("min-h-screen", `zone-${zone}`)}>
        {children}
      </div>
    </BrandContext.Provider>
  );
}

export function BrandLogo({ className }: { className?: string }) {
  const brand = useBrand();

  if (brand?.logo_url) {
    return (
      <img
        src={brand.logo_url}
        alt={brand.nom}
        className={cn("size-11 rounded-2xl object-cover", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow",
        className,
      )}
    >
      <UtensilsCrossed className="size-5" aria-hidden="true" />
    </span>
  );
}
