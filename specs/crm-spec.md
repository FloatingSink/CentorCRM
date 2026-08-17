# CENTOR CRM — Specification

> Status: DRAFT v0.1
> Owner: Jia Long
> Last updated: <10 August 2026>
>
> This is the source of truth for what we are building. Update it *before* changing
> the code, not after. Anything marked `<TBD>` must be resolved before the phase
> that depends on it.

---

## 1. Purpose

CENTOR supplies TBM (tunnel boring machine) consumables and technical services into
large civil tunnelling projects, through a chain of related legal entities across
Singapore, Hong Kong and mainland China. Deals are anchored to **projects and
machines**, not to a simple B2B sales funnel, and nearly every deal flows through
two or more of our own entities back-to-back.

Off-the-shelf CRMs model none of this well. This system exists to answer four
questions quickly and correctly:

1. What is quoted, ordered, and shipped against each tunnelling project?
2. Which of our entities is contracting, with whom, and under what terms?
3. What is the real margin on a back-to-back chain (customer PO vs supplier PO)?
4. Where is the current, correct version of every technical and quality document?

## 2. Users

| User | Needs |
| --- | --- |
| Jia Long (admin) | Everything. Contract chains, margin, document control. |
| Commercial staff | Companies, contacts, enquiries, quotations, orders. |
| Technical staff | Products, TDS/SDS/COC, project consumption data. |

Expected headcount: `<5>`. Design for **under 20 users**.

**Roles (confirmed 2026-08-16, see docs/decisions.md):** exactly two —
`member` (full commercial access: companies, contacts, projects,
opportunities, quotations, orders, activities, documents) and `admin`
(everything `member` can do, plus user management and legal-entity
configuration — neither has a UI yet; both are a later Settings phase).
No read-only role. Enforced server-side in the data-access layer
(`src/server/*`, via `requireUser`/`requireAdmin` in `src/server/auth.ts`),
not just hidden in the UI. Do not build role hierarchies beyond these two
until asked.

## 3. Non-goals

Explicitly out of scope. Do not build these, do not scaffold for them, do not add
"future-proofing" hooks for them.

- Marketing automation, campaigns, email blasts, lead scoring
- Customer-facing portal or supplier-facing portal
- Native mobile app (the web UI must be usable on a phone; that is enough)
- Multi-tenancy — there is exactly one tenant, us

## 4. Domain glossary

Terms Claude must not guess at.

| Term | Meaning |
| --- | --- |
| TBM | Tunnel Boring Machine |
| Tail seal grease | Consumable sealing the TBM tail shield against ground water/grout |
| Soil conditioner / foam | Consumable injected at the cutterhead |
| EP grease | Extreme-pressure grease for main bearing and cutterhead |
| CRTG | China Railway Tunnel Group — major contractor customer |
| TDS | Technical Data Sheet |
| SDS | Safety Data Sheet |
| COC | Certificate of Conformity |
| Incoterm | Delivery term: EXW, FOB, CIF, CFR, DAP etc. |
| UEN | Singapore Unique Entity Number (company registration) |
| Back-to-back | Same goods sold down a chain of our own entities |
| Drum / barrel | Standard 200 L or 180 kg pack |
| Pail | Standard 20 L / 20 kg pack |

## 5. Our legal entities

These are **ours**, not customers. They appear as the contracting party on
quotations, orders and contracts, and they determine currency, letterhead,
governing law and bank details.

| Entity | Jurisdiction | Notes |
| --- | --- | --- |
| CENTOR Group Pte. Ltd. | Singapore | UEN 201923681C. Formerly Centor Engineering. Trades as "CENTOR Global". |
| INFRA TECH PROFESSIONALS PTE. LTD. | Singapore | Technical consulting / service agreements. UEN `<TBD>` |
| TUNNEL TECHNIC ENGINEERING PTE. LTD. | Singapore | Technical consulting / service agreements. UEN `<TBD>` |
| CHENGTUO GROUP LIMITED | Hong Kong | Procurement / trading arm. CR no. `<TBD>` |

Typical flow-down on the Panama Metro Line 3 work:

