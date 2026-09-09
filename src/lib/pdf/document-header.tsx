import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";

import { cjkWrap, pickName } from "./format";
import { letterheadImagePath } from "./letterhead";

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  // 826x224 source (public/logos/README.md) — height fixed, width auto so
  // react-pdf preserves the real aspect ratio instead of stretching it.
  letterhead: { height: 32 },
  entityBlock: { alignItems: "flex-end" },
  docNo: { fontWeight: 700, marginBottom: 2 },
  entityName: { fontWeight: 700, marginBottom: 2 },
  muted: { color: "#555" },
  addressRow: { textAlign: "right", color: "#555", marginTop: 4 },
  titleBlock: { alignItems: "center", marginTop: 16 },
  title: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  subtitle: { color: "#555", marginTop: 2 },
});

export function DocumentHeader({
  language,
  legalEntity,
  docNoLabel,
  docNoValue,
  title,
  subtitle,
}: {
  language: string;
  legalEntity: {
    nameEn: string;
    nameZh: string | null;
    registeredAddress: string | null;
    registrationNo: string | null;
    jurisdiction: string | null;
    letterheadAsset: string | null;
  };
  docNoLabel: string;
  docNoValue: string;
  title: string;
  subtitle?: string;
}) {
  const letterhead = letterheadImagePath(legalEntity.letterheadAsset);

  return (
    <View>
      <View style={styles.row}>
        <View>
          {letterhead ? (
            // react-pdf's Image is a PDF primitive, not an HTML <img> — it
            // has no alt prop; jsx-a11y can't tell the two apart.
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={letterhead} style={styles.letterhead} />
          ) : null}
        </View>
        <View style={styles.entityBlock}>
          <Text style={styles.docNo}>
            {docNoLabel}: {docNoValue}
          </Text>
          <Text style={styles.entityName}>
            {pickName(legalEntity.nameEn, legalEntity.nameZh, language)}
          </Text>
          {legalEntity.registrationNo ? (
            <Text style={styles.muted}>
              {legalEntity.jurisdiction} · {legalEntity.registrationNo}
            </Text>
          ) : null}
        </View>
      </View>

      {legalEntity.registeredAddress ? (
        <Text style={styles.addressRow}>
          {cjkWrap(legalEntity.registeredAddress)}
        </Text>
      ) : null}

      <View style={styles.titleBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}
