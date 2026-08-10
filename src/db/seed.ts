import { config } from "dotenv";

config({ path: ".env.local" });

// Dynamic import: static imports are hoisted above the dotenv config() call
// above, which would make ./client read DATABASE_URL before it's populated.
async function main() {
  const { client, db } = await import("./client");
  const { legalEntity, user } = await import("./schema");

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

  console.log(
    `Seeded ${legalEntities.length}/4 legal entities, ${users.length}/1 users (skipped rows already existed).`,
  );

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
