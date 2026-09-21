import { createFileRoute } from "@tanstack/react-router";

import { BrandProvider } from "@/components/brand";
import { MenuExperience } from "@/components/menu-experience";
import { categoriesQuery, menuQuery, restaurantQuery } from "@/lib/data";

export const Route = createFileRoute("/t/$table")({
  // Prépare la carte pendant le rendu de la page : plus de rectangles gris.
  loader: async ({ context }) => {
    const [restaurant, categories, menu] = await Promise.all([
      context.queryClient.ensureQueryData(restaurantQuery),
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(menuQuery),
    ]);
    return { restaurant, categories, menu };
  },
  head: ({ params, loaderData }) => {
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
        { title: `${restaurant?.nom ?? "Commander"} — Table ${params.table}` },
        {
          name: "description",
          content: `Carte du restaurant et commande envoyée directement en cuisine pour la table ${params.table}.`,
        },
        { property: "og:title", content: `${restaurant?.nom ?? "Commander"} — Table ${params.table}` },
        {
          property: "og:description",
          content: "Choisissez vos plats et envoyez la commande en cuisine.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: links.length > 0 ? links : undefined,
    };
  },
  component: TableOrder,
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <p className="text-muted-foreground">
        La carte n'a pas pu être chargée. Rafraîchissez la page.
      </p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <p className="text-muted-foreground">Cette table n'existe pas.</p>
    </div>
  ),
});

function TableOrder() {
  const { table } = Route.useParams();
  const loaderData = Route.useLoaderData();

  return (
    <BrandProvider zone="client" data={loaderData?.restaurant}>
      <MenuExperience numeroTable={table} categories={loaderData?.categories ?? []} menu={loaderData?.menu ?? []} />
    </BrandProvider>
  );
}
