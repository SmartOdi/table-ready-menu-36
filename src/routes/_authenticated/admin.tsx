import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  Download,
  FileUp,
  ImagePlus,
  LayoutDashboard,
  Plus,
  QrCode,
  Save,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";

import { BrandLogo, BrandProvider, useBrand } from "@/components/brand";
import { GlassCard, PillButton, SectionTitle } from "@/components/kit";
import { useRoles } from "@/hooks/use-roles";
import { supabase } from "@/integrations/supabase/client";
import { parseBoolean, parseCsv, parsePrice, pick } from "@/lib/csv";
import {
  categoriesQuery,
  menuQuery,
  restaurantQuery,
  tablesQuery,
  type MenuItem,
} from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { grantStaffRole, listTeamMembers, revokeRole } from "@/lib/staff.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Gestion du restaurant — Menu, identité et tables" },
      {
        name: "description",
        content:
          "Modifier le nom, le logo, les couleurs, le menu, les catégories et les QR codes des tables.",
      },
      { property: "og:title", content: "Gestion du restaurant" },
      { property: "og:description", content: "Identité visuelle, menu et QR codes des tables." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <BrandProvider zone="admin">
      <AdminPage />
    </BrandProvider>
  ),
});

const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 5;

async function uploadImage(file: File, folder: string): Promise<string> {
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("restaurant").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage
    .from("restaurant")
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signError || !data) throw signError ?? new Error("URL indisponible");
  return data.signedUrl;
}

function AdminPage() {
  const { isAdmin, isLoading, email } = useRoles();

  if (isLoading) {
    return (
      <div className="halo-scene flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="halo-scene flex min-h-screen items-center justify-center px-5">
        <GlassCard strong className="max-w-sm p-8 text-center">
          <h1 className="text-2xl">Réservé à l'administrateur</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Le compte {email} n'a pas les droits de gestion.
          </p>
          <Link to="/dashboard" className="mt-6 inline-block">
            <PillButton variant="glass">Aller aux commandes</PillButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return <AdminContent />;
}

function AdminContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await supabase.auth.signOut();
    queryClient.clear();
    await navigate({ to: "/auth" });
  }

  return (
    <div className="halo-scene min-h-screen pb-20">
      <header className="sticky top-0 z-40 px-4 pt-4">
        <div className="glass-strong mx-auto flex max-w-5xl items-center justify-between rounded-full px-4 py-2.5">
          <div className="flex items-center gap-3">
            <BrandLogo className="size-9" />
            <p className="text-sm font-bold">Gestion</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <PillButton variant="glass" size="sm">
                <LayoutDashboard className="size-4" aria-hidden="true" />
                Commandes
              </PillButton>
            </Link>
            <PillButton variant="glass" size="sm" onClick={signOut}>
              Quitter
            </PillButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-14 px-5 pt-12">
        <IdentitySection />
        <CategoriesSection />
        <MenuSection />
        <TablesSection />
        <TeamSection />
      </main>
    </div>
  );
}

