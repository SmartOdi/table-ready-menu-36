import { createFileRoute } from "@tanstack/react-router";

import { BrandProvider } from "@/components/brand";
import { MenuExperience } from "@/components/menu-experience";
import { categoriesQuery, menuQuery, restaurantQuery } from "@/lib/data";

export const Route = createFileRoute("/")({
  // Prépare la carte pendant le rendu de la page : plus de rectangles gris.
  loader: async ({ context }) => {
    const [restaurant, categories, menu] = await Promise.all([
      context.queryClient.ensureQueryData(restaurantQuery),
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(menuQuery),
    ]);
    return { restaurant, categories, menu };
  },
  head: ({ loaderData }) => {
    const restaurant = loaderData?.restaurant;
    const firstDishImage = loaderData?.menu?.[0]?.image_url;
    const links: { rel: "preload"; as: "image"; href: string; fetchPriority?: "high" | "low" | "auto" }[] = [];
    if (restaurant?.logo_url) {
      links.push({ rel: "preload", as: "image", href: restaurant.logo_url, fetchPriority: "high" });
    }
    if (firstDishImage) {
      links.push({ rel: "preload", as: "image", href: firstDishImage, fetchPriority: "high" });
    }
    return {
      meta: [
        { title: `${restaurant?.nom ?? "Menu & commande en ligne"} — Restaurant` },
        {
          name: "description",
          content:
            "Parcourez la carte du restaurant, ajoutez vos plats au panier et envoyez votre commande en cuisine depuis votre téléphone.",
        },
        { property: "og:title", content: `${restaurant?.nom ?? "Menu & commande en ligne"} — Restaurant` },
        {
          property: "og:description",
          content: "Carte, panier et commande en cuisine, directement depuis votre téléphone.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: links.length > 0 ? links : undefined,
    };
  },
  component: Home,
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <p className="text-muted-foreground">
        La carte n'a pas pu être chargée. Rafraîchissez la page.
      </p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <p className="text-muted-foreground">Page introuvable.</p>
    </div>
  ),
});

function Home() {
  const loaderData = Route.useLoaderData();

  return (
    <BrandProvider zone="client" data={loaderData?.restaurant}>
      <MenuExperience categories={loaderData?.categories ?? []} menu={loaderData?.menu ?? []} />
    </BrandProvider>
  );
}
