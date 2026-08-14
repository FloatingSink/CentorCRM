import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/db/migrations/**",
    // Design-handoff prototype bundle (design_handoff_centor_crm/README.md:
    // "Ignore the <x-dc> / support.js wrapper — that's the prototyping
    // harness, not part of the design") — not app source, not ours to lint.
    "design_handoff_centor_crm/**",
  ]),
]);

export default eslintConfig;
