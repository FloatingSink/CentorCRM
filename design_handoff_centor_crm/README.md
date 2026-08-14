# Handoff: Centor Global CRM

## Overview
A desktop web CRM for **Centor Global**, a Singapore-based distributor of TBM (tunnel-boring machine) lubrication and soil-conditioning products (foam agents, sealing systems, bearing grease). The CRM lets a mixed regional sales team run their procurement pipeline: a **command dashboard** (KPIs, pipeline funnel, today's tasks, recent deals), an **Accounts list**, an **Account detail** page, and a **Deal detail** page.

The design is dark, spacious, and low-chroma — built on the **Nocturne** design system. A single accent (a muted blurple, `#9184d9`) is used as a line/glow, never a flood.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes that show intended look and behavior. They are **not production code to copy directly**. Your task is to **recreate these designs in the target codebase**:

- **Next.js 16.3** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS v4** for styling
- **shadcn/ui** components (on Base UI, `@base-ui/react`) in `src/components/ui/` — currently `badge`, `button`, `card`, `checkbox`, `input`, `label`, `select`, `table`, `textarea`
- **lucide-react** for icons (the prototypes use Phosphor — see the icon map below)
- `cva` + `clsx` + `tailwind-merge` (`cn()`), `zod` v4 (server-side), Drizzle ORM over Postgres

Recreate the visuals using these libraries and their patterns. The prototypes use inline styles and CSS variables; you should port the Nocturne tokens into your Tailwind v4 theme (see Design Tokens) and build with shadcn components rather than hand-rolling markup.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and layout are final and specified exactly below. Recreate the UI pixel-perfectly using the codebase's shadcn/ui components, mapping each prototype element to its shadcn equivalent (table → `Table`, tags → `Badge`, buttons → `Button`, cards → `Card`, search/segmented → `Input`/custom, etc.).

> **One caveat:** option **2a** in `CRM Dashboards.dc.html` is a *speculative* Centor Global brand reskin (graphite `#12151b` + amber `#ef8b3c`, Archivo type). Those hex values are an **interpretation** — Centor's exact brand colors were never confirmed. **Do not treat 2a's palette as canonical.** The keeper direction is **1a on the standard Nocturne palette**; build against Nocturne tokens unless the client supplies real brand values.

---

## Design Tokens

Port these into your Tailwind v4 `@theme` block (or a CSS `:root`). They come verbatim from `nocturne.css`.

### Color — roles
| Token | Hex | Use |
| --- | --- | --- |
| `--color-bg` | `#161826` | Page background |
| `--color-surface` | `#232532` | Cards, sidebar, inputs |
| `--color-text` | `#e9e9ed` | Primary text |
| `--color-accent` | `#9184d9` | Accent — lines, active states, glow (never a flood) |
| `--color-divider` | `rgba(233,233,237,0.16)` | `color-mix(#e9e9ed 16%, transparent)` — hairline borders |
| muted text | `rgba(233,233,237,0.55)` | `.text-muted` — secondary labels |

### Color — neutral ramp
`100 #f3f5fe` · `200 #e4e7f5` · `300 #cfd3e5` · `400 #b2b6ca` · `500 #9397ab` · `600 #75798c` · `700 #595d6c` · `800 #3f424d` · `900 #292b31`

### Color — accent ramp
`100 #f5f4ff` · `200 #e7e5fe` · `300 #d2cefd` · `400 #b5abfc` · `500 #968ae0` · `600 #796cbf` · `700 #5d5294` · `800 #423a6a` · `900 #2b2741`

> On this dark ground: 700–900 for tinted fills/hovers/subtle borders, 500 as base, 100–300 for text on tints. For accent-colored **paragraph text** use `accent-300` (the raw accent isn't AA for body copy). `accent-2` ramp is a mono stand-in — treat it as identical to accent.

### Typography
- Family: **Inter** for both heading and body (`--font-heading` / `--font-body`).
- Heading weight: **500** — never bolder (hierarchy is size + space, not weight).
- Body: 15px / line-height 1.55 / weight 400.
- Headings: line-height 1.12, letter-spacing **−0.015em**.
- Sizes used in these screens: `h1` 44px, page `h2` 24–26px, card titles ~15px, table/body 13–14px, metrics **30px** (`font-heading`), muted meta 11–12px.

### Spacing (density 0.7×)
`--space-1 2.8` · `-2 5.6` · `-3 8.4` · `-4 11.2` · `-6 16.8` · `-8 22.4` (px). Layout padding in screens uses raw 16/20/22/24/28px values on top of the scale.

### Radius
`--radius-sm 4px` · `--radius-md 8px` · `--radius-lg 14px`

### Shadow / elevation
- `--shadow-sm` = `0 0 0 1px #3f424d` (hairline edge — the standard card treatment)
- `--shadow-md` = `0 0 0 1px #595d6c, 0 6px 18px rgba(0,0,0,0.55)`
- `--shadow-lg` = `0 0 0 1px #9397ab, 0 16px 40px rgba(0,0,0,0.65)` (the outer app-shell frame in the mockups only — not needed for a real full-viewport app)

Elevation on dark = an edge + ambient darkness. **Do not stack heavy shadows.**

### Interaction states (themed — never browser defaults)
- Focus: `:focus-visible { outline: 2px solid #9184d9; outline-offset: 2px; }`
- Selection: `::selection` = accent at 30%.
- Nav hover: `background: color-mix(#e9e9ed 7%, transparent)`.
- Active nav item: text `#9184d9`, background `color-mix(#9184d9 12%, transparent)`.
- Table row hover (clickable rows): `color-mix(#e9e9ed 4%, transparent)`, cursor pointer.
- Kanban card hover: border → `color-mix(#e9e9ed 32%, transparent)`.
- Primary button = **outlined** (1px accent border, transparent fill); hover fills accent 12%, active 22%. Never a solid accent fill.
- Disabled: opacity 0.45.

### Icon map (Phosphor → lucide-react)
The prototypes use Phosphor via CDN. Swap for lucide:
`squares-four → LayoutGrid` · `buildings → Building2` · `handshake → Handshake` · `check-square → CheckSquare` · `chart-bar → BarChart3` · `gear → Settings` · `magnifying-glass → Search` · `plus → Plus` · `funnel → Filter` · `sort-ascending → ArrowUpNarrowWide` · `caret-right → ChevronRight` · `note-pencil → PenLine` · `phone-call → PhoneCall` · `envelope-simple → Mail` · `package → Package` · `arrows-clockwise → RefreshCw` · `file-text → FileText` · `circle → Circle` · `check-circle → CheckCircle2` · `arrow-up-right → ArrowUpRight` · `arrow-down-right → ArrowDownRight` · `arrow-right → ArrowRight` · `bell → Bell` · `orange-slice` (brand mark) → replace with the real Centor logo.

---

## Shared app shell (all 1a-family screens)
A rounded `#161826` frame containing a fixed sidebar + scrolling main. In a real app, drop the outer rounded frame + `shadow-lg`; the shell is full-viewport.

- **Sidebar** — `width 236px`, `flex: none`, background `--color-surface`, padding `22px 16px`, vertical flex, `gap 28px`.
  - **Brand**: 26×26 rounded-7px square with 1px accent border + accent icon, then "Centor CRM" in `font-heading` 16px.
  - **Nav**: vertical list, `gap 3px`. Each item: flex row, `gap 11px`, padding `10px 12px`, `radius-md`, 14px, 18px icon. Active item = accent text + accent-12% background. Items: Dashboard, Accounts, Deals, Tasks, Reports, Settings.
  - **User chip** (dashboard + accounts only): `margin-top:auto`, padding 8px, `radius-md`, background `neutral-900`; 30px round avatar (`accent-800` bg / `accent-100` text, initials "AR"), name "Alex Reyes" 13px, "Regional lead" 11px muted.
- **Main** — `flex:1`, padding `24px 28px 30px`, vertical flex, `gap 22–24px`.

---

## Screens / Views

### 1. Dashboard (`CRM Dashboards.dc.html`, option **1a** — the keeper)
**Purpose:** morning command view — pipeline health, today's tasks, recent deal movement.
**Width in mock:** 1360px shell.

- **Header:** greeting `h2` "Good morning, Alex" 24px + muted subline "Wednesday, August 10 · West region". Right-aligned group: a search field (surface bg, divider border, `radius-md`, padding `8px 12px`, min-width 220px, search icon + "Search accounts, deals…" placeholder in `neutral-500`) and a **New deal** primary button (`+` icon).
- **KPI band:** 4-col grid, `gap 16px`. Each = `card elev-sm`, padding 20px, vertical `gap 8px`: 12px muted label, 30px `font-heading` metric (line-height 1), 12px delta row (up/down arrow). Values: Open pipeline **$1.84M** (+12.4%, accent-300), Weighted forecast **$742K** (+4.1%, accent-300), Active accounts **126** (+8, accent-300), Win rate · 90d **34%** (−2.3%, muted).
- **Funnel + tasks:** 2-col grid `1.7fr 1fr`, `gap 24px`.
  - **Pipeline by stage** card: title + ghost "View all". 5 rows, each: 130px stage label (name + muted count) · flex track (14px tall, `radius 999px`, `neutral-900` bg) with an accent-gradient fill (`accent-700 → accent-500`; the Won row uses `accent-500 → accent-300`) · 64px right-aligned value. Rows: Lead ·48 100% $540K, Qualified ·31 80% $430K, Proposal ·19 62% $360K, Negotiation ·11 44% $290K, Won·MTD ·7 30% $220K.
  - **Today** card: title + `tag-neutral` "4 due". 4 task rows, each: circle icon (accent = due today, `neutral-600` = later) + 13px label + 11px muted meta, divider between. Tasks: Follow up — Meridian Building Supply (Today · 2:00pm); Send TBM catalog — Harbor Contractors (Today); Renewal call — Alpine Distributors (Tomorrow · D. Okafor); Quote approval — Cedar & Co. (Aug 12).
- **Recent deals** card: title + ghost "Open board", then a `.table`. Columns: Account, Stage (tag), Owner, Region, Value (right), Updated (right, muted). Rows: Meridian Building Supply / Negotiation `tag-outline` / You / Midwest / $86,400 / 2h ago · Harbor Contractors / Proposal `tag-neutral` / R. Vance / Northeast / $52,100 / 5h · Alpine Distributors / Qualified / D. Okafor / West / $120,000 / 1d · Cedar & Co. / Proposal / You / South / $41,750 / 1d · Fjord Interiors / Won `tag-accent` / D. Okafor / West / $63,200 / 3d.

> Two other dashboard directions exist in the same file for reference only: **1b** a 5-column kanban Pipeline board (top-nav, KPI strip, drag-ready cards), and **1c** a Focus workspace (68px icon rail, a "today" column + right rail with pipeline snapshot and top accounts). Build 1a; keep 1b/1c as alternate layouts if the team wants a board or focus view later.

### 2. Accounts list (`CRM Screens.dc.html` — `#accounts`)
**Purpose:** browse/filter every contractor account with pipeline value at a glance.
- Header: `h2` "Accounts" 24px + "126 contractors · West region"; right = search field + **New account** primary button.
- Filter row: segmented control (`.seg`) All / Mine / Active / At risk (All checked) + two secondary buttons "Region" (funnel icon) and "Value" (sort icon).
- Table in a `card elev-sm` (padding `8px 22px 16px`). Columns: **Account** (28px rounded-7 initials chip `neutral-800`/`neutral-200` + name), Owner, Region, Open deals (center), Pipeline value (right), Last activity (muted), Status (tag). Rows are clickable (`cursor:pointer`, hover tint). Status tags: `tag-accent` Active, `tag-neutral` Nurture/Customer, `tag-outline` At risk.
- Data: Alpine Distributors / D. Okafor / West / 3 / $120,000 / 12m / Active · Meridian Building Supply / You / Midwest / 2 / $86,400 / 1h / Active · Summit Interiors / D. Okafor / West / 1 / $67,800 / 1d / Nurture · Harbor Contractors / R. Vance / Northeast / 1 / $52,100 / 5h / Active · Cedar & Co. / You / South / 1 / $41,750 / 1d / Nurture · Northgate Supply / R. Vance / Midwest / 1 / $18,900 / 2d / At risk · Fjord Interiors / D. Okafor / West / 0 / $63,200 / 3d / Customer.

### 3. Account detail (`CRM Screens.dc.html` — `#account`)
**Purpose:** one contractor — contacts, open deals, activity trail. (Sidebar has no user chip here.)
- Breadcrumb: Accounts › **Alpine Distributors** (12px, `neutral-500`, chevrons; current segment in `--color-text`).
- Header: 52px rounded (`radius-md`) initials tile (`neutral-800`/`neutral-100`, font-heading 18px) + `h2` "Alpine Distributors" 26px + row (`tag-accent` Active + muted "West region · Distributor tier 1 · Owner D. Okafor"). Right: secondary **Log note** + primary **New deal**.
- Stat strip: 4-col grid of `card elev-sm` (padding 16px, `gap 6px`): Open pipeline **$120,000**, Lifetime value **$486K**, Open deals **3**, Last order **14d** (each metric font-heading 22px).
- Body: 2-col grid `1.4fr 1fr`, `gap 22px`, `align-items:start`.
  - **Left:** *Open deals* card (title + ghost "View all") with 3 clickable rows (bordered `radius-md`, hover border brighten): name + product·close-date meta + stage tag + value — Q3 TBM foam supply — Line 4 / Foam Agents / Aug 28 / `tag-neutral` Qualified / $72,000; Main bearing grease — annual / Sealing Systems / Sep 10 / `tag-outline` Negotiation / $34,000; Tail sealant restock / Sealing Systems / Sep 30 / `tag-neutral` Lead / $14,000. Then *Activity* card: icon + timestamped entries (call w/ accent icon and a quoted note, email, delivery).
  - **Right:** *Contacts* card (34px round avatars, name + role, mail icon; "Add contact" ghost) — Jian Mah (Procurement lead · primary, accent avatar), Rosa Peña (Site engineer). *Details* card: label/value rows — Industry: Tunnelling contractor · Payment terms: Net 45 · Currency: USD · Since: 2021.

### 4. Deal detail (`CRM Screens.dc.html` — `#deal`)
**Purpose:** a single deal — stage stepper, line items, working column.
- Breadcrumb: Deals › Alpine Distributors › **Q3 TBM foam supply**.
- Header: `h2` "Q3 TBM foam supply — Line 4" 26px + muted "Alpine Distributors · Foam Agents · Owner D. Okafor"; right = **$72,000** (font-heading 28px) + "Weighted $43,200 · 60%" muted.
- **Stage stepper:** full-width bar (surface bg, `radius-md`, padding 6px) of 5 equal segments separated by caret icons: Lead, **Qualified** (current — accent text, accent-14% bg, `inset 0 0 0 1px accent`), Proposal, Negotiation, Won (inactive = `neutral-500`).
- Body: 2-col grid `1.5fr 1fr`, `gap 22px`.
  - **Left:** *Line items* card — `.table` (Product / Qty center / Unit right / Total right): IS-C foam agent (drum) ×40 @ $1,150 = $46,000; IS-P foam agent (drum) ×16 @ $1,250 = $20,000; On-site commissioning ×1 @ $6,000 = $6,000; then a right-aligned Total **$72,000** (font-heading 17px). *Activity* card: call (accent icon), stage-move, draft-quote entries.
  - **Right:** *Details* card — Close date Aug 28 · Probability 60% · Region West · Source Existing account. *Next steps* card (title + `tag-neutral` "2"): "Send revised quote / Today" (accent circle), "Schedule commissioning / After PO" (neutral circle). Then a full-width primary **Advance to Proposal** button (`btn-block`, arrow icon).

---

## Interactions & Behavior
- **Navigation:** sidebar items route to Dashboard / Accounts / Deals / Tasks / Reports / Settings. Account rows (Accounts list) → Account detail. Open-deal rows (Account detail) → Deal detail. Breadcrumb segments are links.
- **Hover/active/focus:** as specified in Interaction states above — themed tints from the accent/neutral ramps, 2px accent focus ring. Every clickable row gets `cursor:pointer` and a hover tint.
- **Segmented filter** (Accounts): single-select; filters the table client- or server-side.
- **Stage stepper / Advance button** (Deal detail): advancing writes the new stage and appends an activity entry ("Moved to … by …").
- **Search fields** are non-functional placeholders in the mock — wire to a real query.
- **Deltas** on KPIs: positive in `accent-300`, negative in muted text (not red — Nocturne keeps chroma to the single accent).
- No animations were specified; keep transitions subtle (hover tint 100–150ms). No responsive/mobile layout was designed — these are desktop-first (min ~1200px content).

## State Management
- **Dashboard:** KPI values, pipeline-by-stage counts/values, today's task list, recent-deals list. All read-only fetches.
- **Accounts list:** account collection + active filter (All/Mine/Active/At risk) + sort (Region/Value). Row → detail nav.
- **Account detail:** one account with nested contacts, open deals, activity, details. "Log note" / "New deal" / "Add contact" open create flows (dialogs — Nocturne has a `.dialog` pattern).
- **Deal detail:** one deal with line items, stage, activity, details, next-steps. Stage advance mutates deal.stage and appends activity.
- Data implies entities: **Account** (name, owner, region, tier, industry, payment terms, currency, since, lifetime value), **Contact** (name, role, primary, email, accountId), **Deal** (name, account, product line, stage, value, weighted/probability, close date, source, region, owner, line items), **DealLineItem** (product, qty, unit, total), **Task** (label, due, owner, dealId), **Activity** (type, timestamp, actor, body). Stages: **Lead → Qualified → Proposal → Negotiation → Won** (the 1a screens), or the procurement-flavored **Enquiry → Qualification → Technical Review → Quotation → PO/Won** (used in the 2a brand mock). Confirm which stage vocabulary the client wants before modeling.

## Assets
- **Icons:** Phosphor (CDN) in the prototypes → recreate with **lucide-react** (map above).
- **Brand mark:** placeholder `ph-orange-slice` glyph → replace with the real Centor Global logo.
- **Fonts:** Inter (all screens). The 2a mock also loads **Archivo** — only relevant if the client's real brand uses it.
- No photography or raster images are used in these screens.

## Files
- `CRM Dashboards.dc.html` — dashboard directions 1a (keeper), 1b (kanban board), 1c (focus workspace), and 2a (speculative Centor brand reskin).
- `CRM Screens.dc.html` — the keeper 1a extended into **Accounts list**, **Account detail**, **Deal detail**.
- `nocturne.css` — the Nocturne design-system stylesheet (all tokens + component classes: `.btn*`, `.tag*`, `.card`, `.table`, `.seg`, `.field`/`.input`, `.dialog`, `.elev-*`). Source of every token in this README.

> The `.dc.html` files open directly in a browser to preview. Ignore the `<x-dc>` / `support.js` wrapper — that's the prototyping harness, not part of the design.
