# Mon Harmonie 🏠

Application de gestion de la copropriété — Résidence Harmonie, Aix-en-Provence.

## Fonctionnalités

- **Fil d'actualité** avec 2 canaux : "Mon bâtiment" et "Résidence"
- **Signalements** de problèmes (éclairage, fuite, ascenseur…)
- **Annuaire des résidents** filtrable par bâtiment
- **Réservation d'espaces communs** (salle, local vélos, parking visiteur…)
- **Documents** de la copropriété (règlement, PV d'AG, contrats)
- **Comptes duo** — publiez en tant que "Hugo & Amélie — C2"
- PWA installable sur mobile

## Stack

- React + Vite
- Supabase (auth, DB, storage)
- React Router
- Lucide Icons
- Déploiement : Vercel

## Installation

### 1. Supabase

1. Crée un projet sur [supabase.com](https://supabase.com)
2. Va dans **SQL Editor** et exécute le fichier `supabase/schema.sql`
3. Dans **Authentication > Settings**, active l'inscription par email

### 2. Variables d'environnement

```bash
cp .env.example .env
```

Remplis `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` avec les valeurs de ton projet Supabase (Settings > API).

### 3. Lancer le projet

```bash
npm install
npm run dev
```

### 4. Déployer sur Vercel

1. Push sur GitHub
2. Connecte le repo à Vercel
3. Ajoute les variables d'environnement dans les settings Vercel
4. Deploy !

## Bâtiments

A1, A2, A3, A4, A5, A6, A7, A8, B1, B2, B3, B4, C1, C2, C3, C4, D1, D2, D3, MI
