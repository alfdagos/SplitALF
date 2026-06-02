# 💸 SplitALF

Web app per registrare **spese condivise** tra piccoli gruppi (2-10 persone) e
calcolare automaticamente **chi deve dare soldi a chi**, con il numero minimo di
trasferimenti. Ispirata a Splitwise, in versione semplificata.

Architettura **100% gratuita e serverless**:

- **Frontend** statico ospitato su **GitHub Pages**
- **Database + Auth** su **Supabase** (PostgreSQL + GoTrue)
- Comunicazione diretta browser ↔ Supabase tramite il client JS ufficiale
- Sicurezza garantita interamente da **Row Level Security** (RLS)

Nessun backend Node/Spring/PHP: non esiste alcun server applicativo da mantenere.

---

## 🧱 Stack tecnologico

| Area      | Tecnologie                                                                       |
| --------- | -------------------------------------------------------------------------------- |
| Frontend  | React 19 · Vite · TypeScript (strict) · React Router · TanStack Query            |
| UI        | TailwindCSS · shadcn/ui (Radix) · lucide-react · sonner (toast)                  |
| Form      | React Hook Form · Zod                                                            |
| Backend   | Supabase · PostgreSQL · Supabase Auth · Row Level Security                       |
| Qualità   | ESLint · Prettier · TypeScript strict                                            |
| Deploy    | GitHub Actions → GitHub Pages                                                    |

---

## 📂 Struttura del progetto

```
src/
 ├── components/        # Componenti UI riutilizzabili
 │   ├── ui/            #   primitive shadcn/ui (button, card, dialog, table…)
 │   ├── groups/        #   componenti dei gruppi (card, dialog, settings)
 │   ├── members/       #   lista e invito membri
 │   ├── expenses/      #   form spesa + storico con filtri
 │   └── balances/      #   riepilogo saldi e trasferimenti
 ├── pages/             # Pagine (Login, Register, Dashboard, GroupDetail…)
 ├── hooks/             # Hook TanStack Query + useAuth
 ├── services/          # Accesso dati: incapsulano le chiamate a Supabase
 ├── lib/               # supabase client, utils, algoritmo saldi, validazioni
 ├── types/             # Tipi del database e di dominio
 ├── layouts/           # AppLayout (autenticato) e AuthLayout
 └── routes/            # Definizione delle rotte

supabase/
 └── migrations/        # Migration SQL: schema + RLS
.github/workflows/      # CI/CD: deploy automatico su GitHub Pages
```

---

## 🚀 Avvio rapido (locale)

### Prerequisiti

- Node.js ≥ 20
- Un progetto Supabase (gratuito) → <https://supabase.com>

### 1. Installa le dipendenze

```bash
npm install
```

### 2. Configura le variabili d'ambiente

```bash
cp .env.example .env
```

Compila `.env` con i dati del tuo progetto Supabase
(_Dashboard → Project Settings → API_):

```dotenv
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

> La **anon key** è pubblica per design: l'accesso ai dati è protetto da RLS.
> Non inserire **mai** la `service_role key` nel frontend.

### 3. Avvia in sviluppo

```bash
npm run dev
```

App disponibile su <http://localhost:5173>.

### Script disponibili

| Comando             | Descrizione                                |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Server di sviluppo Vite                    |
| `npm run build`     | Type-check + build di produzione           |
| `npm run preview`   | Anteprima della build                      |
| `npm run lint`      | Analisi ESLint                             |
| `npm run format`    | Formattazione con Prettier                 |
| `npm run typecheck` | Controllo dei tipi TypeScript              |

---

## 🗄️ Configurazione Supabase

### 1. Crea il progetto

1. Vai su <https://supabase.com> → **New project**.
2. Scegli nome, password del DB e regione, poi attendi il provisioning.

### 2. Esegui le migration SQL

Apri **SQL Editor** nella dashboard ed esegui, **in ordine**, il contenuto di:

1. [`supabase/migrations/0001_initial_schema.sql`](./supabase/migrations/0001_initial_schema.sql)
   — tabelle, indici, trigger di creazione profilo, funzioni helper e RPC.
2. [`supabase/migrations/0002_rls_policies.sql`](./supabase/migrations/0002_rls_policies.sql)
   — abilitazione RLS e tutte le policy di sicurezza.

> In alternativa, con la [Supabase CLI](https://supabase.com/docs/guides/cli):
>
> ```bash
> supabase link --project-ref <project-ref>
> supabase db push
> ```

### 3. Configura l'autenticazione

In **Authentication → Providers → Email**:

- Abilita **Email**.
- Per provare l'app rapidamente puoi **disattivare “Confirm email”**
  (gli utenti vengono loggati subito dopo la registrazione).
  In produzione, lascialo attivo.

In **Authentication → URL Configuration**:

- **Site URL**: l'URL di GitHub Pages
  (es. `https://tuo-utente.github.io/splitalf/`).
