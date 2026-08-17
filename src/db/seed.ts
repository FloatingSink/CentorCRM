import { config } from "dotenv";

config({ path: ".env.local" });

// Dynamic import: static imports are hoisted above the dotenv config() call
// above, which would make ./client read DATABASE_URL before it's populated.
async function main() {
  const { client, db } = await import("./client");
  const { legalEntity, user, company, companyRole, project, product } =
    await import("./schema");
  const { eq } = await import("drizzle-orm");

  // crm-spec.md §5 — our own contracting entities. Registration numbers
  // marked <TBD> in the spec are left null, not guessed (crm-spec.md §11
  // open questions; CLAUDE.md "do not invent domain data").
  const legalEntities = await db
    .insert(legalEntity)
    .values([
      {
        nameEn: "CENTOR Group Pte. Ltd.",
        nameZh: null, // not provided in spec — do not invent
        shortCode: "CGPL",
        jurisdiction: "Singapore",
        registrationNo: "201923681C",
        defaultCurrency: "SGD",
        // public/logos/CGPL.png — see public/logos/README.md's convention.
        // The other three entities stay unset until their own logos land.
        letterheadAsset: "CGPL.png",
      },
      {
        nameEn: "INFRA TECH PROFESSIONALS PTE. LTD.",
        nameZh: null,
        shortCode: "ITP",
        jurisdiction: "Singapore",
        registrationNo: null, // UEN <TBD> — see spec §11 open questions
        defaultCurrency: "SGD",
      },
      {
        nameEn: "TUNNEL TECHNIC ENGINEERING PTE. LTD.",
        nameZh: null,
        shortCode: "TTE",
        jurisdiction: "Singapore",
        registrationNo: null, // UEN <TBD> — see spec §11 open questions
        defaultCurrency: "SGD",
      },
      {
        nameEn: "CHENGTUO GROUP LIMITED",
        nameZh: null,
        shortCode: "CTG",
        jurisdiction: "Hong Kong",
        registrationNo: null, // CR no. <TBD> — see spec §11 open questions
        defaultCurrency: "HKD",
      },
    ])
    .onConflictDoNothing({ target: legalEntity.shortCode })
    .returning({ shortCode: legalEntity.shortCode });

  const users = await db
    .insert(user)
    .values([
      {
        name: "Jia Long",
        email: "yjialong2000@gmail.com",
        role: "admin",
        isActive: true,
      },
    ])
    .onConflictDoNothing({ target: user.email })
    .returning({ email: user.email });

  const [admin] = await db
    .select()
    .from(user)
    .where(eq(user.email, "yjialong2000@gmail.com"));

  // crm-spec.md §6.2 — only the one confirmed project is seeded. The four
  // China projects are marked <TBD: confirm names and machine counts> in the
  // spec and are skipped entirely, not guessed (CLAUDE.md "do not invent
  // domain data"). Neither `company` nor `project` has a unique column to
  // hang onConflictDoNothing off, so this is a manual select-first check.
  let [crtg] = await db
    .select()
    .from(company)
    .where(eq(company.nameEn, "China Railway Tunnel Group"));
  let companiesSeeded = 0;
  if (!crtg) {
    [crtg] = await db
      .insert(company)
      .values({
        nameEn: "China Railway Tunnel Group",
        nameZh: null, // not provided in spec — do not invent
        country: "China", // from the entity's own name in the spec glossary
        isActive: true,
        createdBy: admin.id,
      })
      .returning();
    await db
      .insert(companyRole)
      .values({ companyId: crtg.id, role: "customer" });
    companiesSeeded = 1;
  }

  const [existingProject] = await db
    .select()
    .from(project)
    .where(eq(project.nameEn, "Panama Metro Line 3"));
  let projectsSeeded = 0;
  if (!existingProject) {
    await db.insert(project).values({
      nameEn: "Panama Metro Line 3",
      nameZh: null,
      clientCompanyId: crtg.id,
      country: "Panama",
      city: null, // not stated in the spec — do not invent
      status: "active",
      ownerUserId: admin.id,
      isActive: true,
      createdBy: admin.id,
    });
    projectsSeeded = 1;
  }

  // crm-spec.md §6.3 — the original 9 "existing line" codes plus 2 more found
  // on the same live catalogue, resolved against centorglobal.com/products
  // (confirmed with Jia Long, 2026-08-17, see docs/decisions.md). Fields left
  // null where the site doesn't give an unambiguous single answer — not
  // guessed (CLAUDE.md "do not invent domain data"): uom,
  // manufacturerPartNo, hsCode for every row, and category for
  // CTR-MBS-P specifically (grease-like but not EP-branded, a distinct
  // product line from CTR-MBG-EP1/EP2 — doesn't map cleanly onto the
  // six-value enum).
  const PRODUCTS: Array<{
    centorCode: string;
    nameEn: string;
    category?:
      | "tail_seal_grease"
      | "soil_conditioner"
      | "ep_grease"
      | "polymer"
      | "anti_wear"
      | "other";
    packSize?: string;
    packDescription?: string;
    isActive: boolean;
  }> = [
    {
      centorCode: "CTR-TSG-P",
      nameEn: "Tail Seal Grease",
      category: "tail_seal_grease",
      packSize: "25 kg / 70 kg / 250 kg drum",
      packDescription:
        "Economical driving-grade tail sealant for shielded TBMs",
      isActive: true,
    },
    {
      centorCode: "CTR-TSG-H",
      nameEn: "Tail Sealant Hand-coat",
      category: "tail_seal_grease",
      packDescription:
        "Dedicated first-fill sealant manually packed into the tail sealing brush",
      isActive: true,
    },
    {
      centorCode: "CTR-MBS-P",
      nameEn: "Main Bearing Sealant",
      packSize: "25 kg / 70 kg / 230 kg drum",
      packDescription:
        "Clay-thickened lubricating grease for the lips sealing system of TBM main bearings",
      isActive: true,
    },
    {
      centorCode: "CTR-MBG-EP1",
      nameEn: "Main Bearing Grease EP1",
      category: "ep_grease",
      packDescription:
        "Eco-friendly sealant for the main bearing lip-seal system",
      isActive: true,
    },
    {
      centorCode: "CTR-MBG-EP2",
      nameEn: "Main Bearing Grease EP2",
      category: "ep_grease",
      packDescription:
        "Eco-friendly sealant for the main bearing lip-seal system",
      isActive: true,
    },
    {
      centorCode: "CTR-ISF-C",
      nameEn: "Standard Foam Agent",
      category: "soil_conditioner",
      packSize: "200 kg drum / 1,000 kg IBC",
      packDescription: "Standard formulation for wet to sandy clay soils",
      isActive: true,
    },
    {
      centorCode: "CTR-ISF-D",
      nameEn: "Dispersed Foam Agent",
      category: "soil_conditioner",
      packSize: "200 kg drum / 1,000 kg IBC",
      packDescription: "Higher solid content for dispersive ground",
      isActive: true,
    },
    {
      centorCode: "CTR-ISF-P",
      nameEn: "Polymer Foam Agent",
      category: "soil_conditioner",
      packSize: "200 kg drum / 1,000 kg IBC",
      packDescription:
        "Polymer-enhanced formula for cohesive or mixed ground conditions",
      isActive: true,
    },
    // Not on the current catalogue — confirmed legacy/discontinued, not
    // removed (CLAUDE.md: nothing commercial hard-deleted).
    {
      centorCode: "PX2350",
      nameEn: "PX2350",
      packDescription:
        "Legacy/discontinued — not on centorglobal.com/products as of 2026-08-17",
      isActive: false,
    },
    {
      centorCode: "TM-T100",
      nameEn: "TM-T100",
      packDescription:
        "Legacy/discontinued — not on centorglobal.com/products as of 2026-08-17",
      isActive: false,
    },
    {
      centorCode: "PA",
      nameEn: "PA",
      packDescription:
        "Legacy/discontinued — not on centorglobal.com/products as of 2026-08-17",
      isActive: false,
    },
  ];
  let productsSeeded = 0;
  for (const { centorCode, ...rest } of PRODUCTS) {
    const [existing] = await db
      .select()
      .from(product)
      .where(eq(product.centorCode, centorCode));
    if (existing) continue;

    await db.insert(product).values({
      centorCode,
      ...rest,
      createdBy: admin.id,
    });
    productsSeeded++;
  }

  console.log(
    `Seeded ${legalEntities.length}/4 legal entities, ${users.length}/1 users, ` +
      `${companiesSeeded}/1 companies, ${projectsSeeded}/1 projects, ` +
      `${productsSeeded}/${PRODUCTS.length} products (skipped rows already existed).`,
  );

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