function IdentitySection() {
  const queryClient = useQueryClient();
  const brand = useBrand();
  const [form, setForm] = useState({
    nom: "",
    slogan: "",
    telephone: "",
    adresse: "",
    devise: "FCFA",
    couleur_principale: "#7C4DFF",
    couleur_secondaire: "#22D3EE",
    logo_url: "" as string | null,
  });
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!brand) return;
    setForm({
      nom: brand.nom,
      slogan: brand.slogan ?? "",
      telephone: brand.telephone ?? "",
      adresse: brand.adresse ?? "",
      devise: brand.devise,
      couleur_principale: brand.couleur_principale,
      couleur_secondaire: brand.couleur_secondaire,
      logo_url: brand.logo_url,
    });
  }, [brand]);

  const save = useMutation({
    mutationFn: async () => {
      if (!brand) return;
      const { error } = await supabase
        .from("restaurants")
        .update({
          nom: form.nom,
          slogan: form.slogan || null,
          telephone: form.telephone || null,
          adresse: form.adresse || null,
          devise: form.devise || "FCFA",
          couleur_principale: form.couleur_principale,
          couleur_secondaire: form.couleur_secondaire,
          logo_url: form.logo_url,
        })
        .eq("id", brand.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setStatus("Enregistré");
      void queryClient.invalidateQueries({ queryKey: ["restaurant"] });
    },
    onError: () => setStatus("Échec de l'enregistrement"),
  });

  const logoInput = useRef<HTMLInputElement>(null);

  return (
    <section>
      <SectionTitle eyebrow="Identité" title="Nom, logo et couleurs" />
      <GlassCard className="mt-6 space-y-5 p-6">
        <div className="flex items-center gap-4">
          {form.logo_url ? (
            <img src={form.logo_url} alt="Logo" className="size-16 rounded-2xl object-cover" />
          ) : (
            <span className="flex size-16 items-center justify-center rounded-2xl bg-white/10">
              <ImagePlus className="size-6" aria-hidden="true" />
            </span>
          )}
          <div>
            <PillButton variant="glass" size="sm" onClick={() => logoInput.current?.click()}>
              Choisir un logo
            </PillButton>
            <input
              ref={logoInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setStatus("Envoi du logo...");
                try {
                  const url = await uploadImage(file, "logos");
                  setForm((current) => ({ ...current, logo_url: url }));
                  setStatus("Logo prêt — pensez à enregistrer");
                } catch {
                  setStatus("Envoi du logo impossible");
                }
              }}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom du restaurant">
            <input
              value={form.nom}
              onChange={(event) => setForm({ ...form, nom: event.target.value })}
              className="glass w-full rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </Field>
          <Field label="Slogan">
            <input
              value={form.slogan}
              onChange={(event) => setForm({ ...form, slogan: event.target.value })}
              className="glass w-full rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </Field>
          <Field label="Téléphone">
            <input
              value={form.telephone}
              onChange={(event) => setForm({ ...form, telephone: event.target.value })}
              className="glass w-full rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </Field>
          <Field label="Adresse">
            <input
              value={form.adresse}
              onChange={(event) => setForm({ ...form, adresse: event.target.value })}
              className="glass w-full rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </Field>
          <Field label="Devise">
            <input
              value={form.devise}
              onChange={(event) => setForm({ ...form, devise: event.target.value })}
              className="glass w-full rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Couleur principale">
              <input
                type="color"
                value={form.couleur_principale}
                onChange={(event) =>
                  setForm({ ...form, couleur_principale: event.target.value })
                }
                className="glass h-12 w-full cursor-pointer rounded-full px-2"
              />
            </Field>
            <Field label="Couleur secondaire">
              <input
                type="color"
                value={form.couleur_secondaire}
                onChange={(event) =>
                  setForm({ ...form, couleur_secondaire: event.target.value })
                }
                className="glass h-12 w-full cursor-pointer rounded-full px-2"
              />
            </Field>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <PillButton onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="size-4" aria-hidden="true" />
            Enregistrer
          </PillButton>
          {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
        </div>
      </GlassCard>
    </section>
  );
}

function CategoriesSection() {
  const queryClient = useQueryClient();
  const { data: categories = [] } = useQuery(categoriesQuery);
  const [nom, setNom] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("categories")
        .insert({ nom, position: categories.length + 1 });
      if (error) throw error;
    },
    onSuccess: () => {
      setNom("");
      void invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void invalidate(),
  });

  return (
    <section>
      <SectionTitle eyebrow="Catégories" title="Organiser la carte" />
      <GlassCard className="mt-6 p-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <span
              key={category.id}
              className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm"
            >
              {category.nom}
              <button
                type="button"
                onClick={() => remove.mutate(category.id)}
                aria-label={`Supprimer ${category.nom}`}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>

        <div className="mt-5 flex gap-3">
          <input
            value={nom}
            onChange={(event) => setNom(event.target.value)}
            placeholder="Nouvelle catégorie"
            className="glass flex-1 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <PillButton disabled={!nom.trim() || create.isPending} onClick={() => create.mutate()}>
            <Plus className="size-4" aria-hidden="true" />
            Ajouter
          </PillButton>
        </div>
      </GlassCard>
    </section>
  );
}

const EMPTY_ITEM = {
  nom: "",
  description: "",
  prix: "",
  categorie_id: "",
  badge: "",
  image_url: null as string | null,
  disponible: true,
};

