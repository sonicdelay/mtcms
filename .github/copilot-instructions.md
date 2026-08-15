<!-- AUTO-GENERIERT – bearbeite stattdessen ai/shared.md und ai/copilot.md -->

# KI-Agent – Gemeinsamer Kontext

Du bist ein hilfreicher TypeScript-Entwickler, der an diesem Projekt arbeitet.

## Überblick

Full-Stack-CMS: React 19 + Vite-Frontend (`app/`), Deno + Oak-Backend (`api/`), PostgreSQL (`@neon/serverless`).

- **Frontend**: Port 4210, Vite-Dev-Proxy `/api` → `localhost:8421`
- **Backend**: Port 8421, Einstieg `api/main.ts`

## Tech-Stack

- **Runner**: sowohl `npm run dev` (tsx) als auch `deno task dev` (Deno) – der Code muss doppelt kompatibel sein
- **Abhängigkeiten**: `package.json` ist die einzige Quelle der Wahrheit; `deno.json` enthält nur Tasks/Lint/Fmt (keine `imports`)
- **JSR-Pakete**: `@oak/oak`, `@tajpouria/cors`, `@neon/serverless` werden über `npm:@jsr/...`-Aliase aufgelöst
- **`.npmrc`**: `@jsr:registry=https://npm.jsr.io`

## Struktur

```
api/
├── main.ts                         # Oak-App + roher http.createServer + WebSocket-Upgrade
├── client.ts                       # WebSocket-Client-Beispiel
├── helpers/database.ts             # DB-Helfer (pg-Pool oder @neon/serverless)
├── middlewares/                     # CORS, Logger, Response-Zeit, Validierung
├── models/                         # TS-Interfaces (synchron mit app/models/ halten)
├── modules/
│   ├── api/                        # OpenAPI-Dokumentations-Endpunkt
│   ├── auth/                       # JWT-Login + Token-Refresh
│   ├── fm/                         # Dateiverwaltung (media/s lesen/schreiben/löschen)
│   ├── node/                       # Node-CRUD, Baum-Abfragen, types/*.json
│   ├── page/                       # Statische Seiten ausliefern
│   └── websocket/                  # WebSocket /ws + /wss
└── util/routeStaticFilesFrom.ts    # Eigene statische Dateiauslieferung (ohne Oak send())

app/
├── main.tsx                        # React-Einstieg, i18n-Init, Router-Mount
├── app.tsx                         # Wurzel: IxApplicationContext, Modal, Theme
├── routes.ts                       # React-Router-v7-Browser-Router
├── actionhandler.ts                # Globale Aktionsverteilung
├── i18n.ts                         # i18next (en/de)
├── index.scss
├── assets/
├── components/                     # Zustandslose gemeinsame Komponenten
│   ├── article-card.tsx
│   ├── dynamic-form.tsx
│   ├── login.tsx
│   ├── markdown.tsx
│   ├── model-edit.tsx
│   ├── root-error-boundary.tsx
│   ├── theme-switcher.tsx
│   ├── modal/
│   └── ui/                         # `<sd-...>`-Web-Component-Wrapper
├── hooks/
│   ├── use-auth-guard.ts
│   └── use-fetch.ts
├── models/                         # TS-Interfaces (synchron mit api/models/ halten)
├── modules/
│   ├── app/                        # Login-Seite + Auth-Store
│   ├── home/                       # Artikel/Landingpage
│   ├── admin/                      # Admin-Baum-Editor
│   └── engine/                     # Babylon.js-3D-Szene
├── services/
│   ├── node.ts                     # Node-API-Aufrufe
│   ├── file.ts                     # Dateiverwaltungs-API-Aufrufe
│   └── common.js
├── styles/
│   ├── _reset.scss
│   └── _variables.scss
└── data/                           # Statische Daten (Kontakte usw.)
```

## Modul-Konvention (Backend)

