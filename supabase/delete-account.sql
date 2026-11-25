-- ============================================================
--  Mon Harmonie — Suppression de compte (RGPD)
--
--  Avant : le bouton « Supprimer mon compte » effaçait les
--  publications et la ligne de profil, mais jamais le compte
--  d'authentification. L'adresse email restait dans Supabase,
--  et la personne ne pouvait plus jamais se réinscrire avec.
--  La suppression du profil échouait d'ailleurs probablement
--  en silence, faute de politique DELETE sur profiles.
--
--  Cette fonction efface tout, dans le bon ordre, et se charge
--  elle-même des tables créées après coup : elle lit les
--  contraintes de la base au lieu d'une liste figée.
--
--  À exécuter dans Supabase → SQL Editor.
-- ============================================================

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  t     text;
  r     record;
begin
  if v_uid is null then
    raise exception 'Aucun utilisateur connecté';
  end if;

  -- --------------------------------------------------------
  -- 1) Délier le co-résident, dans les deux sens
  -- --------------------------------------------------------
  update public.profiles set co_resident_id = null
   where co_resident_id = v_uid;

  -- --------------------------------------------------------
  -- 2) Effacer le contenu personnel
  --    Les tables absentes sont ignorées sans erreur : le
  --    schéma a beaucoup bougé et toutes n'existent pas
  --    partout.
  -- --------------------------------------------------------
  foreach t in array array[
    'comments', 'post_likes', 'likes', 'poll_votes',
    'bookings', 'posts', 'personal_documents', 'rides'
  ] loop
    if to_regclass('public.' || t) is not null
       and exists (
         select 1 from information_schema.columns
          where table_schema = 'public' and table_name = t
            and column_name = 'user_id'
       )
    then
      execute format('delete from public.%I where user_id = $1', t) using v_uid;
    end if;
  end loop;

  if to_regclass('public.co_resident_invites') is not null then
    delete from public.co_resident_invites where inviter_id = v_uid;
  end if;

  -- --------------------------------------------------------
  -- 3) Le contenu collectif reste, on en retire seulement le nom
  --
  --    On parcourt toutes les colonnes qui pointent vers
  --    profiles sans suppression en cascade — documents
  --    déposés, événements créés, et tout ce qui sera ajouté
  --    plus tard. Sans ça, la suppression se heurterait à une
  --    contrainte de clé étrangère.
  -- --------------------------------------------------------
  for r in
    select c.conrelid::regclass::text as tbl,
           a.attname                  as col,
           a.attnotnull               as obligatoire
      from pg_constraint c
      join unnest(c.conkey) with ordinality as k(attnum, ord) on true
      join pg_attribute a
        on a.attrelid = c.conrelid and a.attnum = k.attnum
     where c.confrelid = 'public.profiles'::regclass
       and c.contype   = 'f'
       and c.confdeltype <> 'c'      -- pas déjà en cascade
  loop
    if r.obligatoire then
      -- Colonne obligatoire : impossible de l'annuler, on
      -- supprime la ligne.
      execute format('delete from %s where %I = $1', r.tbl, r.col) using v_uid;
    else
      execute format('update %s set %I = null where %I = $1', r.tbl, r.col, r.col) using v_uid;
    end if;
  end loop;

  -- --------------------------------------------------------
  -- 4) Le compte lui-même
  --    profiles pointe vers auth.users en cascade : supprimer
  --    l'utilisateur supprime aussi son profil, et libère son
  --    adresse email pour une éventuelle réinscription.
  -- --------------------------------------------------------
  delete from auth.users where id = v_uid;
end
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;


-- ============================================================
--  Vérification : la fonction existe et n'est exécutable que
--  par un compte connecté, pour lui-même.
-- ============================================================
select p.proname,
       pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef                               as security_definer
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname = 'delete_my_account';