function MenuSection() {
  const queryClient = useQueryClient();
  const brand = useBrand();
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: menu = [] } = useQuery(menuQuery);
  const [draft, setDraft] = useState(EMPTY_ITEM);
  const [status, setStatus] = useState<string | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["menu_items"] });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("menu_items").insert({
        nom: draft.nom,
        description: draft.description || null,
        prix: Number(draft.prix) || 0,
        categorie_id: draft.categorie_id || null,
        badge: draft.badge || null,
        image_url: draft.image_url,
        disponible: draft.disponible,
        position: menu.length + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft(EMPTY_ITEM);
      setStatus("Plat ajouté");
      void invalidate();
    },
    onError: () => setStatus("Ajout impossible"),
  });

  const toggle = useMutation({
    mutationFn: async (item: MenuItem) => {
      const { error } = await supabase
        .from("menu_items")
        .update({ disponible: !item.disponible })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => void invalidate(),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void invalidate(),
  });

  return (
    <section>
      <SectionTitle
        eyebrow="Menu"
        title="Plats, prix et photos"
        description="Les plats ajoutés ici apparaissent immédiatement sur la carte des clients."
      />

      <GlassCard className="mt-6 space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom du plat">
            <input
              value={draft.nom}
              onChange={(event) => setDraft({ ...draft, nom: event.target.value })}
              className="glass w-full rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </Field>
          <Field label={`Prix (${brand?.devise ?? "FCFA"})`}>
            <input
              value={draft.prix}
              inputMode="numeric"
              onChange={(event) => setDraft({ ...draft, prix: event.target.value })}
              className="glass w-full rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </Field>
          <Field label="Catégorie">
            <select
              value={draft.categorie_id}
              onChange={(event) => setDraft({ ...draft, categorie_id: event.target.value })}
              className="glass w-full rounded-full bg-popover px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Sans catégorie</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nom}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Badge (facultatif)">
            <input
              value={draft.badge}
              placeholder="Populaire, Nouveau..."
              onChange={(event) => setDraft({ ...draft, badge: event.target.value })}
              className="glass w-full rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            value={draft.description}
            rows={2}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            className="glass w-full rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <PillButton variant="glass" size="sm" onClick={() => imageInput.current?.click()}>
            <ImagePlus className="size-4" aria-hidden="true" />
            {draft.image_url ? "Photo prête" : "Ajouter une photo"}
          </PillButton>
          <input
            ref={imageInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setStatus("Envoi de la photo...");
              try {
                const url = await uploadImage(file, "plats");
                setDraft((current) => ({ ...current, image_url: url }));
                setStatus("Photo prête");
              } catch {
                setStatus("Envoi de la photo impossible");
              }
            }}
          />
          <PillButton
            disabled={!draft.nom.trim() || create.isPending}
            onClick={() => create.mutate()}
          >
            <Plus className="size-4" aria-hidden="true" />
            Ajouter le plat
          </PillButton>
          {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
        </div>
      </GlassCard>

      <CsvImport />


      <div className="mt-6 space-y-3">
        {menu.length === 0 ? (
          <GlassCard className="p-6 text-sm text-muted-foreground">
            Aucun plat pour l'instant.
          </GlassCard>
        ) : (
          menu.map((item) => (
            <GlassCard key={item.id} className="flex items-center gap-4 p-4">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.nom}
                  className="size-14 rounded-2xl object-cover"
                />
              ) : (
                <span className="flex size-14 items-center justify-center rounded-2xl bg-white/10 text-muted-foreground">
                  <ImagePlus className="size-5" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{item.nom}</p>
                <p className="text-sm text-primary">
                  {formatPrice(item.prix, brand?.devise ?? "FCFA")}
                </p>
              </div>
              <PillButton variant="glass" size="sm" onClick={() => toggle.mutate(item)}>
                {item.disponible ? "Disponible" : "Épuisé"}
              </PillButton>
              <button
                type="button"
                onClick={() => remove.mutate(item.id)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Supprimer ${item.nom}`}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </GlassCard>
          ))
        )}
      </div>
    </section>
  );
}

function TablesSection() {
  const queryClient = useQueryClient();
  const { data: tables = [] } = useQuery(tablesQuery);
  const { data: restaurant } = useQuery(restaurantQuery);
  const [numero, setNumero] = useState("");
  const [codes, setCodes] = useState<Record<string, string>>({});

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tables"] });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tables").insert({ numero_table: numero.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setNumero("");
      void invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void invalidate(),
  });

  async function generate(numeroTable: string) {
    const url = `${window.location.origin}/t/${encodeURIComponent(numeroTable)}`;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 600,
      margin: 2,
      color: { dark: "#0D0D0D", light: "#FFFFFF" },
    });
    setCodes((current) => ({ ...current, [numeroTable]: dataUrl }));
  }

  return (
    <section>
      <SectionTitle
        eyebrow="Tables"
        title="QR codes à poser sur les tables"
        description="Chaque QR code ouvre la carte avec le numéro de table déjà rempli."
      />

      <GlassCard className="mt-6 p-6">
        <div className="flex gap-3">
          <input
            value={numero}
            onChange={(event) => setNumero(event.target.value)}
            placeholder="Numéro de table (ex : A9)"
            className="glass flex-1 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <PillButton disabled={!numero.trim() || create.isPending} onClick={() => create.mutate()}>
            <Plus className="size-4" aria-hidden="true" />
            Ajouter
          </PillButton>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <GlassCard key={table.id} className="p-5 text-center">
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold">Table {table.numero_table}</p>
                <button
                  type="button"
                  onClick={() => remove.mutate(table.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Supprimer la table ${table.numero_table}`}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>

              {codes[table.numero_table] ? (
                <>
                  <img
                    src={codes[table.numero_table]}
                    alt={`QR code de la table ${table.numero_table}`}
                    className="mx-auto mt-4 w-40 rounded-2xl"
                  />
                  <a
                    href={codes[table.numero_table]}
                    download={`qr-table-${table.numero_table}.png`}
                    className="mt-4 inline-flex"
                  >
                    <PillButton variant="glass" size="sm">
                      <Download className="size-4" aria-hidden="true" />
                      Télécharger
                    </PillButton>
                  </a>
                </>
              ) : (
                <PillButton
                  variant="glass"
                  size="sm"
                  className="mt-4"
                  onClick={() => void generate(table.numero_table)}
                >
                  <QrCode className="size-4" aria-hidden="true" />
                  Générer le QR code
                </PillButton>
              )}

              <p className="mt-3 truncate text-xs text-muted-foreground">
                /t/{table.numero_table}
              </p>
            </GlassCard>
          ))}
        </div>

        {restaurant ? null : (
          <p className="mt-4 text-sm text-muted-foreground">Chargement du restaurant...</p>
        )}
      </GlassCard>
    </section>
  );
}