Jedes `modules/<name>/` folgt diesem Schema:
- `<name>.routes.ts` — Oak-Router mit `.prefix("/api/<name>")`, exportiert als default
- `<name>.controller.ts` — Anfrage/Antwort, lazy-init asynchroner Ressourcen
- `<name>.service.ts` — DB-Abfragen/Geschäftslogik

Registriere Router in `main.ts` über `router.use(newRouter.routes())`.

## Modul-Konvention (Frontend)

- **Zustandslos** (`app/components/`) – nur Props/Events, kein Store-Zugriff
- **Zustandsbehaftet** (`app/modules/<name>/`) – darf auf Stores und Services zugreifen

## Datenbank

- `@neon/serverless`-Client in `helpers/database.ts`
- Immer parametrisierte Abfragen verwenden (`$1`, `$2`, ...)
- Einzelne `nodes`-Tabelle; Baum-Elternteil liegt bei `data->'0'->>'parent'`
- JSON-Schemata in `modules/node/types/<typename>.json` (Felddefinitionen, erlaubte Kinder)

## Seiten & Routing (Frontend)

| Pfad | Komponente |
|------|-----------|
| `/login` | LoginPage |
| `/` | HomeLayout → Weiterleitung zu `/articles/home` |
| `/articles/:id` | ArticlesPage |
| `/admin` | AdminLayout → TasksPage |
| `/admin/edit/:id?` | EditPage |
| `/admin/call` | CallPage |
| `/admin/files` | FilesPage |
| `/admin/tools/:id?` | ToolsPage |
| `/engine` | EngineLayout (Babylon.js) |

Neue Admin-Seiten müssen auch in `navigationItems` in `admin.layout.tsx` ergänzt werden.

## State-Management

- `modules/app/app.store.ts` — Auth-Token + Benutzer, in localStorage gespeichert
- `modules/admin/admin.store.ts` — Baum-Modell, ausgewählter Node, Formular-Modell, Sprache, Abstammung
- Neuen Admin-State in bestehendes `admin.store.ts` aufnehmen; keine neuen Stores erstellen

## UI-Komponenten

- UI in benutzerdefinierte `<sd-...>`-Web-Komponenten kapseln (definiert in `app/components/ui/`)
- Siemens iX (`@siemens/ix-react`) nur innerhalb dieser Wrapper verwenden
- In Seiten `<sd-...>`-Komponenten verwenden, nicht iX direkt
- Icons von `@siemens/ix-icons/icons`
- Nur Seitenkomponenten agieren als `smart components` und dürfen Store/Navigation verwenden
- Präsentations-/dumme React-Komponenten verwenden ausschließlich `app/models/component-props.interface.ts` und senden Daten per Props/Callbacks an die Eltern

## Pfad-Aliase (Frontend)

- `@/` → `app/modules/demo/`
- `@components/` → `app/components/`
- Modelle liegen jetzt in `app/models/` (nicht `@shared/`)

## Befehle

| Aktion | npm | deno |
|--------|-----|------|
| Dev (beide) | `npm run dev` | `deno task dev` |
| Dev: Client | `npm run dev:client` | `deno task dev:client` |
| Dev: Server | `npm run dev:server` | `deno task dev:server` |
| Build | `npm run build` | `deno task build` |
| Serve | `npm run serve` | `deno task serve` |
| Lint | `npm run lint` | `deno task lint` |
| Format | — | `deno task fmt` |
| Typ-Check | `npm run check` | `deno task check` |


---

# Copilot-spezifische Anweisungen

Copilot liest das über `.github/copilot-instructions.md` (symlink/kopiert von hier).

## Verhalten

- `<sd-...>`-Web-Component-Wrapper bevorzugen statt direktem iX-Gebrauch – siehe shared.md
- Keine Kommentare hinzufügen, die erklären, was Code tut; nur Kommentare für nicht offensichtliche WARUMs
- Keine neuen Zustand-Stores erstellen; neuen Admin-State in `admin.store.ts` erweitern
- Nur parametrisierte Abfragen verwenden (`$1`, `$2`, ...) – niemals String-Interpolation in SQL
