# Logos

Drop PNG logos here, one per legal entity, named by short code:

- `CGPL.png` — CENTOR Group Pte. Ltd. (trades as "CENTOR Global"). Wired up:
  `legal_entity.letterhead_asset` is set to `"CGPL.png"` for this entity
  (src/db/seed.ts), and quotation-document.tsx / purchase-order-document.tsx
  render it at the top of the document when set (src/lib/pdf/letterhead.ts).
- `ITP.png` — INFRA TECH PROFESSIONALS PTE. LTD. Not set yet.
- `TTE.png` — TUNNEL TECHNIC ENGINEERING PTE. LTD. Not set yet.
- `CTG.png` — CHENGTUO GROUP LIMITED. Currently the Centor Global logo as a
  stand-in (confirmed with Jia Long, 2026-08-16), not CHENGTUO's own —
  `letterhead_asset` intentionally left unset for this entity until a real
  one replaces it, so nothing renders the stand-in onto an actual document.

These are a different asset from `public/centor-logo.png` (the CRM app's
own sidebar logo, a gradient lockup) — that one is app-wide branding, not
tied to any legal entity, and deliberately not reused here.