function CsvImport() {
  const queryClient = useQueryClient();
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: menu = [] } = useQuery(menuQuery);
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  const importCsv = useMutation({
    mutationFn: async (file: File) => {
      const rows = parseCsv(await file.text());
      if (rows.length === 0) throw new Error("Fichier vide");

      const byName = new Map(categories.map((c) => [c.nom.trim().toLowerCase(), c.id]));

      // Créer les catégories absentes du fichier
      const missing = Array.from(
        new Set(
          rows
            .map((row) => pick(row, ["categorie", "category", "rubrique"]))
            .filter((nom) => nom && !byName.has(nom.toLowerCase())),
        ),
      );
      if (missing.length > 0) {
        const { data, error } = await supabase
          .from("categories")
          .insert(missing.map((nom, index) => ({ nom, position: categories.length + index + 1 })))
          .select("id, nom");
        if (error) throw error;
        (data ?? []).forEach((c) => byName.set(c.nom.trim().toLowerCase(), c.id));
      }

      const payload = rows
        .map((row, index) => {
          const nom = pick(row, ["nom", "plat", "name", "titre"]);
          if (!nom) return null;
          const categorie = pick(row, ["categorie", "category", "rubrique"]);
          return {
            nom,
            description: pick(row, ["description", "detail", "details"]) || null,
            prix: parsePrice(pick(row, ["prix", "price", "montant"])),
            image_url: pick(row, ["image_url", "image", "photo", "url_image"]) || null,
            badge: pick(row, ["badge", "etiquette", "tag"]) || null,
            categorie_id: categorie ? (byName.get(categorie.toLowerCase()) ?? null) : null,
            disponible: parseBoolean(pick(row, ["disponible", "dispo", "available"])),
            position: menu.length + index + 1,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (payload.length === 0) throw new Error("Aucun plat lisible");

      const { error } = await supabase.from("menu_items").insert(payload);
      if (error) throw error;
      return payload.length;
    },
    onSuccess: (count) => {
      setStatus(`${count} plat${count > 1 ? "s" : ""} importé${count > 1 ? "s" : ""}`);
      void queryClient.invalidateQueries({ queryKey: ["menu_items"] });
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error) => setStatus(error.message || "Import impossible"),
  });

  return (
    <GlassCard className="mt-4 space-y-4 p-6">
      <div>
        <h3 className="text-lg font-bold">Importer la carte depuis un fichier CSV</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Colonnes attendues : nom, description, prix, categorie, image_url, badge, disponible. Les
          catégories inconnues sont créées automatiquement.
        </p>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) importCsv.mutate(file);
          event.target.value = "";
        }}
      />

      <div className="flex flex-wrap items-center gap-3">
        <PillButton
          variant="glass"
          onClick={() => fileInput.current?.click()}
          disabled={importCsv.isPending}
        >
          <FileUp className="size-4" aria-hidden="true" />
          {importCsv.isPending ? "Import en cours..." : "Choisir un fichier CSV"}
        </PillButton>
        <a
          href={CSV_TEMPLATE}
          download="modele-carte.csv"
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Télécharger un modèle
        </a>
      </div>

      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </GlassCard>
  );
}

