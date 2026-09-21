import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Restaurant = {
  id: string;
  nom: string;
  slogan: string | null;
  logo_url: string | null;
  couleur_principale: string;
  couleur_secondaire: string;
  telephone: string | null;
  adresse: string | null;
  devise: string;
};

export type Category = { id: string; nom: string; position: number };

export type MenuItem = {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  image_url: string | null;
  categorie_id: string | null;
  disponible: boolean;
  badge: string | null;
  position: number;
};

export type RestaurantTable = {
  id: string;
  numero_table: string;
  active: boolean;
};

export type OrderStatus = "recu" | "en_preparation" | "pret" | "servi";

export type Order = {
  id: string;
  numero: number | null;
  numero_table: string;
  statut: OrderStatus;
  total: number;
  note: string | null;
  created_at: string;
  order_items: {
    id: string;
    nom: string;
    quantite: number;
    prix_unitaire: number;
  }[];
};

/** Les données publiques changent rarement : on les garde en cache 5 minutes. */
const PUBLIC_STALE_TIME = 5 * 60_000;

export const restaurantQuery = queryOptions({
  queryKey: ["restaurant"],
  staleTime: PUBLIC_STALE_TIME,
  queryFn: async (): Promise<Restaurant | null> => {
    const { data, error } = await supabase
      .from("restaurants")
      .select(
        "id, nom, slogan, logo_url, couleur_principale, couleur_secondaire, telephone, adresse, devise",
      )
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as Restaurant | null) ?? null;
  },
});

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  staleTime: PUBLIC_STALE_TIME,
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, nom, position")
      .order("position", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Category[];
  },
});

export const menuQuery = queryOptions({
  queryKey: ["menu_items"],
  staleTime: PUBLIC_STALE_TIME,
  queryFn: async (): Promise<MenuItem[]> => {
    const { data, error } = await supabase
      .from("menu_items")
      .select(
        "id, nom, description, prix, image_url, categorie_id, disponible, badge, position",
      )
      .order("position", { ascending: true })
      .order("nom", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...(row as MenuItem),
      prix: Number((row as MenuItem).prix),
    }));
  },
});

export const tablesQuery = queryOptions({
  queryKey: ["tables"],
  queryFn: async (): Promise<RestaurantTable[]> => {
    const { data, error } = await supabase
      .from("tables")
      .select("id, numero_table, active")
      .order("numero_table", { ascending: true });
    if (error) throw error;
    return (data ?? []) as RestaurantTable[];
  },
});

export const ordersQuery = queryOptions({
  queryKey: ["orders"],
  queryFn: async (): Promise<Order[]> => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(id, nom, quantite, prix_unitaire)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []).map((row) => {
      const order = row as unknown as Order;
      return {
        ...order,
        total: Number(order.total),
        order_items: (order.order_items ?? []).map((item) => ({
          ...item,
          prix_unitaire: Number(item.prix_unitaire),
        })),
      };
    });
  },
});