- **Redirect URLs**: aggiungi sia l'URL di produzione sia
  `http://localhost:5173/` per lo sviluppo locale.
  Il link di recupero password rimanda a `…/#/reset-password`.

### 4. Recupera le chiavi API

In **Project Settings → API** copia **Project URL** e **anon public key**
in `.env` (locale) e nei *secrets* di GitHub (deploy).

---

## 🔐 Modello di sicurezza (RLS)

Tutte le tabelle hanno **Row Level Security attiva**. Regola fondamentale:
_un utente vede e modifica solo i dati dei gruppi di cui è membro_.

- **profiles** — leggibile solo per sé stessi e per chi condivide un gruppo.
- **groups** — visibili ai membri; modificabili dai membri; eliminabili dal creatore.
- **group_members / expenses / expense_shares** — accesso riservato ai membri del gruppo.

Per evitare la **ricorsione infinita** tipica delle policy che interrogano la
stessa tabella (`group_members`), le verifiche usano funzioni
`SECURITY DEFINER` (`is_member_of`, `is_group_creator`, `shares_group_with`,
`can_access_expense`) che girano con privilegi elevati e bypassano RLS.

Due operazioni passano da **RPC** dedicate:

- `add_member_by_email` — cerca il profilo dall'email e lo aggiunge al gruppo
  (dopo aver verificato che il chiamante sia membro). L'invitato deve essere
  già registrato.
- `create_expense_with_shares` — inserisce spesa e quote in un'unica
  transazione atomica, verificando che la somma delle quote sia pari all'importo.

---

## 🧮 Algoritmo di minimizzazione dei trasferimenti

1. Per ogni membro si calcola il **saldo netto**: `pagato − dovuto`.
   - `> 0` → deve **ricevere** (creditore)
   - `< 0` → deve **pagare** (debitore)
2. Algoritmo **greedy**: a ogni passo il debitore maggiore paga il creditore
   maggiore l'importo minimo tra i due, finché tutti i saldi sono azzerati.

Esempio:

```
Mario  +50€   Luigi  +20€   Anna  −70€
  ↓
Anna → Mario  50€
Anna → Luigi  20€
```

I calcoli sono eseguiti in **centesimi interi** per evitare errori di virgola
mobile; la divisione equa distribuisce i centesimi di resto sulle prime quote
(es. 100€ / 3 = 33,34 + 33,33 + 33,33).

Codice: [`src/lib/settle.ts`](./src/lib/settle.ts).

---

## ☁️ Deploy su GitHub Pages

Il deploy è **automatico** ad ogni push su `main` tramite
[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).

### Configurazione una tantum

1. **Crea il repository** su GitHub e fai push del codice sul branch `main`.

2. **Imposta i secrets** del repository
   (_Settings → Secrets and variables → Actions → New repository secret_):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. **Abilita GitHub Pages**
   (_Settings → Pages → Build and deployment → Source_): seleziona
   **GitHub Actions**.

4. Fai push su `main`: la pipeline esegue `lint`, `build` e pubblica `dist/`.
   Il sito sarà su `https://<utente>.github.io/<repo>/`.

> **Perché funziona senza altre modifiche?**
> Vite usa `base: './'` (percorsi relativi) e l'app usa **HashRouter**: gli
> asset e le rotte funzionano su qualsiasi sotto-percorso di GitHub Pages,
> senza 404 sui refresh e senza dover conoscere il nome del repository.

---

## 🗃️ Schema del database

| Tabella          | Colonne principali                                                        |
| ---------------- | ------------------------------------------------------------------------- |
| `profiles`       | `id` (= auth.users), `email`, `name`, `created_at`                        |
| `groups`         | `id`, `name`, `created_by`, `created_at`                                  |
| `group_members`  | `group_id`, `user_id`, `joined_at` (PK composta)                          |
| `expenses`       | `id`, `group_id`, `description`, `amount`, `paid_by`, `expense_date`      |
| `expense_shares` | `expense_id`, `user_id`, `amount_due` (PK composta)                       |

```
profiles ──< group_members >── groups ──< expenses ──< expense_shares
```

---

## ✨ Funzionalità

- **Auth**: registrazione, login, logout, recupero password, sessione persistente.
- **Dashboard**: gruppi, saldo totale, ultime spese.
- **Gruppi**: crea, rinomina, elimina, invita membri via email.
- **Membri**: nome, email, saldo individuale; un membro può lasciare il gruppo.
- **Spese**: descrizione, importo, data, pagatore; divisione **equa** o
  **personalizzata**.
- **Storico**: tabella con ricerca, ordinamento e filtri per data.
- **Riepilogo**: totale spese, creditori, debitori e trasferimenti consigliati.
- **Tema** chiaro/scuro "rosso fuoco" con toggle e persistenza.
- **PWA**: installabile su mobile/desktop (manifest, icona brace, service worker
  con strategia network-first e fallback offline).

---

## 📄 Licenza

Progetto a scopo dimostrativo/didattico. Usalo liberamente.
