-- ============================================================
--  Mon Harmonie — Notifications push
--
--  Deux choses :
--   1. la table des abonnements (un par appareil, pas par personne :
--      un résident peut avoir son téléphone et sa tablette) ;
--   2. les préférences, pour choisir quels sujets donnent lieu à
--      une notification.
--
--  À exécuter dans Supabase → SQL Editor.
-- ============================================================


-- ------------------------------------------------------------
-- 1) Les abonnements
--    endpoint est l'adresse unique que le navigateur fournit.
--    p256dh et auth sont les clés de chiffrement du navigateur :
--    sans elles, impossible de lui envoyer quoi que ce soit.
-- ------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz default now(),
  last_seen   timestamptz default now()
);

create index if not exists push_subscriptions_user
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- Chacun ne voit et ne gère que ses propres appareils.
drop policy if exists "Ses propres abonnements" on public.push_subscriptions;
create policy "Ses propres abonnements"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ------------------------------------------------------------
-- 2) Les préférences, sur le profil
--
--    Tout est activé au départ sauf les réservations, qui sont
--    fréquentes et rarement urgentes. Chacun peut tout couper.
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists notif_prefs jsonb
  default '{
    "annonce":      true,
    "signalement":  true,
    "voisinage":    true,
    "sondage":      true,
    "evenement":    true,
    "reservation":  false,
    "commentaire":  true
  }'::jsonb;

-- Les profils existants n'ont rien : on leur met la valeur par défaut.
update public.profiles
   set notif_prefs = '{
     "annonce":      true,
     "signalement":  true,
     "voisinage":    true,
     "sondage":      true,
     "evenement":    true,
     "reservation":  false,
     "commentaire":  true
   }'::jsonb
 where notif_prefs is null;


-- ------------------------------------------------------------
-- 3) Vérifications
-- ------------------------------------------------------------
select column_name, data_type
  from information_schema.columns
 where table_schema = 'public'
   and table_name   = 'profiles'
   and column_name  = 'notif_prefs';

select count(*) as abonnements from public.push_subscriptions;
