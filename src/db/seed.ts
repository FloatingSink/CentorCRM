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

  // crm-spec.md §6.3 — these 9 codes are given, but category, uom, pack size,
  // manufacturer and HS code are <TBD: confirm full CENTOR code for each> and
  // are left null, not guessed (CLAUDE.md "do not invent domain data").
  const PRODUCT_CODES = [
    "CTR-TSG-P",
    "PX2350",
    "TM-T100",
    "PA",
    "EP1",
    "EP2",
    "IS-C",
    "IS-D",
    "IS-P",
  ];
  let productsSeeded = 0;
  for (const code of PRODUCT_CODES) {
    const [existing] = await db
      .select()
      .from(product)
      .where(eq(product.centorCode, code));
    if (existing) continue;

    await db.insert(product).values({
      centorCode: code,
      nameEn: code,
      isActive: true,
      createdBy: admin.id,
    });
    productsSeeded++;
  }

  console.log(
    `Seeded ${legalEntities.length}/4 legal entities, ${users.length}/1 users, ` +
      `${companiesSeeded}/1 companies, ${projectsSeeded}/1 projects, ` +
      `${productsSeeded}/9 products (skipped rows already existed).`,
  );

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
