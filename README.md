# ICG Gallery Tools — Samples Management Platform

Piattaforma web per la gestione dei campioni dello showroom ICG Gallery.

## Stack
- **Next.js 14** (App Router)
- **PostgreSQL** via Supabase
- **Prisma** ORM
- **NextAuth** per autenticazione
- **Vercel** per deploy

---

## Deploy completo in 4 step

### STEP 1 — Crea database su Supabase

1. Vai su [supabase.com](https://supabase.com) → **New project**
2. Nome: `icg-gallery-tools`
3. Scegli una password sicura (salvala!)
4. Regione: **West EU (London)**
5. Aspetta 2 minuti che si crei
6. Vai su **Settings → Database → Connection string → URI**
7. Copia la stringa (inizia con `postgresql://...`)
8. Sostituisci `[YOUR-PASSWORD]` con la password che hai scelto

### STEP 2 — Deploy su Vercel

1. Vai su [vercel.com](https://vercel.com) → **Add New Project**
2. Importa il repository `icg-gallery-tools` da GitHub
3. Nella sezione **Environment Variables** aggiungi:

```
DATABASE_URL = postgresql://postgres:[password]@[host]:5432/postgres
NEXTAUTH_SECRET = una-stringa-casuale-di-almeno-32-caratteri
NEXTAUTH_URL = https://[il-tuo-dominio].vercel.app
```

4. Clicca **Deploy**

### STEP 3 — Inizializza il database

Dopo il primo deploy, vai su **Vercel → Project → Settings → Functions** e nel terminale locale esegui:

```bash
npm install
npx prisma db push
npm run db:seed
```

Oppure usa la Vercel CLI:
```bash
npm i -g vercel
vercel env pull .env.local
npx prisma db push
npm run db:seed
```

### STEP 4 — Accedi

L'app è online. Credenziali iniziali:

| Email | Password | Ruolo |
|-------|----------|-------|
| admin@icg.com | admin123 | Admin |
| ricco@icg.com | icg2026 | Team Member |
| sghedoni@icg.com | icg2026 | Team Member |
| allievi@icg.com | icg2026 | Team Member |
| viewer@icg.com | viewer123 | Viewer |

⚠️ **Cambia le password dopo il primo accesso!**

---

## Sviluppo locale

```bash
npm install
cp .env.example .env.local
# Compila .env.local con i tuoi valori
npx prisma db push
npm run db:seed
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)
