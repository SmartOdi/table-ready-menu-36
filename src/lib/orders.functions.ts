import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const placeOrderInput = z.object({
  numeroTable: z.string().trim().min(1).max(20),
  note: z.string().trim().max(300).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        quantite: z.number().int().min(1).max(50),
      }),
    )
    .min(1)
    .max(40),
});

const callStaffInput = z.object({
  numeroTable: z.string().trim().min(1).max(20),
  raison: z.string().trim().max(200).optional(),
});

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => placeOrderInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: table } = await supabaseAdmin
      .from("tables")
      .select("id, numero_table, active")
      .eq("numero_table", data.numeroTable)
      .maybeSingle();

    const { data: menuRows, error: menuError } = await supabaseAdmin
      .from("menu_items")
      .select("id, nom, prix, disponible")
      .in(
        "id",
        data.items.map((item) => item.menuItemId),
      );
    if (menuError) throw new Error("Menu indisponible");

    const lines = data.items
      .map((item) => {
        const menuItem = menuRows?.find((row) => row.id === item.menuItemId);
        if (!menuItem || !menuItem.disponible) return null;
        return {
          menu_item_id: menuItem.id,
          nom: menuItem.nom,
          quantite: item.quantite,
          prix_unitaire: Number(menuItem.prix),
        };
      })
      .filter((line): line is NonNullable<typeof line> => line !== null);

    if (lines.length === 0) throw new Error("Aucun plat disponible dans cette commande");

    const total = lines.reduce((sum, line) => sum + line.prix_unitaire * line.quantite, 0);

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        table_id: table?.id ?? null,
        numero_table: table?.numero_table ?? data.numeroTable,
        total,
        note: data.note ?? null,
      })
      .select("id, numero, numero_table, total")
      .single();
    if (orderError || !order) throw new Error("Impossible d'enregistrer la commande");

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(lines.map((line) => ({ ...line, order_id: order.id })));
    if (itemsError) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error("Impossible d'enregistrer les plats de la commande");
    }

    return {
      numero: order.numero,
      numeroTable: order.numero_table,
      total: Number(order.total),
    };
  });

export const callStaff = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => callStaffInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: table } = await supabaseAdmin
      .from("tables")
      .select("id, numero_table")
      .eq("numero_table", data.numeroTable)
      .maybeSingle();

    const { error } = await (supabaseAdmin as any).from("staff_calls").insert({
      table_id: table?.id ?? null,
      numero_table: table?.numero_table ?? data.numeroTable,
      raison: data.raison ?? null,
      statut: "nouveau",
    });

    if (error) throw new Error("Impossible d'appeler le serveur");
    return { ok: true };
  });
