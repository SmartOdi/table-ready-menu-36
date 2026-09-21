CREATE OR REPLACE FUNCTION public.orders_guard_staff_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.numero := OLD.numero;
  NEW.numero_table := OLD.numero_table;
  NEW.total := OLD.total;
  NEW.note := OLD.note;
  NEW.created_at := OLD.created_at;

  IF NEW.statut IS DISTINCT FROM OLD.statut THEN
    IF NOT (
      (OLD.statut = 'recu' AND NEW.statut = 'en_preparation')
      OR (OLD.statut = 'en_preparation' AND NEW.statut IN ('pret', 'servi'))
      OR (OLD.statut = 'pret' AND NEW.statut = 'servi')
    ) THEN
      RAISE EXCEPTION 'invalid status transition';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;