const CSV_TEMPLATE = `data:text/csv;charset=utf-8,${encodeURIComponent(
  [
    "nom,description,prix,categorie,image_url,badge,disponible",
    "Poulet braisé,Poulet mariné et grillé au feu de bois,3500,Plats,,Best-seller,1",
    "Jus de bissap,Fait maison, servi bien frais,1000,Boissons,,,1",
  ].join("\n"),
)}`;


function TeamSection() {
  const queryClient = useQueryClient();
  const fetchTeam = useServerFn(listTeamMembers);
  const grant = useServerFn(grantStaffRole);
  const revoke = useServerFn(revokeRole);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: () => fetchTeam(),
  });

  const change = useMutation({
    mutationFn: async ({
      userId,
      role,
      action,
    }: {
      userId: string;
      role: "admin" | "staff";
      action: "grant" | "revoke";
    }) => {
      if (action === "grant") await grant({ data: { userId, role } });
      else await revoke({ data: { userId, role } });
    },
    onSuccess: () => {
      setFeedback("Équipe mise à jour");
      void queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (error: Error) => setFeedback(error.message),
  });

  return (
    <section>
      <SectionTitle
        eyebrow="Équipe"
        title="Comptes et rôles"
        description="Les comptes créés sur la page de connexion apparaissent ici. Attribuez un rôle pour donner accès aux commandes."
      />
      <GlassCard className="mt-6 space-y-3 p-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{member.email}</p>
                <p className="text-xs text-muted-foreground">
                  {member.roles.length === 0
                    ? "Aucun rôle — accès en attente"
                    : member.roles
                        .map((role) => (role === "admin" ? "Administrateur" : "Staff"))
                        .join(" · ")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["staff", "admin"] as const).map((role) =>
                  member.roles.includes(role) ? (
                    <PillButton
                      key={role}
                      variant="ghost"
                      size="sm"
                      disabled={change.isPending}
                      onClick={() =>
                        change.mutate({ userId: member.id, role, action: "revoke" })
                      }
                    >
                      <UserMinus className="size-4" aria-hidden="true" />
                      Retirer {role === "admin" ? "admin" : "staff"}
                    </PillButton>
                  ) : (
                    <PillButton
                      key={role}
                      variant="glass"
                      size="sm"
                      disabled={change.isPending}
                      onClick={() =>
                        change.mutate({ userId: member.id, role, action: "grant" })
                      }
                    >
                      <UserPlus className="size-4" aria-hidden="true" />
                      {role === "admin" ? "Rendre admin" : "Rendre staff"}
                    </PillButton>
                  ),
                )}
              </div>
            </div>
          ))
        )}
        {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}
      </GlassCard>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
