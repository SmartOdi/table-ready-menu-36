import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  ImageIcon,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { BrandLogo, useBrand } from "@/components/brand";
import { AccentBadge, GlassCard, PillButton, SectionTitle } from "@/components/kit";
import { categoriesQuery, menuQuery, type Category, type MenuItem } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { placeOrder, callStaff } from "@/lib/orders.functions";
import { cn } from "@/lib/utils";

type CartLine = { item: MenuItem; quantite: number };

export function MenuExperience({
  numeroTable,
  categories: initialCategories,
  menu: initialMenu,
}: {
  numeroTable?: string;
  categories: Category[];
  menu: MenuItem[];
}) {
  const brand = useBrand();
  const devise = brand?.devise ?? "FCFA";
  const { data: categories = [] } = useQuery({
    ...categoriesQuery,
    initialData: initialCategories,
  });
  const { data: menu = [] } = useQuery({
    ...menuQuery,
    initialData: initialMenu,
  });

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [callMessage, setCallMessage] = useState("");
  const [note, setNote] = useState("");
  const [pulse, setPulse] = useState(0);
  const [confirmation, setConfirmation] = useState<{ numero: number | null; total: number } | null>(
    null,
  );

  const sendOrder = useServerFn(placeOrder);
  const mutation = useMutation({
    mutationFn: sendOrder,
    onSuccess: (result) => {
      setConfirmation({ numero: result.numero, total: result.total });
      setCart({});
      setNote("");
      setCartOpen(false);
    },
  });

  const sendCall = useServerFn(callStaff);
  const callMutation = useMutation({
    mutationFn: sendCall,
    onSuccess: () => {
      setCallMessage("");
      setCallOpen(false);
      setTimeout(() => callMutation.reset(), 2000);
    },
  });

  const lines = Object.values(cart);
  const total = lines.reduce((sum, line) => sum + line.item.prix * line.quantite, 0);
  const count = lines.reduce((sum, line) => sum + line.quantite, 0);

  const visibleMenu = useMemo(
    () => menu.filter((item) => (activeCategory ? item.categorie_id === activeCategory : true)),
    [menu, activeCategory],
  );

  function add(item: MenuItem) {
    setCart((current) => {
      const line = current[item.id];
      return { ...current, [item.id]: { item, quantite: (line?.quantite ?? 0) + 1 } };
    });
    setPulse((value) => value + 1);
  }

  function decrement(item: MenuItem) {
    setCart((current) => {
      const line = current[item.id];
      if (!line) return current;
      if (line.quantite <= 1) {
        const next = { ...current };
        delete next[item.id];
        return next;
      }
      return { ...current, [item.id]: { item, quantite: line.quantite - 1 } };
    });
  }

  function remove(item: MenuItem) {
    setCart((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
  }

  if (confirmation) {
    return (
      <div className="halo-scene flex min-h-screen items-center justify-center px-5 py-16">
        <GlassCard strong className="w-full max-w-md p-8 text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow">
            <CheckCircle2 className="size-8" aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-3xl">Commande envoyée</h1>
          <p className="mt-3 text-muted-foreground">
            La cuisine a reçu votre commande
            {confirmation.numero ? ` n°${confirmation.numero}` : ""}
            {numeroTable ? ` pour la table ${numeroTable}` : ""}. Le service arrive.
          </p>
          <p className="mt-6 text-2xl font-bold text-price">
            {formatPrice(confirmation.total, devise)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Le règlement se fait sur place, auprès du serveur.
          </p>
          <PillButton
            className="mt-8 w-full"
            size="lg"
            onClick={() => setConfirmation(null)}
          >
            Commander autre chose
          </PillButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="halo-scene min-h-screen pb-32">
      {/* Barre de navigation en verre dépoli */}
      <header className="sticky top-0 z-40 px-4 pt-4">
        <span
          className="pointer-events-none absolute inset-x-0 -top-4 -z-10 h-[calc(100%+2.5rem)] bg-gradient-to-b from-background via-background/85 to-transparent"
          aria-hidden="true"
        />
        <div className="glass-strong mx-auto flex max-w-5xl items-center justify-between rounded-full px-4 py-2.5">

          <div className="flex items-center gap-3">
            <BrandLogo className="size-9" />
            <div className="leading-tight">
              <p className="text-sm font-bold">{brand?.nom ?? "Restaurant"}</p>
              {numeroTable ? (
                <p className="text-xs text-primary">Table {numeroTable}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Menu en ligne</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCallOpen(true);
                callMutation.reset();
              }}
              className="glass relative flex size-11 items-center justify-center rounded-full text-icon-accent transition-transform active:scale-95"
              aria-label="Appeler le serveur"
              title="Appeler le serveur"
            >
              <Phone className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="glass relative flex size-11 items-center justify-center rounded-full text-icon-accent transition-transform active:scale-95"
              aria-label="Ouvrir le panier"
            >
              <ShoppingBag className="size-5" aria-hidden="true" />
              {count > 0 ? (
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-background text-[0.65rem] font-bold text-foreground">
                  {count}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-5xl overflow-x-clip px-5 pt-8 sm:pt-20">
        <span
          className="halo-spot -top-10 left-0 size-56 sm:left-1/4 sm:size-72"
          aria-hidden="true"
        />
        <div className="max-w-2xl">
          {numeroTable ? (
            <AccentBadge>Table {numeroTable}</AccentBadge>
          ) : (
            <AccentBadge>Commande au comptoir</AccentBadge>
          )}
          <h1 className="mt-4 text-3xl leading-[1.05] sm:mt-5 sm:text-6xl">
            {brand?.nom ?? "Notre carte"}
          </h1>
          {brand?.slogan ? (
            <p className="mt-3 text-base text-muted-foreground sm:mt-4 sm:text-lg">{brand.slogan}</p>
          ) : null}
          <p className="mt-3 text-sm text-muted-foreground">
            Choisissez vos plats, envoyez la commande depuis votre téléphone. Le paiement se fait
            sur place.
          </p>
        </div>
      </section>




      {/* Menu */}
      <section className="mx-auto mt-16 max-w-5xl px-5">
        <SectionTitle eyebrow="La carte" title="Notre menu" />

        <div className="no-scrollbar mt-6 flex gap-3 overflow-x-auto pb-2">
          <CategoryChip
            label="Tout"
            active={activeCategory === null}
            onClick={() => setActiveCategory(null)}
          />
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              label={category.nom}
              active={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
            />
          ))}
        </div>

        {visibleMenu.length === 0 ? (
          <GlassCard className="mt-8 p-8 text-center">
            <Sparkles className="mx-auto size-6 text-icon-accent" aria-hidden="true" />
            <p className="mt-4 font-semibold">Le menu n'est pas encore rempli</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Les plats, prix et photos s'ajoutent depuis l'espace de gestion.
            </p>
            <Link to="/admin" className="mt-6 inline-block">
              <PillButton variant="glass">
                Ouvrir la gestion
                <ChevronRight className="size-4" aria-hidden="true" />
              </PillButton>
            </Link>
          </GlassCard>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleMenu.map((item, index) => (
              <div
                key={item.id}
                className="card-enter"
                style={{ "--enter-delay": Math.min(index * 60, 400) } as React.CSSProperties}
              >
                <ProductCard
                  item={item}
                  devise={devise}
                  priority={index < 3}
                  quantity={cart[item.id]?.quantite ?? 0}
                  onAdd={() => add(item)}
                  onDecrement={() => decrement(item)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Contact */}
      <section className="mx-auto mt-20 max-w-5xl px-5">
        <GlassCard strong className="relative overflow-hidden p-8">
          <span className="halo-spot -right-10 top-0 size-64" aria-hidden="true" />
          <SectionTitle eyebrow="Contact" title="Nous trouver" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {brand?.adresse ? (
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <MapPin className="size-5" aria-hidden="true" />
                </span>
                <p className="text-sm">{brand.adresse}</p>
              </div>
            ) : null}
            {brand?.telephone ? (
              <a href={`tel:${brand.telephone}`} className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Phone className="size-5" aria-hidden="true" />
                </span>
                <p className="text-sm">{brand.telephone}</p>
              </a>
            ) : null}
          </div>
        </GlassCard>
        <p className="py-10 text-center text-xs text-muted-foreground">
          {brand?.nom ?? "Restaurant"} — commande par QR code
        </p>
      </section>

      {/* Barre panier fixe */}
      {count > 0 && !cartOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-5">
          <button
            key={pulse}
            type="button"
            onClick={() => setCartOpen(true)}
            className="btn-order mx-auto flex w-full max-w-md animate-[scale-in_0.25s_ease-out] items-center justify-center gap-3 rounded-full py-3.5 text-base font-extrabold tracking-wide transition-transform"
            aria-label={`Commander ${count} article${count > 1 ? "s" : ""}`}
          >
            <ShoppingBag className="size-5" strokeWidth={2.5} />
            <span>Commandez</span>
            <span className="flex size-7 items-center justify-center rounded-full bg-white/25 text-sm font-extrabold text-white shadow-inner backdrop-blur-sm">
              {count}
            </span>
          </button>
        </div>
      ) : null}

      {/* Panier */}
      {cartOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
          <GlassCard
            strong
            className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl p-6 sm:rounded-3xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl">Votre commande</h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="flex size-10 items-center justify-center rounded-full bg-white/10"
                aria-label="Fermer le panier"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            {lines.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Votre panier est vide.
              </p>
            ) : (
              <div className="mt-6 space-y-4">
                {lines.map(({ item, quantite }) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="size-12 shrink-0 overflow-hidden rounded-xl bg-white/5">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.nom}
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center text-muted-foreground">
                          <ImageIcon className="size-5" aria-hidden="true" />
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.nom}</p>
                      <p className="text-sm font-bold text-price">
                        {formatPrice(item.prix * quantite, devise)}
                      </p>
                    </div>
                    <div className="glass flex items-center gap-2 rounded-full px-2 py-1">
                      <button
                        type="button"
                        onClick={() => decrement(item)}
                        className="flex size-7 items-center justify-center rounded-full bg-white/10"
                        aria-label={`Retirer un ${item.nom}`}
                      >
                        <Minus className="size-3.5" aria-hidden="true" />
                      </button>
                      <span className="w-5 text-center text-sm font-bold">{quantite}</span>
                      <button
                        type="button"
                        onClick={() => add(item)}
                        className="flex size-7 items-center justify-center rounded-full cta-gradient"
                        aria-label={`Ajouter un ${item.nom}`}
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                      aria-label={`Supprimer ${item.nom}`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}

                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Une précision pour la cuisine ? (facultatif)"
                  rows={2}
                  maxLength={300}
                  className="glass w-full rounded-2xl px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-xl font-bold text-price">
                    {formatPrice(total, devise)}
                  </span>
                </div>

                {!numeroTable ? (
                  <p className="text-xs text-muted-foreground">
                    Aucune table détectée : scannez le QR code de votre table pour que la cuisine
                    sache où servir.
                  </p>
                ) : null}

                {mutation.isError ? (
                  <p className="text-sm text-destructive">
                    La commande n'a pas pu être envoyée. Réessayez.
                  </p>
                ) : null}

                <PillButton
                  size="lg"
                  className="w-full"
                  disabled={mutation.isPending || !numeroTable}
                  onClick={() =>
                    mutation.mutate({
                      data: {
                        numeroTable: numeroTable ?? "",
                        note: note.trim() || undefined,
                        items: lines.map((line) => ({
                          menuItemId: line.item.id,
                          quantite: line.quantite,
                        })),
                      },
                    })
                  }
                >
                  {mutation.isPending ? "Envoi..." : "Envoyer la commande"}
                </PillButton>
              </div>
            )}
        </GlassCard>
        </div>
      ) : null}

      {/* Appeler le serveur */}
      {callOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
          <GlassCard
            strong
            className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl p-6 sm:rounded-3xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl">Appeler le serveur</h2>
              <button
                type="button"
                onClick={() => setCallOpen(false)}
                className="flex size-10 items-center justify-center rounded-full bg-white/10"
                aria-label="Fermer"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              {numeroTable
                ? `Table ${numeroTable} — envoyez une demande au personnel.`
                : "Aucune table détectée : la demande partira au comptoir."}
            </p>

            <textarea
              value={callMessage}
              onChange={(event) => setCallMessage(event.target.value)}
              placeholder="Ex. : pouvez-vous apporter des serviettes ?"
              rows={3}
              maxLength={300}
              className="glass mt-4 w-full rounded-2xl px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />

            {callMutation.isError ? (
              <p className="mt-3 text-sm text-destructive">
                Le message n'a pas pu être envoyé. Réessayez.
              </p>
            ) : null}

            {callMutation.isSuccess ? (
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-status-servi/10 p-3 text-sm text-status-servi">
                <CheckCircle2 className="size-5" aria-hidden="true" />
                <span>Message envoyé au serveur.</span>
              </div>
            ) : null}

            <PillButton
              size="lg"
              className="mt-5 w-full"
              disabled={callMutation.isPending || !callMessage.trim() || callMutation.isSuccess}
              onClick={() =>
                callMutation.mutate({
                  data: {
                    numeroTable: numeroTable ?? "Comptoir",
                    raison: callMessage.trim(),
                  },
                })
              }
            >
              {callMutation.isPending ? "Envoi..." : "Envoyer au serveur"}
            </PillButton>
          </GlassCard>
        </div>
      ) : null}

    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-all",
        active
          ? "glass border-b-2 border-icon-accent text-foreground shadow-glow"
          : "glass text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function ProductCard({
  item,
  devise,
  quantity = 0,
  priority = false,
  onAdd,
  onDecrement,
}: {
  item: MenuItem;
  devise: string;
  quantity?: number;
  /** Les premières cartes visibles chargent leur photo en priorité. */
  priority?: boolean;
  onAdd: () => void;
  onDecrement: () => void;
}) {
  const [flash, setFlash] = useState(false);

  function handleAdd() {
    onAdd();
    setFlash(true);
    setTimeout(() => setFlash(false), 350);
  }

  return (
    <div className="group relative">
      <GlassCard
        className={cn(
          "liquid-glass flex h-full flex-col overflow-hidden rounded-[2.25rem] transition-all duration-500",
          flash && "liquid-glass-flash",
        )}
      >
        {/* Reflet de surface qui glisse au survol */}
        <span
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2.25rem]"
          aria-hidden="true"
        >
          <span
            className="absolute -left-full -top-full size-[300%] transition-transform duration-1000 group-hover:translate-x-1/4 group-hover:translate-y-1/4"
            style={{
              background:
                "radial-gradient(circle at center, rgb(255 255 255 / 0.08) 0%, transparent 45%)",
            }}
          />
          <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 opacity-60" />
        </span>

        <div className="relative h-[200px] w-full overflow-hidden rounded-t-[2.25rem] bg-gradient-to-br from-white/10 to-white/5">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.nom}
              width={640}
              height={400}
              decoding="async"
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "low"}
              className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-8" aria-hidden="true" />
            </span>
          )}
          {/* Reflet humide en haut de la photo */}
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/20 to-transparent"
            aria-hidden="true"
          />
          {item.badge ? (
            <span className="absolute left-3 top-3">
              <AccentBadge>{item.badge}</AccentBadge>
            </span>
          ) : null}
        </div>


        <div className="relative flex flex-1 flex-col px-4 pt-3 pb-3">
          <h3 className="text-base font-bold leading-snug text-white">{item.nom}</h3>
          {item.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
          ) : null}
          <div className="mt-2 flex flex-1 items-end justify-between gap-3">
            <p className="text-xl font-extrabold text-price">{formatPrice(item.prix, devise)}</p>
            {item.disponible ? (
              quantity > 0 ? (
                <div className="flex items-center gap-2 rounded-full bg-white/5 p-1.5">
                  <button
                    type="button"
                    onClick={onDecrement}
                    className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-transform active:scale-90"
                    aria-label={`Retirer un ${item.nom}`}
                  >
                    <Minus className="size-4" aria-hidden="true" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-white">{quantity}</span>
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="flex size-9 items-center justify-center rounded-full cta-gradient text-white shadow-[var(--shadow-cta)] transition-transform active:scale-90"
                    aria-label={`Ajouter un ${item.nom}`}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAdd}
                  className="flex size-11 items-center justify-center rounded-full cta-gradient shadow-[var(--shadow-cta)] transition-transform active:scale-95"
                  aria-label={`Ajouter ${item.nom} au panier`}
                >
                  <Plus className="size-5" aria-hidden="true" />
                </button>
              )
            ) : (
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                Épuisé
              </span>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
