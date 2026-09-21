import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PinRole = "cuisine" | "caisse";

export type PinOrder = {
  id: string;
  numero: number | null;
  numero_table: string;
  statut: string;
  total: number;
  note: string | null;
  created_at: string;
  order_items: { id: string; nom: string; quantite: number; prix_unitaire: number }[];
};

export type PinCall = {
  id: string;
  numero_table: string;
  raison: string | null;
  created_at: string;
};

/** Date du jour en heure locale (Cotonou / Lagos, UTC+1). */
function localDateKey(): string {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "01";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function dayRange(date: string) {
  const start = new Date(`${date}T00:00:00+01:00`);
  const end = new Date(start.getTime() + 86_400_000);
  return { start: start.toISOString(), end: end.toISOString() };
}

function startOfDay(): string {
  return dayRange(localDateKey()).start;
}

async function resolveSession(token: string): Promise<PinRole> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { hashToken } = await import("./pin.server");
  const { data } = await (supabaseAdmin as any)
    .from("pin_sessions")
    .select("role, expires_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (!data) throw new Error("Session expirée");
  if (new Date(data.expires_at).getTime() < Date.now()) throw new Error("Session expirée");
  return data.role as PinRole;
}

export const pinLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ pin: z.string().regex(/^\d{4,6}$/) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { hashPin, hashToken, newToken, sessionExpiry } = await import("./pin.server");

    const { data: rows } = await (supabaseAdmin as any)
      .from("staff_pins")
      .select("role, pin_hash, active")
      .eq("active", true);

    const hashed = hashPin(data.pin);
    const match = (rows ?? []).find((row: { pin_hash: string }) => row.pin_hash === hashed);
    if (!match) return { ok: false as const };

    const token = newToken();
    await (supabaseAdmin as any)
      .from("pin_sessions")
      .delete()
      .lt("expires_at", new Date().toISOString());
    const { error } = await (supabaseAdmin as any).from("pin_sessions").insert({
      token_hash: hashToken(token),
      role: match.role,
      expires_at: sessionExpiry(),
    });
    if (error) throw new Error("Connexion impossible");

    return { ok: true as const, token, role: match.role as PinRole };
  });

export const pinLogout = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string().min(10) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { hashToken } = await import("./pin.server");
    await (supabaseAdmin as any)
      .from("pin_sessions")
      .delete()
      .eq("token_hash", hashToken(data.token));
    return { ok: true as const };
  });

export const pinBoard = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string().min(10),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const role = await resolveSession(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const selectedDate = role === "caisse" ? (data.date ?? localDateKey()) : null;
    const range = selectedDate ? dayRange(selectedDate) : null;

    let ordersQuery = supabaseAdmin
      .from("orders")
      .select(
        "id, numero, numero_table, statut, total, note, created_at, order_items(id, nom, quantite, prix_unitaire)",
      )
      .order("created_at", { ascending: false });
    if (range) {
      ordersQuery = ordersQuery.gte("created_at", range.start).lt("created_at", range.end);
    } else {
      ordersQuery = ordersQuery.limit(120);
    }

    const showCalls = role === "cuisine" || selectedDate === localDateKey();
    const callsQuery = showCalls
      ? (supabaseAdmin as any)
          .from("staff_calls")
          .select("id, numero_table, raison, created_at")
          .eq("statut", "nouveau")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] });

    const [{ data: orderRows }, { data: callRows }, { data: dayRows }] = await Promise.all([
      ordersQuery,
      callsQuery,
      supabaseAdmin
        .from("orders")
        .select("total, statut")
        .gte("created_at", range?.start ?? startOfDay())
        .lt("created_at", range?.end ?? dayRange(localDateKey()).end),
    ]);

    const orders: PinOrder[] = (orderRows ?? []).map((row: any) => ({
      ...row,
      total: Number(row.total),
      order_items: (row.order_items ?? []).map((item: any) => ({
        ...item,
        prix_unitaire: Number(item.prix_unitaire),
      })),
    }));

    const day = (dayRows ?? []) as { total: number | string; statut: string }[];
    const encaisse = day.filter((row) => row.statut === "servi");
    const revenue = {
      total: encaisse.reduce((sum, row) => sum + Number(row.total), 0),
      commandes: day.length,
      servies: encaisse.length,
    };

    return { role, orders, calls: (callRows ?? []) as PinCall[], revenue, selectedDate };
  });