```
CRTG  →  INFRA TECH / TUNNEL TECHNIC  →  CENTOR Group  →  CHENGTUO (HK)  →  PRC supplier
```

The CRM must be able to represent that whole chain and roll up margin across it.

## 6. Data model

Draft. Review carefully before generating migrations — schema mistakes are the
expensive ones.

### 6.1 Core reference

**`legal_entity`** — our own companies
`id`, `name_en`, `name_zh`, `short_code` (e.g. `CGPL`, `ITP`, `TTE`, `CTG`),
`jurisdiction`, `registration_no`, `registered_address`, `default_currency`,
`letterhead_asset`, `bank_details`, `is_active`

**`company`** — external organisations
`id`, `name_en`, `name_zh`, `country`, `registration_no`, `address`, `website`,
`notes`, `is_active`
plus `company_role` (many-to-many): `customer` | `supplier` | `agent` |
`logistics` | `authority` | `other` — a company can be more than one.

**`contact`**
`id`, `company_id`, `name_en`, `name_zh`, `job_title`, `email`, `phone`,
`wechat_id`, `preferred_language` (`en` | `zh`), `is_primary`, `notes`

### 6.2 Projects

**`project`** — the anchor object for everything commercial
`id`, `name_en`, `name_zh`, `client_company_id`, `country`, `city`,
`status` (`prospect` | `active` | `on_hold` | `completed`), `start_date`,
`expected_end_date`, `owner_user_id`, `notes`

**`machine`** — TBMs on a project
`id`, `project_id`, `designation` (e.g. "TBM-1"), `manufacturer`, `diameter_mm`,
`machine_type` (`EPB` | `slurry` | `TBM_hard_rock` | `other`), `notes`

Known projects to seed: Panama Metro Line 3 (client CRTG), plus four active CRTG
projects in China — `<TBD: confirm names and machine counts>`.

### 6.3 Products

**`product`**
`id`, `centor_code` (e.g. `CTR-TSG-P`), `name_en`, `name_zh`, `category`
(`tail_seal_grease` | `soil_conditioner` | `ep_grease` | `polymer` |
`anti_wear` | `other`), `uom`, `pack_size`, `pack_description`,
`manufacturer_company_id`, `manufacturer_part_no`, `hs_code`, `is_active`, `notes`

Product code list confirmed 2026-08-17 against centorglobal.com/products (see docs/decisions.md) —
resolves the `<TBD: confirm full CENTOR code for each>` this section previously carried. Active
line: `CTR-TSG-P` (Tail Seal Grease), `CTR-TSG-H` (Tail Sealant Hand-coat), `CTR-MBS-P` (Main
Bearing Sealant), `CTR-MBG-EP1` / `CTR-MBG-EP2` (Main Bearing Grease), `CTR-ISF-C` / `CTR-ISF-D` /
`CTR-ISF-P` (Standard/Dispersed/Polymer Foam Agent). `PX2350`, `TM-T100`, `PA` are legacy —
no longer on the current catalogue, kept as `is_active: false` rather than removed.

**`product_document`**
`id`, `product_id`, `doc_type` (`TDS` | `SDS` | `COC` | `test_report` |
`other`), `language` (`en` | `zh` | `bilingual`), `version`, `issued_date`,
`file_key`, `is_current`

Only one `is_current = true` per (`product_id`, `doc_type`, `language`).

### 6.4 Commercial pipeline

**`opportunity`**
`id`, `reference`, `project_id`, `customer_company_id`, `legal_entity_id`,
`title`, `stage`, `estimated_value`, `currency`, `probability`,
`expected_close_date`, `owner_user_id`, `lost_reason`, `notes`

Stages: `enquiry` → `technical_review` → `quoted` → `negotiation` → `won` | `lost`

**`quotation`**
`id`, `quote_no`, `version`, `opportunity_id`, `legal_entity_id`,
`customer_company_id`, `contact_id`, `issue_date`, `valid_until`, `currency`,
`incoterm`, `named_place` (port/site — required for CIF/FOB/CFR/DAP),
`payment_terms`, `lead_time_days`, `language` (`en` | `zh` | `bilingual`),
`status` (`draft` | `sent` | `accepted` | `rejected` | `superseded`), `notes`

