-- Mon Harmonie — Schema Supabase
-- Exécuter dans le SQL Editor de ton dashboard Supabase

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text not null,
  last_name text not null,
  email text not null,
  building text not null,
  role text default 'resident', -- 'resident' | 'syndic' | 'admin'
  co_resident_id uuid references public.profiles(id),
  visible_in_directory boolean default true,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles visibles par tous les résidents"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Chaque résident modifie son profil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Insertion à l'inscription"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================================
-- POSTS (fil d'actualité)
-- ============================================================
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  type text not null default 'voisinage', -- annonce | signalement | voisinage | sondage
  channel text not null default 'building', -- building | residence
  building text, -- bâtiment de l'auteur au moment du post
  created_at timestamptz default now()
);

alter table public.posts enable row level security;

create policy "Lecture des posts"
  on public.posts for select
  using (auth.role() = 'authenticated');

create policy "Création de posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Suppression de ses posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- ============================================================
-- DOCUMENTS
-- ============================================================
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text not null default 'autre', -- reglement | pv | contrat | autre
  file_url text,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.documents enable row level security;

create policy "Documents lisibles par tous"
  on public.documents for select
  using (auth.role() = 'authenticated');

create policy "Documents ajoutés par syndic/admin"
  on public.documents for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('syndic', 'admin')
    )
  );

-- ============================================================
-- ESPACES RÉSERVABLES
-- ============================================================
create table public.spaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_at timestamptz default now()
);

alter table public.spaces enable row level security;

create policy "Espaces visibles par tous"
  on public.spaces for select
  using (auth.role() = 'authenticated');

-- ============================================================
-- RÉSERVATIONS
-- ============================================================
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references public.spaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now()
);

alter table public.bookings enable row level security;

create policy "Réservations visibles par tous"
  on public.bookings for select
  using (auth.role() = 'authenticated');

create policy "Création de réservation"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "Suppression de sa réservation"
  on public.bookings for delete
  using (auth.uid() = user_id);

-- ============================================================
-- INVITATIONS CO-RÉSIDENT
-- ============================================================
create table public.co_resident_invites (
  id uuid default gen_random_uuid() primary key,
  inviter_id uuid references public.profiles(id) on delete cascade not null,
  invitee_email text not null,
  accepted boolean default false,
  created_at timestamptz default now()
);

alter table public.co_resident_invites enable row level security;

create policy "Voir ses invitations"
  on public.co_resident_invites for select
  using (auth.uid() = inviter_id or invitee_email = (select email from public.profiles where id = auth.uid()));

create policy "Créer une invitation"
  on public.co_resident_invites for insert
  with check (auth.uid() = inviter_id);

-- ============================================================
-- DONNÉES INITIALES : espaces communs
-- ============================================================
insert into public.spaces (name, description) values
  ('Salle commune', 'Salle polyvalente au rez-de-chaussée'),
  ('Local vélos', 'Local sécurisé pour vélos et trottinettes'),
  ('Parking visiteur', 'Places visiteurs en surface'),
  ('Jardin partagé', 'Parcelles du jardin collectif');
