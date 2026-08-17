import path from "node:path";

import { Font } from "@react-pdf/renderer";

// Bundled local file, not a network fetch — see docs/decisions.md (this
// slice's entry, superseding 2026-08-12's gstatic-URL version).
// public/fonts/LICENSE-NotoSansSC.txt has the OFL 1.1 license text and
// copyright notice.
export function registerCjkFont(): void {
  Font.register({
    family: "Noto Sans SC",
    src: path.join(process.cwd(), "public", "fonts", "NotoSansSC-Regular.ttf"),
  });
}