**`quotation_line`**
`id`, `quotation_id`, `line_no`, `product_id`, `description_override`,
`quantity`, `uom`, `unit_price`, `discount_pct`, `line_total`

**`sales_order`** — what we sell
`id`, `order_no`, `contract_no`, `quotation_id`, `legal_entity_id`,
`customer_company_id`, `project_id`, `signed_date`, `currency`, `incoterm`,
`named_place`, `total_value`, `governing_law`, `arbitration_rules`
(e.g. `SIAC` / `HKIAC`), `status`, `executed_document_id`, `fx_rate_to_sgd`
(§7's cross-cutting FX rule, made explicit here for this table)

> **Deviation (2026-08-12, confirmed with Jia Long):** back-to-back chains
> often have one of our *own* legal entities as the customer on an internal
> leg (§5's own example — INFRA TECH sells to CENTOR Group), not an external
> `company`. `sales_order` also has a nullable `customer_legal_entity_id`
> alongside `customer_company_id` — exactly one is set per order. See
> `docs/decisions.md`.

**`purchase_order`** — what we buy
`id`, `order_no`, `contract_no`, `legal_entity_id` (the buying entity),
`supplier_company_id` / `supplier_legal_entity_id` (nullable pair, exactly one
set — same inter-entity-leg reasoning as `sales_order`'s customer columns
above), `project_id`, `linked_sales_order_id` (nullable — set for
back-to-back chains, is what makes the margin roll-up work), `signed_date`,
`currency`, `fx_rate_to_sgd`, `incoterm`, `named_place`, `total_value`,
`governing_law`, `arbitration_rules`, `status`, `notes`. Margin for a
back-to-back chain is shown on the linked sales order's detail page (both
sides converted to SGD via their own `fx_rate_to_sgd`), not a separate
combined screen — see docs/decisions.md, 2026-08-12.

**`order_line`** — shared by both, discriminated by `order_type`

### 6.5 Logistics

**`shipment`**
`id`, `reference`, `purchase_order_id`, `sales_order_id`, `mode` (`sea` | `air` |
`land`), `container_no`, `bl_awb_no`, `port_of_loading`, `port_of_discharge`,
`etd`, `eta`, `actual_delivery_date`, `status`, `notes`

### 6.6 Shared

**`activity`** — note, call, meeting, email log
`id`, `type`, `subject`, `body`, `occurred_at`, `user_id`, and a polymorphic link
(`related_type`, `related_id`) to company / contact / project / opportunity / order

**`document`** — general file store
`id`, `title`, `doc_type`, `file_key`, `mime_type`, `size_bytes`, `uploaded_by`,
`related_type`, `related_id`

**`user`**
`id`, `name`, `email`, `role` (`admin` | `member` — see §2), `is_active`

## 7. Cross-cutting rules

- **Money**: store as integer minor units + ISO 4217 `currency` code. Never floats.
  Every monetary column travels with its own currency column.
- **FX**: snapshot the rate on the document at issue date in `fx_rate_to_sgd`;
  do not recompute historical documents from live rates.
- **Bilingual**: any user-visible name has `_en` and `_zh` variants. UI language is
  a user preference; document language is a per-document choice.
- **Dates**: store UTC timestamps; render in Asia/Singapore.
- **Soft delete**: `is_active` / `archived_at`. Nothing commercial is ever hard-deleted.
- **Numbering**: quote/order references are generated per legal entity, e.g.
  `CGPL-Q-2026-0042`. Format `<TBD>`.
- **Audit**: `created_at`, `updated_at`, `created_by` on every table.

## 8. Screens

1. **Dashboard** — a customizable widget grid, not a fixed layout (deviation from the
   original fixed-three-widget description here — confirmed with Jia Long, see
   docs/decisions.md, 2026-08-15). Each user can add/remove widgets from a fixed
   catalog, resize (S/M/L) and drag-reorder them, saved per user. Ships with three
   widgets by default (open opportunities by stage, quotes expiring, shipments in
   transit — the last a placeholder pending P7) plus four more in the catalog: my
   open opportunities, purchase orders awaiting confirmation, pipeline value (by
   currency), recent activity.
2. **Companies** — list + detail (contacts, projects, orders, activity timeline)
3. **Contacts** — list + detail
4. **Projects** — list + detail (machines, opportunities, orders, consumption, docs)
5. **Products** — list + detail (spec, current TDS/SDS/COC, price history)
6. **Opportunities** — kanban by stage + table view
7. **Quotations** — list, builder with line items, PDF export, versioning
8. **Orders** — sales and purchase, with a back-to-back chain view showing margin.
   Built as separate Sales Orders / Purchase Orders list+detail screens (matching
   how every other entity in this app is built) plus a "linked purchase orders &
   margin" section on each sales order's detail page, rather than one combined
   screen — see docs/decisions.md, 2026-08-12.
9. **Shipments** — list + detail
10. **Settings** — legal entities, users, currencies, incoterms, numbering

**Known deferred limitation**: every list screen above currently selects the whole table and
filters/searches client-side (`useMemo`). Fine under ~20 users and hundreds of rows per table;
revisit (server-side pagination, or at least a server-side search) once any single table's row
count reaches roughly the low thousands. Deliberately deferred — see docs/decisions.md,
remediation slice 6 — not a gap to fix incidentally while touching a list page for something else.

## 9. Technical decisions

| Area | Choice |
| --- | --- |
| Framework | Next.js (App Router) + TypeScript |
| Database | PostgreSQL |
| ORM / migrations | Drizzle |
| UI | Tailwind + shadcn/ui |
| Auth | Auth.js, email magic link, internal users only |
| File storage | S3-compatible object storage, private bucket, signed URLs |
| PDF generation | Server-side, `@react-pdf/renderer` (JSX document templates, not literal HTML — see docs/decisions.md) |
| Hosting | Vercel + Neon (confirmed 2026-08-14 — see docs/decisions.md) |
| Testing | Vitest for domain logic; Playwright for two or three critical flows |

Data residency: no customer contract currently requires data to stay in Singapore — confirmed
with Jia Long, 2026-08-17, see docs/decisions.md. Revisit if that changes; nothing in the current
architecture (Neon in `ap-southeast-1`, R2 storage) assumes it either way.

## 10. Build order

Each phase ships end-to-end (schema → API → UI → test) and is merged before the
next begins.

- **P0** Scaffold, auth, users, legal entities, seed data
- **P1** Companies + contacts
- **P2** Projects + machines
- **P3** Products + product documents
- **P4** Opportunities
- **P5** Quotations + line items + PDF export
- **P6** Sales orders, purchase orders, back-to-back linking, margin view
- **P7** Shipments — **on hold**: shipping is currently outsourced and the
  process isn't confirmed yet, so there's no real schema to build against.
  Stubbed to a nav placeholder only (no `shipment` table) — see
  docs/decisions.md, 2026-08-12. P8 is being built next instead.
- **P8** Activities, document library, search
- **P8.5** Dashboard — built out of the original sequence (this phase list never
  actually scheduled it despite §8 listing it as screen 1; see docs/decisions.md,
  2026-08-15). Depends on P4 (opportunities), P5 (quotations), P6 (purchase orders),
  P8 (activities) for its widgets' data.
- **P9** Import of existing spreadsheet data, backups, deploy hardening

## 11. Open questions

- [x] How many users, and do any of them need to be read-only? — ~5 users,
      two roles (`member`/`admin`, see §2), no read-only role. Confirmed
      2026-08-16, see docs/decisions.md.
- [ ] Must the quotation PDF match the existing CENTOR quotation template exactly?
- [ ] Which spreadsheets are the source for the initial data import?
- [ ] Do we need an accounting export, and to which system?
- [ ] Confirm UEN / CR numbers for INFRA TECH, TUNNEL TECHNIC, CHENGTUO
- [ ] Confirm the four active CRTG projects in China and their machine counts
- [x] Confirm the full CENTOR product code list and pack sizes — resolved against
      centorglobal.com/products, 2026-08-17, see §6.3 and docs/decisions.md.