export const pinAdvance = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string().min(10),
        orderId: z.string().uuid(),
        statut: z.enum(["en_preparation", "pret", "servi"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const role = await resolveSession(data.token);
    const allowed: Record<PinRole, string[]> = {
      cuisine: ["en_preparation", "pret", "servi"],
      caisse: [],
    };
    if (!allowed[role].includes(data.statut)) throw new Error("Action non autorisée");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updatedOrder, error } = await supabaseAdmin
      .from("orders")
      .update({ statut: data.statut as never })
      .eq("id", data.orderId)
      .select("id, statut")
      .single();
    if (error) throw new Error("Mise à jour impossible");
    if (!updatedOrder || updatedOrder.statut !== data.statut) {
      throw new Error("Le statut de la commande n'a pas été enregistré");
    }
    return { ok: true as const, statut: updatedOrder.statut };
  });

export const pinResolveCall = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ token: z.string().min(10), callId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    await resolveSession(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("staff_calls")
      .update({ statut: "traite" })
      .eq("id", data.callId);
    if (error) throw new Error("Mise à jour impossible");
    return { ok: true as const };
  });

/* ---------- Espace gérant (e-mail + mot de passe) ---------- */

async function assertManager(context: { supabase: any; userId: string }) {
  const [{ data: isAdmin }, { data: isGerant }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "gerant" }),
  ]);
  if (!isAdmin && !isGerant) throw new Error("Accès refusé");
}

export const listPins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertManager(context as any);
    const { data, error } = await (context.supabase as any)
      .from("staff_pins")
      .select("id, role, label, active, updated_at")
      .order("role", { ascending: true });
    if (error) throw new Error("Impossible de lire les codes");
    return (data ?? []) as {
      id: string;
      role: PinRole;
      label: string;
      active: boolean;
      updated_at: string;
    }[];
  });

export const setPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        role: z.enum(["cuisine", "caisse"]),
        pin: z.string().regex(/^\d{6}$/),
        label: z.string().trim().max(60).optional(),
        active: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertManager(context as any);
    const { hashPin } = await import("./pin.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await (supabaseAdmin as any).from("staff_pins").upsert(
      {
        role: data.role,
        pin_hash: hashPin(data.pin),
        label: data.label ?? (data.role === "cuisine" ? "Cuisine" : "Caisse"),
        active: data.active ?? true,
      },
      { onConflict: "role" },
    );
    if (error) throw new Error("Impossible d'enregistrer le code");

    // Les sessions ouvertes avec l'ancien code sont fermées.
    await (supabaseAdmin as any).from("pin_sessions").delete().eq("role", data.role);
    return { ok: true as const };
  });

export const managerStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertManager(context as any);

    const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const { data, error } = await context.supabase
      .from("orders")
      .select("total, statut, created_at")
      .gte("created_at", since);
    if (error) throw new Error("Impossible de lire le chiffre d'affaires");

    const rows = (data ?? []).map((row) => ({
      total: Number(row.total),
      statut: row.statut as string,
      created_at: row.created_at as string,
    }));
    const dayStart = new Date(startOfDay()).getTime();
    const today = rows.filter((row) => new Date(row.created_at).getTime() >= dayStart);
    const encaisse = (list: typeof rows) =>
      list.filter((row) => row.statut === "servi").reduce((sum, row) => sum + row.total, 0);

    const caJour = encaisse(today);
    const serviesJour = today.filter((row) => row.statut === "servi").length;

    return {
      caJour,
      caSemaine: encaisse(rows),
      commandesJour: today.length,
      serviesJour,
      ticketMoyen: serviesJour > 0 ? caJour / serviesJour : 0,
      enCours: rows.filter((row) => row.statut !== "servi").length,
    };
  });
